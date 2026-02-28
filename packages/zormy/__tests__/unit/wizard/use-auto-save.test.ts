import { z } from "zod";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useAutoSave } from "../../../src/wizards/wizard/hooks/use-auto-save";
import { useWizardForm } from "../../../src/wizards/wizard/hooks/use-wizard-form";

/**
 * Testes do hook useAutoSave.
 *
 * Verifica que o hook monitora corretamente o estado do formulário,
 * gerencia os estados de salvamento e expõe métodos para controlar o salvamento.
 */
describe("useAutoSave", () => {
	const steps = ["step1", "step2"] as const;

	describe("inicialização", () => {
		it("deve inicializar com status 'idle'", () => {
			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			expect(result.current.status).toBe("idle");
			expect(result.current.hasChanges).toBe(false);
			expect(result.current.lastSaved).toBeUndefined();
		});
	});

	describe("detecção de mudanças", () => {
		it("deve detectar quando há campos modificados", () => {
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

			const { result: autoSave } = renderHook(() => useAutoSave(wizard.current));

			act(() => {
				wizard.current.setValue("name", "João", { shouldDirty: true });
			});

			expect(autoSave.current.hasChanges).toBe(true);
		});

		it("deve voltar para 'idle' quando há mudanças após 'saved'", () => {
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

			const { result: autoSave } = renderHook(() => useAutoSave(wizard.current));

			// Marca como salvo
			act(() => {
				autoSave.current.markSaved();
			});

			expect(autoSave.current.status).toBe("saved");

			// Faz uma mudança
			act(() => {
				wizard.current.setValue("name", "João", { shouldDirty: true });
			});

			expect(autoSave.current.status).toBe("idle");
		});
	});

	describe("controle de salvamento", () => {
		it("deve marcar início de salvamento", () => {
			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			act(() => {
				result.current.startSaving();
			});

			expect(result.current.status).toBe("saving");
		});

		it("deve marcar salvamento como concluído", () => {
			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			act(() => {
				result.current.startSaving();
				result.current.markSaved();
			});

			expect(result.current.status).toBe("saved");
			expect(result.current.lastSaved).toBeInstanceOf(Date);
			expect(result.current.hasChanges).toBe(false);
		});

		it("deve marcar erro no salvamento", async () => {
			vi.useFakeTimers();

			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			act(() => {
				result.current.startSaving();
				result.current.markError();
			});

			expect(result.current.status).toBe("error");

			// Após 3 segundos, deve voltar para idle
			act(() => {
				vi.advanceTimersByTime(3000);
			});

			expect(result.current.status).toBe("idle");

			vi.useRealTimers();
		});

		it("não deve permitir múltiplos salvamentos simultâneos", async () => {
			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			const startSavingSpy = vi.spyOn(result.current, "startSaving");

			act(() => {
				result.current.startSaving();
				result.current.startSaving(); // Segunda chamada deve ser ignorada
			});

			expect(startSavingSpy).toHaveBeenCalledTimes(2);
			expect(result.current.status).toBe("saving");
		});
	});

	describe("executeSave", () => {
		it("deve executar salvamento com sucesso", async () => {
			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			const saveFn = vi.fn().mockResolvedValue(undefined);

			await act(async () => {
				await result.current.executeSave(saveFn);
			});

			expect(saveFn).toHaveBeenCalledTimes(1);
			expect(result.current.status).toBe("saved");
			expect(result.current.lastSaved).toBeInstanceOf(Date);
		});

		it("deve tratar erro no salvamento", async () => {
			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			const error = new Error("Erro ao salvar");
			const saveFn = vi.fn().mockRejectedValue(error);

			await act(async () => {
				await expect(result.current.executeSave(saveFn)).rejects.toThrow(error);
			});

			expect(saveFn).toHaveBeenCalledTimes(1);
			expect(result.current.status).toBe("error");
		});

		it("não deve executar salvamento se já estiver salvando", async () => {
			const { result: wizardResult } = renderHook(() =>
				useWizardForm({
					steps,
					schema: ({ step }) => {
						if (step === "step1") return z.object({ name: z.string().min(3) });
						return z.object({ email: z.string().email() });
					},
					defaultValues: { name: "", email: "" },
				})
			);

			const { result } = renderHook(() => useAutoSave(wizardResult.current));

			const saveFn1 = vi
				.fn()
				.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));
			const saveFn2 = vi.fn();

			// Inicia primeiro salvamento
			act(() => {
				result.current.executeSave(saveFn1);
			});

			// Tenta iniciar segundo salvamento (deve ser ignorado)
			act(() => {
				result.current.executeSave(saveFn2);
			});

			expect(saveFn1).toHaveBeenCalledTimes(1);
			expect(saveFn2).not.toHaveBeenCalled();

			// Aguarda primeiro salvamento terminar
			await act(async () => {
				await new Promise((resolve) => setTimeout(resolve, 150));
			});

			expect(result.current.status).toBe("saved");
		});
	});
});
