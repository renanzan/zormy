/**
 * Testes de tipagem - Testes Negativos
 *
 * Verifica que tipos incorretos são rejeitados pelo TypeScript.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Testes Negativos", () => {
	it("deve rejeitar acesso a campo não dependente em getValues", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(NameField)
			.schema(z.string())
			.render(({ getValues }) => {
				// @ts-expect-error - "email" não é uma dependência
				const email = getValues("email");
				return null;
			});
	});

	it("deve rejeitar acesso a campo não dependente em watch", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(NameField)
			.schema(z.string())
			.render(({ watch }) => {
				// @ts-expect-error - "email" não é uma dependência
				const email = watch("email");
				return null;
			});
	});

	it("deve rejeitar tipo incorreto em formValues de schema dinâmico", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const NameField = field("name")
			.dependsOn(AgeField)
			.schema((formValues) => {
				const age = formValues?.age;
				// @ts-expect-error - age é number, não string
				const ageAsString: string = age;
				return z.string();
			})
			.render(() => null);
	});

	it("deve rejeitar tipo incorreto em setValue", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ setValue }) => {
				// @ts-expect-error - number não é string
				setValue("name", 123);
				// @ts-expect-error - boolean não é string
				setValue("name", true);
				return null;
			});
	});

	it("deve rejeitar chave incorreta em setValue", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ setValue }) => {
				// @ts-expect-error - "invalidKey" não é a chave do campo
				setValue("invalidKey", "value");
				return null;
			});
	});

	it("deve rejeitar acesso a campo aninhado incorreto", () => {
		const PaymentMethodField = field("payment.method")
			.schema(z.enum(["credit", "debit"]))
			.render(() => null);

		const CardNumberField = field("payment.cardNumber")
			.dependsOn(PaymentMethodField)
			.schema(z.string())
			.render(({ getValues }) => {
				// @ts-expect-error - "payment.invalid" não existe
				const invalid = getValues("payment.invalid");
				return null;
			});
	});

	it("deve rejeitar tipo incorreto ao acessar campo aninhado", () => {
		const PaymentMethodField = field("payment.method")
			.schema(z.enum(["credit", "debit"]))
			.render(() => null);

		const CardNumberField = field("payment.cardNumber")
			.dependsOn(PaymentMethodField)
			.schema((formValues) => {
				const method = formValues?.payment.method;
				// @ts-expect-error - method é enum, não string genérico
				const methodAsString: string = method;
				return z.string();
			})
			.render(() => null);
	});
});
