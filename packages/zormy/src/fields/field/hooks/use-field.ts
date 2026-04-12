"use client";

import { useCallback } from "react";
import { get, useFormContext } from "react-hook-form";

import type { TypeOf, ZodType } from "zod";
import type {
	FieldErrors,
	Path,
	RegisterOptions,
	UseFormRegisterReturn,
	UseFormReturn,
} from "react-hook-form";
import type { KeyToNested, MergeFieldWithDeps } from "../../../resolver/types/nested-helpers";

/**
 * Tipo dos valores do formulário no contexto de um campo: objeto aninhado da key + dependências.
 * Deve ser o mesmo genérico passado a `useFormContext` para que `setError`, `clearErrors`, `reset`, etc.
 * recebam `FieldPath` corretos.
 *
 * Não usar `UseFormReturn<{ [key in Key]: TypeOf<Schema> } | DepsTypes>`: a união faz o `FieldPath<T>`
 * do react-hook-form distribuir de forma que paths válidos somem e métodos como `setError` aceitam
 * só `root` / `root.*`. O merge (`KeyToNested` + dependências) espelha o objeto real do formulário.
 *
 * `Omit<UseFormReturn<…>, "register" | …> & { … }` permanece necessário: `register`, `getValues`,
 * `setValue` e `watch` têm assinaturas próprias; intersectar `UseFormReturn` com um objeto que
 * redefine esses métodos produz interseção de *call signatures* (inutilizável), não substituição.
 */
type UseFieldFormValues<Key extends string, Schema extends ZodType, DepsTypes> = MergeFieldWithDeps<
	KeyToNested<Key, TypeOf<Schema>>,
	DepsTypes
>;

/**
 * Tipo customizado para o método register do zormy.
 * Permite sobrescrever o nome do campo se necessário.
 */
type ZormyRegister = (
	options?: RegisterOptions & {
		name?: string;
	}
) => UseFormRegisterReturn;

/**
 * Helper para extrair o tipo de erro correto baseado no tipo do schema.
 * Quando o schema é um objeto, o erro deve ser um objeto com erros para cada propriedade.
 * Quando o schema é um tipo primitivo, o erro é um objeto de erro simples.
 *
 * @template SchemaType - Tipo inferido do schema Zod
 */
type ExtractFieldErrorType<SchemaType> = SchemaType extends object
	? SchemaType extends Array<unknown>
		? FieldErrors<Record<string, SchemaType>>[string]
		: FieldErrors<SchemaType>
	: FieldErrors<Record<string, SchemaType>>[string];

/**
 * Estado do campo no formulário.
 *
 * @template Key - Chave do campo
 * @template Schema - Schema Zod do campo
 */
type FieldState<Key extends string, Schema extends ZodType, _DepsTypes = Record<string, never>> = {
	/** Chave do campo no formulário */
	key: Key;
	/** Erro de validação do campo, se houver.
	 * Quando o schema é um objeto, o erro será um objeto com erros para cada propriedade.
	 * Quando o schema é um tipo primitivo, o erro será um objeto de erro simples.
	 */
	error?: ExtractFieldErrorType<TypeOf<Schema>>;
	/** Valor padrão do campo (defaultValue) */
	defaultValue: TypeOf<Schema> | undefined;
};

/**
 * Retorno do hook useField.
 *
 * Fornece acesso ao contexto do formulário com métodos customizados
 * para trabalhar com campos tipados.
 *
 * @template Key - Chave literal do campo
 * @template Schema - Schema Zod do campo
 * @template DepsTypes - Tipos dos campos dependentes
 */
export type UseFieldReturn<
	Key extends string,
	Schema extends ZodType,
	DepsTypes = Record<string, never>,
> = Omit<UseFormReturn<UseFieldFormValues<Key, Schema, DepsTypes>>, "register"> & {
	/** Método register customizado que usa a chave do campo por padrão */
	register: ZormyRegister;
	/** Estado do campo incluindo erros de validação */
	fieldState: FieldState<Key, Schema, DepsTypes>;
	/** Valores padrão (defaultValues) completos do formulário */
	defaultValues: Partial<UseFieldFormValues<Key, Schema, DepsTypes>> | undefined;
};

/**
 * Hook para acessar o contexto do formulário com tipagem forte para um campo específico.
 *
 * Fornece métodos do react-hook-form (register, getValues, etc.) tipados para o campo,
 * além do estado do campo (erros de validação).
 *
 * **Requisito**: Deve ser usado dentro de um FormProvider do react-hook-form.
 *
 * @template Key - Chave literal do campo
 * @template Schema - Schema Zod do campo
 * @template DepsTypes - Tipos inferidos dos campos dependentes
 *
 * @param key - Chave do campo no formulário
 * @returns Contexto do formulário tipado para o campo específico
 *
 * @throws {Error} Se não estiver dentro de um FormProvider
 *
 * @example
 * ```tsx
 * const MyField = () => {
 *   const { register, fieldState, getValues } = useField<"name", ZodString>("name");
 *   return (
 *     <div>
 *       <input {...register()} />
 *       {fieldState.error && <span>{fieldState.error.message}</span>}
 *     </div>
 *   );
 * };
 * ```
 */
export const useField = <
	Key extends string,
	Schema extends ZodType,
	DepsTypes = Record<string, never>,
>(
	key: Key
): UseFieldReturn<Key, Schema, DepsTypes> => {
	type FormType = UseFieldFormValues<Key, Schema, DepsTypes>;
	const context = useFormContext<FormType>();

	if (!context) {
		throw new Error("useField deve ser usado dentro de um FormProvider");
	}

	// Verificação de segurança para garantir que formState esteja inicializado
	if (!context.formState) {
		throw new Error(
			"useField: formState não está inicializado. Certifique-se de que o FormProvider está configurado corretamente."
		);
	}

	const register = useCallback(
		(args?: RegisterOptions & { name?: string }) => {
			const { name, ...options } = args ?? {};

			return context.register(
				(name ?? key) as Path<FormType>,
				options as RegisterOptions<FormType, Path<FormType>>
			);
		},
		[context, key]
	);

	const fieldState: FieldState<Key, Schema, DepsTypes> = {
		key,
		error: context.formState.errors ? get(context.formState.errors, key) : undefined,
		defaultValue: context.formState.defaultValues
			? get(context.formState.defaultValues, key)
			: undefined,
	};

	return {
		...context,
		register,
		fieldState,
		defaultValues: context.formState.defaultValues as Partial<FormType> | undefined,
	};
};
