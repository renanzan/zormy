import { z } from "zod";

import { createNestedSchema } from "./nested-objects";

import type { ZodRawShape } from "zod";

/**
 * Cria um schema Zod a partir de um objeto shape.
 * Detecta automaticamente se há chaves aninhadas e cria o schema apropriado.
 *
 * @param shape - Objeto com chaves e schemas Zod
 * @returns Schema Zod (aninhado ou flat)
 *
 * @example
 * ```ts
 * // Schema flat
 * createSchemaFromShape({ name: z.string(), email: z.string() });
 *
 * // Schema aninhado
 * createSchemaFromShape({ "a.b.c": z.string(), "a.b.d": z.number() });
 * ```
 */
export function shapeToZodSchema(shape: ZodRawShape): z.ZodTypeAny {
	const hasNestedKeys = Object.keys(shape).some((key) => key.includes("."));

	if (hasNestedKeys) {
		return createNestedSchema(shape);
	}

	return z.object(shape);
}
