import type { WizardFormData, WizardFormValues } from "../types/extractors";
import type {
	ExtractStepFieldsMapFromStepsConfig,
	ExtractStepsFromStepsConfig,
	StepDefinition,
	StepFieldsMap,
	WizardConfig,
} from "../types/wizard";

/**
 * Cria uma configuração de wizard a partir de um array de steps (nome + campos).
 *
 * Cada step é um objeto `{ name, fields }`. A ordem do array define a ordem dos steps.
 * Retorna uma config normalizada (steps: nomes[], fields: map) usada internamente por useWizard/createWizard.
 *
 * @template TStepsConfig - Array readonly de StepDefinition (inferido do argumento)
 *
 * @param config - Objeto com `steps` (array de { name, fields }) e opcionalmente `shouldIncludeStep`
 * @returns WizardConfig com steps (array de nomes) e fields (map step -> campos)
 *
 * @example
 * ```ts
 * const config = createWizardConfig({
 *   steps: [
 *     { name: "credentials", fields: [NameField, EmailField] },
 *     { name: "security", fields: [PasswordField] },
 *   ],
 *   shouldIncludeStep: (step, formValues) => {
 *     return formValues["name"] !== "";
 *   },
 * });
 * ```
 */
export function createWizardConfig<TStepsConfig extends readonly StepDefinition[]>(
	config: {
		steps: TStepsConfig;
		shouldIncludeStep?: (
			step: ExtractStepsFromStepsConfig<TStepsConfig>[number],
			formValues: WizardFormValues<ExtractStepFieldsMapFromStepsConfig<TStepsConfig>>
		) => boolean;
	}
): WizardConfig<
	ExtractStepsFromStepsConfig<TStepsConfig>,
	ExtractStepFieldsMapFromStepsConfig<TStepsConfig> & StepFieldsMap<ExtractStepsFromStepsConfig<TStepsConfig>>
> & {
	/** Propriedade fantasma para inferência de FormData (usa map do config, não interseção). */
	readonly __formData?: WizardFormData<ExtractStepFieldsMapFromStepsConfig<TStepsConfig>>;
	/** Propriedade fantasma para inferência de FormValues. */
	readonly __formValues?: WizardFormValues<ExtractStepFieldsMapFromStepsConfig<TStepsConfig>>;
} {
	const steps = config.steps.map((s) => s.name) as ExtractStepsFromStepsConfig<TStepsConfig>;
	const fields = Object.fromEntries(
		config.steps.map((s) => [s.name, s.fields])
	) as ExtractStepFieldsMapFromStepsConfig<TStepsConfig> &
		StepFieldsMap<ExtractStepsFromStepsConfig<TStepsConfig>>;
	return {
		steps,
		fields,
		shouldIncludeStep: config.shouldIncludeStep,
	};
}
