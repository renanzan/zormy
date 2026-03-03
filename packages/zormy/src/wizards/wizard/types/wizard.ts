/**
 * Core da tipagem do sistema de wizard.
 *
 * Este arquivo contém toda a lógica de tipagem que permite inferir corretamente
 * os tipos do formulário a partir da configuração de steps (array de { name, fields }).
 *
 * ## Fluxo de Tipagem
 *
 * 1. **StepDefinition** / **StepsConfig**: Array de steps com nome e campos
 * 2. **ExtractStepsFromStepsConfig** / **ExtractStepFieldsMapFromStepsConfig**: Extraem steps e fields do config
 * 3. **StepFieldsMap**: Mapeia steps para seus campos (representação interna)
 * 4. **WizardConfig**: Config normalizada (steps + fields) usada internamente
 * 5. **ExtractWizardFormData/ExtractWizardFormValues**: Extraem tipos a partir de uma config
 *
 * @example
 * ```ts
 * const config = createWizardConfig({
 *   steps: [
 *     { name: "step1", fields: [NameField] },
 *     { name: "step2", fields: [EmailField] }
 *   ],
 * });
 * type FormData = ExtractWizardFormData<typeof config>;
 * ```
 */

import type { FieldComponentBase } from "../../../fields/field/types/field";
import type { WizardFormValues } from "./extractors";

/**
 * Definição de um step: nome (string literal) e array de campos.
 *
 * @template Name - Nome do step (inferido como literal quando possível)
 * @template Fields - Array de campos do step
 */
export type StepDefinition<
	Name extends string = string,
	Fields extends readonly FieldComponentBase[] = readonly FieldComponentBase[],
> = {
	readonly name: Name;
	readonly fields: Fields;
};

/**
 * Configuração de steps como array de definições (nome + campos).
 * Ordem do array define a ordem dos steps no wizard.
 */
export type StepsConfig = readonly StepDefinition[];

/**
 * Configuração de steps com pelo menos um step (tupla não vazia).
 * Usado em useWizard/UseWizardArgs para garantir que Steps[number] não seja never.
 */
export type NonEmptyStepsConfig = readonly [
	StepDefinition<string, readonly FieldComponentBase[]>,
	...StepDefinition<string, readonly FieldComponentBase[]>[],
];

/**
 * Extrai o tuple de nomes dos steps a partir do config (array de { name, fields }).
 */
export type ExtractStepsFromStepsConfig<T> = T extends readonly [infer F, ...infer R]
	? F extends { readonly name: infer N extends string }
		? [N, ...(R extends readonly unknown[] ? ExtractStepsFromStepsConfig<R> : [])]
		: never
	: [];

/**
 * Extrai o mapeamento step -> campos a partir do config (array de { name, fields }).
 */
export type ExtractStepFieldsMapFromStepsConfig<T> = T extends readonly [infer F, ...infer R]
	? F extends { readonly name: infer N extends string; readonly fields: infer Fld }
		? Fld extends readonly FieldComponentBase[]
			? { [K in N]: Fld } &
					(R extends readonly unknown[] ? ExtractStepFieldsMapFromStepsConfig<R> : never)
			: never
		: never
	: {};

/**
 * Mapeamento de steps para seus campos.
 * Aceita arrays de FieldComponentBase ou tipos mais específicos que preservam tipos literais.
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
