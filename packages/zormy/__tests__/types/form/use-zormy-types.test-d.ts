/**
 * Testes de tipagem - useZormy
 *
 * Verifica que useZormy infere corretamente o tipo do formulário a partir do array de campos:
 * retorno do hook, handleSubmit(data), defaultValues e métodos tipados.
 */

import { z } from "zod";
import { expectTypeOf } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { useZormy } from "../../../src/form/hooks/useZormy";

import type { FieldsToObject } from "../../../src/fields/field/types/extractors";

describe("Type Safety - useZormy", () => {
	describe("inferência do tipo do formulário", () => {
		it("deve inferir corretamente o tipo do formulário", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string())
				.render(() => null);

			const fields = [NameField, EmailField] as const;
			type FormValues = FieldsToObject<typeof fields>;

			const form = useZormy({
				fields: [NameField, EmailField],
				defaultValues: {
					name: "",
					email: "",
				},
			});

			const values = form.getValues();
			const watched = form.watch();

			expectTypeOf<typeof values>().toEqualTypeOf<FormValues>();
			expectTypeOf<typeof watched>().toEqualTypeOf<FormValues>();
		});
	});

	describe("negative - defaultValues incompatível", () => {
		it("deve rejeitar defaultValues com chave inexistente", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			useZormy({
				fields: [NameField],
				defaultValues: {
					name: "",
					// @ts-expect-error - "other" não existe no shape dos campos
					other: "",
				},
			});
		});

		it("deve rejeitar defaultValues com tipo incorreto para a chave", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			useZormy({
				fields: [NameField, AgeField],
				defaultValues: {
					name: "",
					// @ts-expect-error - age deve ser number, não string
					age: "25",
				},
			});
		});
	});
});
