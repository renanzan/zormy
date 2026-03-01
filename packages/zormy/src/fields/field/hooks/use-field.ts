"use client";

import { useCallback } from "react";
import { get, useFormContext } from "react-hook-form";

import type { TypeOf, ZodType } from "zod";
import type {
	ArrayPath,
	Control,
	FieldErrors,
	Path,
	PathValue,
	RegisterOptions,
	UseFormRegisterReturn,
	UseFormReturn,
} from "react-hook-form";
import type {
	KeyToNested,
	KeyToPath,
	MergeFieldWithDeps,
} from "../../../resolver/types/nested-helpers";

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
> = Omit<
	UseFormReturn<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>,
	"register" | "getValues" | "setValue" | "watch"
> & {
	/** Método register customizado que usa a chave do campo por padrão */
	register: ZormyRegister;
	/** Estado do campo incluindo erros de validação */
	fieldState: FieldState<Key, Schema, DepsTypes>;
	/** Control tipado para uso com Controller do react-hook-form.
	 * Quando a chave contém pontos, é tipado como Control<any> para permitir
	 * que o Controller infira corretamente paths aninhados.
	 */
	control: Key extends `${string}.${string}`
		? Control<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
		: Control<{ [key in Key]: TypeOf<Schema> }>;
	/** Método getValues tipado para o campo específico */
	getValues: <
		T extends
			| KeyToPath<Key>
			| Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
			| ArrayPath<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>,
	>(
		path: T
	) => T extends KeyToPath<Key>
		? TypeOf<Schema>
		: T extends
					| Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
					| ArrayPath<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
			? PathValue<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>, T>
			: never;
	/** Método setValue tipado para o campo específico */
	setValue: (
		name: Key,
		value: TypeOf<Schema> | null,
		options?: Parameters<
			UseFormReturn<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>["setValue"]
		>[2]
	) => void;
	/** Método watch tipado para o campo específico */
	watch: {
		/** Observa o campo específico e retorna seu valor */
		(name: Key): TypeOf<Schema> | undefined;
		/** Observa um caminho específico no formulário */
		<T extends Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>>(
			name: T
		): PathValue<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>, T>;
		/** Observa todo o formulário */
		(): MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>;
	} & (<
		T extends
			| Key
			| Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
			| undefined,
	>(
		name?: T
	) => T extends Key
		? TypeOf<Schema> | undefined
		: T extends Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
			? PathValue<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>, T>
			: T extends undefined
				? MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>
				: unknown);
	/** Valores padrão (defaultValues) completos do formulário */
	defaultValues:
		| Partial<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
		| undefined;
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
	type FormType = MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>;
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
				(name ?? key) as Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>,
				options as RegisterOptions<
					MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>,
					Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
				>
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

	const getValues = useCallback(
		<
			T extends
				| KeyToPath<Key>
				| Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
				| ArrayPath<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>,
		>(
			path: T
		): T extends KeyToPath<Key>
			? TypeOf<Schema>
			: T extends
						| Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
						| ArrayPath<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
				? PathValue<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>, T>
				: never => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			return context.getValues(path as any) as T extends KeyToPath<Key>
				? TypeOf<Schema>
				: T extends
							| Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
							| ArrayPath<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
					? PathValue<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>, T>
					: never;
		},
		[context]
	);

	const setValue = useCallback(
		(name: Key, value: TypeOf<Schema> | null, options?: Parameters<typeof context.setValue>[2]) => {
			return context.setValue(
				name as unknown as Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>,
				(value ?? undefined) as PathValue<
					MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>,
					Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
				>,
				options
			);
		},
		[context, key]
	);

	const watch = useCallback(
		(name?: Key | Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>) => {
			if (name === undefined) {
				return context.watch() as MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>;
			}
			// Se o nome for exatamente igual à chave do campo, retorna o tipo do schema
			if (typeof name === "string" && name === (key as string)) {
				return context.watch(
					name as unknown as Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
				) as TypeOf<Schema> | undefined;
			}
			// Caso contrário, retorna o valor do caminho
			return context.watch(
				name as unknown as Path<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
			);
		},
		[context, key]
	) as UseFieldReturn<Key, Schema, DepsTypes>["watch"];

	// Quando a chave contém pontos, o react-hook-form espera uma estrutura aninhada
	// mas o zormy tipa como KeyToNested<Key, TypeOf<Schema>>. Precisamos fazer o control
	// ser compatível com paths aninhados para que o Controller possa inferir corretamente.
	const control = context.control as Key extends `${string}.${string}`
		? Control<FormType>
		: Control<{ [key in Key]: TypeOf<Schema> }>;

	return {
		...context,
		register,
		fieldState,
		control: control as UseFieldReturn<Key, Schema, DepsTypes>["control"],
		getValues,
		setValue,
		watch,
		defaultValues: context.formState.defaultValues as
			| Partial<MergeFieldWithDeps<KeyToNested<Key, TypeOf<Schema>>, DepsTypes>>
			| undefined,
	};
};
