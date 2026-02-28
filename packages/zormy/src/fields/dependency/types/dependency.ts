import type { FieldComponent } from "../../field/types/field";

/**
 * Tipo para dependências aceitas no método `.dependsOn()`.
 *
 * Uma dependência pode ser:
 * - **FieldComponent diretamente**: Melhor tipagem, permite inferência completa dos tipos
 * - **String com a chave**: Sem tipagem forte, útil para dependências dinâmicas
 * - **Função lazy que retorna FieldComponent**: Resolve dependências circulares
 *
 * @template Field - Tipo do FieldComponent (quando usado como lazy getter)
 *
 * @example
 * ```ts
 * // FieldComponent direto (recomendado)
 * field("phone").dependsOn(AgeField)
 *
 * // String (sem tipagem forte)
 * field("phone").dependsOn("age")
 *
 * // Lazy getter (resolve dependência circular)
 * field("name").dependsOn(() => PersonField)
 * ```
 *
 * @remarks
 * **Lazy getters** são úteis para resolver problemas de dependência circular:
 * ```ts
 * // Sem lazy: erro de referência circular
 * const A = field("a").dependsOn(B).schema(...).render(...);
 * const B = field("b").dependsOn(A).schema(...).render(...); // ❌ Erro!
 *
 * // Com lazy: funciona
 * const A = field("a").dependsOn(() => B).schema(...).render(...);
 * const B = field("b").dependsOn(() => A).schema(...).render(...); // ✅ OK!
 * ```
 */
export type Dependency<
	Field extends FieldComponent<any, any, any> = FieldComponent<any, any, any>,
> = Field | string | (() => Field);
