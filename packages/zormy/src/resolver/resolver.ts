import { zodResolver } from "@hookform/resolvers/zod";

import { shapeToZodSchema } from "./helpers/shape-to-zod-schema";

import type { ZodRawShape } from "zod";
import type { Resolver } from "react-hook-form";
import type { FieldsToObject } from "../fields/field/types/extractors";
import type { FieldComponentBase } from "../fields/field/types/field";

/**
 * Argumentos para criar um resolver de formulário.
 *
 * @template Fields - Array de componentes de campo
 */
type FormResolverArgs<Fields extends readonly FieldComponentBase[]> = {
	/** Array de componentes de campo que compõem o formulário */
	fields: Fields;
};

/**
 * Cria um resolver para react-hook-form baseado em um array de campos.
 *
 * O resolver suporta schemas flat e aninhados (chaves com pontos, ex: `"user.email"`).
 * Schemas dinâmicos (função que recebe formValues) são suportados; o schema é montado
 * a partir dos campos no momento da validação.
 *
 * Validação assíncrona: schemas Zod com `.refine()` ou `.superRefine()` que retornam
 * `Promise` são suportados pelo zodResolver do @hookform/resolvers (usa parseAsync internamente).
 *
 * @template Fields - Array de componentes de campo (FieldComponentBase)
 * @param args - Objeto com a propriedade `fields` (array de campos)
 * @returns Resolver tipado para useForm do react-hook-form
 *
 * @example
 * ```tsx
 * const resolver = zormyResolver({
 *   fields: [NameField, EmailField, PasswordField]
 * });
 * const form = useForm({
 *   resolver,
 *   defaultValues: { name: "", email: "", password: "" }
 * });
 * ```
 */
export function zormyResolver<Fields extends readonly FieldComponentBase[]>(
	args: FormResolverArgs<Fields>
): Resolver<FieldsToObject<Fields>> {
	// Cria um objeto shape com todos os schemas dos campos
	const shape = args.fields.reduce((acc, field) => {
		acc[field.config.key] = field.getZodSchema();
		return acc;
	}, {} as ZodRawShape);

	// Cria o schema (aninhado ou flat) automaticamente
	const schema = shapeToZodSchema(shape);

	return zodResolver(schema) as unknown as Resolver<FieldsToObject<Fields>>;
}
