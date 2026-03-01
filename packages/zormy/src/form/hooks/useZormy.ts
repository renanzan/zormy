import { useForm } from "react-hook-form";
import { zormyResolver } from "../../resolver/resolver";

import type { Resolver, UseFormProps } from "react-hook-form";
import type { FieldsToObject } from "../../fields/field/types/extractors";
import type { FieldComponentBase } from "../../fields/field/types/field";

type UseZormyArgs<
	TFieldValues extends FieldComponentBase[] = FieldComponentBase[],
	TContext = unknown,
	TTransformedValues = FieldsToObject<TFieldValues>,
> = {
	fields: TFieldValues;
} & Omit<
	UseFormProps<FieldsToObject<TFieldValues>, TContext, TTransformedValues>,
	"resolver"
>;

/**
 * Hook que integra um array de campos Zormy ao `useForm` do react-hook-form,
 * injetando automaticamente o `zormyResolver` e inferindo o tipo do formulário.
 *
 * @param args - Objeto com `fields` (array de campos) e as demais opções do `useForm`, exceto `resolver`.
 * @returns Retorno do `useForm` tipado com base em `FieldsToObject<TFieldValues>`.
 *
 * @example
 * ```tsx
 * const form = useZormy({
 *   fields: [NameField, EmailField],
 *   defaultValues: { name: "", email: "" },
 * });
 * ```
 */
export const useZormy = <
	TFieldValues extends FieldComponentBase[] = FieldComponentBase[],
	TContext = unknown,
	TTransformedValues = FieldsToObject<TFieldValues>,
>({
	fields,
	...args
}: UseZormyArgs<TFieldValues, TContext, TTransformedValues>) => {
	type FormValues = FieldsToObject<TFieldValues>;
	return useForm<FormValues, TContext, TTransformedValues>({
		...args,
		resolver: zormyResolver({ fields }) as Resolver<
			FormValues,
			TContext,
			TTransformedValues
		>,
	});
};
