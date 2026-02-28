/**
 * Utilitários para navegação entre steps no wizard.
 * Centraliza a lógica comum de navegação para reduzir duplicação.
 */

import type { FieldValues, FormState } from "react-hook-form";
import type { StepStateWithMetadata } from "../../step/types/step";

/**
 * Configuração para navegação entre steps.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template Steps - Array de strings literais representando os steps
 */
export interface NavigationConfig<
	TFieldValues extends FieldValues,
	Steps extends readonly string[],
> {
	/** Step de destino */
	targetStep: Steps[number] | undefined;
	/** Índice do step de destino */
	targetStepIndex: number;
	/** Estado do step anterior */
	previousStepState: StepStateWithMetadata<TFieldValues, Steps> | undefined;
	/** Função para obter estado do step atual */
	getCurrentStepState: (
		step: Steps[number]
	) => StepStateWithMetadata<TFieldValues, Steps> | undefined;
	/** Função para resetar dirtyFields do step anterior */
	resetDirtyFields: (step: Steps[number]) => void;
	/** Estado completo do formulário */
	formState: FormState<TFieldValues>;
	/** Callback chamado quando o step muda */
	onStepChange?: (
		step: Steps[number],
		stepIndex: number,
		formState?: FormState<TFieldValues>,
		previousStepState?: StepStateWithMetadata<TFieldValues, Steps>,
		currentStepState?: StepStateWithMetadata<TFieldValues, Steps>
	) => void;
	/** Função para marcar step pendente (opcional) */
	setPendingStep?: (step: Steps[number] | null) => void;
	/** Executa a mudança de step (já sabe o destino pelo targetStep) */
	executeStepChange: () => void;
}

/**
 * Executa a navegação para um step específico.
 * Centraliza a lógica comum de todos os métodos de navegação.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template Steps - Array de strings literais representando os steps
 *
 * @param config - Configuração da navegação
 */
export function handleStepNavigation<
	TFieldValues extends FieldValues,
	Steps extends readonly string[],
>(config: NavigationConfig<TFieldValues, Steps>): void {
	const {
		targetStep,
		targetStepIndex,
		previousStepState,
		getCurrentStepState,
		resetDirtyFields,
		formState,
		onStepChange,
		setPendingStep,
		executeStepChange,
	} = config;

	if (!targetStep) {
		return;
	}

	// Reseta dirtyFields do step anterior
	if (previousStepState) {
		resetDirtyFields(previousStepState.step);
	}

	// Obtém estado do step de destino
	const currentStepState = getCurrentStepState(targetStep);

	// Marca step pendente se necessário (apenas em modo controlado)
	setPendingStep?.(targetStep);

	onStepChange?.(targetStep, targetStepIndex, formState, previousStepState, currentStepState);
	executeStepChange();
}
