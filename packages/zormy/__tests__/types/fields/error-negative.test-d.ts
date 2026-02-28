/**
 * Testes de tipagem - Erro Negativo
 *
 * Testa que erros de tipo são detectados corretamente usando @ts-expect-error.
 * Estes testes DEVEM PASSAR (os erros devem existir onde marcados).
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

import type { FieldValue } from "../../../src/fields/field/types/extractors";

describe("Type Safety - Testes de Erro Negativo", () => {
	it("deve rejeitar tipo incorreto em atribuição", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		type InferredType = FieldValue<typeof NameField>;

		// @ts-expect-error - number não pode ser atribuído a string
		const test: InferredType = 123;

		// @ts-expect-error - boolean não pode ser atribuído a string
		const test2: InferredType = true;
	});

	it("deve rejeitar valores inválidos em enum", () => {
		const MethodField = field("method")
			.schema(z.enum(["credit", "debit", "pix"]))
			.render(() => null);

		type InferredType = FieldValue<typeof MethodField>;

		// @ts-expect-error - "invalid" não está no enum
		const test: InferredType = "invalid";
	});

	it("campos sem dependências não devem acessar outros campos", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const EmailField = field("email")
			.schema(z.string().email())
			.render(({ getValues }) => {
				// @ts-expect-error - EmailField não depende de NameField
				const name = getValues("name");
				return null;
			});
	});

	it("deve rejeitar tipos incompatíveis em atribuição", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		type InferredType = FieldValue<typeof AgeField>;

		// @ts-expect-error - string não pode ser atribuído a number
		const test1: InferredType = "25";

		// @ts-expect-error - boolean não pode ser atribuído a number
		const test2: InferredType = true;

		// @ts-expect-error - undefined não pode ser atribuído a number (não é optional)
		const test3: InferredType = undefined;
	});
});
