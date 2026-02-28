import { createField } from "./factory";

import type { ComponentProps } from "react";
import type { ZodType } from "zod";
import type { Dependency } from "../../dependency/types/dependency";
import type { ExtractDependencyTypes } from "../../dependency/types/extractors";
import type { AbstractField, AbstractSchemaBuilder, SchemaBuilder } from "../types/builder";
import type { FieldComponent } from "../types/field";
import type { RenderFieldHandler } from "./handlers";

/**
 * Helper interno que cria um SchemaBuilder com dependências.
 *
 * Esta função é usada internamente pelo builder para criar a etapa intermediária
 * após definir o schema. Ela encapsula a lógica de criação do SchemaBuilder,
 * permitindo que o builder retorne um objeto com o método `render`.
 *
 * @template Key - Chave literal do campo
 * @template S - Schema Zod do campo
 * @template D - Array de dependências
 *
 * @param key - Chave do campo (ex: "name", "user.email")
 * @param schema - Schema estático ou função dinâmica que recebe formValues
 * @param dependencies - Array de dependências do campo
 *
 * @returns SchemaBuilder que permite definir a renderização
 *
 * @internal
 * Esta função é para uso interno do builder. Não use diretamente.
 */
export function createSchemaBuilderWithDeps<
	Key extends string,
	S extends ZodType,
	D extends Dependency[],
>(
	key: Key,
	schema: S | ((formValues?: ExtractDependencyTypes<D> & Record<string, any>) => S),
	dependencies: D
): SchemaBuilder<Key, S, D> {
	return {
		render: <Props extends ComponentProps<any>>(
			renderFn: RenderFieldHandler<Key, S, Props, ExtractDependencyTypes<D>>
		) => {
			return createField<Key, S, Props, ExtractDependencyTypes<D>>({
				key,
				schema: schema as S | ((formValues?: Record<string, any>) => S),
				render: renderFn,
				dependencies,
			});
		},
	};
}

/**
 * Helper interno que cria um AbstractSchemaBuilder com dependências.
 *
 * Similar ao `createSchemaBuilderWithDeps`, mas para campos abstratos.
 * Cria a etapa intermediária após definir o schema de um campo abstrato.
 *
 * @template S - Schema Zod do campo abstrato
 * @template D - Array de dependências
 *
 * @param schema - Schema estático ou função dinâmica
 * @param dependencies - Array de dependências do campo abstrato
 *
 * @returns AbstractSchemaBuilder que permite definir a renderização
 *
 * @internal
 * Esta função é para uso interno do builder. Não use diretamente.
 */
export function createAbstractSchemaBuilderWithDeps<S extends ZodType, D extends Dependency[]>(
	schema: S | ((formValues?: ExtractDependencyTypes<D> & Record<string, any>) => S),
	dependencies: D
): AbstractSchemaBuilder<S, D> {
	return {
		render: <Props extends ComponentProps<any>>(
			renderFn: RenderFieldHandler<string, S, Props, ExtractDependencyTypes<D>>
		): AbstractField<S, Props, D> => {
			const fieldOptions = {
				schema: schema as S | ((formValues?: Record<string, any>) => S),
				render: renderFn,
				dependencies,
				defaultProps: undefined as Partial<Props> | undefined,
			};

			return {
				extend: createExtendFunction(fieldOptions),
			};
		},
	};
}

/**
 * Mescla props padrão com props de override.
 * Extrai lógica de mesclagem para reduzir complexidade.
 */
function mergeDefaultProps<Props extends ComponentProps<any>>(
	originalProps: Partial<Props> | undefined,
	overrideProps: Partial<Props> | undefined
): Partial<Props> | undefined {
	if (!originalProps) {
		return overrideProps;
	}
	if (!overrideProps) {
		return originalProps;
	}
	return { ...originalProps, ...overrideProps };
}

/**
 * Resolve dependências finais (override ou originais).
 * Extrai lógica de resolução para reduzir complexidade.
 */
