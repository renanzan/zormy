/**
 * Utilitários para gerenciamento de steps do wizard.
 * Centraliza toda a lógica relacionada a steps: campos, valores, estado, validação e campos alterados.
 */

import z from "zod";

import {
	flattenToNested,
	getNestedValue,
	setNestedValue,
} from "../../../resolver/helpers/nested-objects";

import type { FieldValues, Path } from "react-hook-form";
import type { StepState, WizardStepSummary } from "../types/step";

// ============================================================================
// Extração de campos e valores
// ============================================================================

/**
 * Obtém os campos de um step baseado no schema.
 * Extrai as chaves do schema Zod para identificar quais campos pertencem ao step.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template TSteps - Array de strings literais representando os steps
 *
 * @param step - Step atual
 * @param schemaFactory - Função que cria o schema baseado no step e valores
 * @param getFormValues - Função para obter valores atuais do formulário
 * @returns Array de paths dos campos do step
 */
export function getFieldsForStep<
	TFieldValues extends FieldValues,
	TSteps extends readonly string[],
>(
	step: TSteps[number],
	schemaFactory: (context: { step: TSteps[number]; formValues?: TFieldValues }) => z.ZodTypeAny,
	getFormValues: () => TFieldValues
): Array<Path<TFieldValues>> {
	const currentValues = getFormValues();
	const schema = schemaFactory({ step, formValues: currentValues });

	if (schema instanceof z.ZodObject) {
		return Object.keys(schema.shape) as Array<Path<TFieldValues>>;
	}

	return [];
}

/**
 * Obtém os valores de um step específico.
 * Extrai apenas os valores dos campos do step e converte para estrutura aninhada se necessário.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param fields - Array de paths dos campos do step
 * @param getFormValue - Função para obter um valor específico do formulário
 * @returns Valores parciais do step
 */
export function getStepValues<TFieldValues extends FieldValues>(
	fields: Array<Path<TFieldValues>>,
	getFormValue: <T extends Path<TFieldValues>>(path: T) => unknown
): Partial<TFieldValues> {
	const flatValues = fields.reduce(
		(acc, field) => {
			const value = getFormValue(field);
			if (value !== undefined) {
				(acc as Record<string, unknown>)[field as string] = value;
			}
			return acc;
		},
		{} as Record<string, unknown>
	);

	// Se há chaves com pontos, converte para estrutura aninhada
	const hasNestedKeys = Object.keys(flatValues).some((key) => key.includes("."));
	if (hasNestedKeys) {
		return flattenToNested(flatValues) as Partial<TFieldValues>;
	}

	return flatValues as Partial<TFieldValues>;
}

// ============================================================================
// Estado do step
// ============================================================================

/**
 * Extrai valor aninhado de um objeto usando array de paths.
 *
 * @param obj - Objeto de onde extrair o valor
 * @param path - Array de chaves representando o caminho
 * @returns Valor encontrado ou undefined
 */
function getNestedValueByPath(obj: Record<string, unknown>, path: string[]): unknown {
	let current: unknown = obj;
	for (const segment of path) {
		if (current && typeof current === "object" && !Array.isArray(current) && segment) {
			current = (current as Record<string, unknown>)[segment];
		} else {
			return undefined;
		}
	}
	return current;
}

/**
 * Extrai dados de um campo específico do formState.
 *
 * @param field - Path do campo
 * @param pathArray - Array de chaves do path
 * @param source - Objeto fonte (errors, dirtyFields, etc)
 * @param target - Objeto destino onde o valor será armazenado
 */
function extractFieldData(
	field: string,
	pathArray: string[],
	source: Record<string, unknown>,
	target: Record<string, unknown>
): void {
	const value = getNestedValueByPath(source, pathArray);
	if (value !== undefined) {
		setNestedValue(target, field, value);
	}
}

/**
 * Extrai os dados de um step do formState completo.
 * Cria um recorte do FormState contendo apenas os campos do step especificado.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param fields - Array de paths dos campos do step
 * @param allErrors - Objeto com todos os erros do formulário
 * @param allDirtyFields - Objeto com todos os campos dirty do formulário
 * @param allTouchedFields - Objeto com todos os campos touched do formulário
 * @param allValues - Objeto com todos os valores do formulário
 * @param getFormValue - Função para obter valor específico do formulário
 * @returns Objeto com estado do step (sem isValid, isDirty, isTouched)
 */
