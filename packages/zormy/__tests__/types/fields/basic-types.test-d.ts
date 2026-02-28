/**
 * Testes de tipagem - Tipos Básicos
 *
 * Testa a inferência de tipos primitivos (string, number, boolean, enum, optional).
 * Estes testes DEVEM PASSAR quando as tipagens básicas estiverem corretas.
 */

import { z } from "zod";
import { expectTypeOf } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";

import type { FieldValue } from "../../../src/fields/field/types/extractors";

describe("Type Safety - Campos Básicos", () => {
	it("deve inferir tipo string corretamente", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		// Asserção de atribuição: verificar que o tipo inferido é string
		type InferredType = FieldValue<typeof NameField>;
		const testValue: InferredType = "test";
		expectTypeOf(testValue).toBeString();
	});

	it("deve inferir tipo number corretamente", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		type InferredType = FieldValue<typeof AgeField>;
		const testValue: InferredType = 25;
		expectTypeOf(testValue).toBeNumber();
	});

	it("deve inferir tipo boolean corretamente", () => {
		const TermsField = field("terms")
			.schema(z.boolean())
			.render(() => null);

		type InferredType = FieldValue<typeof TermsField>;
		const testValue: InferredType = true;
		expectTypeOf(testValue).toBeBoolean();
	});

	it("deve inferir tipo enum corretamente", () => {
		const MethodField = field("method")
			.schema(z.enum(["credit", "debit", "pix"]))
			.render(() => null);

		type InferredType = FieldValue<typeof MethodField>;
		// Asserção de atribuição: verificar que valores do enum podem ser atribuídos
		const test1: InferredType = "credit";
		const test2: InferredType = "debit";
		const test3: InferredType = "pix";
		// Verificar que o tipo é exatamente a união dos valores do enum
		const testType: "credit" | "debit" | "pix" = test1;
		const testType2: InferredType = "credit";
	});

	it("deve inferir tipo optional corretamente", () => {
		const OptionalField = field("optional")
			.schema(z.string().optional())
			.render(() => null);

		type InferredType = FieldValue<typeof OptionalField>;
		// Asserção de atribuição: verificar que string e undefined podem ser atribuídos
		const test1: InferredType = "test";
		const test2: InferredType = undefined;
		// Verificar que o tipo é exatamente string | undefined
		const testType: string | undefined = test1;
		const testType2: InferredType = undefined;
	});
});
