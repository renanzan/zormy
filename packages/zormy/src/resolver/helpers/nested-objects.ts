import { z } from "zod";

import type { ZodRawShape, ZodTypeAny } from "zod";

/**
 * Define um valor em um objeto aninhado usando uma chave com pontos.
 *
 * @param obj - Objeto onde o valor será definido
 * @param path - Caminho com pontos (ex: "a.b.c")
 * @param value - Valor a ser definido
 *
 * @example
 * ```ts
 * const obj = {};
 * setNestedValue(obj, "a.b.c", "value");
 * // Resultado: { a: { b: { c: "value" } } }
 * ```
 */
export function setNestedValue(obj: Record<string, any>, path: string, value: any): void {
	const keys = path.split(".");
	let current = obj;

	for (let i = 0; i < keys.length - 1; i++) {
		const key = keys[i];
		if (!key) continue;

		if (!(key in current) || typeof current[key] !== "object" || current[key] === null) {
			current[key] = {};
		}
		current = current[key];
	}

	const lastKey = keys[keys.length - 1];
	if (lastKey) {
		current[lastKey] = value;
	}
}

/**
 * Obtém um valor de um objeto aninhado usando uma chave com pontos.
 *
 * @param obj - Objeto de onde o valor será obtido
 * @param path - Caminho com pontos (ex: "a.b.c")
 * @returns Valor encontrado ou undefined
 *
 * @example
 * ```ts
 * const obj = { a: { b: { c: "value" } } };
 * getNestedValue(obj, "a.b.c");
 * // Resultado: "value"
 * ```
 */
export function getNestedValue(obj: Record<string, any>, path: string): any {
	const keys = path.split(".");
	let current = obj;

	for (const key of keys) {
		if (current === null || current === undefined || typeof current !== "object") {
			return undefined;
		}
		current = current[key];
	}

	return current;
}

/**
 * Converte um objeto com chaves com pontos em um objeto aninhado.
 *
 * @param flat - Objeto com chaves flat (ex: { "a.b.c": "value1", "a.b.d": "value2" })
 * @returns Objeto aninhado (ex: { a: { b: { c: "value1", d: "value2" } } })
 *
 * @example
 * ```ts
 * flattenToNested({ "a.b.c": "value1", "a.b.d": "value2" });
 * // Resultado: { a: { b: { c: "value1", d: "value2" } } }
 * ```
 */
export function flattenToNested(flat: Record<string, any>): Record<string, any> {
	const nested: Record<string, any> = {};

	for (const [key, value] of Object.entries(flat)) {
		setNestedValue(nested, key, value);
	}

	return nested;
}

/**
 * Converte um objeto aninhado em um objeto com chaves com pontos.
 *
 * @param nested - Objeto aninhado (ex: { a: { b: { c: "value1", d: "value2" } } })
 * @param prefix - Prefixo opcional para as chaves
 * @returns Objeto com chaves flat (ex: { "a.b.c": "value1", "a.b.d": "value2" })
 *
 * @example
 * ```ts
 * nestedToFlatten({ a: { b: { c: "value1", d: "value2" } } });
 * // Resultado: { "a.b.c": "value1", "a.b.d": "value2" }
 * ```
 */
export function nestedToFlatten(nested: Record<string, any>, prefix = ""): Record<string, any> {
	const flat: Record<string, any> = {};

	for (const [key, value] of Object.entries(nested)) {
		const newKey = prefix ? `${prefix}.${key}` : key;

		if (value !== null && typeof value === "object" && !Array.isArray(value)) {
			Object.assign(flat, nestedToFlatten(value, newKey));
		} else {
			flat[newKey] = value;
		}
	}

	return flat;
}

/**
 * Verifica se um valor é uma instância de classe (não um objeto simples).
 * Instâncias de classe têm construtor diferente de Object e preservam métodos/protótipos.
 *
 * @param value - Valor a ser verificado
 * @returns true se for uma instância de classe
 */
