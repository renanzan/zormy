"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { useStepMachine } from "../../step/hooks/use-step-machine";
import {
	extractStepData,
	getFieldsForStep,
	getStepSummary,
	getStepValues,
	getValidChangedFieldsForStep,
	hasStepError,
	isStepDirty,
	isStepTouched,
	isStepValid,
} from "../../step/utils/step";
import {
	clearErrorsForOtherSteps,
	handleExternalStepChange,
	handleInternalStepChange,
} from "../../step/utils/step-effects";
import { handleStepNavigation } from "../utils/navigation";
import { createDynamicStepResolver } from "../utils/resolver-helpers";

import type { FieldValues, Path } from "react-hook-form";
import type { UseStepMachineArgs } from "../../step/hooks/use-step-machine";
import type { StepStateWithMetadata, WizardStateItem } from "../../step/types/step";
import type { TriggerOptions, UseWizardFormArgs, UseWizardFormReturn } from "../types/hooks";

/**
 * Hook para gerenciar um formulário multi-step (wizard).
 *
 * Combina react-hook-form com navegação entre steps, fornecendo validação
 * por step, estado de cada step e métodos de navegação.
 *
 * Este hook é a camada base do sistema de wizards do zormy. Ele gerencia:
 * - Navegação entre steps (controlada ou não controlada)
 * - Validação por step usando schemas Zod dinâmicos
 * - Estado de cada step (dirty, touched, errors, valid)
 * - Limpeza automática de erros de steps não ativos
 * - Rastreamento de steps visitados
 *
 * @internal Para uso interno do zormy.
 * @template TFieldValues - Tipo dos valores do formulário
 * @template Steps - Array de strings literais representando os steps do wizard
 *
 * @param args - Argumentos do hook
 * @returns Objeto com estado e métodos do wizard e formulário
 *
 * @example
 * ```tsx
 * const steps = ["step1", "step2", "step3"] as const;
 * const wizard = useWizardForm({
 *   steps,
 *   schema: ({ step }) => {
 *     if (step === "step1") return z.object({ name: z.string() });
 *     if (step === "step2") return z.object({ email: z.string().email() });
 *     return z.object({ age: z.number() });
 *   },
 *   defaultValues: { name: "", email: "", age: 0 },
 *   onSubmit: (data) => console.log("Formulário completo:", data)
 * });
 * ```
 */
