import { useWizardContext } from "../wizards/wizard/context";

import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/**
 * StepProps tipada para permitir definir dinamicamente o componente raíz
 *
 * @template TAs - Tipo do componente (padrão: 'div')
 */
export type StepProps<TAs extends ElementType = "div"> = {
	step: string;
	as?: TAs;
	children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<TAs>, "as" | "children">;

/**
 * Step para wizard, renderiza somente se ativo e com tipagem dinâmica no as
 */
export function Step<TAs extends ElementType = "div">(props: StepProps<TAs>) {
	const { step, as, children, ...rest } = props;
	const { currentStep } = useWizardContext();
	const Component = as || "div";

	if (currentStep !== step) {
		return null;
	}

	return <Component {...rest}>{children}</Component>;
}
