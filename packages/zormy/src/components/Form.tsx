"use client";

import { FormProvider } from "react-hook-form";

import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import type { FieldValues, SubmitHandler, UseFormProps, UseFormReturn } from "react-hook-form";

import { useZormy } from "../form/hooks/useZormy";
import type { FieldsToObject } from "../fields/field/types/extractors";
import type { FieldComponentBase } from "../fields/field/types/field";

/** Props quando o formulário recebe `methods` (useForm/useZormy externo). */
type FormPropsWithMethods<
	TFieldValues extends FieldValues = FieldValues,
	TContextOnly extends boolean = false,
> = TContextOnly extends true
	? {
			methods: UseFormReturn<TFieldValues>;
			contextOnly: true;
			children: ReactElement;
		} & Omit<ComponentPropsWithoutRef<"form">, "children" | "ref">
	: {
			methods: UseFormReturn<TFieldValues>;
			onSubmit?: SubmitHandler<TFieldValues>;
			contextOnly?: false | undefined;
			children?: ReactNode;
		} & Omit<ComponentPropsWithoutRef<"form">, "onSubmit">;

/** Props quando o formulário recebe `fields` (useZormy interno). */
type FormPropsWithFields<TFields extends readonly FieldComponentBase[]> = {
	fields: TFields;
	/** Valores iniciais (opcional). Passado para useForm. */
	defaultValues?: UseFormProps<FieldsToObject<TFields>>["defaultValues"];
	/** Modo de validação: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all". Passado para useForm. */
	mode?: UseFormProps<FieldsToObject<TFields>>["mode"];
	onSubmit?: SubmitHandler<FieldsToObject<TFields>>;
	contextOnly?: false | undefined;
	children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<"form">, "onSubmit" | "children">;

/**
 * Props do componente Form.
 *
 * Aceita **dois modos**:
 * - **`methods`**: instância de useForm/useZormy (controle externo).
 * - **`fields`**: array de campos Zormy; o Form usa useZormy internamente (defaultValues, mode, etc. opcionais).
 *
 * @template TFieldValues - Tipo dos valores do formulário (quando usa `methods`).
 * @template TContextOnly - Se true, exige `children` ReactElement e não renderiza `<form>`.
 * @template TFields - Array de campos (quando usa `fields`).
 */
export type FormProps<
	TFieldValues extends FieldValues = FieldValues,
	TContextOnly extends boolean = false,
	TFields extends readonly FieldComponentBase[] = readonly FieldComponentBase[],
> =
	| FormPropsWithMethods<TFieldValues, TContextOnly>
	| (FormPropsWithFields<TFields> & { methods?: undefined });

function FormWithMethods<
	TFieldValues extends FieldValues,
	TContextOnly extends boolean,
>(props: FormPropsWithMethods<TFieldValues, TContextOnly>) {
	const { methods, contextOnly, children, onSubmit, ...formProps } = props;
	if (contextOnly) {
		return <FormProvider {...methods}>{children as ReactElement}</FormProvider>;
	}
	return (
		<FormProvider {...methods}>
			<form
				{...formProps}
				onSubmit={
				onSubmit
					? methods.handleSubmit(onSubmit as SubmitHandler<TFieldValues>)
					: undefined
			}
			>
				{children}
			</form>
		</FormProvider>
	);
}

function FormWithFields<TFields extends readonly FieldComponentBase[]>(
	props: FormPropsWithFields<TFields>
) {
	const { fields, defaultValues, mode, onSubmit, contextOnly, children, ...rest } = props;
	const methods = useZormy({
		fields: fields as unknown as FieldComponentBase[],
		defaultValues,
		mode,
	});

	if (contextOnly) {
		return <FormProvider {...methods}>{children as ReactElement}</FormProvider>;
	}
	return (
		<FormProvider {...methods}>
			<form
			{...rest}
			onSubmit={
				onSubmit
					? (
							methods as unknown as UseFormReturn<FieldsToObject<TFields>>
						).handleSubmit(onSubmit)
					: undefined
			}
		>
				{children}
			</form>
		</FormProvider>
	);
}

/**
 * Componente de formulário integrado ao react-hook-form.
 *
 * **Dois modos de uso:**
 * - **Com `methods`**: passe o retorno de `useForm` ou `useZormy` (controle externo).
 * - **Com `fields`**: passe o array de campos; o Form usa `useZormy` internamente. Opcionalmente passe `defaultValues`, `mode`, etc.
 *
 * Com `contextOnly`, fornece apenas o contexto (sem `<form>`).
 *
 * @example
 * ```tsx
 * // Com methods (atual):
 * const form = useZormy({ fields: [NameField, EmailField], defaultValues: { name: "", email: "" } });
 * <Form methods={form} onSubmit={form.handleSubmit(handleSubmit)}>
 *   <NameField /> <EmailField />
 * </Form>
 *
 * // Com fields (novo): Form cria o useForm internamente
 * <Form
 *   fields={[NameField, EmailField]}
 *   defaultValues={{ name: "", email: "" }}
 *   mode="onChange"
 *   onSubmit={(data) => console.log(data)}
 * >
 *   <NameField /> <EmailField />
 * </Form>
 * ```
 */
export function Form<
	TFieldValues extends FieldValues = FieldValues,
	TContextOnly extends boolean = false,
	TFields extends readonly FieldComponentBase[] = readonly FieldComponentBase[],
>(
	props: FormProps<TFieldValues, TContextOnly, TFields>
) {
	if ("fields" in props && props.fields !== undefined) {
		return <FormWithFields {...(props as FormPropsWithFields<TFields>)} />;
	}
	return (
		<FormWithMethods {...(props as FormPropsWithMethods<TFieldValues, TContextOnly>)} />
	);
}
