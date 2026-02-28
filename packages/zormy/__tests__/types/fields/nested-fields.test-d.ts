/**
 * Testes de tipagem - Campos Aninhados
 *
 * Testa getValues com campos aninhados (ex: "payment.method").
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

import type { FieldValue } from "../../../src/fields/field/types/extractors";

describe("Type Safety - Campos Aninhados", () => {
	it("deve aceitar chave aninhada de campo dependente em getValues", () => {
		const CardNumberField = field("payment.cardNumber")
			.schema(z.string().regex(/^\d{13,19}$/))
			.render(({ getValues }) => {
				const cardNumber = getValues("payment.cardNumber");
				return null;
			});
	});

	it("deve aceitar chave aninhada de campo dependente em getValues com dependências", () => {
		const PaymentMethodField = field("payment.method")
			.schema(z.enum(["credit", "debit", "pix", "boleto"]))
			.render(() => null);

		const CardNumberField = field("payment.cardNumber")
			.dependsOn(PaymentMethodField)
			.schema((formValues) => {
				const method = formValues?.payment.method;
				// Asserção de tipo: verificar tipo correto
				const methodType: "credit" | "debit" | "pix" | "boleto" | undefined = method;
				if (method === "credit" || method === "debit") {
					return z.string().regex(/^\d{13,19}$/);
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const payment = getValues("payment");
				expectTypeOf(payment).toEqualTypeOf<
					{
						cardNumber: string | undefined;
					} & {
						method: "credit" | "debit" | "pix" | "boleto";
					}
				>();

				const method = getValues("payment.method");
				expectTypeOf(method).toEqualTypeOf<"credit" | "debit" | "pix" | "boleto">();

				const cardNumber = getValues("payment.cardNumber");
				expectTypeOf(cardNumber).toEqualTypeOf<string | undefined>();

				return null;
			});
	});

	it("deve inferir tipos aninhados corretamente", () => {
		const AddressCepField = field("address.cep")
			.schema(z.string().regex(/^\d{5}-?\d{3}$/))
			.render(() => null);

		const AddressStreetField = field("address.street")
			.schema(z.string().min(5))
			.render(() => null);

		const AddressNumberField = field("address.number")
			.schema(z.number())
			.render(() => null);

		type CepType = FieldValue<typeof AddressCepField>;
		type StreetType = FieldValue<typeof AddressStreetField>;
		type NumberType = FieldValue<typeof AddressNumberField>;

		// Asserção de atribuição: verificar tipos corretos
		const cepValue: CepType = "12345-678";
		const streetValue: StreetType = "Rua Teste";
		const numberValue: NumberType = 123;
		const cepString: string = cepValue;
		const streetString: string = streetValue;
		const numberString: number = numberValue;
	});
});
