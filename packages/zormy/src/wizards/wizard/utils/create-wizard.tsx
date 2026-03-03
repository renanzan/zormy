import { createWizardComponents } from "../builder/components";
import { createWizardConfig } from "../builder/config";
import { useWizard } from "../hooks/use-wizard";

import type { ComponentProps, FC } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { UseWizardArgs } from "../hooks/use-wizard";
import type { ExtractWizardFormData } from "../types/extractors";
import type { StepFieldsMap } from "../types/wizard";

type CreateWizardArgs<
	T extends readonly string[],
	TStepFieldsMap extends StepFieldsMap<T>,
> = UseWizardArgs<T, TStepFieldsMap>;

export const createWizard = <T extends readonly string[], TStepFieldsMap extends StepFieldsMap<T>>(
	args: CreateWizardArgs<T, TStepFieldsMap>
) => {
	const { steps, fields, ...rest } = args;

	const config = createWizardConfig({ steps, fields });

	const methods = useWizard({ ...config, ...rest });

	const { Wizard: RawWizard, Step } = createWizardComponents(config);

	// Cria um Wizard que injeta methods automaticamente, omitindo a prop 'methods' do consumidor.
	// Assertion: useWizard retorna UseFormReturn<WizardFormData<TStepFieldsMap>> e RawWizard espera
	// UseFormReturn<ExtractWizardFormData<typeof config>>; são o mesmo em runtime (mesmo config), mas o TS
	// não unifica os tipos condicionais ao comparar.
	type FormData = ExtractWizardFormData<typeof config>;
	const Wizard: FC<Omit<ComponentProps<typeof RawWizard>, "methods">> = (props) => (
		<RawWizard {...props} methods={methods as unknown as UseFormReturn<FormData>} />
	);

	return {
		methods,
		config,
		Wizard,
		Step,
	};
};
