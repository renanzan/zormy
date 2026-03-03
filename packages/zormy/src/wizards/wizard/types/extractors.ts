import type { FieldsToObject } from "../../../fields/field/types/extractors";
import type { FieldComponentBase } from "../../../fields/field/types/field";
import type { DotNotationToNested } from "../../../types/dot-notation";
import type { OmitIndexSignature, UnionToIntersection } from "../../../types/object";
import type { StepFieldsMap } from "./wizard";

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
 * Distribui ExtractStepSchema por cada step (StepUnion como parâmetro faz a união distribuir).
 * @internal
 */
type DistributeStepSchema<
	TStepFieldsMap extends StepFieldsMap<readonly string[]>,
	StepUnion extends string,
> = StepUnion extends string ? ExtractStepSchema<TStepFieldsMap, StepUnion> : never;

/**
 * Schema completo do wizard dado um map de campos e a tupla de steps (evita inferência falha com interseção).
 * @internal
 */
type ExtractCompleteWizardSchemaWithSteps<
	TStepFieldsMap extends StepFieldsMap<readonly string[]>,
	Steps extends readonly string[],
> = TStepFieldsMap extends StepFieldsMap<Steps>
	? OmitIndexSignature<
			UnionToIntersection<DistributeStepSchema<TStepFieldsMap, Steps[number]>>
		>
	: never;

/** Lógica de extração a partir de steps/fields (para configs sem propriedade fantasma). */
type ExtractWizardFormDataFromSteps<TConfig> =
	TConfig extends { steps: infer S; fields: infer F }
		? S extends readonly string[]
			? F extends StepFieldsMap<S>
				? Partial<
						OmitIndexSignature<
							DotNotationToNested<ExtractCompleteWizardSchemaWithSteps<F, S>>
						>
					>
				: never
			: never
		: never;

/**
 * Extrai o tipo de dados do formulário a partir de uma configuração de wizard.
 * Usa __formData quando presente (retorno de createWizardConfig); senão infere de steps/fields.
 *
 * @template TConfig - Configuração do wizard (WizardConfig ou retorno de createWizardConfig)
 */
export type ExtractWizardFormData<TConfig> =
	TConfig extends { __formData?: infer D }
		? D extends Partial<object>
			? D
			: ExtractWizardFormDataFromSteps<TConfig>
		: ExtractWizardFormDataFromSteps<TConfig>;

/** Lógica de extração de FormValues a partir de steps/fields. */
type ExtractWizardFormValuesFromSteps<TConfig> =
	TConfig extends { steps: infer S; fields: infer F }
		? S extends readonly string[]
			? F extends StepFieldsMap<S>
				? DotNotationToNested<ExtractCompleteWizardSchemaWithSteps<F, S>>
				: never
			: never
		: never;

/**
 * Extrai o tipo dos valores do formulário (completo, sem Partial) a partir de uma configuração de wizard.
 * Usa __formValues quando presente (retorno de createWizardConfig); senão infere de steps/fields.
 *
 * @template TConfig - Configuração do wizard (WizardConfig ou retorno de createWizardConfig)
 */
export type ExtractWizardFormValues<TConfig> =
	TConfig extends { __formValues?: infer D }
		? D extends object
			? D
			: ExtractWizardFormValuesFromSteps<TConfig>
		: ExtractWizardFormValuesFromSteps<TConfig>;
