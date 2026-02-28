/**
 * Testes de tipagem - Compatibilidade
 *
 * Verifica compatibilidade entre tipos inferidos do zormy e tipos do Zod.
 */

import { z } from "zod";
import { expectTypeOf } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";

import type { FieldValue } from "../../../src/fields/field/types/extractors";

describe("Type Safety - Compatibilidade de Tipos", () => {
	it("deve ser compatível com tipos inferidos do Zod", () => {
		const stringSchema = z.string();
		const NameField = field("name")
			.schema(stringSchema)
			.render(() => null);

		type InferredType = FieldValue<typeof NameField>;
		type ZodInferred = z.infer<typeof stringSchema>;

		// Os tipos devem ser compatíveis
		const testValue: InferredType = "test";
		const zodValue: ZodInferred = "test";
		expectTypeOf(testValue).toEqualTypeOf<ZodInferred>();
		expectTypeOf(zodValue).toEqualTypeOf<InferredType>();
	});

	it("deve ser compatível com tipos enum do Zod", () => {
		const enumSchema = z.enum(["credit", "debit", "pix"]);
		const MethodField = field("method")
			.schema(enumSchema)
			.render(() => null);

		type InferredType = FieldValue<typeof MethodField>;
		type ZodInferred = z.infer<typeof enumSchema>;

		const testValue: InferredType = "credit";
		const zodValue: ZodInferred = "credit";
		// Asserção de atribuição: verificar compatibilidade bidirecional
		const zodToInferred: InferredType = zodValue;
		const inferredToZod: ZodInferred = testValue;
	});
});
