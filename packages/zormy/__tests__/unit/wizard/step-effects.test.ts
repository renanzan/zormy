import { describe, expect, it, vi } from "vitest";

import {
	clearErrorsForOtherSteps,
	handleExternalStepChange,
	handleInternalStepChange,
} from "../../../src/wizards/step/utils/step-effects";

describe("step-effects", () => {
	describe("handleExternalStepChange", () => {
		it("deve retornar cedo quando stepIndex é -1", () => {
			const capturePreviousStepState = vi.fn();
			const resetDirtyFields = vi.fn();
			const getStepState = vi.fn();
			const onStepChange = vi.fn();
			const updatePreviousStepRef = vi.fn();

			handleExternalStepChange({
				currentStep: "step1",
				stepIndex: -1,
				previousStep: undefined,
				capturePreviousStepState,
				resetDirtyFields,
				getStepState,
				formState: {} as never,
				onStepChange,
				updatePreviousStepRef,
			});

			expect(capturePreviousStepState).not.toHaveBeenCalled();
			expect(resetDirtyFields).not.toHaveBeenCalled();
			expect(getStepState).not.toHaveBeenCalled();
			expect(onStepChange).not.toHaveBeenCalled();
			expect(updatePreviousStepRef).not.toHaveBeenCalled();
		});

		it("deve capturar estado anterior, resetar dirty, obter estado atual e chamar onStepChange", () => {
			const previousStepState = { step: "step0", values: {} };
			const currentStepState = { step: "step1", values: {} };
			const capturePreviousStepState = vi.fn().mockReturnValue(previousStepState);
			const resetDirtyFields = vi.fn();
			const getStepState = vi.fn().mockReturnValue(currentStepState);
			const onStepChange = vi.fn();
			const updatePreviousStepRef = vi.fn();
			const formState = { isDirty: true } as never;

			handleExternalStepChange({
				currentStep: "step1",
				stepIndex: 1,
				previousStep: "step0",
				capturePreviousStepState,
				resetDirtyFields,
				getStepState,
				formState,
				onStepChange,
				updatePreviousStepRef,
			});

			expect(capturePreviousStepState).toHaveBeenCalled();
			expect(resetDirtyFields).toHaveBeenCalledWith("step0");
			expect(getStepState).toHaveBeenCalledWith("step1");
			expect(onStepChange).toHaveBeenCalledWith(
				"step1",
				1,
				formState,
				previousStepState,
				currentStepState
			);
			expect(updatePreviousStepRef).toHaveBeenCalledWith("step1");
		});
	});

	describe("handleInternalStepChange", () => {
		it("deve retornar false quando pendingStep não é igual a currentStep", () => {
			const updatePreviousStepRef = vi.fn();
			const clearPendingStep = vi.fn();
			const resetInternalNavigationFlag = vi.fn();

			const result = handleInternalStepChange({
				currentStep: "step1",
				pendingStep: "step2",
				updatePreviousStepRef,
				clearPendingStep,
				resetInternalNavigationFlag,
			});

			expect(result).toBe(false);
			expect(updatePreviousStepRef).not.toHaveBeenCalled();
			expect(clearPendingStep).not.toHaveBeenCalled();
		});

		it("deve atualizar ref, limpar pending e resetar flag quando pendingStep === currentStep", () => {
			vi.useFakeTimers();
			const updatePreviousStepRef = vi.fn();
			const clearPendingStep = vi.fn();
			const resetInternalNavigationFlag = vi.fn();

			const result = handleInternalStepChange({
				currentStep: "step1",
				pendingStep: "step1",
				updatePreviousStepRef,
				clearPendingStep,
				resetInternalNavigationFlag,
			});

			expect(result).toBe(true);
			expect(updatePreviousStepRef).toHaveBeenCalledWith("step1");
			expect(clearPendingStep).toHaveBeenCalled();
			vi.advanceTimersByTime(0);
			expect(resetInternalNavigationFlag).toHaveBeenCalled();
			vi.useRealTimers();
		});
	});

	describe("clearErrorsForOtherSteps", () => {
		it("deve chamar clearError para cada campo que não está no step atual", () => {
			const currentFieldKeys = new Set(["name", "email"] as const);
			const allFieldKeys = new Set(["name", "email", "phone", "address"] as const);
			const clearError = vi.fn();

			clearErrorsForOtherSteps(
				currentFieldKeys as never,
				allFieldKeys as never,
				clearError
			);

			expect(clearError).toHaveBeenCalledWith("phone");
			expect(clearError).toHaveBeenCalledWith("address");
			expect(clearError).toHaveBeenCalledTimes(2);
		});

		it("não deve chamar clearError quando todos os campos pertencem ao step atual", () => {
			const currentFieldKeys = new Set(["name", "email"] as const);
			const allFieldKeys = new Set(["name", "email"] as const);
			const clearError = vi.fn();

			clearErrorsForOtherSteps(
				currentFieldKeys as never,
				allFieldKeys as never,
				clearError
			);

			expect(clearError).not.toHaveBeenCalled();
		});
	});
});
