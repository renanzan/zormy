import type {
	FieldToNested,
	KeyToNested,
	MergeNested,
	MergeUnionTypes,
} from "../../../resolver/types/nested-helpers";
import type { FieldKey, FieldValue } from "../../field/types/extractors";
import type { FieldComponent } from "../../field/types/field";

/**
 * Extrai a chave literal de uma dependência (Dependency).
 *
 * Este tipo existe porque, diferente de `FieldKey<Field>`, ele aceita também uma string literal diretamente,
 * permitindo usar `DependencyKey<"example">` e obter "example" como resultado. Ou seja, ele é capaz de operar
 * tanto sobre um FieldComponent quanto sobre uma string (ou função lazy), enquanto `FieldKey` só funciona para FieldComponent.
 *
 * Uma dependência pode ser:
 * - Um FieldComponent diretamente → extrai a key do componente
 * - Uma função lazy que retorna FieldComponent → extrai a key do componente retornado
 * - Uma string → retorna a própria string literal usada como chave
 *
 * @template Dep - Tipo da dependência (FieldComponent, string ou função lazy)
 *
 * @example
 * ```ts
 * const NameField = field("name").schema(z.string()).render(...);
 * type Key1 = DependencyKey<typeof NameField>; // "name"
 *
 * type Key2 = DependencyKey<"age">; // "age" (diferente de FieldKey, aceita a string)
 *
 * type Key3 = DependencyKey<() => typeof NameField>; // "name"
 * ```
 *
 * @returns A chave literal da dependência, ou `never` se não for válida
 */
export type DependencyKey<Dep> =
	Dep extends FieldComponent<any, any, any>
		? FieldKey<Dep>
		: Dep extends () => infer Field
			? Field extends FieldComponent<any, any, any>
				? FieldKey<Field>
				: never
			: Dep extends string
				? Dep
				: never;

/**
 * Extrai o tipo do field considerando suas dependências.
 *
 * Este tipo combina o tipo do próprio campo (convertido em objeto aninhado baseado na key)
 * com os tipos das dependências fornecidas.
 *
 * **Limitação atual:** Como o `FieldComponent` não preserva as dependências originais como tipos,
 * você precisa passar as dependências como um segundo parâmetro de tipo. Uma versão futura
 * pode modificar o `FieldComponent` para incluir as dependências como um parâmetro de tipo.
 *
 * @template Field - Tipo do FieldComponent
 * @template Dependencies - Array de dependências (FieldComponent, string ou função lazy)
 *
 * @example
 * ```ts
 * const NameField = field("name").schema(z.string()).render(...);
 * const PhoneField = field("phone").schema(z.string()).render(...);
 * const PersonField = field("person.gender")
 *   .dependsOn(NameField, PhoneField)
 *   .schema(z.enum(["male", "female"]))
 *   .render(...);
 *
 * // Com dependências explícitas (recomendado)
 * type Person = FieldResult<typeof PersonField, [typeof NameField, typeof PhoneField]>;
 * // Resultado: { name: string; phone: string; person: { gender: "male" | "female" } }
 *
 * // Sem dependências (retorna apenas o tipo do campo)
 * type PersonOnly = FieldResult<typeof PersonField>;
 * // Resultado: { person: { gender: "male" | "female" } }
 * ```
 *
 * @returns Tipo objeto mesclado com o campo e suas dependências
 */
export type FieldResult<Field, Dependencies extends readonly any[] = []> =
	Field extends FieldComponent<infer Key, any, any>
		? Key extends string
			? Dependencies extends readonly any[]
				? Dependencies extends []
					? KeyToNested<Key, FieldValue<Field>>
					: MergeNested<ExtractDependencyTypes<Dependencies>, KeyToNested<Key, FieldValue<Field>>>
				: KeyToNested<Key, FieldValue<Field>>
			: never
		: never;

/**
 * Extrai os tipos TypeScript dos campos dependentes.
 *
 * Este é o tipo central do sistema de dependências. Ele converte um array de dependências
 * em um tipo objeto TypeScript que pode ser usado para tipar o parâmetro `formValues`
 * em funções de schema dinâmicas.
 *
 * **Funcionalidades principais:**
 * - Converte keys com pontos em objetos aninhados automaticamente
 * - Mescla múltiplas dependências em um único tipo objeto
 * - Suporta FieldComponents, strings e funções lazy
 * - Funciona com tuples (melhor inferência) e arrays genéricos
 *
 * @template Dependencies - Array de dependências (FieldComponent, string ou função lazy)
 *
 * @example
 * ```ts
 * // Com FieldComponent - tipagem forte e objetos aninhados
 * const LocationField = field("config.location").schema(z.string()).render(...);
 * const ThemeField = field("config.theme").schema(z.string()).render(...);
 *
 * type Deps = ExtractDependencyTypes<[typeof LocationField, typeof ThemeField]>;
 * // Resultado: { config: { location: string; theme: string } }
 *
 * // Uso em schema dinâmico
 * field("result")
 *   .dependsOn(LocationField, ThemeField)
 *   .schema((formValues) => {
 *     // formValues tem tipo: { config: { location: string; theme: string } }
 *     const location = formValues?.config.location; // ✅ Tipado!
 *     const theme = formValues?.config.theme; // ✅ Tipado!
 *     return z.string();
 *   });
 * ```
 *
 * @example
 * ```ts
 * // Com string - sem tipagem forte
 * type Deps = ExtractDependencyTypes<["age", "name"]>;
 * // Resultado: { age: any; name: any }
 * ```
 *
 * @returns Um tipo objeto aninhado mesclado com as chaves e tipos dos campos dependentes
 *
 * @remarks
 * - **Tuples são preferidos**: Arrays inferidos como tuples preservam ordem e têm melhor inferência
 * - **Arrays genéricos funcionam**: Mas podem resultar em uniões que precisam ser mescladas
 * - **Array vazio (`[]`)**: Retorna `Record<string, never>` (evita `never` vindo de `MergeUnionTypes<never>` ao inferir o elemento do array)
 * - **Keys com pontos**: São automaticamente convertidas em objetos aninhados
 * - **Mesclagem inteligente**: Propriedades com mesmo caminho são mescladas recursivamente
 */
export type ExtractDependencyTypes<Dependencies> = Dependencies extends readonly []
	? Record<string, never>
	: Dependencies extends
				| [infer First, ...infer Rest]
				| readonly [infer First, ...infer Rest]
		? MergeNested<FieldToNested<First>, ExtractDependencyTypes<Rest>>
		: Dependencies extends readonly (infer U)[] | (infer U)[]
			? MergeUnionTypes<U>
			: Record<string, never>;
