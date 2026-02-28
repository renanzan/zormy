/**
 * Helper para combinar múltiplos tipos de objeto em um único tipo.
 * Converte uma união de objetos em uma interseção (merge de propriedades).
 * Remove índices genéricos para preservar apenas propriedades literais.
 *
 * @template U - União de tipos de objeto
 */
export type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
	k: infer I
) => void
	? I extends Record<string, any>
		? OmitIndexSignature<I>
		: I
	: never;

/**
 * Remove índices de string genéricos de um tipo.
 * Útil para remover `[x: string]: unknown` de tipos que foram interseccionados com FieldValues.
 *
 * @template T - Tipo do qual remover índices genéricos
 */
export type OmitIndexSignature<T> = {
	[K in keyof T as string extends K ? never : K]: T[K];
};
