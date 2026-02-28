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
			// Parse simples do JSON (em produção, use um parser mais robusto)
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
			// Cria campos dinamicamente
			const fieldMap: Record<string, any[]> = {};
			const defaultValues: Record<string, any> = {};

			// Mapeamento de schemas comuns
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
					// Tenta encontrar o schema no mapeamento
					let schema: z.ZodType;
					const schemaStr = fieldDef.schema?.trim() || "z.string()";

					if (schemaMap[schemaStr]) {
						schema = schemaMap[schemaStr]();
					} else {
						// Fallback: tenta parsear expressões simples
						try {
							// Para schemas mais complexos, use uma abordagem mais segura
							// Por enquanto, usamos um fallback básico
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

					// Cria o campo
					const Field = field(fieldDef.key)
						.schema(schema)
						.render(({ register, fieldState }) => {
							// Verificação de segurança para evitar erros quando formState não está inicializado
							const error = fieldState?.error;
							return (
								<div style={{ marginBottom: "1rem" }}>
									<label style={{ display: "block", marginBottom: "0.25rem" }}>
										{fieldDef.key}
									</label>
									<input
										{...register()}
										style={{
											width: "100%",
											padding: "0.5rem",
											border: error ? "1px solid red" : "1px solid #ccc",
											borderRadius: "4px",
										}}
									/>
									{error && (
										<span style={{ color: "red", fontSize: "0.875rem" }}>
											{error.message as string}
										</span>
									)}
								</div>
							);
						});

					// Define valor padrão
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

			// Componente do wizard
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
						<div
							style={{
								border: "1px solid #e5e7eb",
								borderRadius: "8px",
								padding: "1.5rem",
								backgroundColor: "#fff",
							}}
						>
							<div style={{ marginBottom: "1rem" }}>
								<p style={{ margin: 0, fontSize: "0.875rem", color: "#666" }}>
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

								<div
									style={{
										marginTop: "1.5rem",
										display: "flex",
										gap: "0.5rem",
									}}
								>
									{!wizard.isFirstStep && (
										<button
											type="button"
											onClick={wizard.back}
											style={{
												padding: "0.5rem 1rem",
												border: "1px solid #ccc",
												borderRadius: "4px",
												backgroundColor: "#fff",
												cursor: "pointer",
											}}
										>
											Voltar
										</button>
									)}
									{wizard.isLastStep ? (
										<button
											type="submit"
											style={{
												padding: "0.5rem 1rem",
												border: "none",
												borderRadius: "4px",
												backgroundColor: "#3b82f6",
												color: "#fff",
												cursor: "pointer",
											}}
										>
											Finalizar
										</button>
									) : (
										<button
											type="button"
											onClick={wizard.next}
											style={{
												padding: "0.5rem 1rem",
												border: "none",
												borderRadius: "4px",
												backgroundColor: "#3b82f6",
												color: "#fff",
												cursor: "pointer",
											}}
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
				<div style={{ color: "red", padding: "1rem" }}>
					Erro ao renderizar wizard: {e instanceof Error ? e.message : "Erro desconhecido"}
				</div>
			);
		}
	};

	return (
		<div style={{ display: "flex", gap: "1.5rem", flexDirection: "column" }}>
			<div>
				<h3 style={{ marginBottom: "0.5rem" }}>Schema do Wizard</h3>
				<p style={{ fontSize: "0.875rem", color: "#666", marginBottom: "1rem" }}>
					Edite o JSON abaixo para definir os steps e campos do wizard. Clique em "Aplicar" para ver
					o resultado.
				</p>
				<textarea
					value={schemaCode}
					onChange={(e) => setSchemaCode(e.target.value)}
					style={{
						width: "100%",
						minHeight: "200px",
						padding: "0.75rem",
						fontFamily: "monospace",
						fontSize: "0.875rem",
						border: "1px solid #ccc",
						borderRadius: "4px",
						resize: "vertical",
					}}
				/>
				{error && (
					<div style={{ color: "red", marginTop: "0.5rem", fontSize: "0.875rem" }}>{error}</div>
				)}
				<button
					onClick={parseSchema}
					style={{
						marginTop: "0.75rem",
						padding: "0.5rem 1rem",
						border: "none",
						borderRadius: "4px",
						backgroundColor: "#3b82f6",
						color: "#fff",
						cursor: "pointer",
					}}
				>
					Aplicar Schema
				</button>
			</div>

			<div>
				<h3 style={{ marginBottom: "0.5rem" }}>Preview do Wizard</h3>
				{wizardData ? (
					renderWizard()
				) : (
					<div
						style={{
							border: "1px solid #e5e7eb",
							borderRadius: "8px",
							padding: "3rem",
							textAlign: "center",
							color: "#666",
							backgroundColor: "#f9fafb",
						}}
					>
						<p>Defina um schema e clique em "Aplicar Schema" para ver o wizard</p>
					</div>
				)}
			</div>
		</div>
	);
}
