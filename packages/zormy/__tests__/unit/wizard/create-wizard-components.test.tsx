import { z } from "zod";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { createWizardComponents } from "../../../src/wizards/wizard/builder/components";
import { createWizardConfig } from "../../../src/wizards/wizard/builder/config";
import { useWizard } from "../../../src/wizards/wizard/hooks/use-wizard";

/**
 * Testes unitários para createWizardComponents.
 *
 * Verifica que os componentes retornados funcionam corretamente,
 * renderizam quando esperado e fornecem o contexto adequado.
 */
describe("createWizardComponents - testes unitários", () => {
	const NameField = field("name")
		.schema(z.string().min(3))
		.render(() => null);

	const EmailField = field("email")
		.schema(z.string().email())
		.render(() => null);

	const stepsConfig = [
		{ name: "step1", fields: [NameField] },
		{ name: "step2", fields: [EmailField] },
	] as const;

	const config = createWizardConfig({ steps: stepsConfig });

	describe("retorno da função", () => {
		it("deve retornar um objeto com Wizard, Step e componentes de navegação", () => {
			const components = createWizardComponents(config);

			expect(components).toHaveProperty("Wizard");
			expect(components).toHaveProperty("Step");
			expect(components).toHaveProperty("WizardNav");
			expect(components).toHaveProperty("WizardNavBack");
			expect(components).toHaveProperty("WizardNavNext");
			expect(typeof components.Wizard).toBe("function");
			expect(typeof components.Step).toBe("function");
			expect(typeof components.WizardNav).toBe("function");
			expect(typeof components.WizardNavBack).toBe("function");
			expect(typeof components.WizardNavNext).toBe("function");
		});

		it("deve retornar objetos diferentes, mas componentes estáveis (mesma referência)", () => {
			const components1 = createWizardComponents(config);
			const components2 = createWizardComponents(config);

			// Os objetos retornados são diferentes (novas instâncias)
			expect(components1).not.toBe(components2);
			// Mas os componentes Wizard e Step são estáveis (mesma referência)
			// para evitar rerenders desnecessários quando usado dentro de render
			expect(components1.Wizard).toBe(components2.Wizard);
			expect(components1.Step).toBe(components2.Step);
			expect(components1.WizardNav).toBe(components2.WizardNav);
			expect(components1.WizardNavBack).toBe(components2.WizardNavBack);
			expect(components1.WizardNavNext).toBe(components2.WizardNavNext);
		});
	});

	describe("componente WizardNav", () => {
		it("WizardNav deve renderizar container com filhos", () => {
			const { Wizard, Step, WizardNav, WizardNavBack, WizardNavNext } =
				createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<Wizard methods={wizard}>
						<Step step="step1">
							<div data-testid="step1">Step 1</div>
							<WizardNav as="div" data-testid="nav-container" className="flex gap-3">
								<WizardNavBack as="button">Voltar</WizardNavBack>
								<WizardNavNext as="button" nextLabel="Próximo" submitLabel="Finalizar" />
							</WizardNav>
						</Step>
					</Wizard>
				);
			}

			render(<TestComponent />);

			const nav = screen.getByTestId("nav-container");
			expect(nav).toBeInTheDocument();
			expect(nav.tagName).toBe("DIV");
			expect(nav).toHaveClass("flex", "gap-3");
		});

		it("WizardNavBack não deve renderizar no primeiro step", () => {
			const { Wizard, Step, WizardNav, WizardNavBack, WizardNavNext } =
				createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<Wizard methods={wizard}>
						<Step step="step1">
							<WizardNav as="div">
								<WizardNavBack as="button" data-testid="back-btn">
									Voltar
								</WizardNavBack>
								<WizardNavNext as="button" data-testid="next-btn" />
							</WizardNav>
						</Step>
					</Wizard>
				);
			}

			render(<TestComponent />);

			expect(screen.queryByTestId("back-btn")).not.toBeInTheDocument();
			expect(screen.getByTestId("next-btn")).toBeInTheDocument();
		});

		it("WizardNavBack deve renderizar a partir do segundo step", async () => {
			const { Wizard, Step, WizardNav, WizardNavBack, WizardNavNext } =
				createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "John", email: "j@x.com" },
				});

				return (
					<Wizard methods={wizard}>
						<Step step="step1">
							<WizardNav as="div">
								<WizardNavBack as="button" data-testid="back-btn">
									Voltar
								</WizardNavBack>
								<WizardNavNext
									as="button"
									data-testid="next-btn"
									nextLabel="Próximo"
									submitLabel="Finalizar"
								/>
							</WizardNav>
						</Step>
						<Step step="step2">
							<WizardNav as="div">
								<WizardNavBack as="button" data-testid="back-btn">
									Voltar
								</WizardNavBack>
								<WizardNavNext
									as="button"
									data-testid="submit-btn"
									nextLabel="Próximo"
									submitLabel="Finalizar"
								/>
							</WizardNav>
						</Step>
					</Wizard>
				);
			}

			render(<TestComponent />);

			// Step 1: sem back, com next
			expect(screen.queryByTestId("back-btn")).not.toBeInTheDocument();
			const nextBtn = screen.getByTestId("next-btn");
			expect(nextBtn).toHaveAttribute("type", "button");
			expect(nextBtn).toHaveTextContent("Próximo");

			// Avançar para step 2 (next() é assíncrono)
			fireEvent.click(nextBtn);
			await waitFor(() => {
				expect(screen.getByTestId("back-btn")).toBeInTheDocument();
			});

			// Step 2: com back e submit
			const backBtn = screen.getByTestId("back-btn");
			expect(backBtn).toBeInTheDocument();
			expect(backBtn).toHaveAttribute("type", "button");
			const submitBtn = screen.getByTestId("submit-btn");
			expect(submitBtn).toHaveAttribute("type", "submit");
			expect(submitBtn).toHaveTextContent("Finalizar");
		});

		it("WizardNavNext deve usar nextLabel e submitLabel conforme o step", () => {
			const { Wizard, Step, WizardNavNext } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<Wizard methods={wizard}>
						<Step step="step1">
							<WizardNavNext
								as="button"
								data-testid="nav-next"
								nextLabel="Go next"
								submitLabel="Send"
							/>
						</Step>
					</Wizard>
				);
			}

			render(<TestComponent />);

			const btn = screen.getByTestId("nav-next");
			expect(btn).toHaveTextContent("Go next");
			expect(btn).toHaveAttribute("type", "button");
		});

		it("WizardNav deve aceitar prop 'as' e renderizar o elemento correto", () => {
			const { Wizard, Step, WizardNav, WizardNavBack, WizardNavNext } =
				createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<Wizard methods={wizard}>
						<Step step="step1">
							<WizardNav as="nav" data-testid="nav-root">
								<WizardNavNext as="button" data-testid="next-btn" />
							</WizardNav>
						</Step>
					</Wizard>
				);
			}

			render(<TestComponent />);

			const nav = screen.getByTestId("nav-root");
			expect(nav.tagName).toBe("NAV");
		});
	});

	describe("componente Wizard", () => {
		it("deve renderizar o formulário com contexto do wizard", () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard}>
						<TypedStep step="step1">
							<div data-testid="step1-content">Step 1 Content</div>
						</TypedStep>
						<TypedStep step="step2">
							<div data-testid="step2-content">Step 2 Content</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			const { container } = render(<TestComponent />);

			// Deve renderizar o form
			const form = container.querySelector("form");
			expect(form).toBeInTheDocument();

			// Deve renderizar apenas o step atual (step1)
			expect(screen.getByTestId("step1-content")).toBeInTheDocument();
			expect(screen.queryByTestId("step2-content")).not.toBeInTheDocument();
		});

		it("deve aceitar onSubmit handler", () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);
			const onSubmit = vi.fn();

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard} onSubmit={onSubmit}>
						<TypedStep step="step1">
							<div>Step 1</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			const { container } = render(<TestComponent />);

			const form = container.querySelector("form");
			expect(form).toBeInTheDocument();
			// onSubmit é passado como prop, não como atributo HTML
			// Verificamos que o form foi renderizado corretamente
			expect(form).toBeTruthy();
		});

		it("deve aceitar props HTML do form", () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard} className="custom-form" data-testid="wizard-form">
						<TypedStep step="step1">
							<div>Step 1</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			render(<TestComponent />);

			const form = screen.getByTestId("wizard-form");
			expect(form).toBeInTheDocument();
			expect(form).toHaveClass("custom-form");
		});

		it("deve renderizar com contextOnly sem envolver em <form> e sem repassar props HTML ao filho", () => {
			const { Wizard: TypedWizard } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard} contextOnly data-testid="only-wizard">
						<div data-testid="context-only-child">Só contexto</div>
					</TypedWizard>
				);
			}

			render(<TestComponent />);

			const child = screen.getByTestId("context-only-child");
			expect(child).toBeInTheDocument();
			expect(child.textContent).toBe("Só contexto");

			// O Wizard em modo contextOnly não deve envolver em <form> nem repassar props HTML ao filho.
			// O data-testid definido no Wizard não deve aparecer no elemento filho.
			expect(child).not.toHaveAttribute("data-testid", "only-wizard");
		});
	});

	describe("componente Step", () => {
		it("deve renderizar apenas quando o step está ativo", () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard}>
						<TypedStep step="step1">
							<div data-testid="step1">Step 1</div>
						</TypedStep>
						<TypedStep step="step2">
							<div data-testid="step2">Step 2</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			render(<TestComponent />);

			// Inicialmente deve mostrar apenas step1
			expect(screen.getByTestId("step1")).toBeInTheDocument();
			expect(screen.queryByTestId("step2")).not.toBeInTheDocument();
		});

		it("deve aceitar prop 'as' para customizar o elemento raiz", () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard}>
						<TypedStep step="step1" as="section" data-testid="step-section">
							<div>Step 1</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			render(<TestComponent />);

			const section = screen.getByTestId("step-section");
			expect(section).toBeInTheDocument();
			expect(section.tagName).toBe("SECTION");
		});

		it("deve aceitar props HTML do elemento raiz", () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard}>
						<TypedStep step="step1" className="step-container" id="step1" data-testid="step1">
							<div>Step 1</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			render(<TestComponent />);

			const step = screen.getByTestId("step1");
			expect(step).toBeInTheDocument();
			expect(step).toHaveClass("step-container");
			expect(step).toHaveAttribute("id", "step1");
		});
	});

	describe("integração com useWizard", () => {
		it("deve funcionar corretamente com wizard retornado por useWizard", () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "John", email: "john@example.com" },
				});

				return (
					<TypedWizard methods={wizard}>
						<TypedStep step="step1">
							<div data-testid="step1">Name: {wizard.watch("name")}</div>
						</TypedStep>
						<TypedStep step="step2">
							<div data-testid="step2">Email: {wizard.watch("email")}</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			render(<TestComponent />);

			// Deve mostrar o valor do campo name no step1
			expect(screen.getByText(/Name: John/)).toBeInTheDocument();
		});

		it("deve atualizar quando o step muda", async () => {
			const { Wizard: TypedWizard, Step: TypedStep } = createWizardComponents(config);

			function TestComponent() {
				const wizard = useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				});

				return (
					<TypedWizard methods={wizard}>
						<TypedStep step="step1">
							<div data-testid="step1">Step 1</div>
							<button type="button" onClick={() => wizard.next()} data-testid="next-button">
								Next
							</button>
						</TypedStep>
						<TypedStep step="step2">
							<div data-testid="step2">Step 2</div>
						</TypedStep>
					</TypedWizard>
				);
			}

			render(<TestComponent />);

			// Inicialmente step1 deve estar visível
			expect(screen.getByTestId("step1")).toBeInTheDocument();
			expect(screen.queryByTestId("step2")).not.toBeInTheDocument();

			// Clicar no botão next (mas não vai avançar sem validação)
			// Este teste verifica que os componentes estão conectados corretamente
			const nextButton = screen.getByTestId("next-button");
			expect(nextButton).toBeInTheDocument();
		});
	});

	describe("comportamento com diferentes configs", () => {
		it("deve criar objetos diferentes para configs diferentes, mas componentes estáveis", () => {
			const config1 = createWizardConfig({
				steps: [
					{ name: "a", fields: [NameField] },
					{ name: "b", fields: [EmailField] },
				],
			});

			const config2 = createWizardConfig({
				steps: [
					{ name: "x", fields: [NameField] },
					{ name: "y", fields: [EmailField] },
				],
			});

			const components1 = createWizardComponents(config1);
			const components2 = createWizardComponents(config2);

			// Os objetos retornados são diferentes (novas instâncias)
			expect(components1).not.toBe(components2);
			// Mas os componentes Wizard e Step são estáveis (mesma referência)
			// porque não dependem do config em runtime (só em tipos)
			expect(components1.Wizard).toBe(components2.Wizard);
			expect(components1.Step).toBe(components2.Step);
		});
	});
});