export const useWizardForm = <TFieldValues extends FieldValues, Steps extends readonly string[]>(
	args: UseWizardFormArgs<Steps, TFieldValues>
): UseWizardFormReturn<TFieldValues, Steps> => {
	const stepMachine = useStepMachine({
		...args,
		// Em modo não controlado, não passa onStepChange para o stepMachine
		// porque vamos chamar manualmente em createNavMethod
		// Em modo controlado, passa onStepChange para o stepMachine usar
		onStepChange:
			args.controlledStep !== undefined
				? (args.onStepChange as UseStepMachineArgs<Steps>["onStepChange"] | undefined)
				: undefined,
	});

	// Cria um resolver dinâmico que sempre busca o schema mais recente
	const createDynamicResolver = useCallback(() => {
		return createDynamicStepResolver(args.schema, stepMachine.currentStep);
	}, [args.schema, stepMachine.currentStep]);

	// Cria o form com resolver dinâmico
	const wizardForm = useForm<TFieldValues>({
		resolver: createDynamicResolver(),
		defaultValues: args.defaultValues,
		mode: args.mode ?? "onChange",
	});

	// Rastreamento de steps visitados
	const [visitedSteps, setVisitedSteps] = useState<Set<Steps[number]>>(() => new Set());
	const previousVisitedStepsRef = useRef<Set<Steps[number]>>(new Set());
	const allFieldKeysRef = useRef<Set<Path<TFieldValues>> | null>(null);

	// Estado para forçar atualização do wizardState quando defaultValues são carregados assincronamente
	const [valuesUpdateKey, setValuesUpdateKey] = useState(0);

	// Memoiza getFieldsForStep para evitar recálculos desnecessários
	const getFieldsForStepMemoized = useCallback(
		(step: Steps[number]): Array<Path<TFieldValues>> => {
			return getFieldsForStep(step, args.schema, () => wizardForm.getValues());
		},
		[args.schema, wizardForm]
	);

	const formState = wizardForm.formState;

	/**
	 * Extrai apenas campos válidos alterados (dirty sem erros) de um step específico.
	 *
	 * @param step - Step do qual extrair os campos
	 * @returns Objeto com apenas os campos válidos alterados
	 */
	const getValidChangedFieldsForStepFn = useCallback(
		(step: Steps[number]) => {
			const fields = getFieldsForStepMemoized(step);
			return getValidChangedFieldsForStep(
				fields,
				formState.dirtyFields,
				formState.errors,
				wizardForm.getValues()
			);
		},
		[formState.dirtyFields, formState.errors, wizardForm, getFieldsForStepMemoized]
	);

	/**
	 * Extrai o StepState completo de um step específico (recorte do FormState).
	 *
	 * @param step - Step do qual extrair o estado
	 * @returns Estado completo do step
	 */
	const getStepState = useCallback(
		(step: Steps[number]): StepStateWithMetadata<TFieldValues, Steps> => {
			const fields = getFieldsForStepMemoized(step);
			const stepIndex = args.steps.indexOf(step);
			const allValues = wizardForm.getValues();

			// Extrai dados do step usando helper
			const stepData = extractStepData(
				fields,
				formState.errors,
				formState.dirtyFields,
				formState.touchedFields,
				allValues,
				(path) => wizardForm.getValues(path)
			);

			// Verifica validação
			const currentValues = wizardForm.getValues();
			const schema = args.schema({ step, formValues: currentValues });
			const stepValuesForValidation = getStepValues(fields, (path) => wizardForm.getValues(path));
			const isValid = schema.safeParse(stepValuesForValidation).success;

			// Verifica estados
			const dirty = isStepDirty(fields, formState.dirtyFields);
			const touched = isStepTouched(fields, formState.touchedFields);
			const validChangedData = getValidChangedFieldsForStepFn(step);
			const hasValidChangedData = Object.keys(validChangedData).length > 0;

			return {
				step,
				stepIndex,
				...stepData,
				isValid,
				isDirty: dirty,
				isTouched: touched,
				validChangedData,
				hasValidChangedData,
			};
		},
		[
			getFieldsForStepMemoized,
			formState.errors,
			formState.dirtyFields,
			formState.touchedFields,
			wizardForm,
			args.schema,
			args.steps,
			getValidChangedFieldsForStepFn,
		]
	);

	/**
	 * Obtém os valores de um step específico.
	 *
	 * @param step - Step do qual obter os valores
	 * @returns Valores parciais do step
	 */
	const getStepValuesFn = useCallback(
		(step: Steps[number]): Partial<TFieldValues> => {
			const fields = getFieldsForStepMemoized(step);
			return getStepValues(fields, (path) => wizardForm.getValues(path));
		},
		[getFieldsForStepMemoized, wizardForm]
	);

	/**
	 * Verifica se um step tem campos modificados.
	 *
	 * @param step - Step a verificar
	 * @returns true se o step tiver campos modificados
	 */
	const isStepDirtyFn = useCallback(
		(step: Steps[number]) => {
			const fields = getFieldsForStepMemoized(step);
			return isStepDirty(fields, formState.dirtyFields);
		},
		[getFieldsForStepMemoized, formState.dirtyFields]
	);

	/**
	 * Verifica se um step é válido.
	 *
	 * @param step - Step a verificar
	 * @returns true se o step for válido
	 */
	const isStepValidFn = useCallback(
		(step: Steps[number]) => {
			const fields = getFieldsForStepMemoized(step);
			const currentValues = wizardForm.getValues();
			const schema = args.schema({ step, formValues: currentValues });
			return isStepValid(fields, schema, (path) => wizardForm.getValues(path));
		},
		[getFieldsForStepMemoized, wizardForm, args.schema]
	);

	/**
	 * Verifica se um step tem erros.
	 *
	 * @param step - Step a verificar
	 * @returns true se o step tiver erros
	 */
	const hasStepErrorFn = useCallback(
		(step: Steps[number]) => {
			const fields = getFieldsForStepMemoized(step);
			return hasStepError(step, stepMachine.currentStep, fields, formState.errors, isStepValidFn);
		},
		[getFieldsForStepMemoized, stepMachine.currentStep, formState.errors, isStepValidFn]
	);

	/**
	 * Obtém o resumo do status de um step.
	 *
	 * @param step - Step do qual obter o resumo
	 * @returns Resumo do status do step
	 */
	const getStepSummaryFn = useCallback(
		(step: Steps[number]) => {
			return getStepSummary(
				step,
				stepMachine.currentStep,
				visitedSteps,
				hasStepErrorFn,
				isStepValidFn
			);
		},
		[stepMachine.currentStep, visitedSteps, hasStepErrorFn, isStepValidFn]
	);

	/**
	 * Captura o StepState do step anterior antes de mudar de step.
	 *
	 * @returns Estado do step anterior ou undefined
	 */
	const capturePreviousStepState = useCallback(():
		| StepStateWithMetadata<TFieldValues, Steps>
		| undefined => {
		const previousStep = stepMachine.currentStep;
		return getStepState(previousStep);
	}, [stepMachine.currentStep, getStepState]);

	/**
	 * Reseta os dirtyFields do step anterior após capturar o estado.
	 * Usa setValue para marcar os campos como não-dirty mantendo os valores.
	 *
	 * @param step - Step do qual resetar os dirtyFields
	 */
	const resetPreviousStepDirtyFields = useCallback(
		(step: Steps[number]) => {
			const fields = getFieldsForStepMemoized(step);

			// Reseta dirtyFields apenas dos campos do step anterior
			// Usa setValue com shouldDirty: false para manter os valores mas limpar o dirty
			for (const field of fields) {
				const fieldPath = field as Path<TFieldValues>;
				const currentValue = wizardForm.getValues(fieldPath);

				// Se o campo tem valor, atualiza sem marcar como dirty
				if (currentValue !== undefined) {
					wizardForm.setValue(fieldPath, currentValue, {
						shouldDirty: false,
						shouldTouch: false,
						shouldValidate: false,
					});
				}
			}
		},
		[getFieldsForStepMemoized, wizardForm]
	);

	/**
	 * Marca campos como salvos, resetando estados de manipulação (dirty, touched)
	 * e atualizando defaultValues, mantendo os erros.
	 * Após salvar dados na API, use este método para evitar enviar os mesmos dados novamente.
	 *
	 * @param fields - Array de paths dos campos que foram salvos
	 */
	const markFieldsAsSaved = useCallback(
		(fields: Array<Path<TFieldValues>>) => {
			// Para cada campo salvo, reseta os estados de manipulação e atualiza o defaultValue
			// Usa resetField que permite resetar dirty/touched e atualizar defaultValue individualmente
			// mantendo os erros com keepError: true
			for (const fieldPath of fields) {
				const currentValue = wizardForm.getValues(fieldPath);

				// Se o campo tem valor, reseta o campo mantendo o valor atual e os erros
				// Isso atualiza o defaultValue e reseta dirty/touched
				if (currentValue !== undefined) {
					wizardForm.resetField(fieldPath, {
						defaultValue: currentValue,
						keepError: true,
						keepDirty: false,
						keepTouched: false,
					});
				}
			}
		},
		[wizardForm]
	);

	/** Configuração compartilhada para toda navegação (back, next, goToStep, etc). */
	const getNavigationConfig = useCallback(
		(targetStep: Steps[number], targetStepIndex: number) => ({
			targetStep,
			targetStepIndex,
			previousStepState: capturePreviousStepState(),
			getCurrentStepState: getStepState,
			resetDirtyFields: resetPreviousStepDirtyFields,
			formState,
			onStepChange: args.onStepChange,
			setPendingStep: stepMachine.isControlled
				? (s: Steps[number] | null) => {
						pendingInternalStepRef.current = s;
					}
				: undefined,
		}),
		[
			capturePreviousStepState,
			getStepState,
			resetPreviousStepDirtyFields,
			formState,
			args.onStepChange,
			stepMachine.isControlled,
		]
	);

	const back = useCallback(() => {
		const prevStepIndex = stepMachine.currentStepIndex - 1;
		const prevStep = args.steps[prevStepIndex];
		if (!prevStep) return;

		if (stepMachine.isControlled) isInternalNavigationRef.current = true;
		handleStepNavigation({
			...getNavigationConfig(prevStep, prevStepIndex),
			executeStepChange: () => stepMachine.goToPreviousStep(),
		});
	}, [stepMachine, args.steps, getNavigationConfig]);

	/**
	 * Avança para o próximo step.
	 * Valida os campos do step atual antes de avançar.
	 *
	 * @param options - Opções para o trigger de validação
	 */
	const next = useCallback(
		async (options?: TriggerOptions): Promise<void> => {
			// Obtém apenas os campos do step atual
			const currentFields = getFieldsForStepMemoized(stepMachine.currentStep);

			// Limpa TODOS os erros antes de validar
			// Isso garante que apenas os campos do step atual sejam validados
			wizardForm.clearErrors();

			// Valida apenas os campos do step atual, mas o resolver recebe todos os valores
			// (os valores são obtidos automaticamente pelo resolver)
			// Isso permite validação cross-step baseada em valores de steps anteriores
			const isValid = await wizardForm.trigger(currentFields, {
				shouldFocus: options?.shouldFocus ?? true,
			});

			if (!isValid) {
				return;
			}

			const stepValues = getStepValuesFn(stepMachine.currentStep);
			args.onStepSubmit?.(stepValues, stepMachine.currentStep);

			if (stepMachine.isLastStep) {
				args.onSubmit?.(wizardForm.getValues());
				return;
			}

			const nextStepIndex = stepMachine.currentStepIndex + 1;
			const nextStep = args.steps[nextStepIndex];
			if (!nextStep) {
				return;
			}

			if (stepMachine.isControlled) {
				isInternalNavigationRef.current = true;
			}

			handleStepNavigation({
				...getNavigationConfig(nextStep, nextStepIndex),
				executeStepChange: () => stepMachine.goToNextStep(),
			});
		},
		[
			getFieldsForStepMemoized,
			wizardForm,
			getStepValuesFn,
			args.onStepSubmit,
			args.onSubmit,
			args.steps,
			stepMachine,
			getNavigationConfig,
		]
	);

	/**
	 * Reinicia o wizard.
	 */
	const resetWizard = useCallback(
		(...params: Parameters<typeof wizardForm.reset>) => {
			wizardForm.reset(...params);
			setVisitedSteps(new Set());
			stepMachine.restartFlow();
			// Força atualização do wizardState após reset
			// Isso garante que steps válidos sejam recalculados corretamente
			setValuesUpdateKey((prev) => prev + 1);
		},
		[wizardForm, stepMachine]
	);

	// Método para forçar atualização do wizardState após carregar defaultValues assíncronos
	const forceUpdateWizardState = useCallback(() => {
		setValuesUpdateKey((prev) => prev + 1);
	}, []);

	// Calcula o estado de todos os steps do wizard
	// valuesUpdateKey força recálculo quando defaultValues são carregados assincronamente
	const wizardState = useMemo((): WizardStateItem<Steps>[] => {
		return args.steps.map((step) => ({
			step,
			isVisited: visitedSteps.has(step),
			isDirty: isStepDirtyFn(step),
			isValid: isStepValidFn(step),
			hasError: hasStepErrorFn(step),
			summary: getStepSummaryFn(step),
		}));
	}, [
		args.steps,
		formState.errors,
		formState.dirtyFields,
		valuesUpdateKey,
		stepMachine.currentStep,
		visitedSteps,
		isStepDirtyFn,
		isStepValidFn,
		hasStepErrorFn,
		getStepSummaryFn,
	]);

	// Refs para gerenciar navegação controlada
	// Detecta mudanças no controlledStep e chama onStepChange
	// Isso é necessário quando o wizard está em modo controlado (ex: via URL)
	// e a mudança vem de fora (não de métodos internos como goToStepByIndex)
	const previousControlledStepRef = useRef<Steps[number] | undefined>(
		args.controlledStep ?? stepMachine.currentStep
	);
	const isInternalNavigationRef = useRef(false);
	const pendingInternalStepRef = useRef<Steps[number] | null>(null);

	useEffect(() => {
		const previousStep = previousControlledStepRef.current;
		const currentStep = args.controlledStep;
		const isInternalNavigation = isInternalNavigationRef.current;
		const pendingStep = pendingInternalStepRef.current;

		// Se não há mudança de step, não faz nada
		if (previousStep === currentStep || currentStep === undefined) {
			return;
		}

		// Se é navegação interna, processa e retorna
		if (
			isInternalNavigation &&
			handleInternalStepChange({
				currentStep,
				pendingStep,
				updatePreviousStepRef: (step) => {
					previousControlledStepRef.current = step;
				},
				clearPendingStep: () => {
					pendingInternalStepRef.current = null;
				},
				resetInternalNavigationFlag: () => {
					isInternalNavigationRef.current = false;
				},
			})
		) {
			return;
		}

		// Se não é navegação interna, é mudança externa
		if (!isInternalNavigation) {
			const stepIndex = args.steps.indexOf(currentStep);
			handleExternalStepChange({
				currentStep,
				stepIndex,
				previousStep,
				capturePreviousStepState,
				resetDirtyFields: resetPreviousStepDirtyFields,
				getStepState,
				formState,
				onStepChange: args.onStepChange,
				updatePreviousStepRef: (step) => {
					previousControlledStepRef.current = step;
				},
			});
		}
	}, [args.controlledStep]);

	// Limpa erros de campos que não pertencem ao step atual quando o step muda
	useEffect(() => {
		const currentStep = stepMachine.currentStep;
		const currentFields = getFieldsForStepMemoized(currentStep);
		const currentFieldKeys = new Set(currentFields);

		// Verifica se o step já estava visitado ANTES de ser marcado como visitado agora
		const wasStepVisitedBefore = previousVisitedStepsRef.current.has(currentStep);

		// Obtém todos os campos de todos os steps apenas uma vez
		// Usa memoização para evitar recalcular a cada render
		if (!allFieldKeysRef.current) {
			allFieldKeysRef.current = new Set<Path<TFieldValues>>();
			args.steps.forEach((step) => {
				const stepFields = getFieldsForStepMemoized(step);
				stepFields.forEach((field) => allFieldKeysRef.current!.add(field));
			});
		}

		// Limpa erros de campos que não estão no step atual
		clearErrorsForOtherSteps(currentFieldKeys, allFieldKeysRef.current, (field) =>
			wizardForm.clearErrors(field)
		);

		// Só chama trigger se o step já estava visitado antes (não é a primeira vez)
		if (wasStepVisitedBefore) {
			wizardForm.trigger(currentFields, { shouldFocus: false });
		} else {
			wizardForm.clearErrors();
		}

		// Atualiza o ref com o estado atual ANTES de marcar o step como visitado
		// Usa função de atualização para ler o estado atual sem adicionar dependência
		setVisitedSteps((prev) => {
			// Atualiza o ref com o estado atual antes de adicionar o novo step
			previousVisitedStepsRef.current = new Set(prev);

			if (prev.has(currentStep)) {
				return prev;
			}
			const next = new Set(prev);
			next.add(currentStep);
			return next;
		});
	}, [stepMachine.currentStep]);

	/** Cria método de navegação (goToNextStep, goToPreviousStep, goToStep, goToStepByIndex). */
	const createNavMethod = useCallback(
		(
			getTargetStep: () => Steps[number] | undefined,
			getTargetStepIndex: () => number,
			executeStepChange: () => void
		) => {
			return () => {
				const targetStep = getTargetStep();
				if (!targetStep) return;
				if (stepMachine.isControlled) isInternalNavigationRef.current = true;
				handleStepNavigation({
					...getNavigationConfig(targetStep, getTargetStepIndex()),
					executeStepChange,
				});
			};
		},
		[stepMachine.isControlled, getNavigationConfig]
	);

	return {
		...stepMachine,
		...wizardForm,
		wizardState,
		getFieldsForStep: getFieldsForStepMemoized,
		getStepValues: getStepValuesFn,
		markFieldsAsSaved,
		isStepDirty: isStepDirtyFn,
		hasStepError: hasStepErrorFn,
		isStepValid: isStepValidFn,
		getStepSummary: getStepSummaryFn,
		back,
		next,
		resetWizard,
		forceUpdateWizardState,
		// Sobrescreve métodos de navegação usando helper
		goToNextStep: createNavMethod(
			() => args.steps[stepMachine.currentStepIndex + 1],
			() => stepMachine.currentStepIndex + 1,
			() => stepMachine.goToNextStep()
		),
		goToPreviousStep: createNavMethod(
			() => args.steps[stepMachine.currentStepIndex - 1],
			() => stepMachine.currentStepIndex - 1,
			() => stepMachine.goToPreviousStep()
		),
		goToStep: (step: Steps[number]) => {
			if (!args.steps.includes(step)) return;
			createNavMethod(
				() => step,
				() => args.steps.indexOf(step),
				() => stepMachine.goToStep(step)
			)();
		},
		goToStepByIndex: (stepIndex: number) => {
			createNavMethod(
				() => args.steps[stepIndex],
				() => stepIndex,
				() => stepMachine.goToStepByIndex(stepIndex)
			)();
		},
	};
};
