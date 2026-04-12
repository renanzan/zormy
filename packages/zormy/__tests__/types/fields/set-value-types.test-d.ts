/**
 * Testes de tipagem - Método setValue
 *
 * Verifica tipagem correta do método setValue.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Método setValue", () => {
	it("deve aceitar valor do tipo correto do schema", () => {
		const NameField = field("name")
			.schema(z.string().nullable())
			.render(({ setValue }) => {
				setValue("name", "João");
				setValue("name", null);
				// @ts-expect-error - number não é string
				setValue("name", 123);
				return null;
			});
	});

	it("deve aceitar valor do tipo correto para schema number", () => {
		const AgeField = field("age")
			.schema(z.number().nullable())
			.render(({ setValue }) => {
				setValue("age", 25);
				setValue("age", null);
				// @ts-expect-error - string não é number
				setValue("age", "25");
				return null;
			});
	});

	it("deve aceitar valor do tipo correto para schema boolean", () => {
		const IsActiveField = field("isActive")
			.schema(z.boolean().nullable())
			.render(({ setValue }) => {
				setValue("isActive", true);
				setValue("isActive", false);
				setValue("isActive", null);
				// @ts-expect-error - string não é boolean
				setValue("isActive", "true");
				return null;
			});
	});

	it("deve aceitar valor do tipo correto para schema enum", () => {
		const MethodField = field("method")
			.schema(z.enum(["credit", "debit", "pix"]).nullable())
			.render(({ setValue }) => {
				setValue("method", "credit");
				setValue("method", "debit");
				setValue("method", "pix");
				setValue("method", null);
				// @ts-expect-error - "invalid" não é um valor válido do enum
				setValue("method", "invalid");
				return null;
			});
	});

	it("deve aceitar valor do tipo correto para schema optional", () => {
		const PhoneField = field("phone")
			.schema(z.string().optional().nullable())
			.render(({ setValue }) => {
				setValue("phone", "123456789");
				setValue("phone", null);
				setValue("phone", undefined);
				// @ts-expect-error - number não é string | undefined
				setValue("phone", 123);
				return null;
			});
	});

	it("deve aceitar valor do tipo correto para schema com dependências", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const NameField = field("name")
			.dependsOn(AgeField)
			.schema((formValues) => {
				const age = formValues?.age;
				if (age && age > 18) {
					return z.string().min(3);
				}
				return z.string().optional().nullable();
			})
			.render(({ setValue }) => {
				// O tipo do schema pode ser string ou string | undefined
				setValue("name", "João");
				setValue("name", null);
				// @ts-expect-error - number não é válido
				setValue("name", 123);
				return null;
			});
	});
});
