import { z } from "zod";
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAutoSave } from "../../../src/wizards/wizard/hooks/use-auto-save";
import { useWizardForm } from "../../../src/wizards/wizard/hooks/use-wizard-form";

/**
 * Testes do hook useAutoSave.
 *
 * Verifica que o hook monitora corretamente o estado do formulário,
 * gerencia os estados de salvamento e expõe métodos para controlar o salvamento.
 */
describe("useAutoSave (dirty values)", () => {
	const steps = ["step1", "step2"] as const;
	describe("detecção de mudanças", () => {
		it("deve detectar quando há campos modificados", async () => {
			const { result: wizard } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			// Cria o useAutoSave passando o wizard atual
			const { result: autoSave } = renderHook(() => useAutoSave(wizard.current));

			act(() => {
				wizard.current.setValue("name", "João", { shouldDirty: true });
			});

			// Aguarda a atualização assíncrona do formState.dirtyFields
			await waitFor(() => {
				// Verifica que o wizard foi atualizado
				expect(wizard.current.formState.dirtyFields).toEqual({
					name: true,
				});

				// Verifica que hasChanges foi atualizado
				expect(autoSave.current.hasChanges).toBe(true);
			});
		});

		it("deve detectar quando campo volta ao valor original (rollback)", async () => {
			const { result: wizard } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "João", email: "" },
				})
			);

			// Cria o useAutoSave passando o wizard atual
			const { result: autoSave } = renderHook(() => useAutoSave(wizard.current));

			// Altera o campo
			act(() => {
				wizard.current.setValue("name", "Maria", { shouldDirty: true });
			});

			// Aguarda a atualização
			await waitFor(() => {
				expect(autoSave.current.hasChanges).toBe(true);
			});

			// Volta o campo para o valor original
			act(() => {
				wizard.current.setValue("name", "João", { shouldDirty: true });
			});

			// Aguarda a atualização - deve detectar que não há mudanças reais
			await waitFor(() => {
				expect(autoSave.current.hasChanges).toBe(false);
			});
		});

		it("deve detectar rollback mesmo quando dirtyFields ainda está marcado", async () => {
			const { result: wizard } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "João", email: "" },
				})
			);

			// Cria o useAutoSave passando o wizard atual
			const { result: autoSave } = renderHook(() => useAutoSave(wizard.current));

			// Altera o campo
			act(() => {
				wizard.current.setValue("name", "Maria", { shouldDirty: true });
			});

			// Aguarda a atualização
			await waitFor(() => {
				expect(autoSave.current.hasChanges).toBe(true);
			});

			// Volta o campo para o valor original
			act(() => {
				wizard.current.setValue("name", "João", { shouldDirty: true });
			});

			// Aguarda a atualização
			await waitFor(() => {
				// Mesmo que dirtyFields ainda esteja marcado, hasChanges deve ser false
				// porque o valor atual é igual ao valor padrão
				expect(autoSave.current.hasChanges).toBe(false);
			});

			// Verifica que dirtyFields ainda pode estar marcado (comportamento do react-hook-form)
			// mas hasChanges deve ser false porque não há mudanças reais
			expect(autoSave.current.hasChanges).toBe(false);
		});

		it("deve detectar mudanças em múltiplos campos e rollback parcial", async () => {
			const { result: wizard } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1")
							return z.object({
								name: z.string().min(3),
								age: z.number().min(18),
							});
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "João", age: 25, email: "" },
				})
			);

			// Cria o useAutoSave passando o wizard atual
			const { result: autoSave } = renderHook(() => useAutoSave(wizard.current));

			// Altera ambos os campos
			act(() => {
				wizard.current.setValue("name", "Maria", { shouldDirty: true });
				wizard.current.setValue("age", 30, { shouldDirty: true });
			});

			// Aguarda a atualização
			await waitFor(() => {
				expect(autoSave.current.hasChanges).toBe(true);
			});

			// Volta apenas um campo para o valor original
			act(() => {
				wizard.current.setValue("name", "João", { shouldDirty: true });
			});

			// Aguarda a atualização - ainda deve ter mudanças (age foi alterado)
			await waitFor(() => {
				expect(autoSave.current.hasChanges).toBe(true);
			});

			// Volta o outro campo também
			act(() => {
				wizard.current.setValue("age", 25, { shouldDirty: true });
			});

			// Aguarda a atualização - agora não deve ter mudanças
			await waitFor(() => {
				expect(autoSave.current.hasChanges).toBe(false);
			});
		});
	});
});
