/**
 * Testes de tipagem - Múltiplas Dependências
 *
 * Testa getValues com múltiplas dependências.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Múltiplas Dependências", () => {
	it("deve aceitar todas as chaves de dependências múltiplas", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const EmailField = field("email")
			.schema(z.string().email())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(NameField, EmailField)
			.schema((formValues) => {
				const name = formValues?.name;
				const email = formValues?.email;
				// Asserção de tipo: verificar tipos corretos
				const nameType: string | undefined = name;
				const emailType: string | undefined = email;
				if (name && email) {
					return z.string().min(10);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const name = getValues("name");
				const email = getValues("email");
				return null;
			});
	});

	it("deve inferir tipos corretos de múltiplas dependências", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const IsActiveField = field("isActive")
			.schema(z.boolean())
			.render(() => null);

		const ResultField = field("result")
			.dependsOn(AgeField, IsActiveField)
			.schema((formValues) => {
				const age = formValues?.age;
				const isActive = formValues?.isActive;
				// Asserção de tipo: verificar tipos corretos
				const ageType: number | undefined = age;
				const isActiveType: boolean | undefined = isActive;
				return z.string();
			})
			.render(({ getValues }) => {
				const age = getValues("age");
				const isActive = getValues("isActive");
				return null;
			});
	});
});
