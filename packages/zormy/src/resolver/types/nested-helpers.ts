import type { Dependency } from "../../fields/dependency/types/dependency";
import type { DependencyKey } from "../../fields/dependency/types/extractors";
import type { FieldValue } from "../../fields/field/types/extractors";

/**
 * Converte uma key string com pontos em um tipo objeto aninhado.
 *
 * Se a key contém pontos (ex: "payment.cardNumber"), cria um objeto aninhado.
 * Se a key é simples (ex: "name"), cria uma propriedade simples.
 *
 * @template Key - Chave literal do campo (ex: "name", "payment.cardNumber")
 * @template Value - Tipo do valor a ser atribuído à propriedade final
 *
 * @example
 * ```ts
 * type Nested = KeyToNested<"payment.cardNumber", string>;
 * // Resultado: { payment: { cardNumber: string } }
 *
 * type Simple = KeyToNested<"name", string>;
 * // Resultado: { name: string }
 * ```
 */
export type KeyToNested<Key extends string, Value> = Key extends `${infer Head}.${infer Tail}`
	? {
			[K in Head]: KeyToNested<Tail, Value>;
		}
	: {
			[K in Key]: Value;
		};

/**
 * Mescla o tipo do campo com os tipos das dependências de forma segura.
 * Se DepsTypes for Record<string, never>, retorna apenas o tipo do campo.
 * Caso contrário, mescla os tipos.
 *
 * @template FieldType - Tipo do campo (KeyToNested)
 * @template DepsTypes - Tipos das dependências
 */
export type MergeFieldWithDeps<FieldType, DepsTypes> =
	DepsTypes extends Record<string, never> ? FieldType : FieldType & DepsTypes;

/**
 * Converte uma key string em um path válido do react-hook-form.
 * Se a key contém pontos, retorna a própria key como path.
 * Se a key é simples, retorna a própria key como path.
 *
 * @template Key - Chave literal do campo
 */
export type KeyToPath<Key extends string> = Key;

/**
 * Valor inferido de uma dependência para uso em formValues.
 * Para string (chave) usa `any` para simplificar uso; para Field usa FieldValue.
 */
type DependencyValue<Dep> = Dep extends string ? any : FieldValue<Dep>;

/**
 * Converte uma dependência em um tipo objeto aninhado baseado na sua key.
 *
 * Se a key contém pontos (ex: "user.email"), cria um objeto aninhado.
 * Se a key é simples (ex: "name"), cria uma propriedade simples.
 * Para dependência string (ex: "hasPassword"), o valor é `any` para evitar erros de tipagem.
 *
 * @template Dep - Tipo da dependência (FieldComponent, string ou função lazy)
 *
 * @example
 * ```ts
 * const UserEmailField = field("user.email").schema(z.string()).render(...);
 * type Nested = FieldToNested<typeof UserEmailField>;
 * // Resultado: { user: { email: string } }
 *
 * type ByKey = FieldToNested<"hasPassword">;
 * // Resultado: { hasPassword: any }
 * ```
 */
export type FieldToNested<Dep> = Dep extends Dependency
	? DependencyKey<Dep> extends string
		? KeyToNested<DependencyKey<Dep>, DependencyValue<Dep>>
		: Record<string, never>
	: Record<string, never>;

/**
 * Verifica se um tipo é um objeto simples com chaves literais (não indexável genérico).
 * Usado para evitar loops infinitos em MergeNested ao detectar tipos indexáveis como [x: string].
 */
type IsPlainObject<T> = T extends object
	? T extends any[] | ReadonlyArray<any> | ((...args: any[]) => any) | Date | RegExp
		? false
		: string extends keyof T
			? false
			: keyof T extends never
				? false
				: true
	: false;

/**
 * Mescla dois tipos de objetos aninhados recursivamente.
 *
 * Propriedades com o mesmo caminho são mescladas recursivamente.
 * Propriedades diferentes são combinadas.
 *
 * @template A - Primeiro tipo objeto aninhado
 * @template B - Segundo tipo objeto aninhado
 *
 * @example
 * ```ts
 * type A = { user: { name: string } };
 * type B = { user: { email: string } };
 * type Merged = MergeNested<A, B>;
 * // Resultado: { user: { name: string; email: string } }
 * ```
 */
export type MergeNested<A, B> =
	// Casos base: tipos vazios ou never
	[A, B] extends [never, never]
		? never
		: [A] extends [never]
			? B
			: [B] extends [never]
				? A
				: A extends Record<string, never>
					? B
					: B extends Record<string, never>
						? A
						: // Mesclagem recursiva
							{
								[K in keyof A | keyof B]: K extends keyof A
									? K extends keyof B
										? MergeProperty<A[K], B[K]>
										: A[K]
									: K extends keyof B
										? B[K]
										: never;
							};

/**
 * Mescla duas propriedades, recursivamente se ambas forem objetos simples.
 */
type MergeProperty<A, B> =
	IsPlainObject<A> extends true
		? IsPlainObject<B> extends true
			? A extends B
				? B extends A
					? A // Tipos idênticos, evita recursão desnecessária
					: MergeNested<A, B>
				: MergeNested<A, B>
			: B
		: B;

/**
 * Mescla uma união de tipos em um único tipo objeto.
 *
 * Útil para converter arrays genéricos (que TypeScript infere como união)
 * em um tipo objeto mesclado.
 *
 * @template U - União de tipos
 *
 * @example
 * ```ts
 * type Union = { name: string } | { email: string };
 * type Merged = MergeUnionTypes<Union>;
 * // Resultado: { name: string; email: string }
 * ```
 */
export type MergeUnionTypes<U> = U extends Dependency ? FieldToNested<U> : Record<string, never>;
