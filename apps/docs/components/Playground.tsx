"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
	createWizardComponents,
	createWizardConfig,
	field,
	useWizard,
} from "zormy";
import type { NonEmptyStepsConfig } from "zormy";
import type { ZodType } from "zod";
import type { FieldComponent } from "zormy/fields/field/types/field";
import type { StepFieldsMap } from "zormy/wizards/wizard/types/wizard";

const DEFAULT_SCHEMA = `{
  "steps": ["personal", "contact"],
  "fields": {
    "personal": [
      { "key": "name", "schema": "z.string().min(3)" },
      { "key": "age", "schema": "z.number().min(18)" }
    ],
    "contact": [
      { "key": "email", "schema": "z.string().email()" },
      { "key": "phone", "schema": "z.string().optional()" }
    ]
  }
}`;

interface PlaygroundProps {
	initialSchema?: string;
}

interface PlaygroundSchema {
	steps: string[];
	fields: Record<string, PlaygroundFieldDef[]>;
}

interface PlaygroundFieldDef {
	key: string;
	schema?: string;
	defaultValue?: unknown;
}

const DEBOUNCE_MS = 600;

/**
 * Avalia a string do schema no contexto seguro com apenas `z` (Zod).
 * Suporta qualquer API do Zod: preprocess, transform, refine, etc.
 */
function evalSchema(schemaCode: string): z.ZodType {
	const trimmed = schemaCode.trim();
	if (!trimmed) return z.string();
	try {
		const fn = new Function(
			"z",
			`"use strict"; return (${trimmed});`
		) as (zRef: unknown) => unknown;
		const result = fn(z);
		if (result && typeof (result as { _def?: unknown })._def !== "undefined") {
			return result as z.ZodType;
		}
		throw new Error("Schema deve retornar um tipo Zod (ex: z.string(), z.number())");
	} catch (e) {
		throw e instanceof Error ? e : new Error(String(e));
	}
}

function getDefaultForSchema(schema: z.ZodType): unknown {
	if (schema instanceof z.ZodString) return "";
	if (schema instanceof z.ZodNumber) return 0;
	if (schema instanceof z.ZodBoolean) return false;
	if (schema instanceof z.ZodDate) return undefined;
	if (schema instanceof z.ZodEnum) {
		const enumDef = schema._def.values as [string, ...string[]];
		return enumDef[0];
	}
	return "";
}

function isZodNumber(schema: z.ZodType): boolean {
	return schema instanceof z.ZodNumber;
}

function isZodBoolean(schema: z.ZodType): boolean {
	return schema instanceof z.ZodBoolean;
}

function getZodEnumOptions(schema: z.ZodType): string[] | null {
	if (schema instanceof z.ZodEnum) {
		return schema._def.values as string[];
	}
	return null;
}

