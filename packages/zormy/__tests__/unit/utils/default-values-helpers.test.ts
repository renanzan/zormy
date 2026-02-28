import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
	collectAllFieldKeys,
	createNestedStructureFromKeys,
	normalizeDefaultValues,
} from "../../../src/wizards/wizard/builder/helpers";

import type { FieldComponentBase } from "../../../src/fields/field/types/field";

/**
 * Testes de utilitários para normalização de valores padrão em wizards.
 *
 * Demonstra como coletar chaves de campos, criar estruturas aninhadas
 * e normalizar valores padrão para uso em formulários multi-step.
 */

// Helper para criar mock de FieldComponentBase
function createMockField(key: string): FieldComponentBase {
	return {
		config: { key },
		getZodSchema: () => z.string(),
	};
}

describe("default-values-helpers - normalização de valores padrão", () => {
	describe("collectAllFieldKeys - coletar todas as chaves de campos", () => {
		it("deve coletar todas as chaves de campos de todos os steps", () => {
			const steps = ["step1", "step2"] as const;
			const fieldsMap = {
				step1: [createMockField("name"), createMockField("email")],
				step2: [createMockField("age"), createMockField("phone")],
			};

			const keys = collectAllFieldKeys(steps, fieldsMap);

			expect(keys.size).toBe(4);
			expect(keys.has("name")).toBe(true);
			expect(keys.has("email")).toBe(true);
			expect(keys.has("age")).toBe(true);
			expect(keys.has("phone")).toBe(true);
		});

		it("deve lidar com steps vazios", () => {
			const steps = ["step1"] as const;
			const fieldsMap = {
				step1: [],
			};

			const keys = collectAllFieldKeys(steps, fieldsMap);

			expect(keys.size).toBe(0);
		});

		it("deve coletar chaves de campos aninhados (dot notation)", () => {
			const steps = ["step1"] as const;
			const fieldsMap = {
				step1: [
					createMockField("user.name"),
					createMockField("user.email"),
					createMockField("address.street"),
				],
			};

			const keys = collectAllFieldKeys(steps, fieldsMap);

			expect(keys.size).toBe(3);
			expect(keys.has("user.name")).toBe(true);
			expect(keys.has("user.email")).toBe(true);
			expect(keys.has("address.street")).toBe(true);
		});

		it("deve evitar duplicatas quando mesma chave aparece em múltiplos steps", () => {
			const steps = ["step1", "step2"] as const;
			const fieldsMap = {
				step1: [createMockField("name")],
				step2: [createMockField("name"), createMockField("email")],
			};

			const keys = collectAllFieldKeys(steps, fieldsMap);

			// Deve ter apenas 2 chaves únicas (name e email)
			expect(keys.size).toBe(2);
			expect(keys.has("name")).toBe(true);
			expect(keys.has("email")).toBe(true);
		});
	});

	describe("createNestedStructureFromKeys - criar estrutura aninhada a partir de chaves", () => {
		it("deve criar estrutura aninhada para chaves com dot notation", () => {
			const keys = new Set(["user.name", "user.email", "address.street"]);
			const structure = createNestedStructureFromKeys(keys);

			expect(structure).toEqual({
				user: {
					name: undefined,
					email: undefined,
				},
				address: {
					street: undefined,
				},
			});
		});

		it("deve ignorar chaves sem pontos (flat)", () => {
			const keys = new Set(["name", "email"]);
			const structure = createNestedStructureFromKeys(keys);

			expect(structure).toEqual({});
		});

		it("deve criar estrutura aninhada profunda (múltiplos níveis)", () => {
			const keys = new Set(["level1.level2.level3"]);
			const structure = createNestedStructureFromKeys(keys);

			expect(structure).toEqual({
				level1: {
					level2: {
						level3: undefined,
					},
				},
			});
		});

		it("deve mesclar múltiplos caminhos que compartilham prefixo", () => {
			const keys = new Set(["user.name", "user.email", "user.address.street", "address.city"]);
			const structure = createNestedStructureFromKeys(keys);

			expect(structure).toEqual({
				user: {
					name: undefined,
					email: undefined,
					address: {
						street: undefined,
					},
				},
				address: {
					city: undefined,
				},
			});
		});

		it("deve lidar com Set vazio", () => {
			const keys = new Set<string>([]);
			const structure = createNestedStructureFromKeys(keys);

			expect(structure).toEqual({});
		});
	});

	describe("normalizeDefaultValues - normalizar valores padrão", () => {
		it("deve normalizar valores padrão com estrutura aninhada completa", () => {
			const keys = new Set(["user.name", "user.email"]);
			const defaultValues = {
				user: {
					name: "John",
					email: "john@example.com",
				},
			};

			const normalized = normalizeDefaultValues(defaultValues, keys);

			expect(normalized).toEqual({
				user: {
					name: "John",
					email: "john@example.com",
				},
			});
		});

		it("deve mesclar valores fornecidos com estrutura de campos (preencher campos faltantes com undefined)", () => {
			const keys = new Set(["user.name", "user.email", "address.street"]);
			const defaultValues = {
				user: {
					name: "John",
				},
			};

			const normalized = normalizeDefaultValues(defaultValues, keys);

			expect(normalized).toEqual({
				user: {
					name: "John",
					email: undefined,
				},
				address: {
					street: undefined,
				},
			});
		});

		it("deve normalizar valores padrão flat (sem estrutura aninhada)", () => {
			const keys = new Set(["name", "email"]);
			const defaultValues = {
				name: "John",
				email: "john@example.com",
			};

			const normalized = normalizeDefaultValues(defaultValues, keys);

			expect(normalized).toEqual({
				name: "John",
				email: "john@example.com",
			});
		});

		it("deve mesclar valores flat e aninhados", () => {
			const keys = new Set(["name", "user.email", "address.street"]);
			const defaultValues = {
				name: "John",
				user: {
					email: "john@example.com",
				},
			};

			const normalized = normalizeDefaultValues(defaultValues, keys);

			expect(normalized).toEqual({
				name: "John",
				user: {
					email: "john@example.com",
				},
				address: {
					street: undefined,
				},
			});
		});

		it("deve preservar valores existentes quando normalizar", () => {
			const keys = new Set(["user.name", "user.email"]);
			const defaultValues = {
				user: {
					name: "John",
					email: "john@example.com",
					phone: "123456789", // Campo extra que não está nos keys
				},
			};

			const normalized = normalizeDefaultValues(defaultValues, keys);

			// Deve preservar valores fornecidos
			expect(normalized.user.name).toBe("John");
			expect(normalized.user.email).toBe("john@example.com");
		});
	});
});
