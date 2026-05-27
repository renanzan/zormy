/**
 * Regressão: retorno de useZormy deve ser aceito em <Form methods={...} />.
 * Garante compatibilidade do 3º genérico de UseFormReturn entre versões do RHF.
 */

import { z } from "zod";
import { describe, expectTypeOf, it } from "vitest";

import { Form } from "../../../src/components/Form";
import { field } from "../../../src/fields/field/builder/builder";
import { useZormy } from "../../../src/form/hooks/useZormy";
import type { ZormyFormMethods } from "../../../src/form/types/form-methods";
import type { FormMethodsProps } from "../../../src/components/Form";

describe("Type Safety - useZormy + Form methods", () => {
	it("deve aceitar retorno de useZormy em Form methods", () => {
		const NameField = field("name")
			.schema(z.string())
			.render(() => null);

		const form = useZormy({
			fields: [NameField],
			defaultValues: { name: "" },
		});

		<Form
			methods={form}
			onSubmit={(data) => {
				expectTypeOf(data).toEqualTypeOf<{ name: string }>();
			}}
		>
			<></>
		</Form>;

		expectTypeOf(form).toExtend<ZormyFormMethods<{ name: string }>>();

		type MethodsProp = FormMethodsProps<{ name: string }>["methods"];
		const _check: MethodsProp = form;
		void _check;
	});
});
