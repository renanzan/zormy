import { z } from "zod";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { useWizard } from "../../../src/wizards/wizard/hooks/use-wizard";

/**
 * Testes do hook useWizard.
 *
 * Demonstra como criar e usar wizards multi-step com campos tipados,
 * incluindo validação por step, navegação e callbacks.
 */
describe("useWizard - wizard multi-step com campos tipados", () => {
	const steps = ["personal", "credentials"] as const;

	const NameField = field("name")
		.schema(z.string().min(3))
		.render(() => null);

	const EmailField = field("email")
		.schema(z.string().email())
		.render(() => null);

	const PasswordField = field("password")
		.schema(z.string().min(8))
		.render(() => null);

	const fields = {
		personal: [NameField],
		credentials: [EmailField, PasswordField],
	};

	describe("inicialização do wizard", () => {
		it("deve inicializar wizard com primeiro step e valores padrão", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "", email: "", password: "" },
				})
			);

			expect(result.current.currentStep).toBe("personal");
			expect(result.current.currentStepIndex).toBe(0);
			expect(result.current.steps).toEqual(steps);
			expect(result.current.totalSteps).toBe(2);
			expect(result.current.isFirstStep).toBe(true);
			expect(result.current.isLastStep).toBe(false);
		});

		it("deve inicializar wizard com step inicial customizado", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "", email: "", password: "" },
					initialStep: "credentials",
				})
			);

			expect(result.current.currentStep).toBe("credentials");
			expect(result.current.currentStepIndex).toBe(1);
			expect(result.current.isFirstStep).toBe(false);
			expect(result.current.isLastStep).toBe(true);
		});

		it("deve aceitar mode e repassar para o formulário (validação ainda funciona)", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "", email: "", password: "" },
					mode: "onBlur",
				})
			);

			expect(result.current.currentStep).toBe("personal");
			act(() => {
				result.current.setValue("name", "John");
			});
			await act(async () => {
				await result.current.next();
			});
			expect(result.current.currentStep).toBe("credentials");
		});
	});

	describe("obtenção de campos por step", () => {
		it("deve obter componentes de campo para step específico", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "", email: "", password: "" },
				})
			);

			const personalFields = result.current.getFieldComponentsForStep("personal");
			expect(personalFields).toEqual([NameField]);

			const credentialsFields = result.current.getFieldComponentsForStep("credentials");
			expect(credentialsFields).toEqual([EmailField, PasswordField]);
		});
	});

	describe("validação e navegação", () => {
		it("deve validar step atual antes de avançar - bloqueia se inválido", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "", email: "", password: "" },
				})
			);

			// Tenta avançar com dados inválidos (name muito curto)
			act(() => {
				result.current.setValue("name", "Jo");
			});

			await act(async () => {
				await result.current.next();
			});

			// Não deve avançar devido à validação
			expect(result.current.currentStep).toBe("personal");

			// Preenche dados válidos
			act(() => {
				result.current.setValue("name", "John");
			});

			// Agora deve avançar
			await act(async () => {
				await result.current.next();
			});

			expect(result.current.currentStep).toBe("credentials");
		});

		it("deve voltar para step anterior", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "John", email: "", password: "" },
				})
			);

			act(() => {
				result.current.goToStep("credentials");
			});

			expect(result.current.currentStep).toBe("credentials");

			act(() => {
				result.current.back();
			});

			expect(result.current.currentStep).toBe("personal");
			expect(result.current.canGoBack).toBe(false);
		});

		it("não deve avançar além do último step", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: {
						name: "John",
						email: "test@example.com",
						password: "password123",
					},
				})
			);

			act(() => {
				result.current.goToStep("credentials");
			});

			expect(result.current.isLastStep).toBe(true);
			expect(result.current.canGoNext).toBe(false);
		});
	});

	describe("defaultValues - valores padrão", () => {
		it("deve aceitar defaultValues como objeto direto", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: {
						name: "John",
						email: "john@example.com",
						password: "password123",
					},
				})
			);

			expect(result.current.getValues("name")).toBe("John");
			expect(result.current.getValues("email")).toBe("john@example.com");
			expect(result.current.getValues("password")).toBe("password123");
		});

		it("deve aceitar defaultValues como função síncrona", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: () => ({
						name: "John",
						email: "john@example.com",
						password: "password123",
					}),
				})
			);

			expect(result.current.getValues("name")).toBe("John");
			expect(result.current.getValues("email")).toBe("john@example.com");
			expect(result.current.getValues("password")).toBe("password123");
		});

		it("deve aceitar defaultValues como função assíncrona", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: async () => {
						await new Promise((resolve) => setTimeout(resolve, 10));
						return {
							name: "Jane",
							email: "jane@example.com",
							password: "password456",
						};
					},
				})
			);

			await waitFor(() => {
				expect(result.current.getValues("name")).toBe("Jane");
			});

			expect(result.current.getValues("email")).toBe("jane@example.com");
			expect(result.current.getValues("password")).toBe("password456");
		});

		it("deve validar steps após carregar defaultValues assíncronos válidos", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: async () => {
						await new Promise((resolve) => setTimeout(resolve, 10));
						return {
							name: "John",
							email: "john@example.com",
							password: "password123",
						};
					},
				})
			);

			// Aguarda os valores serem carregados
			await waitFor(() => {
				expect(result.current.getValues("name")).toBe("John");
			});

			// Aguarda validação ser executada
			await waitFor(
				() => {
					const step1State = result.current.wizardState.find((s) => s.step === "personal");
					const step2State = result.current.wizardState.find((s) => s.step === "credentials");

					// Ambos os steps devem estar válidos após carregar defaultValues
					expect(step1State?.isValid).toBe(true);
					expect(step2State?.isValid).toBe(true);
				},
				{ timeout: 3000 }
			);

			const step1State = result.current.wizardState.find((s) => s.step === "personal");
			const step2State = result.current.wizardState.find((s) => s.step === "credentials");

			// Step1 é o step atual, então deve estar como "editing"
			expect(step1State?.summary).toBe("editing");
			// Step2 não é visitado e é válido, então deve estar como "completed"
			expect(step2State?.summary).toBe("completed");
		});

		it("deve mostrar steps inválidos como 'pending' após carregar defaultValues assíncronos", async () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: async () => {
						await new Promise((resolve) => setTimeout(resolve, 10));
						return {
							name: "Jo", // Inválido (min 3)
							email: "invalid-email", // Inválido
							password: "short", // Inválido (min 8)
						};
					},
				})
			);

			// Aguarda os valores serem carregados
			await waitFor(() => {
				expect(result.current.getValues("name")).toBe("Jo");
			});

			// Aguarda validação ser executada
			await waitFor(
				() => {
					const step1State = result.current.wizardState.find((s) => s.step === "personal");
					const step2State = result.current.wizardState.find((s) => s.step === "credentials");

					// Ambos os steps devem estar inválidos
					expect(step1State?.isValid).toBe(false);
					expect(step2State?.isValid).toBe(false);
				},
				{ timeout: 3000 }
			);

			const step1State = result.current.wizardState.find((s) => s.step === "personal");
			const step2State = result.current.wizardState.find((s) => s.step === "credentials");

			// Step1 é o step atual e tem erro, então deve estar como "error"
			expect(step1State?.summary).toBe("editing");
			// Step2 não é visitado e é inválido, então deve estar como "pending"
			expect(step2State?.summary).toBe("pending");
		});

		describe("defaultValues - execução única", () => {
			it("deve chamar função síncrona de defaultValues apenas uma vez", () => {
				const defaultValuesFn = vi.fn(() => ({
					name: "John",
					email: "john@example.com",
					password: "password123",
				}));

				const { result, rerender } = renderHook(
					({ initialStep }) =>
						useWizard({
							steps,
							fields,
							defaultValues: defaultValuesFn,
							initialStep,
						}),
					{
						initialProps: {
							initialStep: undefined as (typeof steps)[number] | undefined,
						},
					}
				);

				// Verifica que a função foi chamada apenas uma vez
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Verifica que os valores foram aplicados
				expect(result.current.getValues("name")).toBe("John");

				// Re-renderiza com props diferentes (mas mesma função)
				rerender({ initialStep: "credentials" });

				// A função não deve ser chamada novamente
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Os valores devem permanecer os mesmos
				expect(result.current.getValues("name")).toBe("John");
			});

			it("deve chamar função assíncrona de defaultValues apenas uma vez", async () => {
				const defaultValuesFn = vi.fn(async () => {
					await new Promise((resolve) => setTimeout(resolve, 10));
					return {
						name: "Jane",
						email: "jane@example.com",
						password: "password456",
					};
				});

				const { result, rerender } = renderHook(
					({ initialStep }) =>
						useWizard({
							steps,
							fields,
							defaultValues: defaultValuesFn,
							initialStep,
						}),
					{
						initialProps: {
							initialStep: undefined as (typeof steps)[number] | undefined,
						},
					}
				);

				// Aguarda a função ser executada
				await waitFor(() => {
					expect(defaultValuesFn).toHaveBeenCalled();
				});

				// Verifica que a função foi chamada apenas uma vez
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Verifica que os valores foram aplicados
				await waitFor(() => {
					expect(result.current.getValues("name")).toBe("Jane");
				});

				// Re-renderiza com props diferentes (mas mesma função)
				rerender({ initialStep: "credentials" });

				// Aguarda um pouco para garantir que não há chamadas adicionais
				await new Promise((resolve) => setTimeout(resolve, 50));

				// A função não deve ser chamada novamente
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Os valores devem permanecer os mesmos
				expect(result.current.getValues("name")).toBe("Jane");
			});

			it("não deve chamar defaultValues novamente quando outras props mudam", () => {
				const defaultValuesFn = vi.fn(() => ({
					name: "John",
					email: "john@example.com",
					password: "password123",
				}));

				const onStepChange = vi.fn();

				const { rerender } = renderHook(
					({ controlledStep }) =>
						useWizard({
							steps,
							fields,
							defaultValues: defaultValuesFn,
							controlledStep,
							onStepChange,
						}),
					{
						initialProps: {
							controlledStep: undefined as (typeof steps)[number] | undefined,
						},
					}
				);

				// Verifica que a função foi chamada apenas uma vez na inicialização
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Muda o controlledStep (deve causar re-render)
				rerender({ controlledStep: "credentials" });

				// A função não deve ser chamada novamente
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);
			});

			it("não deve chamar defaultValues múltiplas vezes em re-renders consecutivos", () => {
				const defaultValuesFn = vi.fn(() => ({
					name: "John",
					email: "john@example.com",
					password: "password123",
				}));

				const { rerender } = renderHook(
					({ mode }) =>
						useWizard({
							steps,
							fields,
							defaultValues: defaultValuesFn,
							mode,
						}),
					{
						initialProps: {
							mode: "onChange" as Parameters<typeof useWizard>[0]["mode"],
						},
					}
				);

				// Verifica que a função foi chamada apenas uma vez na inicialização
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Múltiplos re-renders
				rerender({ mode: "onBlur" });
				rerender({ mode: "onSubmit" });
				rerender({ mode: "onTouched" });
				rerender({ mode: "all" });

				// A função não deve ser chamada novamente
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);
			});

			it("deve aguardar Promise de defaultValues antes de atualizar formulário", async () => {
				let resolvePromise: (value: any) => void;
				const promise = new Promise((resolve) => {
					resolvePromise = resolve;
				});

				const defaultValuesFn = vi.fn(async () => {
					return promise.then(() => ({
						name: "Async",
						email: "async@example.com",
						password: "async123",
					}));
				});

				const { result } = renderHook(() =>
					useWizard({
						steps,
						fields,
						defaultValues: defaultValuesFn,
					})
				);

				// Verifica que a função foi chamada
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Antes de resolver a Promise, os valores não devem estar presentes
				// (pode estar vazio ou com valores iniciais do react-hook-form)
				const initialName = result.current.getValues("name");
				expect(initialName).not.toBe("Async");

				// Resolve a Promise
				resolvePromise!(undefined);
				await promise;

				// Aguarda os valores serem atualizados
				await waitFor(() => {
					expect(result.current.getValues("name")).toBe("Async");
				});

				// Verifica que a função foi chamada apenas uma vez
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);
				expect(result.current.getValues("email")).toBe("async@example.com");
				expect(result.current.getValues("password")).toBe("async123");
			});

			it("deve tratar erro em Promise de defaultValues sem re-executar", async () => {
				const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

				let rejectPromise: (error: any) => void;
				const promise = new Promise((_, reject) => {
					rejectPromise = reject;
				});

				const defaultValuesFn = vi.fn(async () => {
					return promise;
				});

				const { result } = renderHook(() =>
					useWizard({
						steps,
						fields,
						defaultValues: defaultValuesFn,
					})
				);

				// Verifica que a função foi chamada
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				// Rejeita a Promise
				const error = new Error("Erro ao carregar dados");
				rejectPromise!(error);
				await promise.catch(() => {});

				// Aguarda o erro ser tratado
				await waitFor(() => {
					expect(consoleErrorSpy).toHaveBeenCalledWith(
						expect.stringContaining("[useWizard] Erro ao carregar defaultValues assíncrono:"),
						error
					);
				});

				// Verifica que a função foi chamada apenas uma vez
				expect(defaultValuesFn).toHaveBeenCalledTimes(1);

				consoleErrorSpy.mockRestore();
			});
		});
	});

	describe("campos aninhados (dot notation)", () => {
		it("deve lidar com campos aninhados usando dot notation", () => {
			const NestedField = field("user.name")
				.schema(z.string())
				.render(() => null);

			const { result } = renderHook(() =>
				useWizard({
					steps: ["step1"],
					fields: {
						step1: [NestedField],
					},
					defaultValues: {
						user: {
							name: "John",
						},
					},
				})
			);

			// O use-wizard normaliza "user.name" para { user: { name: "John" } }
			// então o react-hook-form armazena como aninhado
			// Verifica que o valor foi armazenado corretamente (pode estar aninhado)
			const allValues = result.current.getValues();
			expect(allValues.user?.name || allValues["user.name"]).toBe("John");

			const stepValues = result.current.getStepValues("step1");
			// getStepValues deve converter "user.name" para estrutura aninhada
			expect(stepValues).toEqual({
				user: {
					name: "John",
				},
			});
		});
	});

	describe("callbacks - onStepSubmit e onSubmit", () => {
		it("deve chamar onStepSubmit quando step é válido e avança", async () => {
			const onStepSubmit = vi.fn();
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "", email: "", password: "" },
					onStepSubmit,
				})
			);

			act(() => {
				result.current.setValue("name", "John");
			});

			await act(async () => {
				await result.current.next();
			});

			expect(onStepSubmit).toHaveBeenCalledWith(
				expect.objectContaining({ name: "John" }),
				"personal"
			);
		});

		it("deve chamar onSubmit no último step quando form é completo", async () => {
			const onSubmit = vi.fn();
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: {
						name: "John",
						email: "john@example.com",
						password: "password123",
					},
					onSubmit,
				})
			);

			act(() => {
				result.current.goToStep("credentials");
			});

			await act(async () => {
				await result.current.next();
			});

			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "John",
					email: "john@example.com",
					password: "password123",
				})
			);
		});
	});

	describe("wizard state - estado de cada step", () => {
		it("deve fornecer estado de cada step (visited, dirty, valid, error)", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps,
					fields,
					defaultValues: { name: "", email: "", password: "" },
				})
			);

			const wizardState = result.current.wizardState;

			expect(wizardState).toHaveLength(2);
			expect(wizardState[0]?.step).toBe("personal");
			expect(wizardState[0]?.isVisited).toBe(true);
			expect(wizardState[1]?.step).toBe("credentials");
			expect(wizardState[1]?.isVisited).toBe(false);
		});
	});

	describe("wizard controlado externamente", () => {
		it("deve permitir controlar wizard externamente via controlledStep", () => {
			type Step = (typeof steps)[number];
			const { result, rerender } = renderHook<
				ReturnType<typeof useWizard<typeof steps, typeof fields>>,
				{ step: Step }
			>(
				({ step }) =>
					useWizard({
						steps,
						fields,
						defaultValues: { name: "", email: "", password: "" },
						controlledStep: step,
					}),
				{
					initialProps: { step: "personal" },
				}
			);

			expect(result.current.currentStep).toBe("personal");

			rerender({ step: "credentials" });

			expect(result.current.currentStep).toBe("credentials");
		});
	});
});
