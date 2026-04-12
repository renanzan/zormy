/**
 * Testes de tipagem - FieldState e Control
 *
 * Verifica tipagem correta do fieldState e control.
 */

import { z } from "zod";

import { field } from "../../../src/fields/field/builder/builder";

import type { Control } from "react-hook-form";

describe("Type Safety - FieldState e Control", () => {
	it("deve ter fieldState com key tipada corretamente", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ fieldState }) => {
				expectTypeOf(fieldState.key).toEqualTypeOf<"name">();
				return null;
			});
	});

	it("deve ter fieldState com defaultValue do tipo correto", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ fieldState }) => {
				expectTypeOf(fieldState.defaultValue).toEqualTypeOf<string | undefined>();
				return null;
			});
	});

	it("deve ter fieldState com error tipado corretamente", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ fieldState }) => {
				expectTypeOf(fieldState.error?.message).toEqualTypeOf<string | undefined>();
				return null;
			});
	});

	it("deve ter fieldState com key tipada para campo aninhado", () => {
		const CardNumberField = field("payment.cardNumber")
			.schema(z.string())
			.render(({ fieldState }) => {
				expectTypeOf(fieldState.key).toEqualTypeOf<"payment.cardNumber">();
				return null;
			});
	});

	it("setError e clearErrors aceitam fieldState.key em campo com key pontilhada (paths aninhados no form values)", () => {
		const CardNumberField = field("payment.cardNumber")
			.schema(z.string())
			.render(({ fieldState, setError, clearErrors }) => {
				type PathArg = Parameters<typeof setError>[0];
				expectTypeOf(fieldState.key).toMatchTypeOf<PathArg>();
				setError(fieldState.key, { type: "manual", message: "inválido" });
				clearErrors(fieldState.key);
				return null;
			});
	});

	it("deve ter control tipado com a key do field", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(({ control }) => {
				// Control deve estar tipado com o tipo do formulário que inclui a key do campo
				// Para campo "name" com schema string, o tipo deve ser Control<{ name: string }>
				// Verifica compatibilidade de tipo usando asserção
				const controlCheck: Control<{ name: string }> = control;
				// Verifica que control tem propriedades básicas do react-hook-form
				const hasRegister = control.register;
				const hasGetFieldState = control._getWatch;
				// Verifica que control não é null ou undefined
				const isDefined: typeof control extends null | undefined ? never : true = true;
				return null;
			});
	});

	it("deve ter control disponível para campo aninhado", () => {
		const CardNumberField = field("payment.cardNumber")
			.schema(z.string())
			.render(({ control }) => {
				const controlCheck: Control<{ payment: { cardNumber: string } }> = control;
				// Para campos aninhados, control deve estar disponível
				// Verifica que control não é null ou undefined
				const isDefined: typeof control extends null | undefined ? never : true = true;
				// Verifica que control tem propriedades básicas do react-hook-form
				const hasRegister = control.register;
				const hasGetFieldState = control._getWatch;
				// Verifica que control é um objeto (não primitivo)
				const isObject: typeof control extends object ? true : false = true;
				return null;
			});
	});

	it("deve ter fieldState com tipos corretos para schema number", () => {
		const AgeField = field("age")
			.schema(z.number())
			.render(({ fieldState }) => {
				expectTypeOf(fieldState.defaultValue).toEqualTypeOf<number | undefined>();
				return null;
			});
	});

	it("deve ter fieldState com tipos corretos para schema boolean", () => {
		const IsActiveField = field("isActive")
			.schema(z.boolean())
			.render(({ fieldState }) => {
				expectTypeOf(fieldState.defaultValue).toEqualTypeOf<boolean | undefined>();
				return null;
			});
	});
});
