/**
 * Testes de tipagem - Componente Form
 *
 * Verifica a tipagem de props do componente Form:
 * modo com `methods`, modo com `fields` (useZormy interno) e contextOnly.
 */

import { z } from "zod";
import { describe, expectTypeOf, it } from "vitest";

import { Form } from "../../../src/components/Form";
import { field } from "../../../src/fields/field/builder/builder";

import type { ReactNode } from "react";
import type { FieldValues } from "react-hook-form";
import type { FormMethodsProps } from "../../../src/components/Form";
import type { ZormyFormMethods } from "../../../src/form/types/form-methods";

declare function getUseFormReturn<T extends FieldValues>(): ZormyFormMethods<T>;

describe("Type Safety - Componente Form", () => {
	it("deve aceitar props padrão (renderiza <form>)", () => {
		const methods = getUseFormReturn<{ name: string; age: number }>();
		// Deve aceitar children solto
		<Form methods={methods}>
			<input name="name" />
		</Form>;
		// Deve aceitar qualquer children (opcional)
		<Form methods={methods} />;
		// contextOnly deve ser opcional e false/undefined
		<Form methods={methods} contextOnly={false} />;
		<Form methods={methods} contextOnly={undefined} />;

		// Tipo do props.children no modo padrão: ReactNode | undefined
		type FormDefaultProps = FormMethodsProps<{ name: string }>;
		expectTypeOf<FormDefaultProps["children"]>().toMatchTypeOf<ReactNode | undefined>();
	});

	it("deve aceitar contextOnly: true e exigir ReactElement filho", () => {
		const methods = getUseFormReturn<{ foo: string }>();
		// contextOnly={true} (literal) exige children — sem genéricos explícitos no Form
		<Form methods={methods} contextOnly={true}>
			<div />
		</Form>;

		<Form methods={methods} contextOnly={true} children={<div />} />;

		<Form methods={methods} contextOnly={true}>
			{<div />}
		</Form>;

		// @ts-expect-error - children obrigatório quando contextOnly: true
		<Form methods={methods} contextOnly={true} />;
	});

	it("deve aceitar props de form HTML (onSubmit, etc.)", () => {
		const methodsA = getUseFormReturn<{ a: number }>();
		<Form
			methods={methodsA}
			onSubmit={(data) => {
				expectTypeOf(data).toEqualTypeOf<{ a: number }>();
			}}
		>
			<input name="a" />
		</Form>;
	});

	it("deve inferir tipos de methods (ZormyFormMethods)", () => {
		const methods = getUseFormReturn<{ test: string }>();
		const _typed: ZormyFormMethods<{ test: string }> = methods;
		void _typed;
	});

	it("deve exigir methods compatível com ZormyFormMethods<TFieldValues>", () => {
		const methods = getUseFormReturn<{ name: string; email: string }>();
		<Form methods={methods}>
			<></>
		</Form>;
		// Props do Form no modo padrão: methods é ZormyFormMethods<TFieldValues>
		type FormPropsDefault = FormMethodsProps<{ name: string }>;
		type MethodsProp = FormPropsDefault["methods"];
		const _methodsCheck: MethodsProp = getUseFormReturn<{ name: string }>();
		void _methodsCheck;
	});

	describe("modo com fields (useZormy interno)", () => {
		it("deve aceitar fields e opcionalmente defaultValues e mode", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string())
				.render(() => null);

			// Apenas fields
			<Form fields={[NameField, EmailField]}>
				<></>
			</Form>;

			// fields + defaultValues
			<Form fields={[NameField, EmailField]} defaultValues={{ name: "", email: "" }}>
				<></>
			</Form>;

			// fields + mode
			<Form fields={[NameField, EmailField]} mode="onChange">
				<></>
			</Form>;

			// fields + defaultValues + mode + onSubmit
			<Form
				fields={[NameField, EmailField]}
				defaultValues={{ name: "", email: "" }}
				mode="onBlur"
				onSubmit={(data) => {
					expectTypeOf(data).toEqualTypeOf<{ name: string; email: string }>();
				}}
			>
				<></>
			</Form>;
		});

		it("onSubmit no modo fields deve receber data tipado como FormValues", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			<Form
				fields={[NameField]}
				onSubmit={(data) => {
					expectTypeOf(data).toEqualTypeOf<{ name: string }>();
				}}
			>
				<></>
			</Form>;
		});
	});
});
