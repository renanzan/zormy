import { z } from "zod";
import { describe, expectTypeOf, it } from "vitest";

import { field } from "../../../../src/fields/field/builder/builder";
import { createForm } from "../../../../src/form/utils/create-form";

import type { ComponentProps, ReactNode } from "react";
import type { SubmitHandler } from "react-hook-form";

/**
 * Testes do createForm.
 *
 * Estes testes demonstram como criar um formulário usando o createForm.
 */
describe("createForm - API para criar formulários", () => {
	describe("criação básica de formulários", () => {
		it("deve criar formulário simples com schema estático e chave literal", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const fields = [NameField];

			const { Form, methods } = createForm({ fields });

			type FormProps = ComponentProps<typeof Form>;

			expectTypeOf<FormProps["onSubmit"]>().toEqualTypeOf<
				SubmitHandler<{ name: string }> | undefined
			>();

			expectTypeOf<FormProps["children"]>().toEqualTypeOf<ReactNode | undefined>();
			expectTypeOf<FormProps["contextOnly"]>().toEqualTypeOf<boolean | undefined>();
			// @ts-expect-error - methods não é um prop do FormPropsWithoutMethods
			expectTypeOf<FormProps["methods"]>().toBeAny();

			const values = methods.watch();

			expectTypeOf(values).toEqualTypeOf<{ name: string }>();
		});
	});
});
