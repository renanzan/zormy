import type { ComponentProps } from "react";
import type { ZodType } from "zod";
import type { Dependency } from "../../dependency/types/dependency";
import type { ExtractDependencyTypes } from "../../dependency/types/extractors";
import type { RenderFieldHandler } from "../builder/handlers";
import type { FieldComponent } from "./field";

/**
 * Representa um campo abstrato sem key definida.
 *
 * Um campo abstrato não pode ser usado diretamente em formulários. Ele serve como template
 * que deve ser extendido com uma key obrigatória para criar um FieldComponent válido.
 *
 * Útil para criar campos reutilizáveis que compartilham schema e renderização, mas têm
 * keys diferentes em contextos distintos.
 *
 * @template Schema - Schema Zod do campo (usado para validação)
 * @template Props - Props do componente React usado na renderização
 * @template Dependencies - Array de dependências do campo (pode ser tuple ou array genérico)
 */
export type AbstractField<
	Schema extends ZodType,
	Props extends ComponentProps<any>,
	Dependencies,
> = {
	/**
	 * Estende o campo abstrato com uma key obrigatória para criar um FieldComponent válido.
	 *
	 * Permite sobrescrever schema, renderização, dependências e props padrão do campo abstrato.
	 * A key é obrigatória pois é o que diferencia um campo abstrato de um FieldComponent válido.
	 *
	 * @template NewKey - Nova chave literal do campo (obrigatória)
	 * @template NewSchema - Novo schema Zod (opcional, padrão: Schema original)
	 * @template NewProps - Novas props do componente (opcional, padrão: Props original)
	 * @template NewDependencies - Novas dependências (opcional, padrão: Dependencies original)
	 *
	 * @param overrides - Configurações para sobrescrever o campo abstrato
	 * @param overrides.key - Chave obrigatória do campo (ex: "user.name", "config.weight")
	 * @param overrides.schema - Schema opcional (pode ser estático ou função dinâmica)
	 * @param overrides.render - Função de renderização opcional
	 * @param overrides.dependsOn - Dependências opcionais (substitui as originais se fornecidas)
	 * @param overrides.props - Props padrão opcionais (mescladas com as originais)
	 *
	 * @returns FieldComponent completo e pronto para uso em formulários
	 *
	 * @remarks
	 * - Se `dependsOn` não for fornecido, as dependências originais são mantidas
	 * - Props são mescladas: `{ ...originalProps, ...overrides.props }`
	 * - Schema e render podem ser sobrescritos completamente ou mantidos do original
	 */
	extend: <
		NewKey extends string,
		NewSchema extends ZodType = Schema,
		NewProps extends ComponentProps<any> = Props,
		NewDependencies extends [...Dependency[]] = Dependencies extends Dependency[]
			? Dependencies
			: [],
	>(overrides: {
		key: NewKey;
		schema?:
			| NewSchema
			| ((formValues?: ExtractDependencyTypes<NewDependencies> & Record<string, any>) => NewSchema);
		render?: RenderFieldHandler<
			NewKey,
			NewSchema,
			NewProps,
			ExtractDependencyTypes<NewDependencies>
		>;
		dependsOn?: NewDependencies;
		props?: Partial<Props>;
	}) => FieldComponent<NewKey, NewSchema, NewProps>;
};

/**
 * Builder intermediário que aparece após definir o schema de um campo.
 *
 * Esta é a etapa final na construção de um campo. Após definir o schema (estático ou dinâmico),
 * você deve definir a função de renderização para completar a construção do FieldComponent.
 *
 * @template Key - Chave literal do campo (ex: "name", "user.email")
 * @template Schema - Schema Zod do campo (usado para validação)
 * @template Dependencies - Array de dependências do campo
 */
export type SchemaBuilder<Key extends string, Schema extends ZodType, Dependencies> = {
	/**
	 * Define a função de renderização do campo.
	 *
	 * Esta é a última etapa na construção do campo. A função recebe o contexto do campo
	 * (register, control, fieldState, etc.) e as props do componente, retornando o JSX.
	 *
	 * @template Props - Props do componente React usado na renderização
	 * @param renderFn - Função que renderiza o campo recebendo contexto e props
	 * @returns FieldComponent completo e pronto para uso
	 */
	render: <Props extends ComponentProps<any>>(
		renderFn: RenderFieldHandler<Key, Schema, Props, ExtractDependencyTypes<Dependencies>>
	) => FieldComponent<Key, Schema, Props>;
};

/**
 * Builder intermediário para campos abstratos após definir o schema.
 *
 * Similar ao `SchemaBuilder`, mas para campos abstratos. Após definir o schema,
 * você deve definir a renderização para completar a construção do AbstractField.
 *
 * A diferença é que o AbstractField resultante ainda precisa ser extendido com uma key
 * antes de poder ser usado em formulários.
 *
 * @template Schema - Schema Zod do campo abstrato
 * @template Dependencies - Array de dependências do campo abstrato
 */