function isClassInstance(value: any): boolean {
	if (value === null || value === undefined || typeof value !== "object") {
		return false;
	}

	// Arrays não são instâncias de classe no sentido que queremos preservar
	if (Array.isArray(value)) {
		return false;
	}

	// Verifica se o construtor não é Object (indica classe customizada)
	const constructor = Object.getPrototypeOf(value)?.constructor;
	if (constructor && constructor !== Object && constructor !== Array) {
		// Verifica se não é um schema Zod (já tratado separadamente)
		if (value instanceof z.ZodType) {
			return false;
		}
		// Se tem construtor customizado, é uma instância de classe
		return true;
	}

	return false;
}

/**
 * Mescla múltiplos objetos aninhados, concatenando propriedades quando necessário.
 * Preserva instâncias de classe (como FileEntry) sem destruí-las.
 *
 * @param objects - Array de objetos aninhados para mesclar
 * @returns Objeto mesclado com todas as propriedades
 *
 * @example
 * ```ts
 * mergeNested(
 *   { a: { b: { c: "value1" } } },
 *   { a: { b: { d: "value2" } } }
 * );
 * // Resultado: { a: { b: { c: "value1", d: "value2" } } }
 * ```
 */
export function mergeNested(
	...objects: Array<Record<string, any> | undefined | null>
): Record<string, any> {
	const result: Record<string, any> = {};

	for (const obj of objects) {
		if (!obj || typeof obj !== "object") continue;

		for (const [key, value] of Object.entries(obj)) {
			if (
				value !== null &&
				typeof value === "object" &&
				!Array.isArray(value) &&
				!(value instanceof z.ZodType) &&
				!isClassInstance(value)
			) {
				// É um objeto aninhado simples, mescla recursivamente
				result[key] = mergeNested(result[key] || {}, value);
			} else {
				// É um valor primitivo, array, schema Zod ou instância de classe, preserva como está
				result[key] = value;
			}
		}
	}

	return result;
}

/**
 * Verifica se um valor é um schema Zod válido.
 *
 * @param value - Valor a ser verificado
 * @returns true se for um schema Zod válido
 */
function isZodSchema(value: any): value is ZodTypeAny {
	return (
		value instanceof z.ZodType ||
		(value &&
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value) &&
			"_def" in value &&
			typeof value.parse === "function" &&
			typeof value.safeParse === "function" &&
			value._def &&
			typeof value._def === "object")
	);
}

/**
 * Constrói um objeto Zod recursivamente a partir de um objeto aninhado.
 *
 * @param obj - Objeto aninhado contendo schemas Zod ou objetos
 * @returns Schema Zod do tipo ZodObject
 */
function buildZodObject(obj: Record<string, any>): ZodTypeAny {
	const zodShape: ZodRawShape = {};

	for (const [key, value] of Object.entries(obj)) {
		if (isZodSchema(value)) {
			// É um schema Zod, usa diretamente
			zodShape[key] = value;
		} else if (value && typeof value === "object" && value !== null && !Array.isArray(value)) {
			// É um objeto aninhado (não é schema Zod), recursivamente cria um ZodObject
			zodShape[key] = buildZodObject(value);
		} else {
			// Valor primitivo, array, null ou undefined - não deveria acontecer em schemas
			// Mas trata como schema para evitar erros
			zodShape[key] = value as ZodTypeAny;
		}
	}

	return z.object(zodShape);
}

/**
 * Cria um schema Zod aninhado a partir de um objeto com chaves com pontos.
 *
 * @param shape - Objeto com chaves flat e schemas Zod (ex: { "a.b.c": z.string(), "a.b.d": z.number() })
 * @returns Schema Zod aninhado (ex: z.object({ a: z.object({ b: z.object({ c: z.string(), d: z.number() }) }) })
 *
 * @example
 * ```ts
 * createNestedSchema({ "a.b.c": z.string(), "a.b.d": z.number() });
 * // Resultado: z.object({ a: z.object({ b: z.object({ c: z.string(), d: z.number() }) }) })
 * ```
 */
export function createNestedSchema(shape: ZodRawShape): ZodTypeAny {
	const nested: Record<string, any> = {};

	// Agrupa schemas por prefixo criando estrutura aninhada
	for (const [key, schema] of Object.entries(shape)) {
		setNestedValue(nested, key, schema);
	}

	// Converte o objeto aninhado em um schema Zod aninhado
	return buildZodObject(nested);
}
