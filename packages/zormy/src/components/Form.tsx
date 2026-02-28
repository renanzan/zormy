import { FormProvider } from "react-hook-form";

import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

/**
 * Props do componente Form.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template TContextOnly - Define se o formulário fornece apenas o contexto (sem envolver em `<form>`). Se true, espera um elemento filho do tipo ReactElement que receberá as props do formulário.
 *
 * @property methods - Instância de UseFormReturn do react-hook-form.
 * @property contextOnly - Se verdadeiro, fornece apenas o contexto do formulário e renderiza o filho customizado **sem envolver em `<form>` e sem repassar props HTML do `Form` para o filho**. Útil para integração com bibliotecas como @radix-ui/react-slot, wrappers customizados, ou cenários avançados de composição.
 */
export type FormProps<
	TFieldValues extends FieldValues = FieldValues,
	TContextOnly extends boolean = false,
> = TContextOnly extends true
	? {
			methods: UseFormReturn<TFieldValues>;
			/** Fornece apenas o contexto do formulário em vez de envolver em um <form>. Veja descrição acima. */
			contextOnly: true;
			/** Elemento filho único que recebe as props do formulário. */
			children: ReactElement;
		} & Omit<ComponentPropsWithoutRef<"form">, "children" | "ref">
	: {
			methods: UseFormReturn<TFieldValues>;
			/** Renderiza formulário padrão <form> (valor default). */
			contextOnly?: false | undefined;
			children?: ReactNode;
		} & ComponentPropsWithoutRef<"form">;

/**
 * Componente de formulário integrado ao react-hook-form.
 *
 * Permite controle flexível do elemento raiz usando a prop `contextOnly`.
 * - Por padrão, renderiza um `<form>`.
 * - Com `contextOnly`, fornece apenas o contexto do formulário e renderiza o filho customizado, repassando as props do formulário para ele (não renderiza `<form>`).
 *
 * @example
 * ```tsx
 * // Modo padrão:
 * <Form methods={formMethods}>
 *   <input name="foo" />
 * </Form>
 *
 * // Com contextOnly (ex: usando Radix Slot ou wrapper customizado):
 * <Form methods={formMethods} contextOnly>
 *   <CustomFormComponent />
 * </Form>
 * ```
 */
export const Form = <
	TFieldValues extends FieldValues = FieldValues,
	TContextOnly extends boolean = false,
>(
	props: FormProps<TFieldValues, TContextOnly>
) => {
	const { methods, contextOnly, children, ...formProps } = props;
	if (contextOnly) {
		// Tipagem garante que contextOnly==true implica filhos ReactElement.
		return <FormProvider {...methods}>{children as ReactElement}</FormProvider>;
	}

	// Padrão: renderiza <form>
	return (
		<FormProvider {...methods}>
			<form {...formProps}>{children}</form>
		</FormProvider>
	);
};
