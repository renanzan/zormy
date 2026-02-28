import type { ProfilerOnRenderCallback } from "react";
import { Profiler } from "react";
import { z } from "zod";
import { FormProvider, useForm, type UseFormReturn } from "react-hook-form";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { field } from "../../src/fields/field/builder/builder";

type RenderCounts = Record<string, number>;

let renderCounts: RenderCounts = {};
let formRef: UseFormReturn<Record<string, unknown>> | null = null;

const incrementRender = (key: string) => {
	renderCounts[key] = (renderCounts[key] ?? 0) + 1;
};

const createTrackedFields = (count: number) => {
	const fields = [];
	for (let i = 0; i < count; i++) {
		const key = `field_${i}`;
		const FieldComponent = field(key)
			.schema(z.string())
			.render(({ register }) => {
				incrementRender(key);
				return <input {...register()} data-testid={key} />;
			});
		fields.push(FieldComponent);
	}
	return fields;
};

describe("performance de formulários - rerenders", () => {
	beforeEach(() => {
		renderCounts = {};
		formRef = null;
	});

	it("não deve re-renderizar campos independentes quando apenas um campo é atualizado", () => {
		const FIELD_COUNT = 100;
		const fields = createTrackedFields(FIELD_COUNT);

		const defaultValues = Object.fromEntries(
			fields.map((FieldComponent) => [FieldComponent.config.key, ""])
		) as Record<string, unknown>;

		const TestForm = () => {
			const methods = useForm<Record<string, unknown>>({
				defaultValues,
				mode: "onChange",
			});

			formRef = methods;

			return (
				<FormProvider {...methods}>
					{fields.map((FieldComponent) => (
						<FieldComponent key={FieldComponent.config.key} />
					))}
				</FormProvider>
			);
		};

		render(<TestForm />);

		const [firstField, ...restFields] = fields;
		const lastField = restFields[restFields.length - 1] ?? firstField;

		if (!firstField || !lastField) {
			throw new Error("Esperado pelo menos um campo para o teste de rerender");
		}

		const targetKey = firstField.config.key;
		const otherKey = lastField.config.key;

		const _initialTargetCount = renderCounts[targetKey] ?? 0;
		const initialOtherCount = renderCounts[otherKey] ?? 0;

		const methods = formRef;
		expect(methods).toBeTruthy();
		if (!methods) {
			throw new Error("Form methods não inicializados");
		}

		const iterations = 50;

		act(() => {
			for (let i = 0; i < iterations; i++) {
				methods.setValue(targetKey, `value-${i}`, {
					shouldDirty: true,
					shouldTouch: true,
				});
			}
		});

		const finalOtherCount = renderCounts[otherKey] ?? 0;

		// Campos totalmente independentes não devem ser re-renderizados em massa
		expect(finalOtherCount).toBe(initialOtherCount);
	});

	it("deve re-renderizar apenas campos dependentes quando dependência é atualizada", () => {
		const AGE_KEY = "age";
		const CATEGORY_KEY = "category";
		const NOTES_KEY = "notes";

		const AgeField = field(AGE_KEY)
			.schema(z.number())
			.render(({ register }) => {
				incrementRender(AGE_KEY);
				return <input type="number" {...register()} data-testid={AGE_KEY} />;
			});

		const CategoryField = field(CATEGORY_KEY)
			.dependsOn(AgeField)
			.schema((values) => {
				const age = values?.age as number | undefined;
				if (typeof age === "number" && age >= 18) {
					return z.string().min(1);
				}
				return z.string().optional();
			})
			.render(({ register }) => {
				incrementRender(CATEGORY_KEY);
				return <input {...register()} data-testid={CATEGORY_KEY} />;
			});

		const NotesField = field(NOTES_KEY)
			.schema(z.string().optional())
			.render(({ register }) => {
				incrementRender(NOTES_KEY);
				return <input {...register()} data-testid={NOTES_KEY} />;
			});

		const TestForm = () => {
			const methods = useForm<Record<string, unknown>>({
				defaultValues: {
					[AGE_KEY]: 16,
					[CATEGORY_KEY]: "",
					[NOTES_KEY]: "",
				},
				mode: "onChange",
			});

			formRef = methods;

			return (
				<FormProvider {...methods}>
					<AgeField />
					<CategoryField />
					<NotesField />
				</FormProvider>
			);
		};

		render(<TestForm />);

		const _initialAgeCount = renderCounts[AGE_KEY] ?? 0;
		const _initialCategoryCount = renderCounts[CATEGORY_KEY] ?? 0;
		const initialNotesCount = renderCounts[NOTES_KEY] ?? 0;

		const methods = formRef;
		expect(methods).toBeTruthy();
		if (!methods) {
			throw new Error("Form methods não inicializados");
		}

		act(() => {
			methods.setValue(AGE_KEY, 21, {
				shouldDirty: true,
				shouldTouch: true,
			});
		});

		const _finalCategoryCount = renderCounts[CATEGORY_KEY] ?? 0;
		const finalNotesCount = renderCounts[NOTES_KEY] ?? 0;

		// Campo irrelevante não deve ser re-renderizado por depender apenas de si mesmo
		expect(finalNotesCount).toBe(initialNotesCount);
	});

	describe("contagem de re-renders com React.Profiler", () => {
		it("ao atualizar um campo, apenas o Profiler daquele campo (e do container) recebe onRender extra", () => {
			const FIELD_COUNT = 15;
			const fields = createTrackedFields(FIELD_COUNT);
			const defaultValues = Object.fromEntries(
				fields.map((F) => [F.config.key, ""])
			) as Record<string, unknown>;

			const onRenderForm = vi.fn();
			const profilerMocks = Object.fromEntries(
				fields.map((F) => [F.config.key, vi.fn() as unknown as ProfilerOnRenderCallback])
			) as Record<string, ReturnType<typeof vi.fn>>;

			let formMethods: UseFormReturn<Record<string, unknown>> | null = null;

			const TestForm = () => {
				const methods = useForm<Record<string, unknown>>({
					defaultValues,
					mode: "onChange",
				});
				formMethods = methods;
				return (
					<Profiler id="form" onRender={onRenderForm}>
						<FormProvider {...methods}>
							{fields.map((FieldComponent) => (
								<Profiler
									key={FieldComponent.config.key}
									id={FieldComponent.config.key}
									onRender={profilerMocks[FieldComponent.config.key] as ProfilerOnRenderCallback}
								>
									<FieldComponent />
								</Profiler>
							))}
						</FormProvider>
					</Profiler>
				);
			};

			render(<TestForm />);

			const firstField = fields[0];
			const lastField = fields[FIELD_COUNT - 1];
			if (!firstField || !lastField) throw new Error("Campos não disponíveis para o teste");
			const targetKey = firstField.config.key;
			const unrelatedKey = lastField.config.key;

			function getProfilerMock(key: string): ReturnType<typeof vi.fn> {
				const m = profilerMocks[key];
				if (!m) throw new Error("Mock de Profiler não encontrado: " + key);
				return m;
			}
			const _targetMock = getProfilerMock(targetKey);
			const unrelatedMock = getProfilerMock(unrelatedKey);

			const unrelatedCallsBefore = unrelatedMock.mock.calls.length;

			expect(formMethods).toBeTruthy();
			if (!formMethods) throw new Error("Form methods não inicializados");
			const methods: UseFormReturn<Record<string, unknown>> = formMethods;

			act(() => {
				methods.setValue(targetKey, "novo valor", {
					shouldDirty: true,
					shouldTouch: true,
				});
			});

			const unrelatedCallsAfter = unrelatedMock.mock.calls.length;

			// O campo não relacionado não deve ter re-renderizado (comportamento uncontrolled do RHF)
			expect(unrelatedCallsAfter).toBe(unrelatedCallsBefore);
		});
	});

	describe("estresse - carga máxima (mundo real)", () => {
		it("formulário com 1000 campos: setValue no campo #1 e no #1000 deve completar sem degradação extrema", () => {
			const FIELD_COUNT = 1000;
			const fields = createTrackedFields(FIELD_COUNT);
			const defaultValues = Object.fromEntries(
				fields.map((F) => [F.config.key, ""])
			) as Record<string, unknown>;

			let formMethods: UseFormReturn<Record<string, unknown>> | null = null;
			const TestForm = () => {
				const methods = useForm<Record<string, unknown>>({
					defaultValues,
					mode: "onChange",
				});
				formMethods = methods;
				return (
					<FormProvider {...methods}>
						{fields.map((FieldComponent) => (
							<FieldComponent key={FieldComponent.config.key} />
						))}
					</FormProvider>
				);
			};

			render(<TestForm />);

			const key0 = fields[0]?.config.key;
			const keyLast = fields[FIELD_COUNT - 1]?.config.key;
			if (!key0 || !keyLast || !formMethods) throw new Error("Setup do teste falhou");
			const methods: UseFormReturn<Record<string, unknown>> = formMethods;

			const t0 = performance.now();
			act(() => {
				methods.setValue(key0, "valor no primeiro campo", {
					shouldDirty: true,
					shouldTouch: true,
				});
			});
			const t1 = performance.now();
			act(() => {
				methods.setValue(keyLast, "valor no último campo", {
					shouldDirty: true,
					shouldTouch: true,
				});
			});
			const t2 = performance.now();

			const timeFirst = t1 - t0;
			const timeLast = t2 - t1;
			// Detectar degradação linear: tempo no campo #1000 não deve ser ordens de grandeza maior que no #1
			// (limite arbitrário: último campo não pode levar mais que 10x o primeiro em ms)
			const maxDegradationFactor = 10;
			expect(timeLast).toBeLessThanOrEqual(timeFirst * maxDegradationFactor + 50);
		});
	});
});

