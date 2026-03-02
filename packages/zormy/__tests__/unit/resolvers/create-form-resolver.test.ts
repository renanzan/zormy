import { z } from "zod";
import { describe, expect, it } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { zormyResolver } from "../../../src/resolver/resolver";

/**
 * Testes do resolver de formulário.
 *
 * Demonstra como criar resolvers para react-hook-form a partir de arrays de campos,
 * incluindo suporte a schemas flat, aninhados e dinâmicos.
 */
describe("createFormResolver - resolver para react-hook-form", () => {
	describe("resolver para campos flat", () => {
		it("deve criar resolver para campos simples sem aninhamento", async () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const resolver = zormyResolver({
				fields: [NameField, EmailField],
			});

			const validData = { name: "John", email: "john@example.com" };
			const result = await resolver(validData, {} as any, {} as any);

			expect(result.errors).toEqual({});
			expect(result.values).toEqual(validData);
		});

		it("deve validar e retornar erros para dados inválidos", async () => {
			const NameField = field("name")
				.schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
				.render(() => null);

			const resolver = zormyResolver({
				fields: [NameField],
			});

			const invalidData = { name: "Jo" };
			const result = await resolver(invalidData, {} as any, {} as any);

			expect(result.errors).toBeDefined();
			expect(result.errors.name).toBeDefined();
			expect(result.values).toEqual({});
		});

		it("deve validar múltiplos campos e retornar erros específicos", async () => {
			const NameField = field("name")
				.schema(z.string().min(3))
				.render(() => null);

			const EmailField = field("email")
				.schema(z.string().email("Email inválido"))
				.render(() => null);

			const resolver = zormyResolver({
				fields: [NameField, EmailField],
			});

			const invalidData = { name: "Jo", email: "invalid-email" };
			const result = await resolver(invalidData, {} as any, {} as any);

			expect(result.errors.name).toBeDefined();
			expect(result.errors.email).toBeDefined();
		});
	});

	describe("resolver para campos aninhados (dot notation)", () => {
		it("deve criar resolver para campos aninhados usando dot notation", async () => {
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(() => null);

			const UserEmailField = field("user.email")
				.schema(z.string().email())
				.render(() => null);

			const resolver = zormyResolver({
				fields: [UserNameField, UserEmailField],
			});

			const validData = {
				user: {
					name: "John",
					email: "john@example.com",
				},
			};

			const result = await resolver(validData as any, {} as any, {} as any);
			expect(result.errors).toEqual({});
			expect(result.values).toEqual(validData);
		});

		it("deve validar campos aninhados e retornar erros na estrutura correta", async () => {
			const UserNameField = field("user.name")
				.schema(z.string().min(3))
				.render(() => null);

			const resolver = zormyResolver({
				fields: [UserNameField],
			});

			const invalidData = {
				user: {
					name: "Jo",
				},
			};

			const result = await resolver(invalidData as any, {} as any, {} as any);
			expect(result.errors).toBeDefined();
			expect((result.errors as any).user).toBeDefined();
			expect((result.errors as any).user.name).toBeDefined();
		});

		it("deve criar resolver para campos aninhados profundos (múltiplos níveis)", async () => {
			const DeepField = field("proponent.person.document")
				.schema(z.string().min(11))
				.render(() => null);

			const resolver = zormyResolver({
				fields: [DeepField],
			});

			const validData = {
				proponent: {
					person: {
						document: "12345678901",
					},
				},
			};

			const result = await resolver(validData as any, {} as any, {} as any);
			expect(result.errors).toEqual({});
		});

		it("deve criar resolver misturando campos flat e aninhados", async () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const UserEmailField = field("user.email")
				.schema(z.string().email())
				.render(() => null);

			const resolver = zormyResolver({
				fields: [NameField, UserEmailField],
			});

			const validData = {
				name: "John",
				user: {
					email: "john@example.com",
				},
			};

			const result = await resolver(validData as any, {} as any, {} as any);
			expect(result.errors).toEqual({});
			expect(result.values).toEqual(validData);
		});
	});

	describe("resolver com schemas dinâmicos", () => {
		it("deve criar resolver com campos que têm schemas dinâmicos", async () => {
			const AgeField = field("age")
				.schema((formValues) => {
					if (formValues?.isMinor) {
						return z.number().max(17);
					}
					return z.number().min(18);
				})
				.render(() => null);

			const resolver = zormyResolver({
				fields: [AgeField],
			});

			// Schemas dinâmicos recebem formValues atuais no momento da validação
			const validData = { age: 25 };
			const result = await resolver(validData, {} as any, {} as any);

			expect(result.errors).toEqual({});
		});
	});

	describe("casos especiais", () => {
		it("deve criar resolver para array vazio de campos", async () => {
			const resolver = zormyResolver({
				fields: [],
			});

			const result = await resolver({}, {} as any, {} as any);
			expect(result.errors).toEqual({});
			expect(result.values).toEqual({});
		});

		it("deve criar resolver com campo que usa preprocess do Zod", async () => {
			const AgeField = field("age")
				.schema(z.preprocess((value) => (!value ? undefined : Number(value)), z.number().min(18)))
				.render(() => null);

			const resolver = zormyResolver({
				fields: [AgeField],
			});

			const validData = { age: "25" }; // String será convertida para número
			const result = await resolver(validData as any, {} as any, {} as any);

			// O preprocess deve converter string para número
			expect(result.errors).toEqual({});
		});
	});
});
