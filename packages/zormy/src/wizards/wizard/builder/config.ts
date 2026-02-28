import type { WizardFormValues } from "../types/extractors";
import type { StepFieldsMap, WizardConfig } from "../types/wizard";

/**
 * Função helper para criar uma configuração de wizard com inferência correta de tipos.
 *
 * Esta função permite que o TypeScript infira corretamente o tipo de `formValues`
 * em `shouldIncludeStep` a partir dos `fields` fornecidos, sem precisar usar `any` ou `Record<string, any>`.
 *
 * @template Steps - Array de strings literais representando os steps do wizard
 * @template TStepFieldsMap - Mapeamento de steps para campos (inferido automaticamente)
 *
 * @param config - Configuração do wizard
 * @returns A mesma configuração com tipos inferidos corretamente
 *
 * @example
 * ```ts
 * const config = createWizardConfig({
 *   steps: ["step1", "step2"] as const,
 *   fields: {
 *     step1: [NameField],
 *     step2: [EmailField]
 *   },
 *   shouldIncludeStep: (step, formValues) => {
 *     // formValues tem tipo correto inferido dos fields!
 *     return formValues["name"] !== "";
 *   }
 * });
 * ```
 */
export function createWizardConfig<
	const Steps extends readonly string[],
	TStepFieldsMap extends StepFieldsMap<Steps>,
>(config: {
	steps: Steps;
	fields: TStepFieldsMap;
	shouldIncludeStep?: (
		step: Steps[number],
		formValues: WizardFormValues<TStepFieldsMap>
	) => boolean;
}): WizardConfig<Steps, TStepFieldsMap> {
	return config;
}
