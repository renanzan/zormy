/**
 * Testes de tipagem - Field Component
 *
 * Verifica a tipagem das props e contratos dos componentes Field.
 */

import { z } from "zod";
import { describe, expectTypeOf, it } from "vitest";

import { abstractField, field } from "../../../src/fields/field/builder/builder";

import type { ComponentProps } from "react";
import type { FieldComponent } from "../../../src/fields/field/types/field";

const AbstractBooleanField = abstractField()
	.schema(z.boolean())
	.render(() => null);

describe("Type Safety - Field", () => {
	describe("Field simples", () => {
		describe("Métodos do render de um field básico", () => {
			it("tipagem dos métodos watch, getValues, setValue, reset e fieldState", () => {
				const NameField = field("name")
					.schema(z.string())
					.render(({ watch, getValues, setValue, reset, fieldState, setError, clearErrors }) => {
						const watchValues = watch();
						expectTypeOf(watchValues).toEqualTypeOf<{ name: string }>();

						type getValuesParams = Parameters<typeof getValues>[0];
						const getValuesValues = getValues("name");
						expectTypeOf<getValuesParams>().toEqualTypeOf<readonly "name"[]>();
						expectTypeOf(getValuesValues).toEqualTypeOf<string>();

						type setValueParams = Parameters<typeof setValue>;
						expectTypeOf<[setValueParams[0], setValueParams[1]]>().toEqualTypeOf<
							["name", string]
						>();

						// reset do RHF: valores do formulário (ou undefined), não path de campo
						type resetValues = Parameters<typeof reset>[0];
						const _resetEmpty: resetValues = undefined;
						const _resetPartial: resetValues = { name: "Jane" };

						expectTypeOf(fieldState.key).toEqualTypeOf<"name">();
						expectTypeOf(fieldState.defaultValue).toEqualTypeOf<string | undefined>();
						expectTypeOf(fieldState.error?.message).toEqualTypeOf<string | undefined>();

						type SetErrorName = Parameters<typeof setError>[0];
						expectTypeOf(fieldState.key).toMatchTypeOf<SetErrorName>();
						setError(fieldState.key, { type: "manual", message: "erro" });
						clearErrors(fieldState.key);

						// @ts-expect-error — path inexistente no formulário deste campo
						setError("notAField", { type: "manual", message: "x" });

						return null;
					});
			});

			it("tipagem das props do field", () => {
				const NameField = field("name")
					.schema(z.string())
					.render(({}, _props: { label: string }) => null);

				type FieldProps = ComponentProps<typeof NameField>;
				expectTypeOf<FieldProps>().toEqualTypeOf<{ label: string }>();
			});

			it("tipagem dos contratos do field", () => {
				const NameField = field("name")
					.schema(z.string())
					.render(({}, _props: { label: string }) => null);

				expectTypeOf(NameField.config.key).toEqualTypeOf<"name">();
				expectTypeOf(NameField.getZodSchema()).toEqualTypeOf<z.ZodString>();
			});

			it("extend retorna FieldComponent correto", () => {
				const NameField = field("name")
					.schema(z.string())
					.render(({}, _props: { label: string }) => null);

				const AgeField = NameField.extend({
					key: "age",
					schema: z.number(),
					props: { label: "Age" },
				});

				type AgeFieldProps = ComponentProps<typeof AgeField>;

				expectTypeOf<AgeFieldProps>().toEqualTypeOf<{ label: string }>();
				expectTypeOf(AgeField.config.key).toEqualTypeOf<"age">();
				expectTypeOf(AgeField.getZodSchema()).toEqualTypeOf<z.ZodNumber>();
			});
		});
	});

	describe("Field com dependsOn (fields dependentes)", () => {
		describe("Métodos do render do field dependente", () => {
			it("tipagem dos métodos, reset e type-safety para múltiplos fields", () => {
				const LastNameField = field("lastName")
					.schema(z.string())
					.render(() => null);

				const TermsOfUseField = AbstractBooleanField.extend({ key: "termsOfUse" });

				const NameField = field("name")
					.dependsOn(LastNameField, TermsOfUseField, "age")
					.schema(z.string())
					.render(
						(
							{ watch, getValues, setValue, reset, fieldState, setError, clearErrors },
							_props: { label: string }
						) => {
							const watchValues = watch();
							expectTypeOf(watchValues).toMatchTypeOf<{
								name: string;
								lastName: string;
								termsOfUse: boolean;
							}>();
							// dependência declarada como string: valor tipado como any no formulário
							expectTypeOf(watchValues.age).toEqualTypeOf<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any -- contrato de dependsOn(string)

							type getValuesParams = Parameters<typeof getValues>[0];

							// Parameters<> perde literais no primeiro argumento de getValues; validamos paths e retornos
							expectTypeOf<"name">().toExtend<getValuesParams[number]>();
							expectTypeOf<"lastName">().toExtend<getValuesParams[number]>();
							expectTypeOf<"termsOfUse">().toExtend<getValuesParams[number]>();
							expectTypeOf<"age">().toExtend<getValuesParams[number]>();
							expectTypeOf<`age.${string}`>().toExtend<getValuesParams[number]>();

							const nameValue = getValues("name");
							const lastNameValue = getValues("lastName");
							const termsOfUseValue = getValues("termsOfUse");
							const ageValue = getValues("age");

							expectTypeOf(nameValue).toEqualTypeOf<string>();
							expectTypeOf(lastNameValue).toEqualTypeOf<string>();
							expectTypeOf(termsOfUseValue).toEqualTypeOf<boolean>();
							expectTypeOf(ageValue).toEqualTypeOf<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any

							setValue("name", "John");
							setValue("lastName", "Doe");
							setValue("termsOfUse", true);
							setValue("age", 20);
							setValue("age", "20");

							type resetParams = Parameters<typeof reset>[0];

							const validAll: resetParams = {
								name: "John",
								lastName: "Doe",
								termsOfUse: true,
								age: 20,
							};
							const validPartial: resetParams = { name: "Jane" };
							const validEmpty: resetParams = {};
							const validUndefined: resetParams = undefined;

							// @ts-expect-error - name deve ser string
							const erroName: resetParams = { name: 42 };

							// @ts-expect-error - termsOfUse deve ser boolean
							const erroTermsOfUse: resetParams = { termsOfUse: "any" };

							// @ts-expect-error - lastName deve ser string
							const erroLastName: resetParams = { lastName: 12 };

							type ExtractWithAge<T> = T extends { age?: infer A } ? A : never;
							type AgeType = ExtractWithAge<resetParams>;
							expectTypeOf<AgeType>().toEqualTypeOf<any>(); // eslint-disable-line @typescript-eslint/no-explicit-any

							// @ts-expect-error - null não permitido
							const erroNull: resetParams = null;

							expectTypeOf(fieldState.key).toEqualTypeOf<"name">();
							expectTypeOf(fieldState.defaultValue).toEqualTypeOf<string | undefined>();
							expectTypeOf(fieldState.error?.message).toEqualTypeOf<string | undefined>();

							type SetErrorPath = Parameters<typeof setError>[0];
							expectTypeOf(fieldState.key).toMatchTypeOf<SetErrorPath>();
							setError(fieldState.key, { type: "manual", message: "erro" });
							setError("lastName", { type: "manual", message: "dep" });
							clearErrors(fieldState.key);
							clearErrors("termsOfUse");

							// @ts-expect-error — path inexistente
							setError("missingField", { type: "manual" });

							return null;
						}
					);
			});

			it("tipagem das props do field dependente", () => {
				const LastNameField = field("lastName")
					.schema(z.string())
					.render(() => null);

				const TermsOfUseField = AbstractBooleanField.extend({ key: "termsOfUse" });

				const NameField = field("name")
					.dependsOn(LastNameField, TermsOfUseField, "age")
					.schema(z.string())
					.render((_, _props: { label: string }) => null);

				type FieldProps = ComponentProps<typeof NameField>;
				expectTypeOf<FieldProps>().toEqualTypeOf<{ label: string }>();
			});

			it("tipagem dos contratos do field dependente", () => {
				const LastNameField = field("lastName")
					.schema(z.string())
					.render(() => null);

				const TermsOfUseField = AbstractBooleanField.extend({ key: "termsOfUse" });

				const NameField = field("name")
					.dependsOn(LastNameField, TermsOfUseField, "age")
					.schema(z.string())
					.render((_, _props: { label: string }) => null);

				expectTypeOf(NameField.config.key).toEqualTypeOf<"name">();
				expectTypeOf(NameField.getZodSchema()).toEqualTypeOf<z.ZodString>();

				const AgeField = NameField.extend({ key: "age", schema: z.number() });
				expectTypeOf(AgeField).toEqualTypeOf<
					FieldComponent<"age", z.ZodNumber, { label: string }>
				>();
			});
		});
	});
});
