import { createElement } from "react";

import { Step } from "../../../components/Step";
import { Wizard } from "../../../components/Wizard";
import { WizardNav, WizardNavBack, WizardNavNext } from "../../../components/WizardNav";

import type { ComponentPropsWithoutRef, ElementType, ReactElement, ReactNode } from "react";
import type { FieldValues, SubmitHandler } from "react-hook-form";
import type {
	WizardNavBackProps,
	WizardNavNextProps,
	WizardNavProps,
} from "../../../components/WizardNav";
import type { ZormyFormMethods } from "../../../form/types/form-methods";
import type { ExtractWizardFormData } from "../types/extractors";
import type { StepFieldsMap, WizardConfig } from "../types/wizard";

/**
 * Props do componente Wizard tipado.
 * Compatível com FormProps do componente Wizard.
 *
 * @template TFieldValues - Tipo dos valores do formulário
 * @template TContextOnly - Define se o formulário fornece apenas o contexto (sem envolver em `<form>`)
 */
export type TypedWizardProps<
	TFieldValues extends FieldValues = FieldValues,
	TContextOnly extends boolean = false,
> = TContextOnly extends true
	? {
			methods: ZormyFormMethods<TFieldValues>;
			/** Fornece apenas o contexto do formulário em vez de envolver em um <form>. */
			contextOnly: true;
			/** Elemento filho único que recebe as props do formulário. */
			children: ReactElement;
		}
	: {
			methods: ZormyFormMethods<TFieldValues>;
			/** Renderiza formulário padrão <form> (valor default). */
			contextOnly?: false | undefined;
			/** Handler de submit do formulário. */
			onSubmit?: SubmitHandler<TFieldValues>;
		} & Omit<ComponentPropsWithoutRef<"form">, "onSubmit">;

/**
 * Props do componente Step tipado.
 *
 * @template Steps - Array de strings literais representando os steps do wizard
 * @template TAs - Tipo do componente (padrão: 'div')
 */