export type AbstractSchemaBuilder<Schema extends ZodType, Dependencies> = {
	/**
	 * Define a função de renderização do campo abstrato.
	 *
	 * A função recebe o contexto do campo. Note que `fieldState.key` será uma string genérica
	 * até que o campo seja extendido com uma key específica.
	 *
	 * @template Props - Props do componente React usado na renderização
	 * @param renderFn - Função que renderiza o campo abstrato
	 * @returns AbstractField que ainda precisa ser extendido com uma key
	 */
	render: <Props extends ComponentProps<any>>(
		renderFn: RenderFieldHandler<string, Schema, Props, ExtractDependencyTypes<Dependencies>>
	) => AbstractField<Schema, Props, Dependencies>;
};

/**
 * Builder inicial para construir um campo de formulário.
 *
 * Este é o ponto de partida para criar um campo usando a função `field(key)`.
 * Permite definir dependências opcionais antes do schema, ou ir direto para o schema.
 *
 * O fluxo típico é:
 * 1. `field("key")` → retorna `FieldBuilder`
 * 2. Opcionalmente: `.dependsOn(...)` → adiciona dependências
 * 3. `.schema(...)` → define o schema (estático ou dinâmico)
 * 4. `.render(...)` → define a renderização
 *
 * @template Key - Chave literal do campo (definida na criação)
 * @template Dependencies - Array de dependências (padrão: array vazio)
 */
export type FieldBuilder<Key extends string, Dependencies extends Dependency[] = []> = {
	/**
	 * Declara campos dos quais este campo depende.
	 *
	 * Isso permite tipagem forte nas dependências e documenta relações entre campos.
	 * As dependências ficam disponíveis tipadas no parâmetro `formValues` da função schema.
	 *
	 * @template D - Array de dependências (inferido como tuple quando possível)
	 * @param dependencies - Array de dependências (FieldComponent, string ou função lazy)
	 * @returns Builder com dependências declaradas, permitindo definir o schema
	 *
	 * @remarks
	 * - Aceita FieldComponents diretamente (melhor tipagem)
	 * - Aceita strings como chaves (sem tipagem forte)
	 * - Aceita funções lazy que retornam FieldComponents (resolve dependências circulares)
	 */
	dependsOn: <D extends [...Dependency[]]>(
		...dependencies: D
	) => Omit<FieldBuilder<Key, D>, "schema"> & {
		/**
		 * Define o schema Zod do campo.
		 *
		 * Pode ser estático ou dinâmico baseado em valores do formulário.
		 * Se houver dependências, `formValues` terá tipagem forte baseada nelas.
		 *
		 * @template S - Tipo do schema Zod
		 * @param schema - Schema estático ou função que recebe formValues e retorna schema
		 * @returns SchemaBuilder para definir a renderização
		 */
		schema: <S extends ZodType>(
			schema: S | ((formValues?: ExtractDependencyTypes<D>) => S)
		) => SchemaBuilder<Key, S, D>;
	};
	/**
	 * Define o schema Zod do campo sem declarar dependências.
	 *
	 * Para schemas dinâmicos que dependem de outros campos, use `.dependsOn()` antes.
	 * Se não houver dependências, `formValues` será `Record<string, any> | undefined`.
	 *
	 * @template S - Tipo do schema Zod
	 * @param schema - Schema estático ou função que retorna schema
	 * @returns SchemaBuilder para definir a renderização
	 */
	schema: <S extends ZodType>(
		schema: S | ((formValues?: Record<string, any>) => S)
	) => SchemaBuilder<Key, S, Dependencies>;
};

/**
 * Builder inicial para construir um campo abstrato de formulário.
 *
 * Similar ao `FieldBuilder`, mas para campos abstratos que não possuem key inicial.
 * O fluxo é o mesmo, mas o resultado final é um `AbstractField` que precisa ser extendido.
 *
 * @template Dependencies - Array de dependências (padrão: array vazio)
 */
export type AbstractFieldBuilder<Dependencies extends Dependency[] = []> = {
	/**
	 * Declara campos dos quais este campo abstrato depende.
	 *
	 * Funciona igual ao `dependsOn` do `FieldBuilder`, mas para campos abstratos.
	 *
	 * @template D - Array de dependências (inferido como tuple quando possível)
	 * @param dependencies - Array de dependências
	 * @returns Builder com dependências declaradas
	 */
	dependsOn: <D extends [...Dependency[]]>(
		...dependencies: D
	) => Omit<AbstractFieldBuilder<D>, "schema"> & {
		/**
		 * Define o schema Zod do campo abstrato.
		 *
		 * @template S - Tipo do schema Zod
		 * @param schema - Schema estático ou função dinâmica
		 * @returns AbstractSchemaBuilder para definir a renderização
		 */
		schema: <S extends ZodType>(
			schema: S | ((formValues?: ExtractDependencyTypes<D> & Record<string, any>) => S)
		) => AbstractSchemaBuilder<S, D>;
	};
	/**
	 * Define o schema Zod do campo abstrato sem declarar dependências.
	 *
	 * @template S - Tipo do schema Zod
	 * @param schema - Schema estático ou função que retorna schema
	 * @returns AbstractSchemaBuilder para definir a renderização
	 */
	schema: <S extends ZodType>(
		schema: S | ((formValues?: Record<string, any>) => S)
	) => AbstractSchemaBuilder<S, Dependencies>;
};
