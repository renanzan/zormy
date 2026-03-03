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

			const { Wizard, Step, methods } = createWizard({
				steps: ["step1", "step2"] as const,
				fields: { step1: [NameField], step2: [EmailField] },
			});

			type WizardProps = ComponentProps<typeof Wizard>;
			type StepProps = ComponentProps<typeof Step>;

			// @ts-expect-error - methods não deve ser uma propriedade do Wizard pois é injetado automaticamente
			expectTypeOf<WizardProps["methods"]>();
			expectTypeOf<StepProps["step"]>().toEqualTypeOf<"step1" | "step2">();
			expectTypeOf(methods.steps).toEqualTypeOf<readonly ["step1", "step2"]>();

			const values = methods.watch();

			expectTypeOf(values).toEqualTypeOf<Partial<{ name: string; email: string }>>();
		});
	});
});
