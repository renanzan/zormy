/**
 * Testes de tipagem - field com diferentes dependsOn
 *
 * Garante que as tipagens de formValues, watch, getValues e fieldState
 * funcionam corretamente para cada variante de dependsOn (Field, string, múltiplos, aninhados, mix).
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

describe("Type Safety - field.dependsOn variantes", () => {
	describe("dependsOn com um único Field", () => {
		it("formValues no schema tem tipo da dependência", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("name")
				.dependsOn(AgeField)
				.schema((formValues) => {
					const age = formValues?.age;
					expectTypeOf(age).toEqualTypeOf<number | undefined>();
					return age && age > 18 ? z.string().min(2) : z.string().optional();
				})
				.render(() => null);
		});

		it("watch e getValues aceitam a chave da dependência", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("name")
				.dependsOn(AgeField)
				.schema((formValues) => {
					expectTypeOf(formValues).toEqualTypeOf<{ age: number } | undefined>();

					return z.string();
				})
				.render(({ watch, getValues }) => {
					const ageW = watch("age");
					const ageG = getValues("age");
					expectTypeOf(ageW).toEqualTypeOf<number>();
					expectTypeOf(ageG).toEqualTypeOf<number>();
					return null;
				});
		});

		it("watch do próprio campo retorna TypeOf<Schema> | undefined", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("name")
				.dependsOn(AgeField)
				.schema(z.string())
				.render(({ watch }) => {
					const name = watch("name");
					expectTypeOf(name).toEqualTypeOf<string | undefined>();
					return null;
				});
		});
	});

	describe("dependsOn com string (chave)", () => {
		it("formValues permite acessar chave declarada por string", () => {
			field("password")
				.dependsOn("hasPassword")
				.schema((formValues) => {
					const hasPassword = formValues?.hasPassword;
					// Com string, tipo da chave é any
					expectTypeOf(hasPassword).toEqualTypeOf<any>();
					return hasPassword ? z.string().min(8) : z.string().optional();
				})
				.render(() => null);
		});

		it("watch aceita a chave passada como string em dependsOn", () => {
			field("password")
				.dependsOn("hasPassword")
				.schema((formValues) => {
					expectTypeOf(formValues).toEqualTypeOf<{ hasPassword: any } | undefined>();

					return z.string().optional();
				})
				.render(({ watch }) => {
					const hasPassword = watch("hasPassword");
					expectTypeOf(hasPassword).not.toEqualTypeOf<never>();
					return null;
				});
		});

		it("getValues aceita chave declarada por string", () => {
			field("password")
				.dependsOn("hasPassword")
				.schema((formValues) => {
					expectTypeOf(formValues).toEqualTypeOf<{ hasPassword: any } | undefined>();

					return z.string().optional();
				})
				.render(({ getValues }) => {
					const hasPassword = getValues("hasPassword");
					return null;
				});
		});
	});

	describe("dependsOn com múltiplos Fields", () => {
		it("formValues no schema tem todas as dependências tipadas", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			field("name")
				.dependsOn(AgeField, EmailField)
				.schema((formValues) => {
					const age = formValues?.age;
					const email = formValues?.email;
					expectTypeOf(age).toEqualTypeOf<number | undefined>();
					expectTypeOf(email).toEqualTypeOf<string | undefined>();
					return z.string();
				})
				.render(() => null);
		});

		it("watch e getValues aceitam todas as chaves das dependências", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			field("phone")
				.dependsOn(AgeField, EmailField)
				.schema(z.string().optional())
				.render(({ watch, getValues }) => {
					const age = watch("age");
					const email = watch("email");
					expectTypeOf(age).toEqualTypeOf<number>();
					expectTypeOf(email).toEqualTypeOf<string>();
					const ageG = getValues("age");
					const emailG = getValues("email");
					expectTypeOf(ageG).toEqualTypeOf<number>();
					expectTypeOf(emailG).toEqualTypeOf<string>();
					return null;
				});
		});
	});

	describe("dependsOn com Field aninhado (dot notation)", () => {
		it("formValues acessa path aninhado com tipagem correta", () => {
			const PaymentMethodField = field("payment.method")
				.schema(z.enum(["credit", "debit"]))
				.render(() => null);

			field("payment.cardNumber")
				.dependsOn(PaymentMethodField)
				.schema((formValues) => {
					const method = formValues?.payment?.method;
					expectTypeOf(method).toEqualTypeOf<"credit" | "debit" | undefined>();
					return method ? z.string().min(13) : z.string().optional();
				})
				.render(() => null);
		});

		it("watch e getValues aceitam path aninhado da dependência", () => {
			const PaymentMethodField = field("payment.method")
				.schema(z.enum(["credit", "debit"]))
				.render(() => null);

			field("payment.cardNumber")
				.dependsOn(PaymentMethodField)
				.schema(z.string().optional())
				.render(({ watch, getValues }) => {
					const method = watch("payment.method");
					expectTypeOf(method).toEqualTypeOf<"credit" | "debit">();
					const methodG = getValues("payment.method");
					expectTypeOf(methodG).toEqualTypeOf<"credit" | "debit">();
					return null;
				});
		});
	});

	describe("dependsOn com mix de Field e string", () => {
		it("formValues tem tipo do Field e any para a string", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("result")
				.dependsOn(AgeField, "extra")
				.schema((formValues) => {
					const age = formValues?.age;
					const extra = formValues?.extra;
					expectTypeOf(age).toEqualTypeOf<number | undefined>();
					expectTypeOf(extra).toEqualTypeOf<any>();
					return z.string();
				})
				.render(() => null);
		});

		it("watch aceita chave do Field e chave string", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("result")
				.dependsOn(AgeField, "extra")
				.schema(z.string())
				.render(({ watch }) => {
					const age = watch("age");
					const extra = watch("extra");
					expectTypeOf(age).toEqualTypeOf<number>();
					expectTypeOf(extra).not.toEqualTypeOf<never>();
					return null;
				});
		});
	});

	describe("chaves inválidas rejeitadas", () => {
		it("watch rejeita chave que não é do campo nem dependência", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("name")
				.dependsOn(AgeField)
				.schema(z.string())
				.render(({ watch }) => {
					// @ts-expect-error - "invalidKey" não é "name" nem "age"
					const invalid = watch("invalidKey");
					return null;
				});
		});

		it("getValues rejeita chave que não é do campo nem dependência", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("name")
				.dependsOn(AgeField)
				.schema(z.string())
				.render(({ getValues }) => {
					// @ts-expect-error - "invalidKey" não é "name" nem "age"
					const invalid = getValues("invalidKey");
					return null;
				});
		});
	});

	describe("campo sem dependsOn", () => {
		it("watch e getValues aceitam apenas a chave do próprio campo", () => {
			field("name")
				.schema(z.string())
				.render(({ watch, getValues }) => {
					const nameW = watch("name");
					const nameG = getValues("name");
					expectTypeOf(nameW).toEqualTypeOf<string | undefined>();
					expectTypeOf(nameG).toEqualTypeOf<string>();
					return null;
				});
		});

		it("formValues no schema é opcional e sem tipo de dependência", () => {
			field("name")
				.schema((formValues) => {
					// Sem dependsOn, formValues é Record<string, any> | undefined
					expectTypeOf(formValues).toEqualTypeOf<Record<string, any> | undefined>();
					return z.string();
				})
				.render(() => null);
		});
	});

	describe("watch() sem argumento", () => {
		it("retorna tipo completo do formulário (campo + dependências)", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("name")
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

		it("com múltiplas dependências retorna intersecção correta", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			const EmailField = field("email")
				.schema(z.string())
				.render(() => null);

			field("phone")
				.dependsOn(AgeField, EmailField)
				.schema(z.string().optional())
				.render(({ watch }) => {
					const all = watch();
					expectTypeOf(all).toMatchTypeOf<{ phone?: string; age: number; email: string }>();
					return null;
				});
		});
	});

	describe("fieldState em campo com dependsOn", () => {
		it("fieldState.error tem tipo compatível com schema dinâmico", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(() => null);

			field("name")
				.dependsOn(AgeField)
				.schema((formValues) => {
					return formValues?.age && formValues.age > 18
						? z.string().min(3, "Mínimo 3 caracteres")
						: z.string().optional();
				})
				.render(({ fieldState }) => {
					// error?.message é string | undefined (consistente com field-state-types)
					expectTypeOf(fieldState.error?.message).toEqualTypeOf<string | undefined>();
					return null;
				});
		});
	});
});
