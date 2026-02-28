/**
 * Utilitários para lógica dos useEffects no wizard.
 * Centraliza a lógica complexa dos effects para reduzir complexidade cognitiva.
 */

import type { FieldValues, FormState, Path } from "react-hook-form";
import type { StepStateWithMetadata } from "../types/step";

/**
 * Processa mudança externa de step (ex: URL mudou diretamente).
 * Usado quando o step é controlado externamente e muda de fora do wizard.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template Steps - Array de strings literais representando os steps
 *
 * @param config - Configuração para processar mudança externa
 */
export function handleExternalStepChange<
	TFieldValues extends FieldValues,
	Steps extends readonly string[],
>(config: {
	currentStep: Steps[number];
	stepIndex: number;
	previousStep: Steps[number] | undefined;
	capturePreviousStepState: () => StepStateWithMetadata<TFieldValues, Steps> | undefined;
	resetDirtyFields: (step: Steps[number]) => void;
	getStepState: (step: Steps[number]) => StepStateWithMetadata<TFieldValues, Steps>;
	formState: FormState<TFieldValues>;
	onStepChange?: (
		step: Steps[number],
		stepIndex: number,
		formState?: FormState<TFieldValues>,
		previousStepState?: StepStateWithMetadata<TFieldValues, Steps>,
		currentStepState?: StepStateWithMetadata<TFieldValues, Steps>
	) => void;
	updatePreviousStepRef: (step: Steps[number]) => void;
}): void {
	const {
		currentStep,
		stepIndex,
		previousStep,
		capturePreviousStepState,
		resetDirtyFields,
		getStepState,
		formState,
		onStepChange,
		updatePreviousStepRef,
	} = config;

	if (stepIndex === -1) {
		return;
	}

	// Captura estado do step anterior
	const previousStepState = capturePreviousStepState();

	// Reseta dirtyFields do step anterior
	if (previousStepState && previousStep) {
		resetDirtyFields(previousStep);
	}

	// Obtém estado do step atual
	const currentStepState = getStepState(currentStep);

	// Chama onStepChange
	onStepChange?.(currentStep, stepIndex, formState, previousStepState, currentStepState);

	// Atualiza ref
	updatePreviousStepRef(currentStep);
}

/**
 * Processa mudança interna de step (navegação via métodos).
 * Usado quando o step muda através de métodos do wizard (next, back, etc).
 *
 * @template Steps - Array de strings literais representando os steps
 *
 * @param config - Configuração para processar mudança interna
 * @returns true se a mudança foi processada
 */
export function handleInternalStepChange<Steps extends readonly string[]>(config: {
	currentStep: Steps[number];
	pendingStep: Steps[number] | null;
	updatePreviousStepRef: (step: Steps[number]) => void;
	clearPendingStep: () => void;
	resetInternalNavigationFlag: () => void;
}): boolean {
	const {
		currentStep,
		pendingStep,
		updatePreviousStepRef,
		clearPendingStep,
		resetInternalNavigationFlag,
	} = config;

	if (pendingStep === currentStep) {
		updatePreviousStepRef(currentStep);
		clearPendingStep();
		// Reseta flag após delay para garantir que todas as atualizações foram processadas
		setTimeout(resetInternalNavigationFlag, 0);
		return true;
	}

	return false;
}

/**
 * Limpa erros de campos que não pertencem ao step atual.
 * Mantém apenas os erros dos campos do step atual visível.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 *
 * @param currentFieldKeys - Set com paths dos campos do step atual
 * @param allFieldKeys - Set com paths de todos os campos do formulário
 * @param clearError - Função para limpar erro de um campo específico
 */
export function clearErrorsForOtherSteps<TFieldValues extends FieldValues>(
	currentFieldKeys: Set<Path<TFieldValues>>,
	allFieldKeys: Set<Path<TFieldValues>>,
	clearError: (field: Path<TFieldValues>) => void
): void {
	allFieldKeys.forEach((fieldKey) => {
		if (!currentFieldKeys.has(fieldKey)) {
			clearError(fieldKey);
		}
	});
}
