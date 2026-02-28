import type { FieldsToObject } from "../../../fields/field/types/extractors";
import type { FieldComponentBase } from "../../../fields/field/types/field";
import type { DotNotationToNested } from "../../../types/dot-notation";
import type { OmitIndexSignature, UnionToIntersection } from "../../../types/object";
import type { StepFieldsMap, WizardConfig } from "./wizard";

/**
 * Extrai o schema Zod de um step específico.
 * Preserva tipos literais quando Fields preserva tipos literais (como tuples).
 *
 * @template TStepFieldsMap - Mapeamento de steps para campos
 * @template Step - Step específico
 */
type ExtractStepSchema<
	TStepFieldsMap extends StepFieldsMap<readonly string[]>,
	Step extends string,
> = TStepFieldsMap extends { [K in Step]: infer Fields }
	? Fields extends readonly FieldComponentBase[]
		? FieldsToObject<Fields>
		: never
	: never;

/**
 * Extrai o schema completo de todos os steps combinando todas as propriedades.
 * Este é o tipo base que representa todos os valores do formulário (sem Partial).
 * Remove índices genéricos para garantir tipagem correta.
 *
 * @template TStepFieldsMap - Mapeamento de steps para campos
 */
export type ExtractCompleteWizardSchema<TStepFieldsMap extends StepFieldsMap<readonly string[]>> =
	TStepFieldsMap extends StepFieldsMap<infer Steps>
		? Steps extends readonly string[]
			? OmitIndexSignature<UnionToIntersection<ExtractStepSchema<TStepFieldsMap, Steps[number]>>>
			: never
		: never;

/**
 * Tipo base para valores do formulário do wizard.
 * Representa o tipo completo extraído dos schemas (sem Partial, mas com OmitIndexSignature já aplicado em ExtractCompleteWizardSchema).
 *
 * @template TStepFieldsMap - Mapeamento de steps para campos
 */
export type WizardFormValues<TStepFieldsMap extends StepFieldsMap<readonly string[]>> =
	DotNotationToNested<ExtractCompleteWizardSchema<TStepFieldsMap>>;

/**
 * Tipo usado pelo react-hook-form.
 * Remove índices genéricos e torna todas as propriedades opcionais.
 *
 * @template TStepFieldsMap - Mapeamento de steps para campos
 */
export type WizardFormData<TStepFieldsMap extends StepFieldsMap<readonly string[]>> = Partial<
	OmitIndexSignature<WizardFormValues<TStepFieldsMap>>
>;

/**
 * Extrai o tipo de dados do formulário a partir de uma configuração de wizard.
 * Retorna o tipo no formato usado pelo react-hook-form (Partial + OmitIndexSignature).
 *
 * @template TConfig - Configuração do wizard (WizardConfig)
 *
 * @example
 * ```ts
 * const wizard = { steps: ["step1"], fields: { step1: [...] } } satisfies WizardConfig<...>;
 * type FormData = ExtractWizardFormData<typeof wizard>;
 * // FormData = Partial<OmitIndexSignature<ExtractCompleteWizardSchema<...>>>
 * ```
 */
export type ExtractWizardFormData<TConfig> =
	TConfig extends WizardConfig<infer Steps, infer TStepFieldsMap>
		? Steps extends readonly string[]
			? TStepFieldsMap extends StepFieldsMap<Steps>
				? WizardFormData<TStepFieldsMap>
				: never
			: never
		: never;

/**
 * Extrai o tipo dos valores do formulário (completo, sem Partial) a partir de uma configuração de wizard.
 * Útil para tipar o parâmetro `formValues` em `shouldIncludeStep`.
 *
 * @template TConfig - Configuração do wizard (WizardConfig)
 *
 * @example
 * ```ts
 * const config = { steps: ["step1"], fields: { step1: [...] } } satisfies WizardConfig<...>;
 * type FormValues = ExtractWizardFormValues<typeof config>;
 * // FormValues = ExtractCompleteWizardSchema<...>
 * ```
 */
export type ExtractWizardFormValues<TConfig> =
	TConfig extends WizardConfig<infer Steps, infer TStepFieldsMap>
		? Steps extends readonly string[]
			? TStepFieldsMap extends StepFieldsMap<Steps>
				? WizardFormValues<TStepFieldsMap>
				: never
			: never
		: never;