export function extractStepData<TFieldValues extends FieldValues>(
	fields: Array<Path<TFieldValues>>,
	allErrors: Record<string, unknown>,
	allDirtyFields: Record<string, unknown>,
	allTouchedFields: Record<string, unknown>,
	allValues: Record<string, unknown>,
	getFormValue: <T extends Path<TFieldValues>>(path: T) => unknown
): Omit<StepState<TFieldValues>, "isValid" | "isDirty" | "isTouched"> {
	const stepErrors: Partial<Record<Path<TFieldValues>, string | undefined>> = {};
	const stepDirtyFields: Partial<
		Record<Path<TFieldValues>, true | Record<string, string | undefined>>
	> = {};
	const stepTouchedFields: Partial<
		Record<Path<TFieldValues>, true | Record<string, string | undefined>>
	> = {};
	const stepValues: Partial<TFieldValues> = {};

	for (const field of fields) {
		const fieldPath = field as string;
		const pathArray = fieldPath.split(".");

		extractFieldData(fieldPath, pathArray, allErrors, stepErrors);
		extractFieldData(fieldPath, pathArray, allDirtyFields, stepDirtyFields);
		extractFieldData(fieldPath, pathArray, allTouchedFields, stepTouchedFields);
		extractFieldData(fieldPath, pathArray, allValues, stepValues);
	}

	// Converte stepValues para estrutura aninhada se necessário
	const hasNestedKeys = Object.keys(stepValues).some((key) => key.includes("."));
	const nestedStepValues = hasNestedKeys
		? (getStepValues(fields, getFormValue) as Partial<TFieldValues>)
		: stepValues;

	return {
		errors: stepErrors,
		dirtyFields: stepDirtyFields,
		touchedFields: stepTouchedFields,
		values: nestedStepValues,
	};
}

/**
 * Verifica se um step tem campos modificados (dirty).
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param fields - Array de paths dos campos do step
 * @param dirtyFields - Objeto com todos os campos dirty do formulário
 * @returns true se algum campo do step estiver dirty
 */
export function isStepDirty<TFieldValues extends FieldValues>(
	fields: Array<Path<TFieldValues>>,
	dirtyFields: Record<string, unknown>
): boolean {
	return fields.some((field) => dirtyFields[field as keyof typeof dirtyFields] !== undefined);
}

/**
 * Verifica se algum campo do step foi tocado.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param fields - Array de paths dos campos do step
 * @param touchedFields - Objeto com todos os campos touched do formulário
 * @returns true se algum campo do step foi tocado
 */
export function isStepTouched<TFieldValues extends FieldValues>(
	fields: Array<Path<TFieldValues>>,
	touchedFields: Record<string, unknown>
): boolean {
	return fields.some((field) => touchedFields[field as keyof typeof touchedFields] !== undefined);
}

// ============================================================================
// Validação do step
// ============================================================================

/**
 * Verifica se um step é válido baseado em seu schema.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param fields - Array de paths dos campos do step
 * @param schema - Schema Zod para validação do step
 * @param getFormValue - Função para obter valor específico do formulário
 * @returns true se o step for válido
 */
export function isStepValid<TFieldValues extends FieldValues>(
	fields: Array<Path<TFieldValues>>,
	schema: z.ZodTypeAny,
	getFormValue: <T extends Path<TFieldValues>>(path: T) => unknown
): boolean {
	const stepValues = getStepValues(fields, getFormValue);
	return schema.safeParse(stepValues).success;
}

/**
 * Verifica se um step tem erros.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param step - Nome do step
 * @param currentStep - Step atual do wizard
 * @param fields - Array de paths dos campos do step
 * @param errors - Objeto com todos os erros do formulário
 * @param isValidFn - Função para verificar se o step é válido
 * @returns true se o step tiver erros
 */
export function hasStepError<TFieldValues extends FieldValues>(
	step: string,
	currentStep: string,
	fields: Array<Path<TFieldValues>>,
	errors: Record<string, unknown>,
	isValidFn: (step: string) => boolean
): boolean {
	// Se é o step atual, verifica erros diretamente
	if (step === currentStep) {
		return fields.some((field) => errors[field] !== undefined);
	}
	// Para steps não atuais, verifica se é inválido
	return !isValidFn(step);
}

/**
 * Obtém o resumo do status de um step.
 * Determina o estado visual do step baseado em visitado, erros e validação.
 *
 * @param step - Nome do step
 * @param currentStep - Step atual do wizard
 * @param visitedSteps - Set com steps já visitados
 * @param hasErrorFn - Função para verificar se o step tem erros
 * @param isValidFn - Função para verificar se o step é válido
 * @returns Resumo do status do step
 */
