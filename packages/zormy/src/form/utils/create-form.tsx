import { Form } from "../../components/Form";
import { useZormy } from "../hooks/useZormy";

import type { FC } from "react";
import type { UseFormProps, UseFormReturn } from "react-hook-form";
import type { FormProps } from "../../components/Form";
import type { FieldsToObject } from "../../fields/field/types/extractors";
import type { FieldComponentBase } from "../../fields/field/types/field";

/** Tipo dos valores do formulário inferidos dos fields */
type FormValues<TFields extends FieldComponentBase[]> = FieldsToObject<TFields>;

export const createForm = <
	TFields extends FieldComponentBase[] = FieldComponentBase[],
	TContextOnly extends boolean = false,
>(
	args: {
		fields: TFields;
		contextOnly?: TContextOnly;
	} & Omit<UseFormProps<FormValues<TFields>>, "fields" | "contextOnly">
) => {
	const methods = useZormy({ ...args });

	type FormValuesType = FormValues<TFields>;

	// União das duas variantes (contextOnly true e false) para o Form aceitar ambos os usos
	type FormPropsWithMethodsTrue = Extract<
		FormProps<FormValuesType, true>,
		{ methods: UseFormReturn<FormValuesType> }
	>;
	type FormPropsWithMethodsFalse = Extract<
		FormProps<FormValuesType, false>,
		{ methods: UseFormReturn<FormValuesType> }
	>;
	type FormPropsWithoutMethods =
		| Omit<FormPropsWithMethodsTrue, "methods">
		| Omit<FormPropsWithMethodsFalse, "methods">;

	const RawForm: FC<FormPropsWithoutMethods> = (props) => {
		const formProps = {
			...props,
			methods: methods as unknown as UseFormReturn<FormValuesType>,
		};
		return <Form {...(formProps as FormProps<FormValuesType, TContextOnly, TFields>)} />;
	};

	return {
		methods,
		Form: RawForm,
	};
};
