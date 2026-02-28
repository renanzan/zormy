/**
 * Testes de tipagem - Inferência Recursiva
 *
 * Testa tipos complexos com cadeias de dependências e dependências aninhadas.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Inferência Recursiva", () => {
	it("deve inferir tipos corretos em cadeias de dependências", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const EmailField = field("email")
			.dependsOn(NameField)
			.schema((formValues) => {
				const name = formValues?.name;
				if (name && name.length > 0) {
					return z.string().email();
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const name = getValues("name");
				return null;
			});

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

	it("deve inferir tipos corretos em dependências aninhadas", () => {
		const PaymentMethodField = field("payment.method")
			.schema(z.enum(["credit", "debit"]))
			.render(() => null);

		const CardNumberField = field("payment.cardNumber")
			.dependsOn(PaymentMethodField)
			.schema((formValues) => {
				const method = formValues?.payment.method;
				if (method === "credit" || method === "debit") {
					return z.string().regex(/^\d{13,19}$/);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const method = getValues("payment.method");
				return null;
			});

		const CardNameField = field("payment.cardName")
			.dependsOn(PaymentMethodField, CardNumberField)
			.schema((formValues) => {
				const method = formValues?.payment.method;
				const cardNumber = formValues?.payment.cardNumber;
				// Asserção de tipo: verificar tipos corretos
				const methodType: "credit" | "debit" | undefined = method;
				const cardNumberType: string | undefined = cardNumber;
				if (method === "credit" || method === "debit") {
					return z.string().min(3);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const method = getValues("payment.method");
				const cardNumber = getValues("payment.cardNumber");
				return null;
			});
	});
});
