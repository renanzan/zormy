import { z } from "zod";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import {
	useAutoSaveContext,
	useWizardContext,
	WizardProvider,
} from "../../../src/wizards/wizard/context";
import { useWizard } from "../../../src/wizards/wizard/hooks/use-wizard";

/**
 * Testes da integração do auto save no useWizard.
 *
 * Verifica que o auto save é criado quando configurado,
 * está disponível via contexto e executa salvamento corretamente.
 */
describe("useWizard com auto save", () => {
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

	describe("criação do auto save", () => {
		it("deve criar autoSave quando configurado", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					autoSave: vi.fn(),
				})
			);

			expect(result.current.autoSave).toBeDefined();
			expect(result.current.autoSave?.status).toBe("idle");
		});

		it("não deve criar autoSave quando não configurado", () => {
			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				})
			);

			expect(result.current.autoSave).toBeUndefined();
		});
	});

	describe("disponibilidade via contexto", () => {
		it("deve disponibilizar autoSave via contexto", () => {
			const { result: wizardResult } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					autoSave: vi.fn(),
				})
			);

			const { result: contextResult } = renderHook(
				() => {
					const wizard = useWizardContext();
					return wizard.autoSave;
				},
				{
					wrapper: ({ children }) => (
						<WizardProvider value={wizardResult.current}>{children}</WizardProvider>
					),
				}
			);

			expect(contextResult.current).toBeDefined();
			expect(contextResult.current?.status).toBe("idle");
		});

		it("deve permitir acesso via useAutoSaveContext", () => {
			const { result: wizardResult } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					autoSave: vi.fn(),
				})
			);

			const { result: autoSaveResult } = renderHook(() => useAutoSaveContext(), {
				wrapper: ({ children }) => (
					<WizardProvider value={wizardResult.current}>{children}</WizardProvider>
				),
			});

			expect(autoSaveResult.current).toBeDefined();
			expect(autoSaveResult.current.status).toBe("idle");
		});

		it("deve lançar erro se useAutoSaveContext for usado sem autoSave configurado", () => {
			const { result: wizardResult } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
				})
			);

			expect(() => {
				renderHook(() => useAutoSaveContext(), {
					wrapper: ({ children }) => (
						<WizardProvider value={wizardResult.current}>{children}</WizardProvider>
					),
				});
			}).toThrow("useAutoSaveContext requer que o wizard tenha autoSave configurado");
		});
	});

	describe("execução de salvamento no onStepChange", () => {
		it("deve executar onSave quando há mudança de step com dados válidos", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const onStepChange = vi.fn();

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					onStepChange,
					autoSave: onSave,
				})
			);

			// Preenche dados válidos no step1
			act(() => {
				result.current.setValue("name", "João", { shouldDirty: true });
			});

			// Avança para o próximo step
			await act(async () => {
				await result.current.next();
			});

			// Verifica que onStepChange foi chamado
			expect(onStepChange).toHaveBeenCalledTimes(1);
			expect(onStepChange).toHaveBeenCalledWith(
				expect.objectContaining({
					step: "step2",
					stepIndex: 1,
				})
			);

			// Aguarda o salvamento ser executado
			await waitFor(() => {
				expect(onSave).toHaveBeenCalledTimes(1);
			});

			// Verifica que onSave foi chamado com os dados corretos
			expect(onSave).toHaveBeenCalledWith(
				expect.objectContaining({
					step: "step1",
					validChangedData: expect.objectContaining({
						name: "João",
					}),
					wizard: expect.any(Object),
				})
			);

			// Verifica que o status do autoSave foi atualizado
			await waitFor(() => {
				expect(result.current.autoSave?.status).toBe("saved");
			});
		});

		it("não deve executar onSave quando não há dados válidos para salvar", async () => {
			const onSave = vi.fn();

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					autoSave: onSave,
				})
			);

			// Avança sem modificar dados
			await act(async () => {
				await result.current.next();
			});

			// Aguarda um pouco para garantir que não foi chamado
			await waitFor(
				() => {
					expect(onSave).not.toHaveBeenCalled();
				},
				{ timeout: 100 }
			);
		});

		it("deve tratar erro no salvamento", async () => {
			const error = new Error("Erro ao salvar");
			const onSave = vi.fn().mockRejectedValue(error);

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					autoSave: onSave,
				})
			);

			// Preenche dados válidos
			act(() => {
				result.current.setValue("name", "João", { shouldDirty: true });
			});

			// Avança para o próximo step
			await act(async () => {
				await result.current.next();
			});

			// Aguarda o erro ser tratado
			await waitFor(
				() => {
					expect(onSave).toHaveBeenCalledTimes(1);
					expect(result.current.autoSave?.status).toBe("error");
				},
				{ timeout: 2000 }
			);
		});

		it("deve chamar onStepChange original se fornecido", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);
			const onStepChange = vi.fn();

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					onStepChange,
					autoSave: onSave,
				})
			);

			// Preenche dados válidos
			act(() => {
				result.current.setValue("name", "João", { shouldDirty: true });
			});

			// Avança para o próximo step
			await act(async () => {
				await result.current.next();
			});

			// Verifica que onStepChange foi chamado
			expect(onStepChange).toHaveBeenCalledTimes(1);
			expect(onStepChange).toHaveBeenCalledWith(
				expect.objectContaining({
					step: "step2",
					stepIndex: 1,
				})
			);

			// Aguarda o salvamento ser executado
			await waitFor(() => {
				expect(onSave).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("integração completa", () => {
		it("deve funcionar corretamente em um fluxo completo", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "", email: "" },
					autoSave: onSave,
				})
			);

			// Preenche step1
			act(() => {
				result.current.setValue("name", "João", { shouldDirty: true });
			});

			// Aguarda o hasChanges ser atualizado
			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(true);
			});
			expect(result.current.autoSave?.status).toBe("idle");

			// Avança para step2 (deve salvar)
			await act(async () => {
				await result.current.next();
			});

			await waitFor(() => {
				expect(onSave).toHaveBeenCalledTimes(1);
				expect(result.current.autoSave?.status).toBe("saved");
			});

			// Preenche step2
			act(() => {
				result.current.setValue("email", "joao@example.com", {
					shouldDirty: true,
				});
			});

			// Status volta para idle quando há novas mudanças
			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(true);
				expect(result.current.autoSave?.status).toBe("idle");
			});
		});
	});

	describe("rollback de alterações", () => {
		it("deve voltar status para 'saved' quando campo é revertido ao valor salvo", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "Original", email: "" },
					autoSave: onSave,
				})
			);

			// 1. Altera o campo
			act(() => {
				result.current.setValue("name", "Modificado", { shouldDirty: true });
			});

			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(true);
				expect(result.current.autoSave?.status).toBe("idle");
			});

			// 2. Salva (avança de step)
			await act(async () => {
				await result.current.next();
			});

			await waitFor(() => {
				expect(onSave).toHaveBeenCalledTimes(1);
				expect(result.current.autoSave?.status).toBe("saved");
				expect(result.current.autoSave?.hasChanges).toBe(false);
			});

			// 3. Altera novamente
			act(() => {
				result.current.setValue("name", "Nova Modificação", {
					shouldDirty: true,
				});
			});

			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(true);
				expect(result.current.autoSave?.status).toBe("idle");
			});

			// 4. Reverte ao valor salvo (rollback)
			act(() => {
				result.current.setValue("name", "Modificado", { shouldDirty: true });
			});

			// Deve voltar para 'saved' quando não há mudanças reais
			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(false);
				expect(result.current.autoSave?.status).toBe("saved");
			});
		});

		it("deve detectar rollback mesmo após múltiplas alterações", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "Original", email: "" },
					autoSave: onSave,
				})
			);

			// 1. Altera e salva
			act(() => {
				result.current.setValue("name", "Salvo", { shouldDirty: true });
			});

			await act(async () => {
				await result.current.next();
			});

			await waitFor(() => {
				expect(result.current.autoSave?.status).toBe("saved");
			});

			// 2. Altera múltiplas vezes
			act(() => {
				result.current.setValue("name", "Modificação 1", { shouldDirty: true });
			});

			await waitFor(() => {
				expect(result.current.autoSave?.status).toBe("idle");
			});

			act(() => {
				result.current.setValue("name", "Modificação 2", { shouldDirty: true });
			});

			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(true);
			});

			// 3. Reverte ao valor salvo
			act(() => {
				result.current.setValue("name", "Salvo", { shouldDirty: true });
			});

			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(false);
				expect(result.current.autoSave?.status).toBe("saved");
			});
		});

		it("deve detectar rollback parcial com múltiplos campos", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);

			const NameFieldLocal = field("name")
				.schema(z.string().min(3))
				.render(() => null);
			const EmailFieldLocal = field("email")
				.schema(z.string().email())
				.render(() => null);

			const stepsConfigLocal = [
				{ name: "step1", fields: [NameFieldLocal] },
				{ name: "step2", fields: [EmailFieldLocal] },
			] as const;

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfigLocal,
					defaultValues: { name: "Original", email: "original@example.com" },
					autoSave: onSave,
				})
			);

			// 1. Altera name e salva (avança para step2)
			act(() => {
				result.current.setValue("name", "Salvo 1", { shouldDirty: true });
			});

			await act(async () => {
				await result.current.next();
			});

			await waitFor(() => {
				expect(onSave).toHaveBeenCalledTimes(1);
				expect(result.current.autoSave?.status).toBe("saved");
			});

			// Volta para step1 para poder alterar ambos os campos
			act(() => {
				result.current.back();
			});

			await waitFor(() => {
				expect(result.current.currentStep).toBe("step1");
			});

			// 2. Altera ambos novamente
			act(() => {
				result.current.setValue("name", "Modificado", { shouldDirty: true });
				result.current.setValue("email", "modificado@example.com", {
					shouldDirty: true,
				});
			});

			await waitFor(() => {
				expect(result.current.autoSave?.status).toBe("idle");
			});

			// 3. Reverte apenas um campo
			act(() => {
				result.current.setValue("name", "Salvo 1", { shouldDirty: true });
			});

			await waitFor(() => {
				// Ainda deve ter mudanças (email foi modificado)
				expect(result.current.autoSave?.hasChanges).toBe(true);
				expect(result.current.autoSave?.status).toBe("idle");
			});

			// 4. Reverte o segundo campo também para o valor original (que estava nos valores salvos)
			act(() => {
				result.current.setValue("email", "original@example.com", {
					shouldDirty: true,
				});
			});

			await waitFor(() => {
				// Agora não deve ter mudanças
				expect(result.current.autoSave?.hasChanges).toBe(false);
				expect(result.current.autoSave?.status).toBe("saved");
			});
		});

		it("não deve salvar quando há rollback completo antes de mudar de step", async () => {
			const onSave = vi.fn().mockResolvedValue(undefined);

			const { result } = renderHook(() =>
				useWizard({
					steps: stepsConfig,
					defaultValues: { name: "Original", email: "" },
					autoSave: onSave,
				})
			);

			// 1. Altera e salva
			act(() => {
				result.current.setValue("name", "Salvo", { shouldDirty: true });
			});

			await act(async () => {
				await result.current.next();
			});

			await waitFor(() => {
				expect(onSave).toHaveBeenCalledTimes(1);
				expect(result.current.autoSave?.status).toBe("saved");
			});

			// 2. Altera
			act(() => {
				result.current.setValue("name", "Modificado", { shouldDirty: true });
			});

			await waitFor(() => {
				expect(result.current.autoSave?.status).toBe("idle");
			});

			// 3. Reverte ao valor salvo (rollback)
			act(() => {
				result.current.setValue("name", "Salvo", { shouldDirty: true });
			});

			await waitFor(() => {
				expect(result.current.autoSave?.hasChanges).toBe(false);
				expect(result.current.autoSave?.status).toBe("saved");
			});

			// 4. Avança de step - não deve salvar porque não há mudanças
			const initialCallCount = onSave.mock.calls.length;
			await act(async () => {
				await result.current.next();
			});

			// Aguarda um pouco para garantir que não houve nova chamada
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Não deve ter chamado onSave novamente
			expect(onSave).toHaveBeenCalledTimes(initialCallCount);
		});
	});
});
