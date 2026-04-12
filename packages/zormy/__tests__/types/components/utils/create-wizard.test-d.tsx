import { z } from "zod";
import { describe, expectTypeOf, it } from "vitest";

import { field } from "../../../../src/fields/field/builder/builder";
import { createWizard } from "../../../../src/wizards/wizard/utils/create-wizard";

import type { ComponentProps } from "react";

/**
 * Testes do createWizard.
 *
 * Estes testes demonstram como criar um wizard usando o createWizard.
 */
describe("createWizard - API para criar wizards", () => {
	describe("criação básica de wizards", () => {
		it("deve criar wizard simples com campos estáticos", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const { Wizard, Step, WizardNav, WizardNavBack, WizardNavNext, methods } = createWizard({
				steps: [
					{ name: "step1", fields: [NameField] },
					{ name: "step2", fields: [EmailField] },
				] as const,
				onComplete: (data) => {
					expectTypeOf(data).toEqualTypeOf<{ name: string; email: string }>();
				},
			});

			type WizardProps = ComponentProps<typeof Wizard>;
			type StepProps = ComponentProps<typeof Step>;

			// @ts-expect-error - methods não deve ser uma propriedade do Wizard pois é injetado automaticamente
			expectTypeOf<WizardProps["methods"]>();
			expectTypeOf<StepProps["step"]>().toEqualTypeOf<"step1" | "step2">();
			expectTypeOf(WizardNav).toBeFunction();
			expectTypeOf(WizardNavBack).toBeFunction();
			expectTypeOf(WizardNavNext).toBeFunction();
			expectTypeOf(methods.steps).toEqualTypeOf<["step1", "step2"]>();

			const values = methods.watch();

			expectTypeOf(values).toEqualTypeOf<Partial<{ name: string; email: string }>>();
		});
	});
});
