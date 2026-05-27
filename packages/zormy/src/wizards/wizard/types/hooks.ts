/**
 * Tipos relacionados ao hook `useWizardForm`.
 *
 * Separados em arquivo próprio para reduzir tamanho do arquivo principal
 * e melhorar organização e legibilidade do código.
 */

import type z from "zod";
import type { DefaultValues, FieldValues, FormState, Path } from "react-hook-form";
import type { ZormyFormMethods } from "../../../form/types/form-methods";
import type { UseStepMachineArgs } from "../../step/hooks/use-step-machine";
import type {
	StepStateWithMetadata,
	WizardStateItem,
	WizardStepSummary,
} from "../../step/types/step";

/**
 * Opções para o trigger de validação do método `next()`.
 *
 * @example
 * ```tsx
 * await wizard.next({ shouldFocus: false });
 * ```
 */
export type TriggerOptions = {
	/** Se deve focar no primeiro campo com erro após validação (padrão: true) */
	shouldFocus?: boolean;
};

/**
 * Argumentos para o hook `useWizardForm`.
 *
 * @template Steps - Array de strings literais representando os steps do wizard
 * @template TFieldValues - Tipo dos valores do formulário
 */
export type UseWizardFormArgs<
	Steps extends readonly string[],
	TFieldValues extends FieldValues,
> = Omit<UseStepMachineArgs<Steps>, "onStepChange"> & {
	/**
	 * Callback chamado quando o step muda internamente.
	 * Útil para sincronizar com URL ou estado externo.
	 *
	 * @param step - Step atual
	 * @param stepIndex - Índice do step atual
	 * @param formState - Estado do formulário completo (erros, campos modificados, etc)
	 * @param previousStepState - StepState do step anterior (recorte do formState)
	 * @param currentStepState - StepState do step atual (recorte do formState)
	 */
	onStepChange?: (
		step: Steps[number],
		stepIndex: number,
		formState?: FormState<TFieldValues>,
		previousStepState?: StepStateWithMetadata<TFieldValues, Steps>,
		currentStepState?: StepStateWithMetadata<TFieldValues, Steps>
	) => void;
	/**
	 * Função que cria o schema Zod baseado no step atual e valores do formulário.
	 * Permite validação cross-step usando valores de steps anteriores.
	 *
	 * @param context - Contexto com step atual e valores do formulário
	 * @returns Schema Zod para validação do step
	 */
	schema: (context: { step: Steps[number]; formValues?: TFieldValues }) => z.ZodTypeAny;
	/** Valores padrão do formulário */
	defaultValues?: DefaultValues<TFieldValues>;
	/** Modo de validação do react-hook-form (padrão: "onChange") */
	mode?: "onChange" | "onBlur" | "onSubmit" | "onTouched" | "all";
	/** Callback quando o wizard é finalizado (último step) — recebe todos os dados preenchidos */
	onComplete?: (data: TFieldValues) => void;
	/**
	 * Callback chamado ao avançar de step (ao clicar em "Próximo" ou ao finalizar).
	 * @param data - Dados validados do step atual
	 * @param step - Nome do step que foi concluído
	 * @param allDataSoFar - Todos os dados preenchidos até o momento (steps anteriores + atual)
	 */
	onStepSubmit?: (
		data: Partial<TFieldValues>,
		step: Steps[number],
		allDataSoFar: Partial<TFieldValues>
	) => void;
};

/**
 * Retorno do hook `useWizardForm`.
 *
 * Combina propriedades do `stepMachine`, `react-hook-form` e métodos específicos do wizard.
 * Fornece uma API completa para gerenciar formulários multi-step com validação por step.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template Steps - Array de strings literais representando os steps do wizard
 */
export type UseWizardFormReturn<
	TFieldValues extends FieldValues,
	Steps extends readonly string[],
> = {
	// Propriedades do stepMachine
	/** Array de steps do wizard */
	steps: Steps;
	/** Step inicial */
	initialStep: Steps[number];
	/** Step atual */
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
} & ZormyFormMethods<TFieldValues> & {
		// Propriedades específicas do wizard
		/** Estado de todos os steps do wizard */
		wizardState: WizardStateItem<Steps>[];
		/** Obtém os campos de um step específico */
		getFieldsForStep: (step: Steps[number]) => Array<Path<TFieldValues>>;
		/** Obtém os valores de um step específico */
		getStepValues: (step: Steps[number]) => Partial<TFieldValues>;
		/** Marca campos como salvos, resetando estados de manipulação */
		markFieldsAsSaved: (fields: Array<Path<TFieldValues>>) => void;
		/** Verifica se um step tem campos modificados */
		isStepDirty: (step: Steps[number]) => boolean;
		/** Verifica se um step tem erros */
		hasStepError: (step: Steps[number]) => boolean;
		/** Verifica se um step é válido */
		isStepValid: (step: Steps[number]) => boolean;
		/** Obtém o resumo do status de um step */
		getStepSummary: (step: Steps[number]) => WizardStepSummary;
		/** Volta para o step anterior */
		back: () => void;
		/**
		 * Avança para o próximo step (valida antes)
		 * Aceita TriggerOptions para uso programático
		 *
		 * @remarks
		 * Overload para permitir chamada sem argumentos (para uso em onClick)
		 */
		next: {
			(options?: TriggerOptions): Promise<void>;
			(): void;
		};
		/** Reinicia o wizard */
		resetWizard: (...params: Parameters<ZormyFormMethods<TFieldValues>["reset"]>) => void;
		/** Força atualização do wizardState (útil após carregar defaultValues assíncronos) */
		forceUpdateWizardState: () => void;
	};
