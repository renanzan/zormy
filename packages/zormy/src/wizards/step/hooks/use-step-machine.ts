"use client";

import { useState } from "react";

import type { FieldValues, FormState } from "react-hook-form";

/**
 * Argumentos para o hook `useStepMachine`.
 *
 * @template Steps - Array de strings literais representando os steps do wizard
 */
export type UseStepMachineArgs<Steps extends readonly string[]> = {
	/** Array de steps do wizard em ordem */
	steps: Steps;
	/** Step inicial do wizard (padrão: primeiro step do array) */
	initialStep?: Steps[number];
	/**
	 * Step controlado externamente (ex: via URL query params).
	 * Quando fornecido, o wizard será controlado por este valor ao invés de estado interno.
	 */
	controlledStep?: Steps[number];
	/**
	 * Callback chamado quando o step muda internamente.
	 * Útil para sincronizar com URL ou estado externo.
	 *
	 * @param step - Step atual
	 * @param stepIndex - Índice do step atual (0-based)
	 * @param formState - Estado do formulário completo (erros, campos modificados, etc)
	 * @param previousStepState - Estado do step anterior (recorte do formState)
	 * @param currentStepState - Estado do step atual (recorte do formState)
	 */
	onStepChange?: <TFieldValues extends FieldValues = FieldValues, TStepState = any>(args: {
		step: Steps[number];
		stepIndex: number;
		formState?: FormState<TFieldValues>;
		previousStepState?: TStepState;
		currentStepState?: TStepState;
	}) => void;
};

/**
 * Retorno do hook `useStepMachine`.
 *
 * @template Steps - Array de strings literais representando os steps do wizard
 */
export type UseStepMachineReturn<Steps extends readonly string[]> = {
	/** Array de steps do wizard */
	steps: Steps;
	/** Step inicial do wizard */
	initialStep: Steps[number];
	/** Step atual do wizard */
	currentStep: Steps[number];
	/** Índice do step atual (0-based) */
	currentStepIndex: number;
	/** Número total de steps */
	totalSteps: number;
	/** Indica se está no primeiro step */
	isFirstStep: boolean;
	/** Indica se está no último step */
	isLastStep: boolean;
	/** Indica se pode voltar para o step anterior */
	canGoBack: boolean;
	/** Indica se pode avançar para o próximo step */
	canGoNext: boolean;
	/** Avança para o próximo step */
	goToNextStep: () => void;
	/** Volta para o step anterior */
	goToPreviousStep: () => void;
	/** Vai para um step específico */
	goToStep: (step: Steps[number]) => void;
	/** Vai para um step pelo índice */
	goToStepByIndex: (stepIndex: number) => void;
	/** Reinicia o fluxo voltando para o step inicial */
	restartFlow: () => void;
	/** Indica se o step está sendo controlado externamente */
	isControlled: boolean;
};

/**
 * Hook para gerenciar a navegação entre steps de um wizard.
 *
 * Fornece controle sobre qual step está ativo e métodos para navegar entre steps.
 * Suporta tanto modo controlado (via prop `controlledStep`) quanto não controlado (estado interno).
 *
 * @internal Para uso interno do zormy.
 * @template Steps - Array de strings literais representando os steps do wizard
 *
 * @param args - Argumentos do hook
 * @returns Objeto com estado e métodos de navegação
 *
 * @throws {Error} Se não houver steps ou se o step inicial for inválido
 *
 * @example
 * ```tsx
 * const steps = ["step1", "step2", "step3"] as const;
 * const machine = useStepMachine({
 *   steps,
 *   initialStep: "step1",
 *   onStepChange: (step, index) => {
 *     console.log(`Mudou para ${step} no índice ${index}`);
 *   }
 * });
 *
 * // Navegar
 * machine.goToNextStep();
 * machine.goToPreviousStep();
 * machine.goToStep("step3");
 * ```
 */
