import { z } from "zod";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { useWizard } from "../../../src/wizards/wizard/hooks/use-wizard";

/**
 * Testes para verificar se a ordem dos steps definida no array é respeitada.
 *
 * Estes testes verificam se o wizard mantém a ordem original dos steps,
 * especialmente quando há `shouldIncludeStep` que filtra steps condicionais.
 */
describe("useWizard - ordem dos steps", () => {
	/**
	 * Simula o cenário do preFunding wizard:
	 * - Steps definidos: ["wantToContribute", "refuseReason", "selectQuota", "manageCompanies", "review", "proposal"]
	 * - Quando wantToContribute === false: apenas ["wantToContribute", "refuseReason"]
	 * - Quando wantToContribute === true: todos exceto ["wantToContribute", "refuseReason"]
	 */
	const allSteps = [
		"wantToContribute",
		"refuseReason",
		"selectQuota",
		"manageCompanies",
		"review",
		"proposal",
	] as const;

	const WantToContributeField = field("wantToContribute")
		.schema(z.boolean())
		.render(() => null);

	const RefuseReasonField = field("refuseReason")
		.schema(z.string().min(1, "Campo obrigatório"))
		.render(() => null);

	const SelectQuotaField = field("selectQuota")
		.schema(z.string().min(1, "Campo obrigatório"))
		.render(() => null);

	const ManageCompaniesField = field("manageCompanies")
		.schema(z.string().optional())
		.render(() => null);

	const ReviewField = field("review")
		.schema(z.string().optional())
		.render(() => null);

	const ProposalField = field("proposal")
		.schema(z.string().optional())
		.render(() => null);

	const stepsConfig = [
		{ name: "wantToContribute", fields: [WantToContributeField] },
		{ name: "refuseReason", fields: [RefuseReasonField] },
		{ name: "selectQuota", fields: [SelectQuotaField] },
		{ name: "manageCompanies", fields: [ManageCompaniesField] },
		{ name: "review", fields: [ReviewField] },
		{ name: "proposal", fields: [ProposalField] },
	] as const;

	describe("ordem dos steps sem shouldIncludeStep", () => {
		it("deve manter a ordem exata dos steps definidos no array", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
				})
			);

			// Verifica que a ordem dos steps é exatamente a mesma do array original
			expect(result.current.steps).toEqual(allSteps);
			expect(result.current.steps[0]).toBe("wantToContribute");
			expect(result.current.steps[1]).toBe("refuseReason");
			expect(result.current.steps[2]).toBe("selectQuota");
			expect(result.current.steps[3]).toBe("manageCompanies");
			expect(result.current.steps[4]).toBe("review");
			expect(result.current.steps[5]).toBe("proposal");
		});

		it("deve navegar pelos steps na ordem correta (next)", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "quota1",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
				})
			);

			// Começa no primeiro step
			expect(result.current.currentStep).toBe("wantToContribute");
			expect(result.current.currentStepIndex).toBe(0);

			// Preenche e avança
			act(() => {
				result.current.setValue("wantToContribute", true);
			});

			await act(async () => {
				await result.current.next();
			});

			// Deve ir para o segundo step na ordem
			expect(result.current.currentStep).toBe("refuseReason");
			expect(result.current.currentStepIndex).toBe(1);

			// Avança novamente
			act(() => {
				result.current.setValue("refuseReason", "reason");
			});

			await act(async () => {
				await result.current.next();
			});

			// Deve ir para o terceiro step na ordem
			expect(result.current.currentStep).toBe("selectQuota");
			expect(result.current.currentStepIndex).toBe(2);
		});

		it("deve navegar pelos steps na ordem correta (back)", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "quota1",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
				})
			);

			// Vai para o terceiro step
			act(() => {
				result.current.goToStep("selectQuota");
			});

			expect(result.current.currentStep).toBe("selectQuota");
			expect(result.current.currentStepIndex).toBe(2);

			// Volta
			act(() => {
				result.current.back();
			});

			// Deve voltar para o segundo step na ordem
			expect(result.current.currentStep).toBe("refuseReason");
			expect(result.current.currentStepIndex).toBe(1);

			// Volta novamente
			act(() => {
				result.current.back();
			});

			// Deve voltar para o primeiro step na ordem
			expect(result.current.currentStep).toBe("wantToContribute");
			expect(result.current.currentStepIndex).toBe(0);
		});
	});

	describe("ordem dos steps com shouldIncludeStep", () => {
		it("deve iniciar no primeiro step do array original quando wantToContribute é undefined", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						// wantToContribute não está definido (undefined)
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			// Aguarda o wizard processar os valores iniciais
			await waitFor(() => {
				expect(result.current.steps.length).toBeGreaterThan(0);
			});

			// Quando wantToContribute é undefined, deve iniciar no primeiro step do array original
			expect(result.current.currentStep).toBe("wantToContribute");
			expect(result.current.currentStepIndex).toBe(0);
			expect(result.current.isFirstStep).toBe(true);
		});

		it("deve manter a ordem original dos steps quando filtrados (wantToContribute = false)", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: false,
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			// Aguarda o wizard processar os valores iniciais
			await waitFor(() => {
				expect(result.current.steps.length).toBeGreaterThan(0);
			});

			// Quando wantToContribute === false, deve ter apenas 2 steps
			// e devem estar na ordem original: ["wantToContribute", "refuseReason"]
			const filteredSteps = result.current.steps;
			expect(filteredSteps.length).toBe(2);
			expect(filteredSteps[0]).toBe("wantToContribute");
			expect(filteredSteps[1]).toBe("refuseReason");

			// Verifica que a ordem está correta comparando com o array original
			const expectedOrder = ["wantToContribute", "refuseReason"];
			expect(filteredSteps).toEqual(expectedOrder);
		});

		it("deve manter a ordem original dos steps quando filtrados (wantToContribute = true)", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			// Aguarda o wizard processar os valores iniciais
			await waitFor(() => {
				expect(result.current.steps.length).toBeGreaterThan(0);
			});

			// Quando wantToContribute === true, deve ter 5 steps
			// na ordem original: ["wantToContribute", "selectQuota", "manageCompanies", "review", "proposal"]
			const filteredSteps = result.current.steps;
			expect(filteredSteps.length).toBe(5);
			expect(filteredSteps[0]).toBe("wantToContribute");
			expect(filteredSteps[1]).toBe("selectQuota");
			expect(filteredSteps[2]).toBe("manageCompanies");
			expect(filteredSteps[3]).toBe("review");
			expect(filteredSteps[4]).toBe("proposal");

			// Verifica que a ordem está correta comparando com o array original
			const expectedOrder = [
				"wantToContribute",
				"selectQuota",
				"manageCompanies",
				"review",
				"proposal",
			];
			expect(filteredSteps).toEqual(expectedOrder);
		});

		it("deve navegar pelos steps filtrados na ordem correta (next) - wantToContribute = false", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: false,
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			await waitFor(() => {
				expect(result.current.steps.length).toBe(2);
			});

			// Começa no primeiro step filtrado
			expect(result.current.currentStep).toBe("wantToContribute");
			expect(result.current.currentStepIndex).toBe(0);
			expect(result.current.isFirstStep).toBe(true);
			expect(result.current.isLastStep).toBe(false);

			// Preenche e avança
			act(() => {
				result.current.setValue("wantToContribute", false);
			});

			await act(async () => {
				await result.current.next();
			});

			// Deve ir para o segundo step filtrado na ordem
			expect(result.current.currentStep).toBe("refuseReason");
			expect(result.current.currentStepIndex).toBe(1);
			expect(result.current.isFirstStep).toBe(false);
			expect(result.current.isLastStep).toBe(true);
		});

		it("deve navegar pelos steps filtrados na ordem correta (next) - wantToContribute = true", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			await waitFor(() => {
				expect(result.current.steps.length).toBe(5);
			});

			// Começa no primeiro step filtrado (wantToContribute está incluído)
			expect(result.current.currentStep).toBe("wantToContribute");
			expect(result.current.currentStepIndex).toBe(0);
			expect(result.current.isFirstStep).toBe(true);
			expect(result.current.isLastStep).toBe(false);

			// Preenche e avança
			act(() => {
				result.current.setValue("wantToContribute", true);
			});

			await act(async () => {
				await result.current.next();
			});

			// Deve ir para o segundo step filtrado na ordem
			expect(result.current.currentStep).toBe("selectQuota");
			expect(result.current.currentStepIndex).toBe(1);

			// Preenche e avança
			act(() => {
				result.current.setValue("selectQuota", "quota1");
			});

			await act(async () => {
				await result.current.next();
			});

			// Deve ir para o terceiro step filtrado na ordem
			expect(result.current.currentStep).toBe("manageCompanies");
			expect(result.current.currentStepIndex).toBe(2);

			// Avança novamente
			await act(async () => {
				await result.current.next();
			});

			// Deve ir para o quarto step filtrado na ordem
			expect(result.current.currentStep).toBe("review");
			expect(result.current.currentStepIndex).toBe(3);

			// Avança novamente
			await act(async () => {
				await result.current.next();
			});

			// Deve ir para o último step filtrado na ordem
			expect(result.current.currentStep).toBe("proposal");
			expect(result.current.currentStepIndex).toBe(4);
			expect(result.current.isLastStep).toBe(true);
		});

		it("deve navegar pelos steps filtrados na ordem correta (back) - wantToContribute = true", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "quota1",
						manageCompanies: "companies",
						review: "review",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			await waitFor(() => {
				expect(result.current.steps.length).toBe(5);
			});

			// Vai para o último step filtrado
			act(() => {
				result.current.goToStep("proposal");
			});

			expect(result.current.currentStep).toBe("proposal");
			expect(result.current.currentStepIndex).toBe(4);

			// Volta
			act(() => {
				result.current.back();
			});

			// Deve voltar para o quarto step filtrado na ordem
			expect(result.current.currentStep).toBe("review");
			expect(result.current.currentStepIndex).toBe(3);

			// Volta novamente
			act(() => {
				result.current.back();
			});

			// Deve voltar para o terceiro step filtrado na ordem
			expect(result.current.currentStep).toBe("manageCompanies");
			expect(result.current.currentStepIndex).toBe(2);

			// Volta novamente
			act(() => {
				result.current.back();
			});

			// Deve voltar para o segundo step filtrado na ordem
			expect(result.current.currentStep).toBe("selectQuota");
			expect(result.current.currentStepIndex).toBe(1);

			// Volta novamente
			act(() => {
				result.current.back();
			});

			// Deve voltar para o primeiro step filtrado na ordem
			expect(result.current.currentStep).toBe("wantToContribute");
			expect(result.current.currentStepIndex).toBe(0);
		});

		it("deve manter a ordem correta mesmo quando o step atual muda dinamicamente", async () => {
			const { result } = renderHook(
				({ wantToContribute }) =>
					useWizard({
						steps: stepsConfig,
						defaultValues: {
							wantToContribute,
							refuseReason: "",
							selectQuota: "",
							manageCompanies: "",
							review: "",
							proposal: "",
						},
						shouldIncludeStep: (step, formValues) => {
							const wantToContribute = formValues["wantToContribute"];

							const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

							const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
								(s) => s === "wantToContribute" || !refuseFlow.includes(s)
							);

							if (wantToContribute === false) {
								return refuseFlow.includes(step);
							}

							return selectQuotaFlow.includes(step);
						},
					}),
				{
					initialProps: {
						wantToContribute: false as boolean,
					},
				}
			);

			await waitFor(() => {
				expect(result.current.steps.length).toBe(2);
			});

			// Inicialmente com wantToContribute = false
			expect(result.current.steps).toEqual(["wantToContribute", "refuseReason"]);
			expect(result.current.currentStep).toBe("wantToContribute");

			// Muda para wantToContribute = true
			act(() => {
				result.current.setValue("wantToContribute", true);
			});

			await waitFor(() => {
				expect(result.current.steps.length).toBe(5);
			});

			// Agora deve ter os steps na ordem correta
			expect(result.current.steps).toEqual([
				"wantToContribute",
				"selectQuota",
				"manageCompanies",
				"review",
				"proposal",
			]);

			// O step atual deve ser o primeiro dos steps filtrados
			expect(result.current.currentStep).toBe("wantToContribute");
			expect(result.current.currentStepIndex).toBe(0);
		});
	});

	describe("índices dos steps", () => {
		it("deve calcular currentStepIndex corretamente baseado nos steps filtrados", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			await waitFor(() => {
				expect(result.current.steps.length).toBe(5);
			});

			const filteredSteps = result.current.steps;

			// Verifica que o índice corresponde à posição no array filtrado
			act(() => {
				result.current.goToStep("wantToContribute");
			});
			expect(result.current.currentStepIndex).toBe(filteredSteps.indexOf("wantToContribute"));
			expect(result.current.currentStepIndex).toBe(0);

			act(() => {
				result.current.goToStep("selectQuota");
			});
			expect(result.current.currentStepIndex).toBe(filteredSteps.indexOf("selectQuota"));
			expect(result.current.currentStepIndex).toBe(1);

			act(() => {
				result.current.goToStep("manageCompanies");
			});
			expect(result.current.currentStepIndex).toBe(filteredSteps.indexOf("manageCompanies"));
			expect(result.current.currentStepIndex).toBe(2);

			act(() => {
				result.current.goToStep("review");
			});
			expect(result.current.currentStepIndex).toBe(filteredSteps.indexOf("review"));
			expect(result.current.currentStepIndex).toBe(3);

			act(() => {
				result.current.goToStep("proposal");
			});
			expect(result.current.currentStepIndex).toBe(filteredSteps.indexOf("proposal"));
			expect(result.current.currentStepIndex).toBe(4);
		});

		it("deve calcular isFirstStep e isLastStep corretamente baseado nos steps filtrados", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: {
						wantToContribute: true,
						refuseReason: "",
						selectQuota: "",
						manageCompanies: "",
						review: "",
						proposal: "",
					},
					shouldIncludeStep: (step, formValues) => {
						const wantToContribute = formValues["wantToContribute"];

						const refuseFlow: (typeof allSteps)[number][] = ["wantToContribute", "refuseReason"];

						const selectQuotaFlow: (typeof allSteps)[number][] = allSteps.filter(
							(s) => s === "wantToContribute" || !refuseFlow.includes(s)
						);

						if (wantToContribute === false) {
							return refuseFlow.includes(step);
						}

						return selectQuotaFlow.includes(step);
					},
				})
			);

			await waitFor(() => {
				expect(result.current.steps.length).toBe(5);
			});

			// Primeiro step
			act(() => {
				result.current.goToStep("wantToContribute");
			});
			expect(result.current.isFirstStep).toBe(true);
			expect(result.current.isLastStep).toBe(false);

			// Step do meio
			act(() => {
				result.current.goToStep("review");
			});
			expect(result.current.isFirstStep).toBe(false);
			expect(result.current.isLastStep).toBe(false);

			// Último step
			act(() => {
				result.current.goToStep("proposal");
			});
			expect(result.current.isFirstStep).toBe(false);
			expect(result.current.isLastStep).toBe(true);
		});
	});
});
