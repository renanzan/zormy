import type { z, ZodType } from "zod";

/**
 * Extrai a chave literal de um campo.
 *
 * Este tipo helper é fundamental para inferir a key de um FieldComponent em tempo de compilação.
 * Ele acessa a propriedade `config.key` do campo e extrai o tipo literal da string.
 *
 * @template Field - Tipo do FieldComponent
 *
 * @example
 * ```ts
 * const NameField = field("name").schema(z.string()).render(...);
 * type Key = FieldKey<typeof NameField>; // "name"
 *
 * const EmailField = field("user.email").schema(z.string()).render(...);
 * type EmailKey = FieldKey<typeof EmailField>; // "user.email"
 * ```
 *
 * @returns A chave literal do campo, ou `never` se não for um FieldComponent válido
 */
export type FieldKey<Field> = Field extends { config: { key: infer Key } }
	? Key extends string
		? Key
		: never
	: never;

/**
 * Extrai o tipo TypeScript inferido do schema Zod de um campo.
 *
 * Este tipo acessa o método `getZodSchema` do FieldComponent e extrai o tipo inferido
 * usando `z.infer<Schema>`. Funciona tanto para schemas estáticos quanto dinâmicos.
 *
 * @template Field - Tipo do FieldComponent
 *
 * @example
 * ```ts
 * const NameField = field("name")
 *   .schema(z.string().min(3))
 *   .render(...);
 *
 * type NameType = FieldValue<typeof NameField>; // string
 *
 * const AgeField = field("age")
 *   .schema(z.number().min(0).max(120))
 *   .render(...);
 *
 * type AgeType = FieldValue<typeof AgeField>; // number
 * ```
 *
 * @returns O tipo TypeScript inferido do schema Zod, ou `never` se não for válido
 */
export type FieldValue<Field> = Field extends {
	getZodSchema: () => infer Schema;
}
	? Schema extends ZodType
		? z.infer<Schema>
		: never
	: Field extends { getZodSchema: (formValues?: any) => infer Schema }
		? Schema extends ZodType
			? z.infer<Schema>
			: never
		: never;

/**
 * Extrai o schema Zod completo de um array de campos, convertendo em um tipo objeto.
 *
 * Este tipo é útil para criar tipos de formulário a partir de arrays de campos.
 * Ele mapeia cada campo do array para uma propriedade no objeto resultante,
 * usando a key do campo como nome da propriedade e o tipo do schema como valor.
 *
 * @template Fields - Array de FieldComponents (pode ser readonly)
 *
 * @example
 * ```tsx
 * const fields = [
 *   field("name").schema(z.string()).render(...),
 *   field("age").schema(z.number()).render(...),
 *   field("email").schema(z.string().email()).render(...)
 * ] as const;
 *
 * type FormData = FieldsToObject<typeof fields>;
 * // Resultado: { name: string; age: number; email: string }
 * ```
 *
 * @returns Um tipo objeto com as keys dos campos como propriedades e os tipos dos schemas como valores
 */
export type FieldsToObject<Fields> = Fields extends readonly any[]
	? {
			[Key in Fields[number] as FieldKey<Key>]: FieldValue<Key>;
		}
	: Record<string, never>;
