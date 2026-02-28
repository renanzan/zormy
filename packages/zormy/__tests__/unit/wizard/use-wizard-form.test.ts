import { z } from "zod";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useWizardForm } from "../../../src/wizards/wizard/hooks/use-wizard-form";

describe("useWizardForm", () => {
	it("deve inicializar wizard form corretamente", () => {
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string() });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "", email: "" },
			})
		);

		expect(result.current.currentStep).toBe("step1");
		expect(result.current.steps).toEqual(["step1", "step2"]);
		expect(result.current.totalSteps).toBe(2);
	});

	it("deve validar step atual antes de avançar", async () => {
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string().min(3) });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "", email: "" },
			})
		);

		// Tenta avançar com dados inválidos
		await act(async () => {
			await result.current.next();
		});

		// Não deve avançar
		expect(result.current.currentStep).toBe("step1");

		// Preenche dados válidos
		act(() => {
			result.current.setValue("name", "John");
		});

		// Agora deve avançar
		await act(async () => {
			await result.current.next();
		});

		expect(result.current.currentStep).toBe("step2");
	});

	it("deve voltar para step anterior", () => {
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string() });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "", email: "" },
			})
		);

		act(() => {
			result.current.goToStep("step2");
		});

		expect(result.current.currentStep).toBe("step2");

		act(() => {
			result.current.back();
		});

		expect(result.current.currentStep).toBe("step1");
	});

	it("deve obter valores do step atual", () => {
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string() });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "John", email: "" },
			})
		);

		const stepValues = result.current.getStepValues("step1");
		expect(stepValues).toEqual({ name: "John" });
	});

	it("deve verificar se step está dirty", () => {
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string() });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "", email: "" },
			})
		);

		expect(result.current.isStepDirty("step1")).toBe(false);

		act(() => {
			result.current.setValue("name", "John", { shouldDirty: true });
		});

		// Aguarda o react-hook-form atualizar o estado
		act(() => {
			// Força uma atualização do formState
			result.current.trigger("name");
		});

		expect(result.current.isStepDirty("step1")).toBe(true);
	});

	it("deve verificar se step tem erro", async () => {
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string().min(3) });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "", email: "" },
			})
		);

		act(() => {
			result.current.setValue("name", "Jo");
		});

		await act(async () => {
			await result.current.trigger("name");
		});

		expect(result.current.hasStepError("step1")).toBe(true);
	});

	it("deve chamar onStepSubmit quando step é válido", async () => {
		const onStepSubmit = vi.fn();
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string().min(3) });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "", email: "" },
				onStepSubmit,
			})
		);

		act(() => {
			result.current.setValue("name", "John");
		});

		await act(async () => {
			await result.current.next();
		});

		expect(onStepSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "John" }), "step1");
	});

	it("deve chamar onSubmit no último step", async () => {
		const onSubmit = vi.fn();
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string().min(3) });
					}
					return z.object({ email: z.string().email() });
				},
				defaultValues: { name: "John", email: "john@example.com" },
				onSubmit,
			})
		);

		act(() => {
			result.current.goToStep("step2");
		});

		await act(async () => {
			await result.current.next();
		});

		expect(onSubmit).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "John",
				email: "john@example.com",
			})
		);
	});

	it("deve reiniciar wizard", () => {
		const { result } = renderHook(() =>
			useWizardForm({
				steps: ["step1", "step2"] as const,
				schema: ({ step }) => {
					if (step === "step1") {
						return z.object({ name: z.string() });
					}
					return z.object({ email: z.string() });
				},
				defaultValues: { name: "John", email: "john@example.com" },
			})
		);

		act(() => {
			result.current.setValue("name", "Jane");
			result.current.goToStep("step2");
		});

		act(() => {
			result.current.resetWizard();
		});

		expect(result.current.currentStep).toBe("step1");
		expect(result.current.getValues("name")).toBe("John");
	});

	describe("wizardState e status de steps", () => {
		it("deve mostrar step válido como 'completed' mesmo sem ser visitado", async () => {
			const { result } = renderHook(() =>
				useWizardForm({
					steps: ["step1", "step2"] as const,
					schema: ({ step }) => {
						if (step === "step1") {
							return z.object({ name: z.string().min(1) });
						}
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "John", email: "john@example.com" },
				})
			);

			// Aguarda validação inicial
			await act(async () => {
				await result.current.trigger(["name", "email"]);
			});

			// Força atualização do wizardState
			act(() => {
				result.current.forceUpdateWizardState();
			});

			// Step2 não é o step atual e tem valor válido
			const step2State = result.current.wizardState.find((s) => s.step === "step2");

			// Step2 tem valor válido mas não foi visitado
			expect(step2State?.isValid).toBe(true);
			expect(step2State?.isVisited).toBe(false);
			expect(step2State?.summary).toBe("completed");
		});

		it("deve mostrar step inválido como 'pending' quando não visitado", async () => {
			const { result } = renderHook(() =>
				useWizardForm({
					steps: ["step1", "step2"] as const,
					schema: ({ step }) => {
						if (step === "step1") {
							return z.object({ name: z.string().min(1) });
						}
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "John", email: "invalid-email" },
				})
			);

			// Aguarda validação inicial
			await act(async () => {
				await result.current.trigger(["name", "email"]);
			});

			// Força atualização do wizardState
			act(() => {
				result.current.forceUpdateWizardState();
			});

			// Step2 não é o step atual e tem valor inválido
			const step2State = result.current.wizardState.find((s) => s.step === "step2");

			// Step2 tem valor inválido e não foi visitado
			expect(step2State?.isValid).toBe(false);
			expect(step2State?.isVisited).toBe(false);
			expect(step2State?.summary).toBe("pending");
		});

		it("deve atualizar wizardState após reset com valores válidos", async () => {
			const { result } = renderHook(() =>
				useWizardForm({
					steps: ["step1", "step2"] as const,
					schema: ({ step }) => {
						if (step === "step1") {
							return z.object({ name: z.string().min(1) });
						}
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			// Reseta com valores válidos
			act(() => {
				result.current.resetWizard({
					name: "John",
					email: "john@example.com",
				});
			});

			// Valida todos os campos
			await act(async () => {
				await result.current.trigger(["name", "email"]);
			});

			// Força atualização do wizardState
			act(() => {
				result.current.forceUpdateWizardState();
			});

			const step1State = result.current.wizardState.find((s) => s.step === "step1");
			const step2State = result.current.wizardState.find((s) => s.step === "step2");

			// Ambos os steps devem estar válidos
			expect(step1State?.isValid).toBe(true);
			expect(step2State?.isValid).toBe(true);
			// Step1 é o step atual, então deve estar como "editing"
			expect(step1State?.summary).toBe("editing");
			// Step2 não é visitado e é válido, então deve estar como "completed"
			expect(step2State?.summary).toBe("completed");
		});
	});
});