function resolveFinalDependencies<D extends Dependency[], NewDependencies extends [...Dependency[]]>(
	originalDeps: D | undefined,
	overrideDeps: NewDependencies | undefined
): NewDependencies | D {
	if (overrideDeps) {
		return overrideDeps;
	}
	if (originalDeps) {
		return originalDeps;
	}
	return [] as unknown as NewDependencies | D;
}

/**
 * Adapta função de renderização se necessário.
 * Extrai lógica de adaptação para reduzir complexidade.
 */
function adaptRenderFunction<
	NewKey extends string,
	NewSchema extends ZodType,
	NewProps extends ComponentProps<any>,
	NewDepsTypes,
	OriginalSchema extends ZodType,
	OriginalProps extends ComponentProps<any>,
	OriginalDepsTypes,
>(
	originalRender: RenderFieldHandler<string, OriginalSchema, OriginalProps, OriginalDepsTypes>,
	overrideRender: RenderFieldHandler<NewKey, NewSchema, NewProps, NewDepsTypes> | undefined
): RenderFieldHandler<NewKey, NewSchema, NewProps, NewDepsTypes> {
	if (overrideRender) {
		return overrideRender;
	}
	return (context, props) => {
		return originalRender(context as any, props as unknown as OriginalProps);
	};
}

/**
 * Helper interno que cria a função `extend` para campos abstratos.
 *
 * Esta função encapsula toda a lógica de extensão de um campo abstrato:
 * - Mescla props padrão (originais + novas)
 * - Resolve dependências finais (novas ou originais)
 * - Adapta a função de renderização se necessário
 * - Cria o FieldComponent final com todas as configurações
 *
 * @template Schema - Schema Zod original do campo abstrato
 * @template Props - Props originais do componente
 * @template D - Dependências originais do campo abstrato
 *
 * @param fieldOptions - Opções do campo abstrato original
 * @param fieldOptions.schema - Schema original (pode ser estático ou função)
 * @param fieldOptions.render - Função de renderização original
 * @param fieldOptions.defaultProps - Props padrão originais (opcional)
 * @param fieldOptions.dependencies - Dependências originais (opcional)
 *
 * @returns Função `extend` que permite criar FieldComponents a partir do campo abstrato
 *
 * @internal
 * Esta função é para uso interno do builder. Não use diretamente.
 *
 * @remarks
 * - Props são mescladas: `{ ...originalProps, ...newProps }`
 * - Dependências podem ser substituídas completamente ou mantidas
 * - Se `render` não for fornecido no `extend`, a função original é adaptada
 * - Se `schema` não for fornecido no `extend`, o schema original é mantido
 */
export function createExtendFunction<
	Schema extends ZodType,
	Props extends ComponentProps<any>,
	D extends Dependency[],
>(fieldOptions: {
	schema: Schema | ((formValues?: Record<string, any>) => Schema);
	render: RenderFieldHandler<string, Schema, Props, ExtractDependencyTypes<D>>;
	defaultProps?: Partial<Props>;
	dependencies?: D;
}) {
	return <
		NewKey extends string,
		NewSchema extends ZodType = Schema,
		NewProps extends ComponentProps<any> = Props,
		NewDependencies extends [...Dependency[]] = D,
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
	}): FieldComponent<NewKey, NewSchema, NewProps> => {
		const mergedDefaultProps = mergeDefaultProps(fieldOptions.defaultProps, overrides.props);
		const finalDependencies = resolveFinalDependencies(fieldOptions.dependencies, overrides.dependsOn);
		type FinalDepsTypes = ExtractDependencyTypes<NewDependencies>;

		const adaptedRender = adaptRenderFunction<
			NewKey,
			NewSchema,
			NewProps,
			FinalDepsTypes,
			Schema,
			Props,
			ExtractDependencyTypes<D>
		>(fieldOptions.render, overrides.render);

		const finalSchema = overrides.schema ?? fieldOptions.schema;

		return createField<NewKey, NewSchema, NewProps, FinalDepsTypes>({
			key: overrides.key,
			schema: finalSchema as NewSchema | ((formValues?: Record<string, any>) => NewSchema),
			render: adaptedRender as any,
			defaultProps: mergedDefaultProps as Partial<NewProps> | undefined,
			dependencies: finalDependencies,
		});
	};
}
