"use client";

import { useState } from "react";
import { z } from "zod";
import { createWizardComponents, createWizardConfig, field, useWizard } from "zormy";

interface PlaygroundProps {
	initialSchema?: string;
}

export function Playground({ initialSchema }: PlaygroundProps) {
	const [schemaCode, setSchemaCode] = useState(
		initialSchema ||
			`{
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
}`
	);

	const [error, setError] = useState<string | null>(null);
	const [wizardData, setWizardData] = useState<any>(null);

	const parseSchema = () => {
		try {
			setError(null);
			const parsed = JSON.parse(schemaCode);
			setWizardData(parsed);
		} catch (e) {
			setError(`Erro ao parsear schema: ${e instanceof Error ? e.message : "Erro desconhecido"}`);
		}
	};

	const renderWizard = () => {
		if (!wizardData || !wizardData.steps || !wizardData.fields) {
			return null;
		}

		try {
			const fieldMap: Record<string, any[]> = {};
			const defaultValues: Record<string, any> = {};

			const schemaMap: Record<string, (args?: any) => z.ZodType> = {
				"z.string()": () => z.string(),
				"z.string().min(3)": () => z.string().min(3),
				"z.string().email()": () => z.string().email(),
				"z.string().optional()": () => z.string().optional(),
				"z.string().min(8)": () => z.string().min(8),
				"z.number()": () => z.number(),
				"z.number().min(18)": () => z.number().min(18),
				"z.boolean()": () => z.boolean(),
			};

			Object.entries(wizardData.fields).forEach(([step, fields]: [string, any]) => {
				fieldMap[step] = fields.map((fieldDef: any) => {
					let schema: z.ZodType;
					const schemaStr = fieldDef.schema?.trim() || "z.string()";

					if (schemaMap[schemaStr]) {
						schema = schemaMap[schemaStr]();
					} else {
						try {
							if (schemaStr.includes("z.string()")) {
								if (schemaStr.includes(".email()")) {
									schema = z.string().email();
								} else if (schemaStr.includes(".optional()")) {
									schema = z.string().optional();
								} else if (schemaStr.includes(".min(")) {
									const match = schemaStr.match(/\.min\((\d+)\)/);
									const min = match ? parseInt(match[1], 10) : 1;
									schema = z.string().min(min);
								} else {
									schema = z.string();
								}
							} else if (schemaStr.includes("z.number()")) {
								if (schemaStr.includes(".min(")) {
									const match = schemaStr.match(/\.min\((\d+)\)/);
									const min = match ? parseInt(match[1], 10) : 0;
									schema = z.number().min(min);
								} else {
									schema = z.number();
								}
							} else if (schemaStr.includes("z.boolean()")) {
								schema = z.boolean();
							} else {
								schema = z.string();
							}
						} catch {
							schema = z.string();
						}
					}

					const Field = field(fieldDef.key)
						.schema(schema)
						.render(({ register, fieldState }) => {
							const error = fieldState?.error;
							return (
								<div className="mb-6">
									<label
										className="block mb-1 font-medium text-gray-700 dark:text-gray-200"
										htmlFor={fieldDef.key}
									>
										{fieldDef.key}
									</label>
									<input
										id={fieldDef.key}
										{...register()}
										className={`w-full px-3 py-2 rounded-md outline-none transition-colors border text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 focus:border-blue-500 ${error ? "border-red-500 focus:border-red-500" : "border-gray-300 dark:border-gray-700"}`}
									/>
									{error && (
										<span className="text-red-600 text-xs mt-1 block">
											{error.message as string}
										</span>
									)}
								</div>
							);
						});

					if (fieldDef.defaultValue !== undefined) {
						defaultValues[fieldDef.key] = fieldDef.defaultValue;
					} else if (schema instanceof z.ZodString) {
						defaultValues[fieldDef.key] = "";
					} else if (schema instanceof z.ZodNumber) {
						defaultValues[fieldDef.key] = 0;
					} else if (schema instanceof z.ZodBoolean) {
						defaultValues[fieldDef.key] = false;
					}

					return Field;
				});
			});

			const WizardComponent = () => {
				const config = createWizardConfig({
					steps: wizardData.steps,
					fields: fieldMap,
				});

				const wizard = useWizard({
					...config,
					defaultValues,
					onSubmit: (data) => {
						alert(JSON.stringify(data, null, 2));
					},
				});

				const { Wizard } = createWizardComponents(config);

				return (
					<Wizard methods={wizard} contextOnly>
						<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-8 bg-white dark:bg-gray-900 shadow-sm">
							<div className="mb-4">
								<p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
									Step {wizard.currentStepIndex + 1} de {wizard.totalSteps} - {wizard.currentStep}
								</p>
							</div>
							<form
								onSubmit={wizard.handleSubmit((data) => {
									alert(JSON.stringify(data, null, 2));
								})}
							>
								{wizard.getFieldComponentsForStep(wizard.currentStep).map((Field, i) => (
									<Field key={i} />
								))}
								<div className="mt-6 flex gap-2">
									{!wizard.isFirstStep && (
										<button
											type="button"
											onClick={wizard.back}
											className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
										>
											Voltar
										</button>
									)}
									{wizard.isLastStep ? (
										<button
											type="submit"
											className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
										>
											Finalizar
										</button>
									) : (
										<button
											type="button"
											onClick={wizard.next}
											className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
										>
											Próximo
										</button>
									)}
								</div>
							</form>
						</div>
					</Wizard>
				);
			};

			return <WizardComponent />;
		} catch (e) {
			return (
				<div className="text-red-500 dark:text-red-400 p-4">
					Erro ao renderizar wizard: {e instanceof Error ? e.message : "Erro desconhecido"}
				</div>
			);
		}
	};

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
					Schema do Wizard
				</h3>
				<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
					Edite o JSON abaixo para definir os steps e campos do wizard. Clique em "Aplicar" para ver
					o resultado.
				</p>
				<textarea
					value={schemaCode}
					onChange={(e) => setSchemaCode(e.target.value)}
					className="w-full min-h-[200px] p-3 font-mono text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				{error && <div className="text-red-600 dark:text-red-500 mt-2 text-xs">{error}</div>}
				<button
					onClick={parseSchema}
					className="mt-3 px-4 py-2 rounded-md bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition-colors"
				>
					Aplicar Schema
				</button>
			</div>

			<div>
				<h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
					Preview do Wizard
				</h3>
				{wizardData ? (
					renderWizard()
				) : (
					<div className="border border-gray-200 dark:border-gray-700 rounded-xl px-8 py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 transition-colors">
						<p>Defina um schema e clique em "Aplicar Schema" para ver o wizard</p>
					</div>
				)}
			</div>
		</div>
	);
}
