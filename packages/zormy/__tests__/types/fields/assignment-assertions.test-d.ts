/**
 * Testes de tipagem - Asserções de Atribuição
 *
 * Verifica que tipos podem ser atribuídos corretamente.
 * Estes testes DEVEM PASSAR quando as tipagens básicas estiverem corretas.
 */

import { z } from "zod";
import { expectTypeOf } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";

import type { FieldValue } from "../../../src/fields/field/types/extractors";

describe("Type Safety - Asserções de Atribuição", () => {
	it("deve permitir atribuição de tipos compatíveis", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		type InferredType = FieldValue<typeof NameField>;

		// Deve permitir atribuição de string
		const test1: InferredType = "John Doe";
		expectTypeOf(test1).toBeString();

		// Deve permitir atribuição de string vazia
		const test2: InferredType = "";
		expectTypeOf(test2).toBeString();
	});

	it("deve permitir atribuição de tipos enum", () => {
		const MethodField = field("method")
			.schema(z.enum(["credit", "debit", "pix"]))
			.render(() => null);

		type InferredType = FieldValue<typeof MethodField>;

		const test1: InferredType = "credit";
		const test2: InferredType = "debit";
		const test3: InferredType = "pix";

		// Asserção de atribuição: verificar compatibilidade de tipos
		const expectedType: "credit" | "debit" | "pix" = test1;
		const inferredType: InferredType = "credit";
	});

	it("deve permitir atribuição de tipos optional", () => {
		const OptionalField = field("optional")
			.schema(z.string().optional())
			.render(() => null);

		type InferredType = FieldValue<typeof OptionalField>;
		const test1: InferredType = "value";
		const test2: InferredType = undefined;

		// Asserção de atribuição: verificar compatibilidade de tipos
		const expectedType: string | undefined = test1;
		const inferredType: InferredType = undefined;
	});
});
