import { Form, type FormMethodsProps } from "../../components/Form";
import { useZormy } from "../hooks/useZormy";

import type { FC } from "react";
import type { UseFormProps } from "react-hook-form";
import type { ZormyFormMethods } from "../types/form-methods";
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

	/** Lado `methods` do Form (ambas variantes de contextOnly), sem a prop `methods`. */
	type FormPropsWithMethodsSide = Extract<
		FormProps<FormValuesType, TFields>,
		{ methods: ZormyFormMethods<FormValuesType> }
	>;
	type FormPropsWithoutMethods = Omit<FormPropsWithMethodsSide, "methods">;

	const RawForm: FC<FormPropsWithoutMethods> = (props) => {
		const formProps = {
			...props,
			methods,
		};
		return <Form {...(formProps as FormMethodsProps<FormValuesType>)} />;
	};

	return {
		methods,
		Form: RawForm,
	};
};
