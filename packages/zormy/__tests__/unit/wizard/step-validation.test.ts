import { describe, expect, it } from "vitest";

import { getStepSummary } from "../../../src/wizards/step/utils/step";

describe("step-validation - getStepSummary", () => {
	describe("steps não visitados", () => {
		it("deve retornar 'completed' para step não visitado mas válido", () => {
			const visitedSteps = new Set<string>();
			const hasErrorFn = () => false;
			const isValidFn = () => true;

			const summary = getStepSummary("step1", "step2", visitedSteps, hasErrorFn, isValidFn);

			expect(summary).toBe("completed");
		});

		it("deve retornar 'pending' para step não visitado e inválido", () => {
			const visitedSteps = new Set<string>();
			const hasErrorFn = () => false;
			const isValidFn = () => false;

			const summary = getStepSummary("step1", "step2", visitedSteps, hasErrorFn, isValidFn);

			expect(summary).toBe("pending");
		});

		it("deve retornar 'pending' para step não visitado com erro", () => {
			const visitedSteps = new Set<string>();
			const hasErrorFn = () => true;
			const isValidFn = () => false;

			const summary = getStepSummary("step1", "step2", visitedSteps, hasErrorFn, isValidFn);

			expect(summary).toBe("pending");
		});
	});

	describe("steps visitados", () => {
		it("deve retornar 'completed' para step visitado e válido", () => {
			const visitedSteps = new Set<string>(["step1"]);
			const hasErrorFn = () => false;
			const isValidFn = () => true;

			const summary = getStepSummary("step1", "step2", visitedSteps, hasErrorFn, isValidFn);

			expect(summary).toBe("completed");
		});

		it("deve retornar 'error' para step visitado com erro", () => {
			const visitedSteps = new Set<string>(["step1"]);
			const hasErrorFn = () => true;
			const isValidFn = () => false;

			const summary = getStepSummary("step1", "step2", visitedSteps, hasErrorFn, isValidFn);

			expect(summary).toBe("error");
		});
	});

	describe("step atual", () => {
		it("deve retornar 'editing' para step atual sem erro", () => {
			const visitedSteps = new Set<string>(["step1"]);
			const hasErrorFn = () => false;
			const isValidFn = () => true;

			const summary = getStepSummary("step1", "step1", visitedSteps, hasErrorFn, isValidFn);

			expect(summary).toBe("editing");
		});

		it("deve retornar 'error' para step atual com erro", () => {
			const visitedSteps = new Set<string>(["step1"]);
			const hasErrorFn = () => true;
			const isValidFn = () => false;

			const summary = getStepSummary("step1", "step1", visitedSteps, hasErrorFn, isValidFn);

			expect(summary).toBe("error");
		});
	});
});