export function Playground({ initialSchema }: PlaygroundProps) {
	const [schemaCode, setSchemaCode] = useState(initialSchema ?? DEFAULT_SCHEMA);
	const [parseError, setParseError] = useState<string | null>(null);
	const [wizardData, setWizardData] = useState<PlaygroundSchema | null>(null);
	const [submittedData, setSubmittedData] = useState<unknown>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const tryParse = useCallback(() => {
		setParseError(null);
		try {
			const parsed = JSON.parse(schemaCode) as PlaygroundSchema;
			if (!parsed.steps || !Array.isArray(parsed.steps) || !parsed.fields || typeof parsed.fields !== "object") {
				setParseError("Schema deve ter 'steps' (array) e 'fields' (objeto).");
				return;
			}
			setWizardData(parsed);
		} catch (e) {
			setParseError(e instanceof SyntaxError ? `JSON inválido: ${e.message}` : String(e));
		}
	}, [schemaCode]);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(tryParse, DEBOUNCE_MS);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [tryParse]);

	useEffect(() => {
		tryParse();
	}, []);

	const resetSchema = () => {
		setSchemaCode(DEFAULT_SCHEMA);
		setParseError(null);
		setSubmittedData(null);
	};

	const renderWizard = () => {
		if (!wizardData?.steps?.length || !wizardData.fields) return null;

		const fieldMap: StepFieldsMap<readonly string[]> = {};
		const defaultValues: Record<string, unknown> = {};

		for (const step of wizardData.steps) {
			const fields = wizardData.fields[step];
			if (!Array.isArray(fields)) continue;

			fieldMap[step] = fields.map((fieldDef: PlaygroundFieldDef) => {
				const schemaStr = fieldDef.schema?.trim() || "z.string()";
				let schema: z.ZodType;
				try {
					schema = evalSchema(schemaStr);
				} catch (e) {
					throw new Error(`Campo "${fieldDef.key}": ${e instanceof Error ? e.message : schemaStr}`);
				}

				const enumOptions = getZodEnumOptions(schema);
				const isNumber = isZodNumber(schema);
				const isBoolean = isZodBoolean(schema);

				const Field = field(fieldDef.key)
					.schema(schema)
					.render(({ register, fieldState }) => {
						const err = fieldState?.error;
						const inputCn = `w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none transition-colors focus:ring-2 focus:ring-blue-500 focus:border-transparent ${err ? "border-red-500" : "border-gray-300 dark:border-gray-600"}`;

						if (isBoolean) {
							return (
								<div className="mb-5">
									<label className="flex items-center gap-2 cursor-pointer">
										<input
											type="checkbox"
											{...register()}
											className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
										/>
										<span className="font-medium text-gray-700 dark:text-gray-200">{fieldDef.key}</span>
									</label>
									{err && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{err.message as string}</p>}
								</div>
							);
						}

						if (enumOptions?.length) {
							return (
								<div className="mb-5">
									<label className="block mb-1 font-medium text-gray-700 dark:text-gray-200" htmlFor={fieldDef.key}>
										{fieldDef.key}
									</label>
									<select id={fieldDef.key} {...register()} className={inputCn}>
										<option value="">Selecione...</option>
										{enumOptions.map((opt) => (
											<option key={opt} value={opt}>
												{opt}
											</option>
										))}
									</select>
									{err && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{err.message as string}</p>}
								</div>
							);
						}

						return (
							<div className="mb-5">
								<label className="block mb-1 font-medium text-gray-700 dark:text-gray-200" htmlFor={fieldDef.key}>
									{fieldDef.key}
								</label>
								<input
									id={fieldDef.key}
									type={isNumber ? "number" : "text"}
									{...(isNumber ? register({ valueAsNumber: true }) : register())}
									className={inputCn}
									placeholder={isNumber ? "0" : undefined}
								/>
								{err && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{err.message as string}</p>}
							</div>
						);
					});

				defaultValues[fieldDef.key] =
					fieldDef.defaultValue !== undefined ? fieldDef.defaultValue : getDefaultForSchema(schema);
				return Field;
			});
		}

		const stepsConfig = wizardData.steps.map((step) => ({
			name: step,
			fields: fieldMap[step] ?? [],
		}));
		if (stepsConfig.length === 0) return null;

		const WizardComponent = () => {
			const config = createWizardConfig({
				steps: stepsConfig as unknown as NonEmptyStepsConfig,
			});
			const wizard = useWizard({
				steps: stepsConfig as unknown as NonEmptyStepsConfig,
				defaultValues,
				onComplete: (data) => setSubmittedData(data),
			});
			const { Wizard, WizardNav, WizardNavBack, WizardNavNext } =
				createWizardComponents(config);

			return (
				<Wizard methods={wizard} contextOnly>
					<div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
						<div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
							<p className="text-sm font-medium text-gray-600 dark:text-gray-300">
								Step {wizard.currentStepIndex + 1} de {wizard.totalSteps}
								<span className="text-gray-500 dark:text-gray-400"> — {wizard.currentStep}</span>
							</p>
						</div>
						<form
							className="p-6"
							onSubmit={wizard.handleSubmit((data) => setSubmittedData(data))}
						>
							{wizard
								.getFieldComponentsForStep(wizard.currentStep)
								.map((Field: FieldComponent<string, ZodType>, i) => (
									<Field key={i} />
								))}
							<WizardNav as="div" className="mt-6 flex gap-3">
								<WizardNavBack
									as="button"
									className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
								>
									Voltar
								</WizardNavBack>
								<WizardNavNext
									as="button"
									nextLabel="Próximo"
									submitLabel="Finalizar"
									className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 transition-colors"
								/>
							</WizardNav>
						</form>
					</div>
				</Wizard>
			);
		};

		return <WizardComponent />;
	};

	let previewContent: React.ReactNode;
	let previewError: string | null = null;

	if (parseError) {
		previewContent = null;
		previewError = parseError;
	} else if (wizardData) {
		try {
			previewContent = renderWizard();
		} catch (e) {
			previewContent = null;
			previewError = e instanceof Error ? e.message : String(e);
		}
	} else {
		previewContent = null;
		previewError = null;
	}

	return (
		<div className="my-8 flex flex-col gap-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Editor */}
				<div className="flex flex-col">
					<div className="flex items-center justify-between mb-2">
						<label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
							Schema JSON — o que você edita aqui vale no preview (Zod real)
						</label>
						<button
							type="button"
							onClick={resetSchema}
							className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
						>
							Restaurar padrão
						</button>
					</div>
					<textarea
						value={schemaCode}
						onChange={(e) => setSchemaCode(e.target.value)}
						spellCheck={false}
						className="min-h-[280px] w-full p-4 font-mono text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
						placeholder='{ "steps": [...], "fields": { ... } }'
					/>
					{parseError && (
						<div className="mt-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
							{parseError}
						</div>
					)}
				</div>

				{/* Preview */}
				<div className="flex flex-col">
					<div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
						Preview do wizard
					</div>
					<div className="min-h-[320px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 p-4 flex flex-col">
						{previewError ? (
							<div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200 p-4">
								{previewError}
							</div>
						) : previewContent ? (
							previewContent
						) : (
							<div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm text-center px-4">
								Edite o JSON ao lado. O preview atualiza automaticamente. Use qualquer API do Zod nos campos <code className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">schema</code> (ex.: preprocess, transform).
							</div>
						)}
					</div>
					{submittedData !== null && (
						<details className="mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
							<summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
								Dados enviados (onComplete)
							</summary>
							<pre className="p-4 text-xs overflow-auto max-h-48 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
								{JSON.stringify(submittedData, null, 2)}
							</pre>
						</details>
					)}
				</div>
			</div>
		</div>
	);
}