export type TypedStepProps<Steps extends readonly string[], TAs extends ElementType = "div"> = {
	step: Steps[number];
	as?: TAs;
	children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<TAs>, "as" | "children">;

/**
 * Componentes tipados retornados por `createWizardComponents`.
 *
 * @template TConfig - Configuração do wizard (WizardConfig)
 */
export type WizardComponents<TConfig> =
	TConfig extends WizardConfig<infer Steps, infer TStepFieldsMap>
		? TStepFieldsMap extends StepFieldsMap<Steps>
			? {
					/**
					 * Componente Wizard tipado com os valores do formulário extraídos do config.
					 *
					 * @example
					 * ```tsx
					 * const { Wizard: TypedWizard } = createWizardComponents(config);
					 * <TypedWizard methods={wizard}>
					 *   <TypedStep step="step1">...</TypedStep>
					 * </TypedWizard>
					 * ```
					 */
					Wizard: {
						(props: TypedWizardProps<ExtractWizardFormData<TConfig>, true>): React.ReactElement;
						(props: TypedWizardProps<ExtractWizardFormData<TConfig>, false>): React.ReactElement;
					};
					/**
					 * Componente Step tipado com os steps do config.
					 *
					 * @example
					 * ```tsx
					 * const { Step: TypedStep } = createWizardComponents(config);
					 * <TypedStep step="step1">...</TypedStep>
					 * ```
					 */
					Step: <TAs extends ElementType = "div">(
						props: TypedStepProps<Steps, TAs>
					) => React.ReactElement;
					/**
					 * Container para botões de navegação (use com WizardNavBack e WizardNavNext).
					 *
					 * @example
					 * ```tsx
					 * <WizardNav as="div" className="flex gap-3">
					 *   <WizardNavBack as="button">Voltar</WizardNavBack>
					 *   <WizardNavNext as="button" nextLabel="Próximo" submitLabel="Finalizar" />
					 * </WizardNav>
					 * ```
					 */
					WizardNav: <TAs extends ElementType = "div">(
						props: WizardNavProps<TAs>
					) => React.ReactElement;
					/** Botão Voltar (só renderiza quando !isFirstStep). */
					WizardNavBack: <TAs extends ElementType = "button">(
						props: WizardNavBackProps<TAs>
					) => React.ReactElement | null;
					/** Botão Próximo ou Finalizar (submit no último step). */
					WizardNavNext: <TAs extends ElementType = "button">(
						props: WizardNavNextProps<TAs>
					) => React.ReactElement;
				}
			: never
		: never;

/**
 * Implementação estável do Wizard tipado.
 *
 * Importante: este componente NÃO depende do config em runtime (o config é só para inferência de tipos),
 * então mantemos a referência estável para evitar remounts quando `createWizardComponents(...)`
 * é chamado dentro de um render.
 */
const TypedWizardImpl = <TFieldValues extends FieldValues, TContextOnly extends boolean = false>(
	props: TypedWizardProps<TFieldValues, TContextOnly>
): React.ReactElement => {
	// Infer TContextOnly baseado nas props
	const isContextOnly = "contextOnly" in props && props.contextOnly === true;
	if (isContextOnly) {
		return createElement(
			Wizard<TFieldValues, true>,
			props as unknown as TypedWizardProps<TFieldValues, true>
		);
	}
	return createElement(
		Wizard<TFieldValues, false>,
		props as unknown as TypedWizardProps<TFieldValues, false>
	);
};

/**
 * Implementação estável do Step tipado.
 *
 * Mesma lógica: o config é só para tipo. Mantemos referência estável.
 */
const TypedStepImpl = <Steps extends readonly string[], TAs extends ElementType = "div">(
	props: TypedStepProps<Steps, TAs>
): ReactElement => {
	return createElement(Step<TAs>, props as unknown as TypedStepProps<Steps, TAs>);
};

const TypedWizardNavImpl = WizardNav;
const TypedWizardNavBackImpl = WizardNavBack;
const TypedWizardNavNextImpl = WizardNavNext;

/**
 * Cria componentes Wizard e Step tipados baseados em uma configuração de wizard.
 *
 * Esta função permite criar componentes com tipagem forte, onde:
 * - O componente `Wizard` tem os tipos de valores do formulário inferidos do config
 * - O componente `Step` aceita apenas steps válidos do config
 *
 * @template TConfig - Configuração do wizard (WizardConfig)
 *
 * @param config - Configuração do wizard
 * @returns Objeto com componentes Wizard e Step tipados
 *
 * @example
 * ```tsx
 * const config = createWizardConfig({
 *   steps: ["step1", "step2"] as const,
 *   fields: {
 *     step1: [NameField],
 *     step2: [EmailField]
 *   }
 * });
 *
 * const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);
 *
 * const wizard = useWizard({ ...config, ... });
 *
 * <TypedWizard methods={wizard}>
 *   <TypedStep step="step1">
 *     {/* step é tipado como "step1" | "step2" *\/}
 *     <input name="name" />
 *   </TypedStep>
 *   <TypedStep step="step2">
 *     <input name="email" />
 *   </TypedStep>
 * </TypedWizard>
 * ```
 */
export function createWizardComponents<TConfig>(_config: TConfig): WizardComponents<TConfig> {
	// Type assertion para manter a tipagem correta dos genéricos.
	// WizardComponents<TConfig> é um tipo condicional e o TS não consegue sempre inferir
	// corretamente os index access types aqui.
	return {
		Wizard: TypedWizardImpl,
		Step: TypedStepImpl,
		WizardNav: TypedWizardNavImpl,
		WizardNavBack: TypedWizardNavBackImpl,
		WizardNavNext: TypedWizardNavNextImpl,
	} as unknown as WizardComponents<TConfig>;
}
