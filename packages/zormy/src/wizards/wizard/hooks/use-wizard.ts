"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { flattenToNested } from "../../../resolver/helpers/nested-objects";
import { shapeToZodSchema } from "../../../resolver/helpers/shape-to-zod-schema";
import {
	collectAllFieldKeys,
	normalizeDefaultValues,
	processAsyncDefaultValues,
	processDefaultValues,
} from "../builder/helpers";
import { useAutoSave } from "./use-auto-save";
import { useWizardForm } from "./use-wizard-form";

import type { ZodType } from "zod";
import type { DefaultValues, FieldValues, FormState } from "react-hook-form";
import type { FieldComponentBase } from "../../../fields/field/types/field";
import type { StepStateWithMetadata } from "../../step/types/step";
import type { WizardFormData, WizardFormValues } from "../types/extractors";
import type { TriggerOptions, UseWizardFormReturn } from "../types/hooks";
import type { StepFieldsMap, WizardConfig } from "../types/wizard";

/**
 * Cria um handler para onStepChange que normaliza os estados.
 * Extrai a lógica de normalização para reduzir complexidade.
 */
function createOnStepChangeHandler<FormData extends FieldValues, Steps extends readonly string[]>(
	normalizeStepState: (
		stepState: StepStateWithMetadata<FormData, Steps> | undefined
	) => StepStateWithMetadata<FormData, Steps> | undefined,
	onStepChange: (args: {
		step: Steps[number];
		stepIndex: number;
		formState?: FormState<FormData>;
		previousStepState?: StepStateWithMetadata<FormData, Steps>;
		currentStepState?: StepStateWithMetadata<FormData, Steps>;
	}) => void
) {
	return (
		step: Steps[number],
		stepIndex: number,
		formState?: FormState<FormData>,
		previousStepState?: StepStateWithMetadata<FormData, Steps>,
		currentStepState?: StepStateWithMetadata<FormData, Steps>
	) => {
		onStepChange({
			step,
			stepIndex,
			formState: formState ? (formState as FormState<FormData>) : undefined,
			previousStepState: previousStepState ? normalizeStepState(previousStepState) : undefined,
			currentStepState: currentStepState ? normalizeStepState(currentStepState) : undefined,
		});
	};
}

/**
 * Argumentos para o hook `useWizard`.
 */
export type UseWizardArgs<
	Steps extends readonly string[],
	TStepFieldsMap extends StepFieldsMap<Steps>,
> = WizardConfig<Steps, TStepFieldsMap> & {
	/** Valores padrão: objeto, função síncrona ou assíncrona. Aceita valores aninhados. */
	defaultValues?:
		| WizardFormData<TStepFieldsMap>
		| (() => WizardFormData<TStepFieldsMap>)
		| (() => Promise<WizardFormData<TStepFieldsMap>>);
	/** Callback quando o wizard é finalizado (último step) — recebe todos os dados preenchidos */
	onSubmit?: (data: WizardFormValues<TStepFieldsMap>) => void;
	/**
	 * Callback ao avançar de step (ao clicar em "Próximo" ou ao finalizar).
	 * @param data - Dados validados do step atual
	 * @param step - Nome do step que foi concluído
	 * @param allDataSoFar - Todos os dados preenchidos até o momento (steps anteriores + atual)
	 */
	onStepSubmit?: <Step extends Steps[number]>(
		data: WizardFormData<TStepFieldsMap>,
		step: Step,
		allDataSoFar: WizardFormData<TStepFieldsMap>
	) => void;
	/** Step inicial (padrão: primeiro step) */
	initialStep?: Steps[number];
	/** Modo de validação do react-hook-form */
	mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
	/** Step controlado externamente (ex: URL query params) */
	controlledStep?: Steps[number];
	/** Callback quando o step muda (útil para sincronizar com URL) */
	onStepChange?: (args: {
		step: Steps[number];
		stepIndex: number;
		formState?: FormState<WizardFormData<TStepFieldsMap>>;
		previousStepState?: StepStateWithMetadata<WizardFormData<TStepFieldsMap>, Steps>;
		currentStepState?: StepStateWithMetadata<WizardFormData<TStepFieldsMap>, Steps>;
	}) => void;
	/** Auto save: salva automaticamente ao mudar de step com dados válidos */
	autoSave?: (args: {
		step: Steps[number];
		validChangedData: WizardFormData<TStepFieldsMap>;
		wizard: UseWizardFormReturn<WizardFormData<TStepFieldsMap>, Steps>;
	}) => Promise<void>;
};

