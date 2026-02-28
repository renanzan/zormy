import { createAbstractSchemaBuilderWithDeps, createSchemaBuilderWithDeps } from "./helpers";

import type { ZodType } from "zod";
import type { Dependency } from "../../dependency/types/dependency";
import type { ExtractDependencyTypes } from "../../dependency/types/extractors";
import type {
	AbstractFieldBuilder,
	AbstractSchemaBuilder,
	FieldBuilder,
	SchemaBuilder,
} from "../types/builder";

/**
 * Cria a parte do builder com dependências para campos normais.
 * Extrai lógica comum para reduzir duplicação.
 */
function createFieldDependsOnBuilder<Key extends string, D extends [...Dependency[]]>(
	key: Key,
	dependencies: D
) {
	return {
		dependsOn: field(key).dependsOn,
		schema: <S extends ZodType>(
			schema: S | ((formValues?: ExtractDependencyTypes<D> & Record<string, any>) => S)
		) => {
			return createSchemaBuilderWithDeps(key, schema, dependencies);
		},
	} as FieldBuilder<Key, D> & {
		schema: <S extends ZodType>(
			schema: S | ((formValues?: ExtractDependencyTypes<D> & Record<string, any>) => S)
		) => SchemaBuilder<Key, S, D>;
	};
}

/**
 * Cria a parte do builder com dependências para campos abstratos.
 * Extrai lógica comum para reduzir duplicação.
 */
function createAbstractDependsOnBuilder<D extends [...Dependency[]]>(dependencies: D) {
	return {
		dependsOn: abstractField().dependsOn,
		schema: <S extends ZodType>(
			schema: S | ((formValues?: ExtractDependencyTypes<D> & Record<string, any>) => S)
		) => {
			return createAbstractSchemaBuilderWithDeps(schema, dependencies);
		},
	} as AbstractFieldBuilder<D> & {
		schema: <S extends ZodType>(
			schema: S | ((formValues?: ExtractDependencyTypes<D> & Record<string, any>) => S)
		) => AbstractSchemaBuilder<S, D>;
	};
}

/**
 * Cria um builder fluente para construir um campo de formulário.
 *
 * Esta é a função principal para criar campos tipados. Ela retorna um builder que permite
 * definir dependências opcionais, schema (estático ou dinâmico) e renderização de forma encadeada.
 *
 * **Fluxo típico:**
 * 1. `field("key")` → inicia o builder
 * 2. Opcionalmente: `.dependsOn(...)` → adiciona dependências
 * 3. `.schema(...)` → define o schema (estático ou função dinâmica)
 * 4. `.render(...)` → define a renderização
 *
 * @template Key - Chave literal do campo (inferida do parâmetro)
 * @param key - Chave única que identifica o campo no formulário (ex: "name", "user.email")
 * @returns Builder para continuar a construção do campo
 */
export function field<Key extends string>(key: Key): FieldBuilder<Key> {
	return {
		dependsOn: <D extends [...Dependency[]]>(...dependencies: D) => {
			return createFieldDependsOnBuilder(key, dependencies);
		},
		schema: <S extends ZodType>(schema: S | ((formValues?: Record<string, any>) => S)) => {
			return createSchemaBuilderWithDeps(key, schema, []);
		},
	};
}

/**
 * Cria um builder fluente para construir um campo abstrato de formulário.
 *
 * Um campo abstrato não possui key inicial e não pode ser usado diretamente em formulários.
 * Ele serve como template reutilizável que deve ser extendido com uma key obrigatória
 * para criar um FieldComponent válido.
 *
 * **Use casos:**
 * - Criar campos genéricos que compartilham schema e renderização
 * - Reduzir duplicação quando múltiplos campos têm comportamento similar
 * - Criar bibliotecas de campos reutilizáveis
 *
 * **Fluxo típico:**
 * 1. `abstractField()` → inicia o builder
 * 2. Opcionalmente: `.dependsOn(...)` → adiciona dependências
 * 3. `.schema(...)` → define o schema
 * 4. `.render(...)` → define a renderização
 * 5. `.extend({ key: "..." })` → cria FieldComponents específicos
 *
 * @returns Builder para continuar a construção do campo abstrato
 */
export function abstractField(): AbstractFieldBuilder {
	return {
		dependsOn: <D extends [...Dependency[]]>(...dependencies: D) => {
			return createAbstractDependsOnBuilder(dependencies);
		},
		schema: <S extends ZodType>(schema: S | ((formValues?: Record<string, any>) => S)) => {
			return createAbstractSchemaBuilderWithDeps(schema, []);
		},
	};
}
