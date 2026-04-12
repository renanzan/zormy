/**
 * Testes de tipagem - Método watch
 *
 * Verifica tipagem correta do método watch em diferentes cenários.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - Método watch", () => {
	it("deve retornar tipo correto ao observar o próprio campo", () => {
		const NameField = field("name")
			.schema(z.string().optional())
			.render(({ watch }) => {
				const name = watch("name");
				expectTypeOf(name).toEqualTypeOf<string | undefined>();
				return null;
			});
	});

	it("deve retornar tipo correto ao observar campo dependente", () => {
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
				return z.string().optional();
			})
			.render(({ watch }) => {
				const age = watch("age");
				expectTypeOf(age).toEqualTypeOf<number>();
				return null;
			});
	});

	it("deve retornar tipo correto ao observar campo aninhado", () => {
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
			.render(({ watch }) => {
				const method = watch("payment.method");
				expectTypeOf(method).toEqualTypeOf<"credit" | "debit">();
				return null;
			});
	});

	it("deve retornar tipo correto ao observar todo o formulário", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const NameField = field("name")
			.dependsOn(AgeField)
			.schema(z.string())
			.render(({ watch }) => {
				const all = watch();
				expectTypeOf(all).toEqualTypeOf<
					{
						name: string;
					} & {
						age: number;
					}
				>();
				return null;
			});
	});

	it("deve rejeitar chaves inválidas em watch", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ watch }) => {
				// @ts-expect-error - "invalidKey" não existe
				const invalid = watch("invalidKey");
				return null;
			});
	});

	it("deve inferir tipo correto ao observar múltiplas dependências", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(() => null);

		const EmailField = field("email")
			.schema(z.string().email())
			.render(() => null);

		const NameField = field("name")
			.dependsOn(AgeField, EmailField)
			.schema(z.string())
			.render(({ watch }) => {
				const age = watch("age");
				const email = watch("email");
				expectTypeOf(age).toEqualTypeOf<number>();
				expectTypeOf(email).toEqualTypeOf<string>();
				return null;
			});
	});
});
