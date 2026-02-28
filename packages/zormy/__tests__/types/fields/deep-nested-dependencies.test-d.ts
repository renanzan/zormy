/**
 * Testes de tipagem - Dependências Profundamente Aninhadas
 *
 * Verifica tipagem correta com múltiplos níveis de aninhamento e dependências complexas.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Dependências Profundamente Aninhadas", () => {
	it("deve inferir tipos corretos com três níveis de aninhamento", () => {
		const UserProfileField = field("user.profile.name")
			.schema(z.string())
			.render(() => null);

		const UserEmailField = field("user.profile.email")
			.dependsOn(UserProfileField)
			.schema((formValues) => {
				const name = formValues?.user.profile.name;
				expectTypeOf(name).toEqualTypeOf<string | undefined>();
				if (name) {
					return z.string().email();
				}
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const name = getValues("user.profile.name");
				expectTypeOf(name).toEqualTypeOf<string>();
				return null;
			});
	});

	it("deve mesclar dependências de diferentes níveis de aninhamento", () => {
		const UserNameField = field("user.name")
			.schema(z.string())
			.render(() => null);

		const UserEmailField = field("user.email")
			.schema(z.string().email())
			.render(() => null);

		const AddressStreetField = field("address.street")
			.schema(z.string())
			.render(() => null);

		const PhoneField = field("phone")
			.dependsOn(UserNameField, UserEmailField, AddressStreetField)
			.schema((formValues) => {
				const userName = formValues?.user.name;
				const userEmail = formValues?.user.email;
				const addressStreet = formValues?.address.street;
				expectTypeOf(userName).toEqualTypeOf<string | undefined>();
				expectTypeOf(userEmail).toEqualTypeOf<string | undefined>();
				expectTypeOf(addressStreet).toEqualTypeOf<string | undefined>();
				return z.string().optional();
			})
			.render(({ getValues }) => {
				const userName = getValues("user.name");
				const userEmail = getValues("user.email");
				const addressStreet = getValues("address.street");
				expectTypeOf(userName).toEqualTypeOf<string>();
				expectTypeOf(userEmail).toEqualTypeOf<string>();
				expectTypeOf(addressStreet).toEqualTypeOf<string>();
				return null;
			});
	});

	it("deve inferir tipos corretos com dependências em diferentes ramos", () => {
		const PaymentMethodField = field("payment.method")
			.schema(z.enum(["credit", "debit"]))
			.render(() => null);

		const ShippingMethodField = field("shipping.method")
			.schema(z.enum(["standard", "express"]))
			.render(() => null);

		const TotalField = field("total")
			.dependsOn(PaymentMethodField, ShippingMethodField)
			.schema((formValues) => {
				const paymentMethod = formValues?.payment.method;
				const shippingMethod = formValues?.shipping.method;
				expectTypeOf(paymentMethod).toEqualTypeOf<"credit" | "debit" | undefined>();
				expectTypeOf(shippingMethod).toEqualTypeOf<"standard" | "express" | undefined>();
				return z.number();
			})
			.render(({ getValues }) => {
				const paymentMethod = getValues("payment.method");
				const shippingMethod = getValues("shipping.method");
				expectTypeOf(paymentMethod).toEqualTypeOf<"credit" | "debit">();
				expectTypeOf(shippingMethod).toEqualTypeOf<"standard" | "express">();
				return null;
			});
	});

	it("deve inferir tipos corretos com dependências aninhadas e simples misturadas", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const AddressCityField = field("address.city")
			.schema(z.string())
			.render(() => null);

		const ResultField = field("result")
			.dependsOn(AgeField, AddressCityField)
			.schema((formValues) => {
				const age = formValues?.age;
				const city = formValues?.address.city;
				expectTypeOf(age).toEqualTypeOf<number | undefined>();
				expectTypeOf(city).toEqualTypeOf<string | undefined>();
				return z.string();
			})
			.render(({ getValues }) => {
				const age = getValues("age");
				const city = getValues("address.city");
				expectTypeOf(age).toEqualTypeOf<number>();
				expectTypeOf(city).toEqualTypeOf<string>();
				return null;
			});
	});

	it("deve inferir tipos corretos ao acessar objeto completo aninhado", () => {
		const PaymentMethodField = field("payment.method")
			.schema(z.enum(["credit", "debit"]))
			.render(() => null);

		const PaymentAmountField = field("payment.amount")
			.schema(z.number())
			.render(() => null);

		const SummaryField = field("summary")
			.dependsOn(PaymentMethodField, PaymentAmountField)
			.schema(z.string())
			.render(({ getValues }) => {
				const payment = getValues("payment");
				expectTypeOf(payment).toEqualTypeOf<{
					method: "credit" | "debit";
					amount: number;
				}>();
				return null;
			});
	});
});
