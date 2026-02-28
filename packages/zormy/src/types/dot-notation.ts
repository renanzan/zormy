// Helper para separar a chave antes do primeiro ponto
type SplitDot<S extends string> = S extends `${infer Head}.${infer Rest}` ? [Head, Rest] : [S];

export type DotNotationToNested<T> = {
	// Todas as possíveis "cabeças" das chaves em T
	[Key in keyof T as SplitDot<Extract<Key, string>>[0]]: Extract<
		Key,
		string
	> extends `${infer H}.${string}`
		? DotNotationToNested<{
				// Só pega as chaves de T que iniciam com a mesma "cabeça"
				[K in keyof T as K extends `${H}.${string}`
					? `${SplitDot<Extract<K, string>>[1]}`
					: never]: T[K];
			}>
		: T[Key];
};