export function getStepSummary(
	step: string,
	currentStep: string,
	visitedSteps: Set<string>,
	hasErrorFn: (step: string) => boolean,
	isValidFn: (step: string) => boolean
): WizardStepSummary {
	// Step atual sempre está em edição ou erro
	if (step === currentStep) {
		return hasErrorFn(step) ? "error" : "editing";
	}

	const isVisited = visitedSteps.has(step);

	// Steps não visitados: mostra como completed se válido, pending caso contrário
	if (!isVisited) {
		return isValidFn(step) ? "completed" : "pending";
	}

	const isValid = isValidFn(step);
	const hasError = hasErrorFn(step);

	// Step visitado com erro
	if (hasError) {
		return "error";
	}

	// Step visitado e válido está completo
	if (isValid) {
		return "completed";
	}

	// Fallback para erro
	return "error";
}

// ============================================================================
// Campos válidos alterados
// ============================================================================

/**
 * Verifica se um campo pertence ao step atual.
 *
 * @param fieldPath - Path do campo
 * @param stepFields - Set com paths dos campos do step
 * @returns true se o campo pertence ao step
 */
function belongsToStep(fieldPath: string, stepFields: Set<string>): boolean {
	return Array.from(stepFields).some((stepField) => {
		if (stepField === fieldPath) return true;
		if (fieldPath.startsWith(`${stepField}.`)) return true;
		return false;
	});
}

/**
 * Percorre recursivamente dirtyFields para encontrar campos realmente dirty.
 * Filtra apenas campos que pertencem ao step e não têm erros.
 *
 * @param dirtyObj - Objeto de dirtyFields
 * @param currentPath - Path atual na travessia
 * @param stepFields - Set com paths dos campos do step
 * @param errors - Objeto com todos os erros do formulário
 * @param allValues - Objeto com todos os valores do formulário
 * @param validChangedFields - Objeto onde serão armazenados os campos válidos alterados
 */
function traverseDirtyFields(
	dirtyObj: unknown,
	currentPath: string,
	stepFields: Set<string>,
	errors: Record<string, unknown>,
	allValues: Record<string, unknown>,
	validChangedFields: Record<string, unknown>
): void {
	if (!dirtyObj || typeof dirtyObj !== "object" || Array.isArray(dirtyObj)) {
		return;
	}

	const dirtyObjRecord = dirtyObj as Record<string, unknown>;
	for (const [key, dirtyValue] of Object.entries(dirtyObjRecord)) {
		const fieldPath = currentPath ? `${currentPath}.${key}` : key;

		// Ignora campos que não pertencem ao step
		if (!belongsToStep(fieldPath, stepFields)) {
			continue;
		}

		// Se o campo está marcado como dirty (true)
		if (dirtyValue === true) {
			const error = getNestedValue(errors, fieldPath);
			// Só adiciona se não tiver erro
			if (error === undefined) {
				const value = getNestedValue(allValues, fieldPath);
				if (value !== undefined) {
					validChangedFields[fieldPath] = value;
				}
			}
		} else if (
			dirtyValue !== null &&
			typeof dirtyValue === "object" &&
			!Array.isArray(dirtyValue) &&
			Object.keys(dirtyValue as Record<string, unknown>).length > 0
		) {
			// Continua travessia recursiva para objetos aninhados
			traverseDirtyFields(dirtyValue, fieldPath, stepFields, errors, allValues, validChangedFields);
		}
	}
}

/**
 * Extrai apenas campos válidos alterados (dirty sem erros) de um step específico.
 * Útil para enviar apenas os dados que foram modificados e estão válidos para a API.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param fields - Array de paths dos campos do step
 * @param dirtyFields - Objeto com todos os campos dirty do formulário
 * @param errors - Objeto com todos os erros do formulário
 * @param allValues - Objeto com todos os valores do formulário
 * @returns Objeto com apenas os campos válidos alterados do step
 */
export function getValidChangedFieldsForStep<TFieldValues extends FieldValues>(
	fields: Array<Path<TFieldValues>>,
	dirtyFields: Record<string, unknown>,
	errors: Record<string, unknown>,
	allValues: Record<string, unknown>
): Partial<TFieldValues> {
	const stepFieldsSet = new Set(fields.map((f) => f as string));
	const validChangedFields: Record<string, unknown> = {};

	if (dirtyFields && typeof dirtyFields === "object" && Object.keys(dirtyFields).length > 0) {
		traverseDirtyFields(dirtyFields, "", stepFieldsSet, errors, allValues, validChangedFields);
	}

	if (Object.keys(validChangedFields).length === 0) {
		return {} as Partial<TFieldValues>;
	}

	// Converte para estrutura aninhada se necessário
	const hasNestedKeys = Object.keys(validChangedFields).some((key) => key.includes("."));

	return hasNestedKeys
		? (flattenToNested(validChangedFields) as Partial<TFieldValues>)
		: (validChangedFields as Partial<TFieldValues>);
}
