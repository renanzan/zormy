/**
 * Core da tipagem do sistema de wizard.
 *
 * Este arquivo contém toda a lógica de tipagem que permite inferir corretamente
 * os tipos do formulário a partir da configuração de steps e fields.
 *
 * ## Fluxo de Tipagem
 *
 * 1. **StepFieldsMap**: Mapeia steps para seus campos
 * 2. **ExtractStepSchema**: Extrai o schema Zod de um step específico
 * 3. **ExtractCompleteWizardSchema**: Combina todos os schemas dos steps em um único tipo
 * 4. **WizardFormValues**: Tipo completo dos valores (sem Partial)
 * 5. **WizardFormData**: Tipo usado pelo react-hook-form (Partial + sem índices genéricos)
 * 6. **ExtractWizardFormData/ExtractWizardFormValues**: Extraem tipos a partir de uma config
 *
 * @example
 * ```ts
 * const config = createWizardConfig({
 *   steps: ["step1", "step2"] as const,
 *   fields: {
 *     step1: [NameField],
 *     step2: [EmailField]
 *   }
 * });
 *
 * // Tipo inferido automaticamente
 * type FormData = ExtractWizardFormData<typeof config>;
 * // FormData = Partial<{ name: string; email: string }>
 * ```
 */

import type { FieldComponentBase } from "../../../fields/field/types/field";
import type { WizardFormValues } from "./extractors";

/**
 * Mapeamento de steps para seus campos.
 * Aceita arrays de FieldComponentBase ou tipos mais específicos que preservam tipos literais.
 * Quando arrays preservam tipos literais (como tuples), os tipos são corretamente inferidos.
 *
 * @template Steps - Array de strings literais representando os steps do wizard
 */
export type StepFieldsMap<Steps extends readonly string[]> = {
	[Step in Steps[number]]: readonly FieldComponentBase[];
};

/**
 * Configuração de um wizard.
 *
 * @template Steps - Array de strings literais representando os steps do wizard
 * @template TStepFieldsMap - Mapeamento de steps para campos
 */
export type WizardConfig<
	Steps extends readonly string[],
	TStepFieldsMap extends StepFieldsMap<Steps> = StepFieldsMap<Steps>,
> = {
	/** Array de steps do wizard em ordem */
	steps: Steps;
	/** Mapeamento de steps para seus campos */
	fields: TStepFieldsMap;
	/**
	 * Função opcional para determinar se um step deve ser incluído baseado nos valores do formulário.
	 * Útil para criar steps condicionais que aparecem apenas quando certas condições são atendidas.
	 *
	 * O tipo de `formValues` é inferido automaticamente a partir dos `fields` fornecidos.
	 *
	 * @param step - Step a verificar
	 * @param formValues - Valores atuais do formulário (flat, com pontos nas chaves)
	 * @returns true se o step deve ser incluído, false caso contrário
	 *
	 * @example
	 * ```ts
	 * shouldIncludeStep: (step, formValues) => {
	 *   if (step === "sportCategories") {
	 *     return formValues["configurations.hasSportPotentialLaw"] === true;
	 *   }
	 *   if (step === "culturalSegments") {
	 *     return formValues["configurations.hasCulturalPotentialLaw"] === true;
	 *   }
	 *   return true; // Inclui todos os outros steps
	 * }
	 * ```
	 */
	shouldIncludeStep?: (
		step: Steps[number],
		formValues: WizardFormValues<TStepFieldsMap>
	) => boolean;
};
