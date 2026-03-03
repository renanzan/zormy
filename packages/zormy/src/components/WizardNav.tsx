"use client";

import { useWizardContext } from "../wizards/wizard/context";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * Props do container de navegação do wizard.
 * Permite definir o elemento raiz via `as` (padrão: 'div').
 *
 * @template TAs - Tipo do componente (padrão: 'div')
 */
export type WizardNavProps<TAs extends ElementType = "div"> = {
	as?: TAs;
	children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<TAs>, "as" | "children">;

/**
 * Container para os botões de navegação do wizard.
 * Use com {@link WizardNavBack} e {@link WizardNavNext} para montar a barra de ações sem condicionais.
 *
 * @param props - Props do container (inclui `as` e props do elemento)
 * @returns Elemento raiz com os filhos
 *
 * @example
 * ```tsx
 * <WizardNav as="div" className="flex gap-3">
 *   <WizardNavBack as="button">Voltar</WizardNavBack>
 *   <WizardNavNext as="button" nextLabel="Próximo" submitLabel="Finalizar" />
 * </WizardNav>
 * ```
 */
export function WizardNav<TAs extends ElementType = "div">(props: WizardNavProps<TAs>) {
	const { as, children, ...rest } = props;
	const Component = as ?? "div";
	return <Component {...rest}>{children}</Component>;
}

/**
 * Props do botão "Voltar".
 * Só renderiza quando não está no primeiro step.
 *
 * @template TAs - Tipo do componente (padrão: 'button')
 */
export type WizardNavBackProps<TAs extends ElementType = "button"> = {
	as?: TAs;
	children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<TAs>, "as" | "children" | "type" | "onClick">;

/**
 * Botão "Voltar" do wizard. Renderiza apenas quando `!isFirstStep`.
 * Usa o contexto do wizard para `back()`; tipo e atributos do elemento são definidos por `as`.
 *
 * @param props - Inclui `as` (padrão: 'button'), children (label) e demais props do elemento
 * @returns O elemento ou null no primeiro step
 *
 * @example
 * ```tsx
 * <WizardNavBack as="button" className="btn-secondary">Voltar</WizardNavBack>
 * ```
 */
export function WizardNavBack<TAs extends ElementType = "button">(props: WizardNavBackProps<TAs>) {
	const { as, children, ...rest } = props;
	const { back, isFirstStep } = useWizardContext();

	if (isFirstStep) {
		return null;
	}

	const Component = as ?? "button";
	return (
		<Component type="button" onClick={back} {...rest}>
			{children}
		</Component>
	);
}

/**
 * Props do botão "Avançar" / "Finalizar".
 * No último step renderiza um submit; nos demais um botão que chama next().
 *
 * @template TAs - Tipo do componente (padrão: 'button')
 */
export type WizardNavNextProps<TAs extends ElementType = "button"> = {
	as?: TAs;
	/** Label quando não é o último step (padrão: "Next") */
	nextLabel?: ReactNode;
	/** Label no último step (padrão: "Submit") */
	submitLabel?: ReactNode;
} & Omit<ComponentPropsWithoutRef<TAs>, "as" | "children" | "type" | "onClick">;

/**
 * Botão "Avançar" ou "Finalizar" do wizard.
 * No último step: `type="submit"` e exibe submitLabel; nos demais: `type="button"`, onClick=next e exibe nextLabel.
 * Elimina a necessidade de condicionais no JSX.
 *
 * @param props - Inclui `as`, nextLabel, submitLabel e demais props do elemento
 * @returns O elemento (sempre renderizado)
 *
 * @example
 * ```tsx
 * <WizardNavNext as="button" nextLabel="Próximo" submitLabel="Finalizar" />
 * ```
 */
export function WizardNavNext<TAs extends ElementType = "button">(props: WizardNavNextProps<TAs>) {
	const {
		as,
		nextLabel = "Next",
		submitLabel = "Submit",
		...rest
	} = props as WizardNavNextProps<TAs> & { nextLabel?: ReactNode; submitLabel?: ReactNode };
	const { next, isLastStep } = useWizardContext();

	const Component = as ?? "button";

	if (isLastStep) {
		return (
			<Component type="submit" {...rest}>
				{submitLabel}
			</Component>
		);
	}

	return (
		<Component type="button" onClick={next} {...rest}>
			{nextLabel}
		</Component>
	);
}
