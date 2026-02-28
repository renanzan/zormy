import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useStepMachine } from "../../../src/wizards/step/hooks/use-step-machine";

import type { UseStepMachineReturn } from "../../../src/wizards/step/hooks/use-step-machine";

describe("useStepMachine", () => {
	const steps = ["step1", "step2", "step3"] as const;

	it("deve inicializar com o primeiro step", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
			})
		);

		expect(result.current.currentStep).toBe("step1");
		expect(result.current.currentStepIndex).toBe(0);
		expect(result.current.isFirstStep).toBe(true);
		expect(result.current.isLastStep).toBe(false);
	});

	it("deve inicializar com step inicial customizado", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
				initialStep: "step2",
			})
		);

		expect(result.current.currentStep).toBe("step2");
		expect(result.current.currentStepIndex).toBe(1);
	});

	it("deve avançar para o próximo step", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
			})
		);

		act(() => {
			result.current.goToNextStep();
		});

		expect(result.current.currentStep).toBe("step2");
		expect(result.current.currentStepIndex).toBe(1);
		expect(result.current.canGoBack).toBe(true);
		expect(result.current.canGoNext).toBe(true);
	});

	it("deve voltar para o step anterior", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
				initialStep: "step2",
			})
		);

		act(() => {
			result.current.goToPreviousStep();
		});

		expect(result.current.currentStep).toBe("step1");
		expect(result.current.currentStepIndex).toBe(0);
	});

	it("não deve avançar além do último step", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
				initialStep: "step3",
			})
		);

		expect(result.current.isLastStep).toBe(true);
		expect(result.current.canGoNext).toBe(false);

		act(() => {
			result.current.goToNextStep();
		});

		expect(result.current.currentStep).toBe("step3");
	});

	it("não deve voltar antes do primeiro step", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
			})
		);

		expect(result.current.isFirstStep).toBe(true);
		expect(result.current.canGoBack).toBe(false);

		act(() => {
			result.current.goToPreviousStep();
		});

		expect(result.current.currentStep).toBe("step1");
	});

	it("deve ir para step específico", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
			})
		);

		act(() => {
			result.current.goToStep("step3");
		});

		expect(result.current.currentStep).toBe("step3");
		expect(result.current.currentStepIndex).toBe(2);
	});

	it("deve ir para step por índice", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
			})
		);

		act(() => {
			result.current.goToStepByIndex(2);
		});

		expect(result.current.currentStep).toBe("step3");
	});

	it("deve reiniciar o fluxo", () => {
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
			})
		);

		act(() => {
			result.current.goToStep("step3");
		});

		expect(result.current.currentStep).toBe("step3");

		act(() => {
			result.current.restartFlow();
		});

		expect(result.current.currentStep).toBe("step1");
	});

	it("deve chamar onStepChange quando step muda", () => {
		const onStepChange = vi.fn();
		const { result } = renderHook(() =>
			useStepMachine({
				steps,
				onStepChange,
			})
		);

		act(() => {
			result.current.goToNextStep();
		});

		expect(onStepChange).toHaveBeenCalledWith({ step: "step2", stepIndex: 1 });
	});

	it("deve funcionar em modo controlado", () => {
		const { result, rerender } = renderHook<
			UseStepMachineReturn<typeof steps>,
			{ controlledStep: (typeof steps)[number] }
		>(
			({ controlledStep }) =>
				useStepMachine({
					steps,
					controlledStep,
				}),
			{
				initialProps: { controlledStep: "step1" },
			}
		);

		expect(result.current.currentStep).toBe("step1");
		expect(result.current.isControlled).toBe(true);

		rerender({ controlledStep: "step2" });

		expect(result.current.currentStep).toBe("step2");
	});

	it("deve lançar erro se não houver steps", () => {
		expect(() => {
			renderHook(() =>
				useStepMachine({
					steps: [] as readonly string[],
				})
			);
		}).toThrow("useStepMachine requer pelo menos um passo");
	});

	it("deve lançar erro se step inicial não existir", () => {
		expect(() => {
			renderHook(() =>
				useStepMachine({
					steps,
					initialStep: "invalid" as any,
				})
			);
		}).toThrow("O passo inicial precisa existir dentro da lista de passos");
	});
});
