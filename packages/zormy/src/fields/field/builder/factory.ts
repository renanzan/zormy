import { extractDependencyKeys } from "../../dependency/extractor";
import { useField } from "../hooks/use-field";

import type { ComponentProps } from "react";
import type { ZodType } from "zod";
import type { Dependency } from "../../dependency/types/dependency";
import type { FieldComponent, FieldConfig } from "../types/field";
import type { RenderFieldHandler } from "./handlers";

/**
 * Opções para criar um campo de formulário.
 *
 * @template Key - Chave literal do campo
 * @template Schema - Schema Zod do campo
 * @template Props - Props do componente React
 * @template DepsTypes - Tipos inferidos dos campos dependentes
 */
export type FieldOptions<
	Key extends string,
	Schema extends ZodType,
	Props extends ComponentProps<any>,
	DepsTypes = Record<string, never>,
> = {
	/** Chave única que identifica o campo no formulário */
	key: Key;
	/**
	 * Schema Zod do campo.
	 * Pode ser estático ou uma função que retorna um schema baseado nos valores do formulário.
	 */
	schema: Schema | ((formValues?: Record<string, any>) => Schema);
	/**
	 * Função de renderização do campo.
	 * Recebe o contexto do campo (register, fieldState, etc.) e as props customizadas.
	 */
	render: RenderFieldHandler<Key, Schema, Props, DepsTypes>;
	/**
	 * Dependências do campo (para validação dinâmica).
	 * Pode ser FieldComponents, strings (chaves) ou funções lazy para resolver dependências circulares.
	 */
	dependencies?: readonly Dependency[];
	/**
	 * Props padrão do campo.
	 * Essas props serão mescladas com as props passadas ao componente,
	 * permitindo que props passadas sobrescrevam as padrão.
	 */
	defaultProps?: Partial<Props>;
};

/**
 * Cria um componente de campo de formulário tipado.
 *
 * O componente retornado pode ser usado diretamente no JSX e também contém
 * metadados sobre sua configuração (chave, schema, dependências).
 *
 * @template Key - Chave literal do campo
 * @template Schema - Schema Zod do campo
 * @template Props - Props do componente React
 * @template DepsTypes - Tipos inferidos dos campos dependentes
 *
 * @param options - Opções para criar o campo
 * @returns Componente de campo configurado com metadados
 *
 * @example
 * ```tsx
 * const NameField = createField({
 *   key: "name",
 *   schema: z.string(),
 *   render: ({ register }) => <input {...register()} />
 * });
 *
 * // Uso no formulário:
 * <NameField />
 * ```
 */
/**
 * Mescla props padrão com props passadas, garantindo que props passadas sobrescrevam as padrão.
 */
function mergeProps<Props extends ComponentProps<any>>(
	defaultProps: Partial<Props> | undefined,
	passedProps: Props
): Props {
	if (!defaultProps) {
		return passedProps;
	}
	// Mescla props padrão com props passadas (props passadas têm prioridade)
	return Object.assign({}, defaultProps, passedProps) as Props;
}
/**
 * Factory interna para criar um componente de campo de formulário tipado.
 *
 * Esta função **é destinada preferencialmente para uso interno da biblioteca**.
 * Ela serve como base para helpers internos (ex: `field`, `abstractField`) que expõem APIs públicas.
 *
 * Dado um objeto de opções (`FieldOptions`), retorna um componente React enriquecido
 * com metadados de configuração do campo, métodos utilitários e suporte à extensão tipada.
 *
 * - Interna: para consumo em helpers/builders internos. Usuário deve preferir `field`.
 * - Normaliza a criação de campos, extensão tipada, config, ajuste de dependências e schema dinâmico.
 *
 * @internal
 * Função factory de uso interno da lib, para criar fields recomendase usar o builder `field(...)`;
 * Essa é a sequência usada internamente para criar fields: factory (interno) → helper (interno) → field (externo)
 *
 * @template Key       - Chave literal única para o campo.
 * @template Schema    - Schema Zod do campo.
 * @template Props     - Props do componente React associado ao campo.
 * @template DepsTypes - Tipos inferidos das dependências desse campo.
 * @param options      - Opções de configuração para o campo.
 * @returns            - FieldComponent enriquecido com métodos utilitários.
 */
export function createField<
	Key extends string,
	Schema extends ZodType,
	Props extends ComponentProps<any> = ComponentProps<any>,
	DepsTypes = Record<string, never>,
>(options: FieldOptions<Key, Schema, Props, DepsTypes>): FieldComponent<Key, Schema, Props> {
	// Componente React do campo, já usando o hook useField
	const Field = ((props: Props) => {
		const context = useField<Key, Schema, DepsTypes>(options.key);
		const mergedProps = mergeProps(options.defaultProps, props);
		return options.render(context, mergedProps);
	}) as FieldComponent<Key, Schema, Props>;

	/**
	 * Permite criar um novo FieldComponent estendendo a configuração original,
	 * sobrescrevendo chave, schema, render ou defaultProps.
	 *
	 * @param overrides - Opções a sobrescrever (key, schema, render, props())
	 * @returns         - Novo FieldComponent com tipagem extendida
	 */
	Field.extend = <
		NewKey extends string = Key,
		NewSchema extends ZodType = Schema,
		NewProps extends ComponentProps<any> = Props,
	>(overrides: {
		key?: NewKey;
		schema?: NewSchema;
		render?: RenderFieldHandler<NewKey, NewSchema, NewProps>;
		/**
		 * Props padrão para sobrescrever ou estender as props padrão existentes.
		 * As props passadas ao componente ainda terão prioridade sobre essas props padrão.
		 * Quando apenas props é especificado (sem render), o tipo Props original é preservado.
		 */
		props?: Partial<Props>;
	}): FieldComponent<NewKey, NewSchema, NewProps> => {
		const mergedDefaultProps = options.defaultProps
			? { ...options.defaultProps, ...overrides.props }
			: overrides.props;

		return createField<NewKey, NewSchema, NewProps>({
			key: (overrides.key ?? options.key) as NewKey,
			schema: (overrides.schema ?? options.schema) as NewSchema,
			render: (overrides.render ?? options.render) as RenderFieldHandler<
				NewKey,
				NewSchema,
				NewProps
			>,
			defaultProps: mergedDefaultProps as unknown as Partial<NewProps> | undefined,
		});
	};

	// Configuração estática do schema (para metadados do campo)
	const staticSchema = typeof options.schema === "function" ? options.schema() : options.schema;

	// Extração das dependências (se houver), lidando com lazy/lazy circular dependency
	const dependencyKeys = options.dependencies
		? extractDependencyKeys(options.dependencies)
		: undefined;

	/**
	 * Metadados estáticos sobre esse componente de campo
	 */
	Field.config = {
		key: options.key,
		schema: staticSchema,
		dependencies: dependencyKeys,
	} as FieldConfig<Key>;

	/**
	 * Retorna o schema Zod, suportando funções dinâmicas baseadas em valores do formulário.
	 * @param formValues - (Opcional) Valores atuais/anteriores do formulário
	 */
	Field.getZodSchema = (formValues?: Record<string, any>) => {
		if (typeof options.schema === "function") {
			return options.schema(formValues);
		}
		return options.schema;
	};

	return Field;
}
