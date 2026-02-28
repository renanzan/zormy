/**
 * Testes de tipagem - Schemas Dinâmicos
 *
 * Testa inferência de tipos em schemas dinâmicos baseados em condições.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Schemas Dinâmicos", () => {
	it("deve inferir tipos corretos em schemas dinâmicos baseados em condições", () => {
		const HasPhoneField = field("hasPhone")
			.schema(z.boolean())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(HasPhoneField)
			.schema((formValues) => {
				const hasPhone = formValues?.hasPhone;
				// Asserção de tipo: verificar que hasPhone é boolean
				const hasPhoneType: boolean | undefined = hasPhone;
				if (hasPhone) {
					return z.string().min(10);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const hasPhone = getValues("hasPhone");
				return null;
			});
	});

	it("deve inferir tipos corretos em schemas dinâmicos com múltiplas condições", () => {
		const MethodField = field("method")
			.schema(z.enum(["credit", "debit", "pix"]))
			.render(() => null);

		const AmountField = field("amount")
			.schema(z.number())
			.render(() => null);

		const CardNumberField = field("cardNumber")
			.dependsOn(MethodField, AmountField)
			.schema((formValues) => {
				const method = formValues?.method;
				const amount = formValues?.amount;
				// Asserção de tipo: verificar tipos corretos
				const methodType: "credit" | "debit" | "pix" | undefined = method;
				const amountType: number | undefined = amount;
				if (method === "credit" || method === "debit") {
					return z.string().regex(/^\d{13,19}$/);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const method = getValues("method");
				const amount = getValues("amount");
				return null;
			});
	});
});
