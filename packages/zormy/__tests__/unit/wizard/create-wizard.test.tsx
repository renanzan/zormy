import { z } from "zod";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { createWizard } from "../../../src/wizards/wizard/utils/create-wizard";

import type { ReactElement, ReactNode } from "react";

/**
 * Forma do retorno de createWizard usada nos testes (type-safe).
 * Evita dependência do tipo genérico que pode narrow para never.
 */
interface CreateWizardTestResult {
	readonly config: { steps: readonly string[]; fields: Record<string, unknown> };
	methods: {
		watch: (name: string) => unknown;
		setValue: (...args: unknown[]) => void;
		next: () => Promise<void>;
		back: () => void;
		readonly steps: readonly string[];
	};
	Wizard: (props: { children?: ReactNode }) => ReactElement;
	Step: (props: { step: string; children?: ReactNode }) => ReactElement;
}

/**
 * Testes unitários para createWizard.
 *
 * Garante que createWizard retorna methods, config, Wizard e Step;
 * que o Wizard injeta methods automaticamente (consumidor não passa methods);
 * e que o fluxo de render e submit funciona corretamente.
 *
 * createWizard chama useWizard, portanto deve ser invocado dentro de um componente.
 */
describe("createWizard - testes unitários", () => {
	const NameField = field("name")
		.schema(z.string().min(3))
		.render(() => null);

	const EmailField = field("email")
		.schema(z.string().email())
		.render(() => null);

	const defaultArgs = {
		steps: [
			{ name: "step1", fields: [NameField] },
			{ name: "step2", fields: [EmailField] },
		] as const,
		defaultValues: { name: "", email: "" },
	} as const;

	/** Tipo usado nos testes (interface explícita para evitar never no narrowing) */
	type WizardResult = CreateWizardTestResult;

	describe("retorno da função", () => {
		it("deve retornar methods, config, Wizard e Step", () => {
			let result: WizardResult | null = null;

			function TestComponent() {
				const created = createWizard(defaultArgs);
				result = created as unknown as WizardResult;
				return (
					<created.Wizard>
						<created.Step step="step1">
							<div>Step 1</div>
						</created.Step>
					</created.Wizard>
				);
			}

			render(<TestComponent />);

			expect(result).not.toBeNull();
			if (result === null) throw new Error("unreachable");
			const r: CreateWizardTestResult = result;
			expect(r).toHaveProperty("methods");
			expect(r).toHaveProperty("config");
			expect(r).toHaveProperty("Wizard");
			expect(r).toHaveProperty("Step");
			expect(typeof r.Wizard).toBe("function");
			expect(typeof r.Step).toBe("function");
		});

		it("config deve conter steps e fields do args", () => {
			let config: WizardResult["config"] | null = null;

			function TestComponent() {
				const created = createWizard(defaultArgs);
				config = created.config as unknown as WizardResult["config"];
				return (
					<created.Wizard>
						<created.Step step="step1">
							<div>Step 1</div>
						</created.Step>
					</created.Wizard>
				);
			}

			render(<TestComponent />);

			expect(config).not.toBeNull();
			if (config === null) throw new Error("unreachable");
			const c: CreateWizardTestResult["config"] = config;
			expect(c.steps).toEqual(["step1", "step2"]);
			expect(c.fields).toHaveProperty("step1");
			expect(c.fields).toHaveProperty("step2");
		});

		it("methods deve expor API do useWizard (watch, setValue, next, back, etc.)", () => {
			let methods: WizardResult["methods"] | null = null;

			function TestComponent() {
				const created = createWizard({
					...defaultArgs,
					defaultValues: { name: "a", email: "b@b.com" },
				});
				methods = created.methods as unknown as WizardResult["methods"];
				return (
					<created.Wizard>
						<created.Step step="step1">
							<div>Step 1</div>
						</created.Step>
					</created.Wizard>
				);
			}

			render(<TestComponent />);

			expect(methods).not.toBeNull();
			if (methods === null) throw new Error("unreachable");
			const m: CreateWizardTestResult["methods"] = methods;
			expect(typeof m.watch).toBe("function");
			expect(typeof m.setValue).toBe("function");
			expect(typeof m.next).toBe("function");
			expect(typeof m.back).toBe("function");
			expect(m.steps).toEqual(["step1", "step2"]);
		});
	});

	describe("Wizard sem prop methods", () => {
		it("deve renderizar o formulário sem o consumidor passar methods", () => {
			function TestComponent() {
				const { Wizard: WizardComp, Step } = createWizard(defaultArgs);
				return (
					<WizardComp>
						<Step step="step1">
							<div data-testid="step1-content">Step 1</div>
						</Step>
						<Step step="step2">
							<div data-testid="step2-content">Step 2</div>
						</Step>
					</WizardComp>
				);
			}

			const { container } = render(<TestComponent />);

			const form = container.querySelector("form");
			expect(form).toBeInTheDocument();
			expect(screen.getByTestId("step1-content")).toBeInTheDocument();
			expect(screen.queryByTestId("step2-content")).not.toBeInTheDocument();
		});

		it("deve aceitar onComplete e outras props do form", () => {
			const onComplete = vi.fn();

			function TestComponent() {
				const { Wizard: WizardComp, Step } = createWizard({
					...defaultArgs,
					defaultValues: { name: "John", email: "john@example.com" },
					onComplete,
				});
				return (
					<WizardComp onSubmit={onComplete} data-testid="wizard-form">
						<Step step="step1">
							<div>Step 1</div>
						</Step>
						<Step step="step2">
							<button type="submit" data-testid="submit-btn">
								Submit
							</button>
						</Step>
					</WizardComp>
				);
			}

			render(<TestComponent />);

			expect(screen.getByTestId("wizard-form")).toBeInTheDocument();
		});

		it("deve usar o mesmo methods retornado por createWizard (valores visíveis via watch)", () => {
			function TestComponent() {
				const {
					Wizard: WizardComp,
					Step,
					methods,
				} = createWizard({
					...defaultArgs,
					defaultValues: { name: "Alice", email: "alice@example.com" },
				});
				const name = methods.watch("name");
				return (
					<WizardComp>
						<Step step="step1">
							<div data-testid="name-display">Name: {name}</div>
						</Step>
						<Step step="step2">
							<div>Step 2</div>
						</Step>
					</WizardComp>
				);
			}

			render(<TestComponent />);

			expect(screen.getByTestId("name-display").textContent).toContain("Alice");
		});
	});

	describe("integração Wizard + Step", () => {
		it("deve renderizar apenas o step atual", () => {
			function TestComponent() {
				const { Wizard: WizardComp, Step } = createWizard({
					...defaultArgs,
					defaultValues: { name: "Abc", email: "a@b.com" },
				});
				return (
					<WizardComp>
						<Step step="step1">
							<div data-testid="s1">Step 1</div>
						</Step>
						<Step step="step2">
							<div data-testid="s2">Step 2</div>
						</Step>
					</WizardComp>
				);
			}

			render(<TestComponent />);

			expect(screen.getByTestId("s1")).toBeInTheDocument();
			expect(screen.queryByTestId("s2")).not.toBeInTheDocument();
		});

		it("Step deve aceitar prop 'as' e props HTML", () => {
			function TestComponent() {
				const { Wizard: WizardComp, Step } = createWizard(defaultArgs);
				return (
					<WizardComp>
						<Step step="step1" as="section" className="step-one" data-testid="step-section">
							<div>Step 1</div>
						</Step>
						<Step step="step2">
							<div>Step 2</div>
						</Step>
					</WizardComp>
				);
			}

			render(<TestComponent />);

			const section = screen.getByTestId("step-section");
			expect(section).toBeInTheDocument();
			expect(section.tagName).toBe("SECTION");
			expect(section).toHaveClass("step-one");
		});
	});

	describe("callbacks", () => {
		it("deve chamar onComplete quando configurado em createWizard", async () => {
			const onComplete = vi.fn();
			let wizardMethods: WizardResult["methods"] | null = null;

			function TestComponentWithRef() {
				const created = createWizard({
					...defaultArgs,
					defaultValues: { name: "Valid", email: "valid@example.com" },
					onComplete,
				});
				wizardMethods = created.methods as unknown as WizardResult["methods"];
				return (
					<created.Wizard>
						<created.Step step="step1">
							<div>Step 1</div>
						</created.Step>
						<created.Step step="step2">
							<div>Step 2</div>
						</created.Step>
					</created.Wizard>
				);
			}

			render(<TestComponentWithRef />);

			expect(wizardMethods).not.toBeNull();
			if (wizardMethods === null) throw new Error("unreachable");
			// Ler wizardMethods dentro do act para usar a ref atualizada após re-render (typecheck exige checagem no callback)
			await act(async () => {
				const wm = wizardMethods;
				if (!wm) throw new Error("unreachable");
				await wm.next();
			});
			await act(async () => {
				const wm = wizardMethods;
				if (!wm) throw new Error("unreachable");
				await wm.next();
			});

			expect(onComplete).toHaveBeenCalled();
			const submitCall = onComplete.mock.calls[0];
			if (submitCall === undefined) throw new Error("expected one submit call");
			expect(submitCall[0]).toMatchObject({
				name: "Valid",
				email: "valid@example.com",
			});
		});

		it("deve chamar onStepChange quando step muda", async () => {
			const onStepChange = vi.fn();
			let wizardMethods: WizardResult["methods"] | null = null;

			function TestComponentWithStepChange() {
				const created = createWizard({
					...defaultArgs,
					defaultValues: { name: "Valid", email: "valid@example.com" },
					onStepChange,
				});
				wizardMethods = created.methods as unknown as WizardResult["methods"];
				return (
					<created.Wizard>
						<created.Step step="step1">
							<div>Step 1</div>
						</created.Step>
						<created.Step step="step2">
							<div>Step 2</div>
						</created.Step>
					</created.Wizard>
				);
			}

			render(<TestComponentWithStepChange />);

			expect(wizardMethods).not.toBeNull();
			if (wizardMethods === null) throw new Error("unreachable");

			// Inicial: está no step1
			expect(onStepChange).not.toHaveBeenCalled();

			await act(async () => {
				const wm = wizardMethods;
				if (!wm) throw new Error("unreachable");
				await wm.next();
			});
			// Após next, change para step2; onStepChange deve ser chamado
			expect(onStepChange).toHaveBeenCalledTimes(1);

			const call = onStepChange.mock.calls[0]?.[0];
			// Deve conter alguns dados úteis
			expect(call).toEqual(
				expect.objectContaining({
					step: "step2",
					stepIndex: 1,
					currentStepState: expect.objectContaining({
						step: "step2",
						isValid: true,
						values: {
							email: "valid@example.com",
						},
					}),
					previousStepState: expect.objectContaining({
						step: "step1",
						isValid: true,
						values: {
							name: "Valid",
						},
					}),
					formState: expect.objectContaining({
						defaultValues: {
							name: "Valid",
							email: "valid@example.com",
						},
					}),
				})
			);
		});

		it("deve chamar onStepSubmit quando step é válido", async () => {
			const onStepSubmit = vi.fn();
			let wizardMethods: WizardResult["methods"] | null = null;

			function TestComponentWithStepSubmit() {
				const created = createWizard({
					...defaultArgs,
					defaultValues: { name: "Valid", email: "valid@example.com" },
					onStepSubmit,
					// Não precisa passar onComplete pois queremos testar só onStepSubmit aqui
				});
				wizardMethods = created.methods as unknown as WizardResult["methods"];
				return (
					<created.Wizard>
						<created.Step step="step1">
							<div>Step 1</div>
						</created.Step>
						<created.Step step="step2">
							<div>Step 2</div>
						</created.Step>
					</created.Wizard>
				);
			}

			render(<TestComponentWithStepSubmit />);

			expect(wizardMethods).not.toBeNull();
			if (wizardMethods === null) throw new Error("unreachable");

			// Avança do step 1 para step 2 -- onStepSubmit deve ser chamado para o step 1
			await act(async () => {
				const wm = wizardMethods;
				if (!wm) throw new Error("unreachable");
				await wm.next();
			});
			expect(onStepSubmit).toHaveBeenCalledTimes(1);
			const step1Call = onStepSubmit.mock.calls[0];
			expect(step1Call?.[0]).toMatchObject({
				name: "Valid",
			});
			expect(step1Call?.[1]).toEqual("step1");

			// No próximo next, submete o último step -- onStepSubmit deve ser chamado novamente para o último step
			await act(async () => {
				const wm = wizardMethods;
				if (!wm) throw new Error("unreachable");
				await wm.next();
			});
			expect(onStepSubmit).toHaveBeenCalledTimes(2);
			const step2Call = onStepSubmit.mock.calls[1];
			expect(step2Call?.[0]).toMatchObject({
				email: "valid@example.com",
			});
			expect(step2Call?.[1]).toEqual("step2");
		});
	});
});