/**
 * Hook para criar e gerenciar wizard de formulário multi-step.
 *
 * Gera schemas Zod automaticamente, suporta campos aninhados e validação cross-step.
 *
 * @example
 * ```tsx
 * const wizard = useWizard({
 *   steps: ["basicInfo", "address"] as const,
 *   fields: {
 *     basicInfo: [NameField, EmailField],
 *     address: [StreetField, CityField]
 *   },
 *   defaultValues: { name: "", email: "" },
 *   onSubmit: (data) => console.log(data)
 * });
 * ```
 */
export const useWizard = <
	Steps extends readonly string[],
	TStepFieldsMap extends StepFieldsMap<Steps>,
>(
	args: UseWizardArgs<Steps, TStepFieldsMap>
) => {
	type FormData = WizardFormData<TStepFieldsMap>;
	type FormValues = WizardFormValues<TStepFieldsMap>;

	const getFieldComponentsForStep = useCallback(
		(step: Steps[number]) => {
			const stepKey = step as keyof TStepFieldsMap;
			return args.fields[stepKey];
		},
		[args.fields]
	);

	const createStepSchema = useCallback(
		(context: { step: Steps[number]; formValues?: FormData }) => {
			const currentFields = getFieldComponentsForStep(context.step);
			const shape = currentFields.reduce<Record<string, ZodType>>(
				(acc, field: FieldComponentBase) => {
					acc[field.config.key] = field.getZodSchema(context.formValues);
					return acc;
				},
				{}
			);

			return shapeToZodSchema(shape);
		},
		[getFieldComponentsForStep]
	);

	const defaultValuesStateRef = useRef({
		cache: null as DefaultValues<Partial<FormData>> | null,
		processedSync: false,
		startedAsync: false,
		fn: args.defaultValues as typeof args.defaultValues,
		previousFn: args.defaultValues as typeof args.defaultValues,
	});

	useEffect(() => {
		const state = defaultValuesStateRef.current;
		if (typeof args.defaultValues === "function" && state.previousFn !== args.defaultValues) {
			state.processedSync = false;
			state.startedAsync = false;
			state.cache = null;
		}
		state.previousFn = args.defaultValues;
		state.fn = args.defaultValues;
	}, [args.defaultValues]);

	const isDefaultValuesFunction = typeof args.defaultValues === "function";
	const allFieldKeys = useMemo(
		() => collectAllFieldKeys(args.steps, args.fields),
		[args.steps, args.fields]
	);

	const normalizeDefaultValuesCallback = useCallback(
		(defaultValuesObj: Record<string, unknown>) => {
			return normalizeDefaultValues<Partial<FormData>>(
				defaultValuesObj,
				allFieldKeys
			) as DefaultValues<Partial<FormData>>;
		},
		[allFieldKeys]
	);

	const normalizeStepState = useCallback(
		(
			stepState: StepStateWithMetadata<FormData, Steps> | undefined
		): StepStateWithMetadata<FormData, Steps> | undefined => {
			if (!stepState) {
				return undefined;
			}

			return {
				...stepState,
				values: stepState.values
					? (normalizeDefaultValues(stepState.values, allFieldKeys) as Partial<FormData>)
					: ({} as Partial<FormData>),
				validChangedData: stepState.validChangedData,
				hasValidChangedData: stepState.hasValidChangedData,
			};
		},
		[allFieldKeys]
	);

	const normalizedDefaultValues = useMemo(() => {
		if (!isDefaultValuesFunction) {
			const state = defaultValuesStateRef.current;
			const cacheRef = {
				get current() {
					return state.cache;
				},
				set current(v: DefaultValues<Partial<FormData>> | null) {
					state.cache = v;
				},
			};
			const processedRef = {
				get current() {
					return state.processedSync;
				},
				set current(v: boolean) {
					state.processedSync = v;
				},
			};
			return processDefaultValues<FormData>(
				args.defaultValues,
				false,
				normalizeDefaultValuesCallback,
				cacheRef,
				processedRef
			);
		}
		return undefined;
	}, [
		...(isDefaultValuesFunction ? [] : [args.defaultValues]),
		normalizeDefaultValuesCallback,
		isDefaultValuesFunction,
	]);

	const autoSaveRef = useRef<ReturnType<typeof useAutoSave> | null>(null);
	const wizardRef = useRef<UseWizardFormReturn<FormData, Steps> | null>(null);

	/**
	 * Executa auto-save se necessário.
	 * Extrai a lógica de auto-save para reduzir complexidade.
	 */
	const executeAutoSave = useCallback(
		(previousStepState: StepStateWithMetadata<FormData, Steps> | undefined) => {
			if (!args.autoSave || !previousStepState?.hasValidChangedData || !previousStepState.validChangedData) {
				return;
			}

			if (!autoSaveRef.current || !wizardRef.current) {
				return;
			}

			const previousStep = previousStepState.step;
			const validChangedData = previousStepState.validChangedData as FormData;

			autoSaveRef.current
				.executeSave(async () => {
					await args.autoSave!({
						step: previousStep,
						validChangedData,
						wizard: wizardRef.current! as UseWizardFormReturn<FormData, Steps>,
					});
				})
				.catch(() => {});
		},
		[args.autoSave]
	);

	const onStepChangeWithAutoSave = useCallback(
		(
			step: Steps[number],
			stepIndex: number,
			formState?: FormState<FormData>,
			previousStepState?: StepStateWithMetadata<FormData, Steps>,
			currentStepState?: StepStateWithMetadata<FormData, Steps>
		) => {
			args.onStepChange?.({
				step,
				stepIndex,
				formState: formState ? (formState as FormState<FormData>) : undefined,
				previousStepState: previousStepState ? normalizeStepState(previousStepState) : undefined,
				currentStepState: currentStepState ? normalizeStepState(currentStepState) : undefined,
			});

			executeAutoSave(previousStepState);
		},
		[normalizeStepState, args.onStepChange, executeAutoSave]
	);

	const wizard = useWizardForm<FormData, Steps>({
		steps: args.steps,
		initialStep: args.initialStep,
		controlledStep: args.controlledStep,
		schema: createStepSchema,
		defaultValues: normalizedDefaultValues,
		mode: args.mode,
		onSubmit: args.onSubmit
			? (data) => {
					// data é FormData (Partial), convertemos para FormValues
					// usando flattenToNested para garantir estrutura aninhada correta
					const nested = flattenToNested(data) as FormValues;
					args.onSubmit?.(nested);
				}
			: undefined,
		onStepSubmit: args.onStepSubmit
			? (data, step, allDataSoFar) => {
					args.onStepSubmit?.(data as FormData, step, allDataSoFar as FormData);
				}
			: undefined,
		onStepChange: args.autoSave
			? onStepChangeWithAutoSave
			: args.onStepChange
				? createOnStepChangeHandler(normalizeStepState, args.onStepChange)
				: undefined,
	});

	// IMPORTANT:
	// `watch()` inscreve o componente para rerenderizar em toda mudança do formulário.
	// Aqui nós só precisamos disso quando `shouldIncludeStep` depende de valores do form
	// para filtrar steps dinamicamente. Se não houver steps dinâmicos, evitamos a inscrição.
	const flatFormValues = args.shouldIncludeStep ? wizard.watch() : undefined;
	const nestedFormValues = useMemo(() => {
		if (!args.shouldIncludeStep || !flatFormValues) {
			return undefined;
		}
		return flattenToNested(flatFormValues) as FormValues;
	}, [args.shouldIncludeStep, flatFormValues]);

	const filteredSteps = useMemo(() => {
		if (!args.shouldIncludeStep) {
			return args.steps;
		}

		const filtered = args.steps.filter((step) => {
			try {
				return args.shouldIncludeStep!(step, nestedFormValues as FormValues);
			} catch (error) {
				console.warn(`[useWizard] Erro ao verificar shouldIncludeStep para "${step}":`, error);
				return true;
			}
		}) as readonly Steps[number][];

		return filtered as Steps;
	}, [args.steps, args.shouldIncludeStep, nestedFormValues]);

	const findNextValidStep = useCallback(
		(currentStep: Steps[number]): Steps[number] | null => {
			const currentIndex = filteredSteps.indexOf(currentStep);
			if (currentIndex >= 0 && currentIndex < filteredSteps.length - 1) {
				const nextStep = filteredSteps[currentIndex + 1];
				return nextStep ?? null;
			}
			return null;
		},
		[filteredSteps]
	);

	const findPreviousValidStep = useCallback(
		(currentStep: Steps[number]): Steps[number] | null => {
			const currentIndex = filteredSteps.indexOf(currentStep);
			if (currentIndex > 0) {
				const previousStep = filteredSteps[currentIndex - 1];
				return previousStep ?? null;
			}
			return null;
		},
		[filteredSteps]
	);

	/**
	 * Valida campos do step atual.
	 * Extrai lógica de validação para reduzir complexidade.
	 */
	const validateCurrentStep = useCallback(
		async (options?: TriggerOptions): Promise<boolean> => {
			const currentFields = wizard.getFieldsForStep(wizard.currentStep);
			wizard.clearErrors();
			return await wizard.trigger(currentFields, {
				shouldFocus: options?.shouldFocus ?? true,
			});
		},
		[wizard]
	);

	/**
	 * Verifica se o step atual é o último step filtrado.
	 */
	const isLastFilteredStep = useCallback(() => {
		return filteredSteps.indexOf(wizard.currentStep) === filteredSteps.length - 1;
	}, [filteredSteps, wizard.currentStep]);

	const interceptedNextImpl = useCallback(
		async (options?: TriggerOptions) => {
			const isValid = await validateCurrentStep(options);
			if (!isValid) {
				return;
			}

			// No último step, delegar ao next() do useWizardForm para que acumule valores e chame onSubmit com todos os dados
			if (isLastFilteredStep()) {
				await wizard.next(options);
				return;
			}

			const nextStep = findNextValidStep(wizard.currentStep);
			if (nextStep) {
				wizard.goToStep(nextStep);
			}
		},
		[validateCurrentStep, isLastFilteredStep, findNextValidStep, wizard]
	);

	const interceptedNext = ((options?: TriggerOptions): Promise<void> => {
		return interceptedNextImpl(options);
	}) as {
		(options?: TriggerOptions): Promise<void>;
		(): Promise<void>;
	};

	const interceptedBack = useCallback(() => {
		const previousStep = findPreviousValidStep(wizard.currentStep);
		if (previousStep) {
			wizard.goToStep(previousStep);
		}
	}, [wizard, findPreviousValidStep]);

	useEffect(() => {
		wizardRef.current = wizard;
	}, [wizard]);

	const autoSave = args.autoSave ? useAutoSave(wizard) : undefined;

	useEffect(() => {
		if (autoSave) {
			autoSaveRef.current = autoSave;
		}
	}, [autoSave]);

	useEffect(() => {
		if (!args.shouldIncludeStep) {
			return;
		}

		const isCurrentStepIncluded = filteredSteps.includes(wizard.currentStep);
		if (!isCurrentStepIncluded) {
			const firstStep = filteredSteps[0];
			if (firstStep !== undefined) {
				wizard.goToStep(firstStep);
			}
		}
	}, [filteredSteps, wizard.currentStep, args.shouldIncludeStep, wizard]);

	useEffect(() => {
		if (!isDefaultValuesFunction || !defaultValuesStateRef.current.fn) return;

		const state = defaultValuesStateRef.current;
		const defaultValuesFn = state.fn as (() => FormData) | (() => Promise<FormData>);
		const bindRef = <T>(
			get: () => T,
			set: (v: T) => void
		): { current: T } => ({
			get current() {
				return get();
			},
			set current(v: T) {
				set(v);
			},
		});

		processAsyncDefaultValues<Partial<FormData>>({
			defaultValuesFn,
			normalizeCallback: normalizeDefaultValuesCallback,
			cacheRef: bindRef(() => state.cache, (v) => { state.cache = v; }),
			processedSyncRef: bindRef(() => state.processedSync, (v) => { state.processedSync = v; }),
			startedAsyncRef: bindRef(() => state.startedAsync, (v) => { state.startedAsync = v; }),
			onNormalized: (normalized) => {
				wizardRef.current?.reset(normalized as any);
				wizardRef.current?.forceUpdateWizardState();
			},
		});
	}, [isDefaultValuesFunction, normalizeDefaultValuesCallback]);

	const result = {
		...wizard,
		getFieldComponentsForStep,
		steps: filteredSteps,
		next: args.shouldIncludeStep ? interceptedNext : wizard.next,
		back: args.shouldIncludeStep ? interceptedBack : wizard.back,
		/** Índice do step atual baseado nos steps filtrados pelo shouldIncludeStep */
		get currentStepIndex() {
			return filteredSteps.indexOf(wizard.currentStep);
		},
		get isLastStep() {
			return filteredSteps.indexOf(wizard.currentStep) === filteredSteps.length - 1;
		},
		get isFirstStep() {
			return filteredSteps.indexOf(wizard.currentStep) === 0;
		},
		get totalSteps() {
			return filteredSteps.length;
		},
	} as UseWizardFormReturn<FormData, Steps> & {
		getFieldComponentsForStep: (step: Steps[number]) => TStepFieldsMap[keyof TStepFieldsMap];
		autoSave: typeof autoSave;
	};

	if (autoSave) {
		(
			result as UseWizardFormReturn<FormData, Steps> & {
				autoSave: typeof autoSave;
			}
		).autoSave = autoSave;
	}

	return result;
};
