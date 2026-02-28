import type { FieldValues, Path } from "react-hook-form";

/**
 * Estado de um step específico (recorte do FormState).
 * Contém apenas os dados relacionados aos campos do step.
 */
export type StepState<TFieldValues extends FieldValues> = {
	/** Erros apenas dos campos do step */
	errors: Partial<Record<Path<TFieldValues>, string | undefined>>;
	/** Campos alterados apenas do step */
	dirtyFields: Partial<Record<Path<TFieldValues>, true | Record<string, string | undefined>>>;
	/** Campos tocados apenas do step */
	touchedFields: Partial<Record<Path<TFieldValues>, true | Record<string, string | undefined>>>;
	/** Valores apenas dos campos do step */
	values: Partial<TFieldValues>;
	/** Indica se o step é válido */
	isValid: boolean;
	/** Indica se o step tem campos alterados */
	isDirty: boolean;
	/** Indica se algum campo do step foi tocado */
	isTouched: boolean;
};

/**
 * Estado completo de um step com informações adicionais.
 * Estende StepState com metadados sobre o step (nome, índice, dados válidos alterados).
 */
export type StepStateWithMetadata<
	TFieldValues extends FieldValues,
	Steps extends readonly string[],
> = StepState<TFieldValues> & {
	/** Nome do step */
	step: Steps[number];
	/** Índice do step (0-based) */
	stepIndex: number;
	/** Dados válidos alterados (apenas campos dirty sem erros) */
	validChangedData: Partial<TFieldValues>;
	/** Indica se o step tem dados válidos alterados */
	hasValidChangedData: boolean;
};

/**
 * Status de um step no wizard.
 * Usado para indicar o estado visual do step na UI.
 */
export type WizardStepSummary = "pending" | "editing" | "completed" | "error";

/**
 * Estado de um step no wizard.
 * Contém informações sobre o estado de um step específico para uso na UI.
 */
export type WizardStateItem<Steps extends readonly string[]> = {
	/** Nome do step */
	step: Steps[number];
	/** Indica se o step já foi visitado */
	isVisited: boolean;
	/** Indica se o step tem campos modificados */
	isDirty: boolean;
	/** Indica se o step é válido */
	isValid: boolean;
	/** Indica se o step tem erros */
	hasError: boolean;
	/** Resumo do status do step */
	summary: WizardStepSummary;
};