export const useStepMachine = <Steps extends readonly string[]>(
	args: UseStepMachineArgs<Steps>
): UseStepMachineReturn<Steps> => {
	const { steps, initialStep = steps[0], controlledStep, onStepChange } = args;

	// Validações
	if (steps.length === 0) {
		throw new Error("useStepMachine requer pelo menos um passo");
	}

	if (initialStep === undefined) {
		throw new Error("Não foi possível resolver o step inicial.");
	}

	if (!steps.includes(initialStep)) {
		throw new Error("O passo inicial precisa existir dentro da lista de passos");
	}

	// Determina se está em modo controlado
	const isControlled = controlledStep !== undefined;
	const [internalStep, setInternalStep] = useState<Steps[number]>(initialStep);
	const currentStep = isControlled ? controlledStep : internalStep;

	// Calcula propriedades derivadas
	const currentStepIndex = steps.indexOf(currentStep);
	const totalSteps = steps.length;
	const isFirstStep = currentStepIndex === 0;
	const isLastStep = currentStepIndex === totalSteps - 1;
	const canGoBack = currentStepIndex > 0;
	const canGoNext = currentStepIndex < totalSteps - 1;

	/**
	 * Define o step atual.
	 * Em modo não controlado, atualiza o estado interno e chama `onStepChange`.
	 * Em modo controlado, apenas chama `onStepChange` (o estado é controlado externamente).
	 */
	const setCurrentStep = <TFieldValues extends FieldValues = FieldValues>(
		step: Steps[number],
		formState?: FormState<TFieldValues>,
		previousStepState?: any,
		currentStepState?: any
	) => {
		if (!isControlled) {
			setInternalStep(step);
		}

		// Em modo não controlado, chama onStepChange diretamente
		// Em modo controlado, o useEffect no use-wizard-form detecta mudanças e chama onStepChange
		if (!isControlled) {
			const stepIndex = steps.indexOf(step);
			// Só passa argumentos opcionais se forem fornecidos
			if (
				formState !== undefined ||
				previousStepState !== undefined ||
				currentStepState !== undefined
			) {
				onStepChange?.({
					step,
					stepIndex,
					formState,
					previousStepState,
					currentStepState,
				});
			} else {
				onStepChange?.({ step, stepIndex });
			}
		}
	};

	/**
	 * Avança para o próximo step.
	 */
	const goToNextStep = <TFieldValues extends FieldValues = FieldValues, TStepState = any>(
		formState?: FormState<TFieldValues>,
		previousStepState?: TStepState,
		currentStepState?: TStepState
	) => {
		if (!canGoNext) return;

		const nextStep = steps[currentStepIndex + 1];
		if (nextStep !== undefined) {
			setCurrentStep(nextStep, formState, previousStepState, currentStepState);
		}
	};

	/**
	 * Volta para o step anterior.
	 */
	const goToPreviousStep = <TFieldValues extends FieldValues = FieldValues, TStepState = any>(
		formState?: FormState<TFieldValues>,
		previousStepState?: TStepState,
		currentStepState?: TStepState
	) => {
		if (!canGoBack) return;

		const previousStep = steps[currentStepIndex - 1];
		if (previousStep !== undefined) {
			setCurrentStep(previousStep, formState, previousStepState, currentStepState);
		}
	};

	/**
	 * Vai para um step específico.
	 */
	const goToStep = <TFieldValues extends FieldValues = FieldValues, TStepState = any>(
		step: Steps[number],
		formState?: FormState<TFieldValues>,
		previousStepState?: TStepState,
		currentStepState?: TStepState
	) => {
		if (steps.includes(step)) {
			setCurrentStep(step, formState, previousStepState, currentStepState);
		}
	};

	/**
	 * Vai para um step pelo índice.
	 */
	const goToStepByIndex = <TFieldValues extends FieldValues = FieldValues, TStepState = any>(
		stepIndex: number,
		formState?: FormState<TFieldValues>,
		previousStepState?: TStepState,
		currentStepState?: TStepState
	) => {
		if (stepIndex >= 0 && stepIndex < steps.length) {
			const step = steps[stepIndex];
			if (step !== undefined) {
				setCurrentStep(step, formState, previousStepState, currentStepState);
			}
		}
	};

	/**
	 * Reinicia o fluxo voltando para o step inicial.
	 */
	const restartFlow = () => {
		setCurrentStep(initialStep);
	};

	return {
		steps,
		initialStep,
		currentStep,
		currentStepIndex,
		totalSteps,
		isFirstStep,
		isLastStep,
		canGoBack,
		canGoNext,
		goToNextStep,
		goToPreviousStep,
		goToStep,
		goToStepByIndex,
		restartFlow,
		isControlled,
	};
};
