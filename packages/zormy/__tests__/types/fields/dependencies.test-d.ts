/**
 * Testes de tipagem - Dependências
 *
 * Testa getValues com campos dependentes.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - getValues com dependências", () => {
	it("deve aceitar chave de campo dependente em getValues", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(NameField)
			.schema((formValues) => {
				// formValues deve ter tipagem para "name"
				const name = formValues?.name;
				// Asserção de tipo: verificar que name é string
				const nameType: string | undefined = name;
				if (name && name.length > 0) {
					return z.string().min(10);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				// getValues deve aceitar "name" porque PhoneField depende de NameField
				const name = getValues("name");
				return null;
			});
	});

	it("deve rejeitar chaves inválidas em getValues", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(NameField)
			.schema((formValues) => {
				const name = formValues?.name;
				if (name && name.length > 0) {
					return z.string().min(10);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				// @ts-expect-error - "invalidKey" não é uma dependência
				const invalid = getValues("invalidKey");
				return null;
			});
	});

	it("deve inferir tipo correto do campo dependente em getValues", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(AgeField)
			.schema((formValues) => {
				const age = formValues?.age;
				// Asserção de tipo: verificar que age é number
				const ageType: number | undefined = age;
				if (age && age > 18) {
					return z.string().min(10);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const age = getValues("age");
				return null;
			});
	});
});
