import { z } from "zod";
import { describe, expect, it } from "vitest";

import { extractDependencyKeys } from "../../../src/fields/dependency/extractor";
import { field } from "../../../src/fields/field/builder/builder";

import type { FieldComponent } from "../../../src/fields/field/types/field";

/**
 * Testes do extrator de dependências.
 *
 * Demonstra como as chaves são extraídas de diferentes tipos de dependências,
 * incluindo FieldComponents, strings e lazy getters.
 */
describe("extractDependencyKeys - extração de chaves de dependências", () => {
	describe("extração de FieldComponents", () => {
		it("deve extrair chave de um FieldComponent diretamente", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const keys = extractDependencyKeys([NameField]);

			expect(keys).toEqual(["name"]);
		});

		it("deve extrair chaves de múltiplos FieldComponents", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const AgeField = field("age")
				.schema(z.number())
				.render(({ register }) => <input type="number" {...register()} />);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(({ register }) => <input type="email" {...register()} />);

			const keys = extractDependencyKeys([NameField, AgeField, EmailField]);

			expect(keys).toEqual(["name", "age", "email"]);
		});

		it("deve extrair chave de FieldComponent aninhado (dot notation)", () => {
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(({ register }) => <input {...register({ name: "user.name" })} />);

			const keys = extractDependencyKeys([UserNameField]);

			expect(keys).toEqual(["user.name"]);
		});
	});

	describe("extração de strings", () => {
		it("deve extrair chave de string diretamente", () => {
			const keys = extractDependencyKeys(["name"]);

			expect(keys).toEqual(["name"]);
		});

		it("deve extrair múltiplas chaves de strings", () => {
			const keys = extractDependencyKeys(["name", "age", "email"]);

			expect(keys).toEqual(["name", "age", "email"]);
		});

		it("deve extrair chave aninhada de string com dot notation", () => {
			const keys = extractDependencyKeys(["user.name", "user.email"]);

			expect(keys).toEqual(["user.name", "user.email"]);
		});
	});

	describe("extração de lazy getters", () => {
		it("deve extrair chave de lazy getter que retorna FieldComponent", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const keys = extractDependencyKeys([() => NameField]);

			expect(keys).toEqual(["name"]);
		});

		it("deve extrair chaves de múltiplos lazy getters", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const AgeField = field("age")
				.schema(z.number())
				.render(({ register }) => <input type="number" {...register()} />);

			const keys = extractDependencyKeys([() => NameField, () => AgeField]);

			expect(keys).toEqual(["name", "age"]);
		});

		it("deve retornar array vazio se lazy getter falhar (dependência circular)", () => {
			// Simula dependência circular onde o FieldComponent ainda não existe
			// eslint-disable-next-line prefer-const
			let PersonField: FieldComponent<"person", z.ZodString>;

			const lazyGetter = () => PersonField;

			// Antes de PersonField ser definido, a extração deve falhar graciosamente
			const keys = extractDependencyKeys([lazyGetter]);

			// Em caso de dependência circular, pode retornar array vazio ou null
			// O comportamento esperado é que não quebre
			expect(Array.isArray(keys)).toBe(true);

			// Depois que PersonField é definido, deve funcionar
			PersonField = field("person")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const keysAfter = extractDependencyKeys([lazyGetter]);
			expect(keysAfter).toEqual(["person"]);
		});
	});

	describe("combinação de tipos de dependências", () => {
		it("deve extrair chaves de array misto (FieldComponent + string)", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const keys = extractDependencyKeys([NameField, "age", "email"]);

			expect(keys).toEqual(["name", "age", "email"]);
		});

		it("deve extrair chaves de array misto (FieldComponent + lazy getter)", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const AgeField = field("age")
				.schema(z.number())
				.render(({ register }) => <input type="number" {...register()} />);

			const keys = extractDependencyKeys([NameField, () => AgeField]);

			expect(keys).toEqual(["name", "age"]);
		});

		it("deve extrair chaves de array misto completo (todos os tipos)", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(({ register }) => <input type="email" {...register()} />);

			const keys = extractDependencyKeys([NameField, "age", () => EmailField, "phone"]);

			expect(keys).toEqual(["name", "age", "email", "phone"]);
		});
	});

	describe("casos especiais", () => {
		it("deve retornar array vazio para array vazio", () => {
			const keys = extractDependencyKeys([]);

			expect(keys).toEqual([]);
		});

		it("deve lidar graciosamente com dependências inválidas", () => {
			// Dependências que não podem ser extraídas devem ser ignoradas
			const keys = extractDependencyKeys(["valid", null as any, undefined as any, "alsoValid"]);

			// Apenas strings válidas devem ser retornadas
			expect(keys).toContain("valid");
			expect(keys).toContain("alsoValid");
		});

		it("deve extrair chave de dependência como objeto com config (não função)", () => {
			// Ramo: dependency é object com "config" in dependency (ex.: mock ou proxy)
			const depAsObject = { config: { key: "nestedKey" } } as any;
			const keys = extractDependencyKeys([depAsObject]);
			expect(keys).toEqual(["nestedKey"]);
		});

		it("deve ignorar lazy getter que lança (ex.: dependência circular não resolvida)", () => {
			const lazyThatThrows = () => {
				throw new Error("circular");
			};
			const keys = extractDependencyKeys([lazyThatThrows]);
			expect(keys).toEqual([]);
		});
	});
});
