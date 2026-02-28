/**
 * Utilitários para processamento e normalização de defaultValues no wizard.
 * Centraliza toda a lógica relacionada a valores padrão.
 */

import { flattenToNested, mergeNested } from "../../../resolver/helpers/nested-objects";

import type { DefaultValues, FieldValues } from "react-hook-form";
import type { FieldComponentBase } from "../../../fields/field/types/field";

/**
 * Processa defaultValues síncronos.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param defaultValuesFn - Função que retorna defaultValues
 * @param normalizeCallback - Função para normalizar valores
 * @param cacheRef - Ref para cache do resultado
 * @param processedRef - Ref para indicar se já foi processado
 * @returns Valores padrão processados ou undefined
 */
function processSyncDefaultValues<TFieldValues extends FieldValues>(
	defaultValuesFn: () => Partial<TFieldValues>,
	normalizeCallback: (values: Record<string, unknown>) => DefaultValues<TFieldValues>,
	cacheRef: { current: DefaultValues<TFieldValues> | null },
	processedRef: { current: boolean }
): DefaultValues<TFieldValues> | undefined {
	if (processedRef.current) {
		return cacheRef.current || undefined;
	}

	const result = defaultValuesFn();

	// Se retornou uma Promise, não processa aqui
	if (result instanceof Promise) {
		processedRef.current = true;
		return undefined;
	}

	// Processa e armazena
	cacheRef.current = normalizeCallback(result as Record<string, unknown>);
	processedRef.current = true;
	return cacheRef.current;
}

/**
 * Processa defaultValues (objeto ou função).
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param defaultValues - Valores padrão (objeto, função síncrona ou assíncrona)
 * @param isFunction - Indica se defaultValues é uma função
 * @param normalizeCallback - Função para normalizar valores
 * @param cacheRef - Ref para cache do resultado
 * @param processedRef - Ref para indicar se já foi processado
 * @returns Valores padrão processados ou undefined
 */
export function processDefaultValues<TFieldValues extends FieldValues>(
	defaultValues:
		| Partial<TFieldValues>
		| (() => Partial<TFieldValues>)
		| (() => Promise<Partial<TFieldValues>>)
		| undefined,
	isFunction: boolean,
	normalizeCallback: (values: Record<string, unknown>) => DefaultValues<TFieldValues>,
	cacheRef: { current: DefaultValues<TFieldValues> | null },
	processedRef: { current: boolean }
): DefaultValues<TFieldValues> | undefined {
	if (!defaultValues) {
		return undefined;
	}

	// Se é função, processa
	if (isFunction) {
		return processSyncDefaultValues(
			defaultValues as () => Partial<TFieldValues>,
			normalizeCallback,
			cacheRef,
			processedRef
		);
	}

	// Se é objeto, processa diretamente
	return normalizeCallback(defaultValues as Record<string, unknown>);
}

/**
 * Coleta todas as chaves de campos de todos os steps.
 * Útil para criar estrutura base para normalização de defaultValues.
 *
 * @template Steps - Array de strings literais representando os steps
 *
 * @param steps - Array de steps
 * @param fieldsMap - Mapeamento de steps para campos
 * @returns Set com todas as chaves de campos
 */
export function collectAllFieldKeys<Steps extends readonly string[]>(
	steps: Steps,
	fieldsMap: Record<string, readonly FieldComponentBase[]>
): Set<string> {
	const allFieldKeys = new Set<string>();

	steps.forEach((step) => {
		const stepKey = step as keyof typeof fieldsMap;
		const fields = fieldsMap[stepKey] || [];
		fields.forEach((field: FieldComponentBase) => {
			allFieldKeys.add(field.config.key);
		});
	});

	return allFieldKeys;
}

/**
 * Cria estrutura base aninhada a partir das chaves dos campos.
 * Converte chaves com pontos (ex: "a.b.c") em estrutura aninhada (ex: { a: { b: { c: undefined } } }).
 *
 * @param fieldKeys - Set com todas as chaves dos campos
 * @returns Objeto com estrutura aninhada vazia
 */
export function createNestedStructureFromKeys(fieldKeys: Set<string>): Record<string, unknown> {
	const flatStructure: Record<string, unknown> = {};

	// Cria um objeto flat com todas as chaves
	fieldKeys.forEach((key) => {
		if (key.includes(".")) {
			flatStructure[key] = undefined;
		}
	});

	// Converte para estrutura aninhada
	return flattenToNested(flatStructure);
}

/**
 * Normaliza valores padrão do formulário para estrutura aninhada.
 * Mescla os defaultValues fornecidos com a estrutura base criada a partir das chaves dos campos.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param defaultValues - Valores padrão a normalizar
 * @param fieldKeys - Set com todas as chaves dos campos
 * @returns Valores normalizados com estrutura aninhada
 */
export function normalizeDefaultValues<TFieldValues extends FieldValues>(
	defaultValues: Record<string, unknown>,
	fieldKeys: Set<string>
): DefaultValues<TFieldValues> {
	const structureFromFields = createNestedStructureFromKeys(fieldKeys);
	const merged = mergeNested(structureFromFields, defaultValues);

	return merged as DefaultValues<TFieldValues>;
}

/**
 * Configuração para processar defaultValues assíncronos.
 *
 * @template TFieldValues - Tipo dos valores do formulário (pode ser Partial)
 */
export interface AsyncDefaultValuesConfig<TFieldValues extends FieldValues> {
	/** Função que retorna defaultValues (síncrona ou assíncrona) */
	defaultValuesFn: (() => Partial<TFieldValues>) | (() => Promise<Partial<TFieldValues>>);
	/** Função para normalizar valores */
	normalizeCallback: (values: Record<string, unknown>) => DefaultValues<Partial<TFieldValues>>;
	/** Ref para cache do resultado */
	cacheRef: { current: DefaultValues<Partial<TFieldValues>> | null };
	/** Ref para indicar se função síncrona já foi processada */
	processedSyncRef: { current: boolean };
	/** Ref para indicar se função assíncrona já foi iniciada */
	startedAsyncRef: { current: boolean };
	/** Callback para resetar o formulário com os valores normalizados */
	onNormalized: (normalized: DefaultValues<Partial<TFieldValues>>) => void;
}

/**
 * Processa defaultValues assíncronos.
 * Fluxo: (1) evita reexecução se já processado; (2) chama defaultValuesFn;
 * (3) se Promise → then/catch e onNormalized no then; (4) se valor → normaliza e onNormalized.
 */
export function processAsyncDefaultValues<TFieldValues extends FieldValues>(
	config: AsyncDefaultValuesConfig<TFieldValues>
): void {
	const {
		defaultValuesFn,
		normalizeCallback,
		cacheRef,
		processedSyncRef,
		startedAsyncRef,
		onNormalized,
	} = config;

	if (processedSyncRef.current || startedAsyncRef.current) return;

	const result = defaultValuesFn();

	if (result instanceof Promise) {
		startedAsyncRef.current = true;
		result
			.then((asyncValues) => {
				const normalized = normalizeCallback(asyncValues as Record<string, unknown>);
				cacheRef.current = normalized;
				onNormalized(normalized);
			})
			.catch((error) => {
				console.error("[useWizard] Erro ao carregar defaultValues assíncrono:", error);
				startedAsyncRef.current = false;
			});
	} else {
		processedSyncRef.current = true;
		const normalized = normalizeCallback(result as Record<string, unknown>);
		cacheRef.current = normalized;
		onNormalized(normalized);
	}
}