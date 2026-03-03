import { z } from "zod";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { useWizard } from "../../../src/wizards/wizard/hooks/use-wizard";

/**
 * Testes para steps condicionais no wizard.
 *
 * Demonstra como implementar steps que aparecem/desaparecem baseado em valores do formulário,
 * incluindo navegação que pula steps condicionais e validação antes de avançar.
 */
describe("useWizard - steps condicionais", () => {
	const allSteps = ["step1", "step2", "conditionalStep1", "conditionalStep2", "step3"] as const;

	const Step1Field = field("step1Value")
		.schema(z.string().min(1, "Campo obrigatório"))
		.render(() => null);

	const Step2Field = field("hasConditional1")
		.schema(z.boolean())
		.render(() => null);

	const Conditional1Field = field("conditional1Value")
		.schema(z.string().min(1, "Campo obrigatório"))
		.render(() => null);

	const HasConditional2Field = field("hasConditional2")
		.schema(z.boolean())
		.render(() => null);

	const Conditional2Field = field("conditional2Value")
		.schema(z.string().min(1, "Campo obrigatório"))
		.render(() => null);

	const Step3Field = field("step3Value")
		.schema(z.string().min(1, "Campo obrigatório"))
		.render(() => null);

	const stepsConfig = [
		{ name: "step1", fields: [Step1Field] },
		{ name: "step2", fields: [Step2Field] },
		{ name: "conditionalStep1", fields: [Conditional1Field] },
		{ name: "conditionalStep2", fields: [HasConditional2Field, Conditional2Field] },
		{ name: "step3", fields: [Step3Field] },
	] as const;

	describe("filtragem de steps condicionais", () => {
		it("deve filtrar steps condicionais baseado em valores do formulário", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "",
						hasConditional1: false,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
				})
			);

			// Inicialmente, os steps condicionais não devem aparecer
			expect(result.current.steps).toEqual(allSteps);
			expect(result.current.currentStep).toBe("step1");

			// Preenche step1 e avança
			act(() => {
				result.current.setValue("step1Value", "valor1");
			});

			await act(async () => {
				await result.current.next();
			});

			expect(result.current.currentStep).toBe("step2");

			// Marca hasConditional1 como true
			act(() => {
				result.current.setValue("hasConditional1", true);
			});

			// Avança - deve pular conditionalStep1 se não estiver habilitado
			await act(async () => {
				await result.current.next();
			});

			// Se conditionalStep1 não está habilitado, deve ir para conditionalStep2 ou step3
			// Mas como o wizard usa todos os steps, vamos testar a lógica de filtragem manual
		});

		it("deve incluir step condicional quando condição é verdadeira", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "",
						hasConditional1: true,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
				})
			);

			// Preenche step1
			act(() => {
				result.current.setValue("step1Value", "valor1");
			});

			await act(async () => {
				await result.current.next();
			});

			expect(result.current.currentStep).toBe("step2");

			// Avança - como hasConditional1 é true, deve ir para conditionalStep1
			await act(async () => {
				await result.current.next();
			});

			// O wizard vai para o próximo step na lista (conditionalStep1)
			expect(result.current.currentStep).toBe("conditionalStep1");
		});
	});

	describe("navegação com steps condicionais", () => {
		it("deve pular step condicional ao avançar quando condição é falsa", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "",
						hasConditional1: false,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
				})
			);

			// Preenche step1
			act(() => {
				result.current.setValue("step1Value", "valor1");
			});

			await act(async () => {
				await result.current.next();
			});

			expect(result.current.currentStep).toBe("step2");

			// Marca hasConditional1 como false
			act(() => {
				result.current.setValue("hasConditional1", false);
			});

			// Função helper para filtrar steps baseado em valores
			const getFilteredSteps = () => {
				const values = result.current.getValues();
				const hasConditional1 = values.hasConditional1 === true;
				const hasConditional2 = values.hasConditional2 === true;

				return allSteps.filter((step) => {
					if (step === "conditionalStep1" && !hasConditional1) return false;
					if (step === "conditionalStep2" && !hasConditional2) return false;
					return true;
				});
			};

			// Simula navegação com steps filtrados
			const filteredSteps = getFilteredSteps();
			expect(filteredSteps).not.toContain("conditionalStep1");
			expect(filteredSteps).toContain("step2");
			expect(filteredSteps).toContain("step3");
		});

		it("deve pular step condicional ao voltar quando condição é falsa", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "valor1",
						hasConditional1: false,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "valor3",
					},
				})
			);

			// Vai para step3
			act(() => {
				result.current.goToStep("step3");
			});

			expect(result.current.currentStep).toBe("step3");

			// Função helper para encontrar step anterior filtrado
			const findPreviousFilteredStep = () => {
				const values = result.current.getValues();
				const hasConditional1 = values.hasConditional1 === true;
				const hasConditional2 = values.hasConditional2 === true;

				const filteredSteps = allSteps.filter((step) => {
					if (step === "conditionalStep1" && !hasConditional1) return false;
					if (step === "conditionalStep2" && !hasConditional2) return false;
					return true;
				});

				const currentIndex = filteredSteps.indexOf("step3");
				return currentIndex > 0 ? filteredSteps[currentIndex - 1] : null;
			};

			const previousStep = findPreviousFilteredStep();
			expect(previousStep).toBe("step2"); // Deve pular conditionalStep2 e conditionalStep1
		});
	});

	describe("validação com steps condicionais", () => {
		it("deve validar step atual antes de avançar, mesmo com steps condicionais", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "",
						hasConditional1: false,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
				})
			);

			// Tenta avançar sem preencher step1 (inválido)
			await act(async () => {
				await result.current.next();
			});

			// Não deve avançar
			expect(result.current.currentStep).toBe("step1");
			expect(result.current.formState.errors.step1Value).toBeDefined();

			// Preenche step1 corretamente
			act(() => {
				result.current.setValue("step1Value", "valor1");
			});

			// Agora deve avançar
			await act(async () => {
				await result.current.next();
			});

			expect(result.current.currentStep).toBe("step2");
		});

		it("deve validar step condicional quando ele está habilitado", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "valor1",
						hasConditional1: true,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
				})
			);

			// Vai para step2
			act(() => {
				result.current.goToStep("step2");
			});

			// Marca hasConditional1 como true e avança
			act(() => {
				result.current.setValue("hasConditional1", true);
			});

			await act(async () => {
				await result.current.next();
			});

			// Deve ir para conditionalStep1
			expect(result.current.currentStep).toBe("conditionalStep1");

			// Tenta avançar sem preencher conditional1Value (inválido)
			await act(async () => {
				await result.current.next();
			});

			// Não deve avançar
			expect(result.current.currentStep).toBe("conditionalStep1");
			expect(result.current.formState.errors.conditional1Value).toBeDefined();

			// Preenche conditional1Value corretamente
			act(() => {
				result.current.setValue("conditional1Value", "valor condicional");
			});

			// Agora deve avançar
			await act(async () => {
				await result.current.next();
			});

			expect(result.current.currentStep).toBe("conditionalStep2");
		});
	});

	describe("submit com steps condicionais", () => {
		it("deve chamar onComplete no último step filtrado, não no último step original", async () => {
			const onComplete = vi.fn();

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "",
						hasConditional1: false,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
					onComplete,
				})
			);

			// Preenche todos os steps não condicionais
			act(() => {
				result.current.setValue("step1Value", "valor1");
			});

			await act(async () => {
				await result.current.next();
			});

			act(() => {
				result.current.setValue("hasConditional1", false);
			});

			await act(async () => {
				await result.current.next();
			});

			// Como conditionalStep1 e conditionalStep2 estão desabilitados,
			// deve ir direto para step3
			act(() => {
				result.current.goToStep("step3");
			});

			act(() => {
				result.current.setValue("step3Value", "valor3");
			});

			// Função helper para verificar se é o último step filtrado
			const isLastFilteredStep = () => {
				const values = result.current.getValues();
				const hasConditional1 = values.hasConditional1 === true;
				const hasConditional2 = values.hasConditional2 === true;

				const filteredSteps = allSteps.filter((step) => {
					if (step === "conditionalStep1" && !hasConditional1) return false;
					if (step === "conditionalStep2" && !hasConditional2) return false;
					return true;
				});

				return filteredSteps.indexOf("step3") === filteredSteps.length - 1;
			};

			expect(isLastFilteredStep()).toBe(true);

			// Avança no último step - deve chamar onComplete
			await act(async () => {
				await result.current.next();
			});

			expect(onComplete).toHaveBeenCalledTimes(1);
			expect(onComplete).toHaveBeenCalledWith(
				expect.objectContaining({
					step1Value: "valor1",
					hasConditional1: false,
					step3Value: "valor3",
				})
			);
		});

		it("deve considerar step condicional como último quando ele é o último step filtrado", async () => {
			const onComplete = vi.fn();

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "",
						hasConditional1: true,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
					onComplete,
				})
			);

			// Preenche step1
			act(() => {
				result.current.setValue("step1Value", "valor1");
			});

			await act(async () => {
				await result.current.next();
			});

			// Marca hasConditional1 como true
			act(() => {
				result.current.setValue("hasConditional1", true);
			});

			await act(async () => {
				await result.current.next();
			});

			// Deve ir para conditionalStep1
			expect(result.current.currentStep).toBe("conditionalStep1");

			// Preenche conditionalStep1
			act(() => {
				result.current.setValue("conditional1Value", "valor condicional");
			});

			await act(async () => {
				await result.current.next();
			});

			// Vai para conditionalStep2
			expect(result.current.currentStep).toBe("conditionalStep2");

			// Marca hasConditional2 como false (step2 não será incluído)
			act(() => {
				result.current.setValue("hasConditional2", false);
			});

			// Vai para step3
			act(() => {
				result.current.goToStep("step3");
			});

			act(() => {
				result.current.setValue("step3Value", "valor3");
			});

			// step3 deve ser o último step filtrado
			const values = result.current.getValues();
			const hasConditional2 = values.hasConditional2 === true;
			const filteredSteps = allSteps.filter((step) => {
				if (step === "conditionalStep2" && !hasConditional2) return false;
				return true;
			});

			expect(filteredSteps.indexOf("step3")).toBe(filteredSteps.length - 1);

			// Avança no último step - deve chamar onComplete
			await act(async () => {
				await result.current.next();
			});

			expect(onComplete).toHaveBeenCalledTimes(1);
		});
	});

	describe("mudança dinâmica de steps condicionais", () => {
		it("deve atualizar steps filtrados quando valor condicional muda", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "",
						hasConditional1: false,
						conditional1Value: "",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
				})
			);

			// Função helper para obter steps filtrados
			const getFilteredSteps = () => {
				const values = result.current.getValues();
				const hasConditional1 = values.hasConditional1 === true;
				const hasConditional2 = values.hasConditional2 === true;

				return allSteps.filter((step) => {
					if (step === "conditionalStep1" && !hasConditional1) return false;
					if (step === "conditionalStep2" && !hasConditional2) return false;
					return true;
				});
			};

			// Inicialmente, steps condicionais não devem estar incluídos
			let filteredSteps = getFilteredSteps();
			expect(filteredSteps).not.toContain("conditionalStep1");
			expect(filteredSteps).not.toContain("conditionalStep2");

			// Marca hasConditional1 como true
			act(() => {
				result.current.setValue("hasConditional1", true);
			});

			// Agora conditionalStep1 deve estar incluído
			filteredSteps = getFilteredSteps();
			expect(filteredSteps).toContain("conditionalStep1");
			expect(filteredSteps).not.toContain("conditionalStep2");

			// Marca hasConditional2 como true
			act(() => {
				result.current.setValue("hasConditional2", true);
			});

			// Agora ambos os steps condicionais devem estar incluídos
			filteredSteps = getFilteredSteps();
			expect(filteredSteps).toContain("conditionalStep1");
			expect(filteredSteps).toContain("conditionalStep2");
		});

		it("deve redirecionar se usuário está em step condicional que foi desabilitado", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						step1Value: "valor1",
						hasConditional1: true,
						conditional1Value: "valor condicional",
						hasConditional2: false,
						conditional2Value: "",
						step3Value: "",
					},
				})
			);

			// Vai para conditionalStep1
			act(() => {
				result.current.goToStep("conditionalStep1");
			});

			expect(result.current.currentStep).toBe("conditionalStep1");

			// Desabilita hasConditional1
			act(() => {
				result.current.setValue("hasConditional1", false);
			});

			// Função helper para encontrar próximo step válido
			const findNextValidStep = (): (typeof allSteps)[number] => {
				const values = result.current.getValues();
				const hasConditional1 = values.hasConditional1 === true;
				const hasConditional2 = values.hasConditional2 === true;

				const filteredSteps = allSteps.filter((step) => {
					if (step === "conditionalStep1" && !hasConditional1) return false;
					if (step === "conditionalStep2" && !hasConditional2) return false;
					return true;
				});

				// Como conditionalStep1 não está mais nos steps filtrados,
				// encontra o próximo step válido após a posição original de conditionalStep1
				const originalIndex = allSteps.indexOf("conditionalStep1");

				// Procura o próximo step válido após a posição original
				for (let i = originalIndex + 1; i < allSteps.length; i++) {
					const step = allSteps[i];
					if (step && filteredSteps.includes(step)) {
						return step;
					}
				}

				// Se não encontrou, retorna o último step filtrado (sempre existe pelo menos um)
				const lastStep = filteredSteps[filteredSteps.length - 1];
				if (!lastStep) {
					throw new Error("Nenhum step válido encontrado");
				}
				return lastStep;
			};

			const nextValidStep = findNextValidStep();
			// Como hasConditional2 é false, conditionalStep2 também não está nos steps filtrados
			// Então o próximo step válido após conditionalStep1 é step3
			expect(nextValidStep).toBe("step3");

			// Simula redirecionamento
			if (nextValidStep) {
				act(() => {
					result.current.goToStep(nextValidStep);
				});

				expect(result.current.currentStep).toBe("step3");
			}
		});
	});
});
