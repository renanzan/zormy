/**
 * Testes de tipagem - Tipos de Retorno de getValues
 *
 * Verifica tipos retornados por getValues baseados nas dependências.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Tipos de Retorno de getValues", () => {
	it("deve retornar o tipo correto baseado na dependência string", () => {
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
				const name = getValues("name");
				return null;
			});
	});

	it("deve retornar o tipo correto baseado na dependência number", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(AgeField)
			.schema((formValues) => {
				const age = formValues?.age;
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

	it("deve retornar o tipo correto baseado na dependência enum", () => {
		const MethodField = field("method")
			.schema(z.enum(["credit", "debit", "pix"]))
			.render(() => null);

		const CardNumberField = field("cardNumber")
			.dependsOn(MethodField)
			.schema((formValues) => {
				const method = formValues?.method;
				if (method === "credit" || method === "debit") {
					return z.string().regex(/^\d{13,19}$/);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const method = getValues("method");
				return null;
			});
	});
});
