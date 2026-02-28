import { z } from "zod";
import { describe, expect, it } from "vitest";

import { shapeToZodSchema } from "../../../src/resolver/helpers/shape-to-zod-schema";

/**
 * Testes de utilitários para manipulação de schemas Zod.
 *
 * Demonstra como criar schemas dinamicamente e verificar se são aninhados,
 * útil para resolver de formulários e validação.
 */
describe("schema-helpers - utilitários para schemas Zod", () => {
	describe("shapeToZodSchema - criar schema dinamicamente", () => {
		it("deve criar schema flat quando não há chaves aninhadas (sem dot notation)", () => {
			const shape = {
				name: z.string(),
				email: z.string(),
			};
			const schema = shapeToZodSchema(shape);

			expect(schema).toBeInstanceOf(z.ZodObject);

			const result = schema.safeParse({
				name: "John",
				email: "john@example.com",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					name: "John",
					email: "john@example.com",
				});
			}
		});

		it("deve criar schema aninhado quando há chaves com dot notation", () => {
			const shape = {
				"user.name": z.string(),
				"user.email": z.string(),
			};
			const schema = shapeToZodSchema(shape);

			expect(schema).toBeInstanceOf(z.ZodObject);

			const result = schema.safeParse({
				user: {
					name: "John",
					email: "john@example.com",
				},
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toEqual({
					user: {
						name: "John",
						email: "john@example.com",
					},
				});
			}
		});

		it("deve validar schema flat corretamente (aceita válidos e rejeita inválidos)", () => {
			const shape = {
				name: z.string().min(3),
				age: z.number().min(18),
			};
			const schema = shapeToZodSchema(shape);

			// Dados válidos
			const valid = schema.safeParse({ name: "John", age: 25 });
			expect(valid.success).toBe(true);

			// Dados inválidos (name muito curto, age menor que 18)
			const invalid = schema.safeParse({ name: "Jo", age: 15 });
			expect(invalid.success).toBe(false);
		});

		it("deve criar schema misto (flat + aninhado)", () => {
			const shape = {
				name: z.string(),
				"user.email": z.string().email(),
			};
			const schema = shapeToZodSchema(shape);

			const result = schema.safeParse({
				name: "John",
				user: {
					email: "john@example.com",
				},
			});

			expect(result.success).toBe(true);
		});

		it("deve criar schema aninhado profundo (múltiplos níveis)", () => {
			const shape = {
				"level1.level2.level3": z.string(),
			};
			const schema = shapeToZodSchema(shape);

			const result = schema.safeParse({
				level1: {
					level2: {
						level3: "value",
					},
				},
			});

			expect(result.success).toBe(true);
		});

		it("deve mesclar múltiplos caminhos que compartilham prefixo", () => {
			const shape = {
				"user.name": z.string(),
				"user.email": z.string().email(),
				"address.street": z.string(),
			};
			const schema = shapeToZodSchema(shape);

			const result = schema.safeParse({
				user: {
					name: "John",
					email: "john@example.com",
				},
				address: {
					street: "Main St",
				},
			});

			expect(result.success).toBe(true);
		});
	});
});
