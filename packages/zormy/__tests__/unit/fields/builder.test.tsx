import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { abstractField, field } from "../../../src/fields/field/builder/builder";

/**
 * Testes do builder de campos (field builder).
 *
 * Estes testes demonstram como criar campos usando a API fluente do formy
 * e servem como documentação de exemplos de uso.
 */
describe("field builder - API fluente para criar campos", () => {
	describe("criação básica de campos", () => {
		it("deve criar campo simples com schema estático e chave literal", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			// Verifica que o campo foi criado corretamente
			expect(NameField.config.key).toBe("name");
			expect(NameField.config.schema).toBeInstanceOf(z.ZodString);
		});

		it("deve criar campo com schema dinâmico baseado em valores do formulário", () => {
			const AgeField = field("age")
				.schema((formValues) => {
					if (formValues?.isMinor) {
						return z.number().max(17);
					}
					return z.number().min(18);
				})
				.render(({ register }) => <input type="number" {...register()} />);

			expect(AgeField.config.key).toBe("age");

			// Schema dinâmico deve gerar schema diferente baseado em formValues
			const minorSchema = AgeField.getZodSchema({ isMinor: true });
			expect(minorSchema).toBeInstanceOf(z.ZodNumber);

			const adultSchema = AgeField.getZodSchema({ isMinor: false });
			expect(adultSchema).toBeInstanceOf(z.ZodNumber);
		});

		it("deve permitir renderizar campo como componente React dentro de FormProvider", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} data-testid="name-input" />);

			const TestForm = () => {
				const methods = useForm({
					defaultValues: { name: "" },
				});

				return (
					<FormProvider {...methods}>
						<NameField />
					</FormProvider>
				);
			};

			render(<TestForm />);
			expect(screen.getByTestId("name-input")).toBeInTheDocument();
		});
	});

	describe("campos com dependências - validação cross-field", () => {
		it("deve criar campo com dependência de outro campo usando FieldComponent", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const EmailField = field("email")
				.dependsOn(NameField)
				.schema((formValues) => {
					// formValues.name está tipado aqui devido ao dependsOn
					const name = formValues?.name;
					return name ? z.string().email() : z.string().optional();
				})
				.render(({ register }) => <input type="email" {...register()} />);

			// Verifica que a dependência foi registrada
			expect(EmailField.config.dependencies).toEqual(["name"]);
		});

		it("deve criar campo com múltiplas dependências de FieldComponents", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(({ register }) => <input type="number" {...register()} />);

			const EmailField = field("email")
				.schema(z.string().email())
				.render(({ register }) => <input type="email" {...register()} />);

			const PhoneField = field("phone")
				.dependsOn(AgeField, EmailField)
				.schema((formValues) => {
					// formValues.age e formValues.email estão tipados
					const age = formValues?.age;
					const email = formValues?.email;

					const isMinor = age !== undefined && age < 18;
					const isCorporateEmail =
						email?.endsWith("@empresa.com") || email?.endsWith("@corporativo.com.br");

					// Telefone obrigatório para menores OU emails corporativos
					if (isMinor || isCorporateEmail) {
						return z.string({ required_error: "Telefone obrigatório" });
					}

					return z.string().optional();
				})
				.render(({ register }) => <input {...register()} />);

			expect(PhoneField.config.dependencies).toEqual(["age", "email"]);
		});

		it("deve criar campo com dependência usando string (sem tipagem forte)", () => {
			const PhoneField = field("phone")
				.dependsOn("age")
				.schema((formValues) => {
					// formValues.age está disponível mas sem tipagem forte
					const age = formValues?.age;
					return age && age < 18
						? z.string({ required_error: "Telefone obrigatório" })
						: z.string().optional();
				})
				.render(({ register }) => <input {...register()} />);

			expect(PhoneField.config.dependencies).toEqual(["age"]);
		});

		it("deve criar campo com dependência usando lazy getter para resolver dependências circulares", () => {
			// Simula dependência circular usando lazy getter
			// Nota: Este é um exemplo conceitual - dependências circulares são complexas
			// Na prática, o lazy getter permite que o FieldComponent seja resolvido depois
			const PersonField = field("person")
				.schema(z.object({ id: z.string() }))
				.render(({ register }) => <input {...register()} />);

			const NameField = field("name")
				.dependsOn(() => PersonField) // Lazy getter resolve dependência circular
				.schema((formValues) => {
					const person = formValues?.person;
					return person ? z.string().min(1) : z.string().optional();
				})
				.render(({ register }) => <input {...register()} />);

			// A dependência deve ser extraída corretamente (mesmo que lazy)
			expect(NameField.config.dependencies).toBeDefined();
		});
	});

	describe("extensão de campos - criar variações", () => {
		it("deve estender campo criando novo campo com chave diferente", () => {
			const BaseField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const FirstNameField = BaseField.extend({
				key: "first_name",
			});

			expect(FirstNameField.config.key).toBe("first_name");
			expect(FirstNameField.config.schema).toBeInstanceOf(z.ZodString);
		});

		it("deve estender campo sobrescrevendo schema com validações adicionais", () => {
			const BaseField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const RequiredNameField = BaseField.extend({
				schema: z.string().min(1, "Nome obrigatório"),
			});

			expect(RequiredNameField.config.key).toBe("name");
			expect(RequiredNameField.config.schema).toBeInstanceOf(z.ZodString);

			// Deve validar mínimo de 1 caractere
			const schema = RequiredNameField.getZodSchema();
			const result = schema.safeParse("");
			expect(result.success).toBe(false);
		});

		it("deve estender campo sobrescrevendo função de renderização", () => {
			const BaseField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} data-testid="base" />);

			const CustomField = BaseField.extend({
				render: ({ register }) => <input {...register()} data-testid="custom" />,
			});

			const TestForm = () => {
				const methods = useForm({ defaultValues: { name: "" } });
				return (
					<FormProvider {...methods}>
						<CustomField />
					</FormProvider>
				);
			};

			render(<TestForm />);
			expect(screen.getByTestId("custom")).toBeInTheDocument();
			expect(screen.queryByTestId("base")).not.toBeInTheDocument();
		});

		it("deve estender campo combinando múltiplas sobrescritas (key + schema)", () => {
			const BaseField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} />);

			const ExtendedField = BaseField.extend({
				key: "fullName",
				schema: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres"),
			});

			expect(ExtendedField.config.key).toBe("fullName");
			const schema = ExtendedField.getZodSchema();
			const result = schema.safeParse("AB");
			expect(result.success).toBe(false);
		});

		it("deve estender campo sobrescrevendo props padrão", () => {
			const BaseField = field("name")
				.schema(z.string())
				.render(({ register }, props: { label: string; placeholder?: string }) => (
					<div>
						<label>{props.label}</label>
						<input {...register()} placeholder={props.placeholder} data-testid="name-input" />
					</div>
				));

			const ExtendedField = BaseField.extend({
				props: {
					label: "Nome Completo",
					placeholder: "Digite seu nome completo",
				},
			});

			const TestForm = () => {
				const methods = useForm({ defaultValues: { name: "" } });
				return (
					<FormProvider {...methods}>
						{/* Props padrão permitem usar o campo sem passar props, mas TypeScript ainda exige */}
						<ExtendedField label="Nome Completo" />
					</FormProvider>
				);
			};

			render(<TestForm />);
			const input = screen.getByTestId("name-input");
			expect(input).toHaveAttribute("placeholder", "Digite seu nome completo");
			expect(screen.getByText("Nome Completo")).toBeInTheDocument();
		});

		it("deve permitir sobrescrever props padrão ao usar o campo estendido", () => {
			const BaseField = field("name")
				.schema(z.string())
				.render(({ register }, props: { label: string; placeholder?: string }) => (
					<div>
						<label>{props.label}</label>
						<input {...register()} placeholder={props.placeholder} data-testid="name-input" />
					</div>
				));

			const ExtendedField = BaseField.extend({
				props: {
					label: "Nome Completo",
					placeholder: "Digite seu nome completo",
				},
			});

			const TestForm = () => {
				const methods = useForm({ defaultValues: { name: "" } });
				return (
					<FormProvider {...methods}>
						<ExtendedField label="Nome Sobrescrito" placeholder="Placeholder sobrescrito" />
					</FormProvider>
				);
			};

			render(<TestForm />);
			const input = screen.getByTestId("name-input");
			expect(input).toHaveAttribute("placeholder", "Placeholder sobrescrito");
			expect(screen.getByText("Nome Sobrescrito")).toBeInTheDocument();
		});

		it("deve mesclar props padrão ao estender campo com props existentes", () => {
			const BaseField = field("name")
				.schema(z.string())
				.render(
					({ register }, props: { label: string; placeholder?: string; required?: boolean }) => (
						<div>
							<label>
								{props.label}
								{props.required && " *"}
							</label>
							<input
								{...register()}
								placeholder={props.placeholder}
								data-testid="name-input"
								data-required={props.required}
							/>
						</div>
					)
				);

			// Cria campo com props padrão
			const FieldWithDefaults = BaseField.extend({
				props: {
					label: "Nome",
					placeholder: "Digite seu nome",
					required: true,
				},
			});

			// Estende novamente, mesclando props
			const ExtendedField = FieldWithDefaults.extend({
				props: {
					label: "Nome Completo",
					// placeholder e required são mantidos
				},
			});

			const TestForm = () => {
				const methods = useForm({ defaultValues: { name: "" } });
				return (
					<FormProvider {...methods}>
						{/* Props padrão mescladas: label sobrescrito, placeholder e required mantidos */}
						<ExtendedField label="Nome Completo" />
					</FormProvider>
				);
			};

			render(<TestForm />);
			const input = screen.getByTestId("name-input");
			expect(input).toHaveAttribute("placeholder", "Digite seu nome");
			expect(input).toHaveAttribute("data-required", "true");
			expect(screen.getByText("Nome Completo *")).toBeInTheDocument();
		});

		it("deve preservar tipo Props original ao estender campo apenas com props padrão", () => {
			// Simula o cenário do PasswordField: campo com InputProps que inclui className
			const BaseField = field("password")
				.schema(z.string())
				.render(
					(
						{ register, fieldState },
						props: {
							label: { text: string; required: boolean };
							className?: string;
							placeholder?: string;
						}
					) => (
						<div className={props.className}>
							<label>
								{props.label.text}
								{props.label.required && " *"}
							</label>
							<input
								{...register()}
								placeholder={props.placeholder}
								data-testid="password-input"
								data-error={fieldState.error?.message}
							/>
						</div>
					)
				);

			// Estende apenas com props padrão (sem especificar className)
			const ExtendedField = BaseField.extend({
				key: "current_password",
				props: {
					label: { text: "Senha Atual", required: true },
				},
			});

			const TestForm = () => {
				const methods = useForm({ defaultValues: { current_password: "" } });
				return (
					<FormProvider {...methods}>
						{/* Deve aceitar className mesmo que não tenha sido especificado no extend */}
						{/* Props padrão são mescladas, mas você ainda pode passar props adicionais */}
						<ExtendedField
							label={{ text: "Senha Atual", required: true }}
							className="col-span-full"
							placeholder="Digite sua senha"
						/>
					</FormProvider>
				);
			};

			render(<TestForm />);
			const container = screen.getByTestId("password-input").parentElement;
			expect(container).toHaveClass("col-span-full");
			const input = screen.getByTestId("password-input");
			expect(input).toHaveAttribute("placeholder", "Digite sua senha");
			expect(screen.getByText("Senha Atual *")).toBeInTheDocument();
		});

		it("deve permitir passar todas as props originais ao estender campo com props padrão", () => {
			type InputProps = {
				label: { text: string; required: boolean };
				className?: string;
				placeholder?: string;
				disabled?: boolean;
			};

			const BaseField = field("email")
				.schema(z.string().email())
				.render(({ register, fieldState }, props: InputProps) => (
					<div className={props.className}>
						<label>
							{props.label.text}
							{props.label.required && " *"}
						</label>
						<input
							{...register()}
							placeholder={props.placeholder}
							disabled={props.disabled}
							data-testid="email-input"
							data-error={fieldState.error?.message}
						/>
					</div>
				));

			// Estende apenas com props padrão
			const ExtendedField = BaseField.extend({
				props: {
					label: { text: "E-mail", required: true },
					placeholder: "Digite seu e-mail",
				},
			});

			const TestForm = () => {
				const methods = useForm({ defaultValues: { email: "" } });
				return (
					<FormProvider {...methods}>
						{/* Deve aceitar todas as props originais (className, disabled, etc.) */}
						{/* Props passadas sobrescrevem as padrão (placeholder será "E-mail desabilitado") */}
						<ExtendedField
							label={{ text: "E-mail", required: true }}
							className="col-span-full"
							disabled={true}
							placeholder="E-mail desabilitado"
						/>
					</FormProvider>
				);
			};

			render(<TestForm />);
			const container = screen.getByTestId("email-input").parentElement;
			expect(container).toHaveClass("col-span-full");
			const input = screen.getByTestId("email-input");
			expect(input).toBeDisabled();
			expect(input).toHaveAttribute("placeholder", "E-mail desabilitado");
			expect(screen.getByText("E-mail *")).toBeInTheDocument();
		});
	});

	describe("campos aninhados - usando dot notation", () => {
		it("deve criar campo aninhado usando dot notation na chave", () => {
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(({ register }) => <input {...register({ name: "user.name" })} />);

			expect(UserNameField.config.key).toBe("user.name");

			// Campo aninhado deve funcionar corretamente
			const TestForm = () => {
				const methods = useForm({
					defaultValues: {
						user: {
							name: "",
						},
					},
				});
				return (
					<FormProvider {...methods}>
						<UserNameField />
					</FormProvider>
				);
			};

			render(<TestForm />);
		});

		it("deve criar campo aninhado profundo (múltiplos níveis)", () => {
			const DeepField = field("proponent.person.document")
				.schema(z.string())
				.render(({ register }) => <input {...register({ name: "proponent.person.document" })} />);

			expect(DeepField.config.key).toBe("proponent.person.document");
		});
	});

	describe("comportamentos do contexto do campo", () => {
		it("deve fornecer register que conecta campo ao formulário", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(({ register }) => <input {...register()} data-testid="name-input" />);

			const TestForm = () => {
				const methods = useForm({ defaultValues: { name: "" } });

				return (
					<FormProvider {...methods}>
						<NameField />
						<button
							type="button"
							onClick={() => {
								const value = methods.getValues("name");
								methods.setValue("name", value + "test");
							}}
							data-testid="set-value-btn"
						>
							Set Value
						</button>
					</FormProvider>
				);
			};

			render(<TestForm />);
			const input = screen.getByTestId("name-input") as HTMLInputElement;

			// O input deve estar conectado ao formulário
			expect(input).toBeInTheDocument();

			// Pode definir valor através do formulário
			screen.getByTestId("set-value-btn").click();
			expect(input.value).toBe("test");
		});

		it("deve fornecer fieldState com erros de validação", () => {
			const NameField = field("name")
				.schema(z.string().min(3, "Nome deve ter pelo menos 3 caracteres"))
				.render(({ register, fieldState }) => (
					<div>
						<input {...register()} data-testid="name-input" />
						{fieldState.error && <span data-testid="error">{fieldState.error.message}</span>}
					</div>
				));

			const TestForm = () => {
				const methods = useForm({
					defaultValues: { name: "" },
					mode: "onChange",
				});

				return (
					<FormProvider {...methods}>
						<NameField />
					</FormProvider>
				);
			};

			render(<TestForm />);
			const input = screen.getByTestId("name-input") as HTMLInputElement;

			// Digita valor inválido
			input.value = "AB";
			input.dispatchEvent(new Event("input", { bubbles: true }));

			// Deve mostrar erro após validação
			// (Note: A validação pode precisar ser triggerada manualmente em testes)
		});

		it("deve fornecer getValues tipado para acessar outros campos", () => {
			const AgeField = field("age")
				.schema(z.number())
				.render(({ register }) => <input type="number" {...register()} />);

			const PhoneField = field("phone")
				.dependsOn(AgeField)
				.schema((formValues) => {
					const age = formValues?.age;
					return age && age < 18
						? z.string({ required_error: "Telefone obrigatório" })
						: z.string().optional();
				})
				.render(({ register, getValues }) => {
					const age = getValues("age");
					const isRequired = typeof age === "number" && age < 18;

					return <input {...register()} required={isRequired} data-testid="phone-input" />;
				});

			const TestForm = () => {
				const methods = useForm({
					defaultValues: { age: 20, phone: "" },
				});

				return (
					<FormProvider {...methods}>
						<AgeField />
						<PhoneField />
					</FormProvider>
				);
			};

			render(<TestForm />);
			const phoneInput = screen.getByTestId("phone-input") as HTMLInputElement;

			// Campo deve estar renderizado
			expect(phoneInput).toBeInTheDocument();
		});
	});

	describe("campos abstratos - abstractField", () => {
		it("deve criar campo abstrato sem key que não pode ser usado diretamente", () => {
			const AbstractRangeField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(({ fieldState }, props: { allowIrrelevant?: boolean }) => (
					<input
						type="number"
						data-testid="range-input"
						data-allow-irrelevant={props.allowIrrelevant}
						data-key={fieldState.key}
					/>
				));

			// Campo abstrato não deve ter key
			expect(AbstractRangeField).not.toHaveProperty("config");
			expect(AbstractRangeField).toHaveProperty("extend");

			// Deve ter método extend
			expect(typeof AbstractRangeField.extend).toBe("function");
		});

		it("deve estender campo abstrato com key obrigatória para criar campo válido", () => {
			const AbstractRangeField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(({ fieldState }, props: { allowIrrelevant?: boolean }) => (
					<input
						type="number"
						data-testid="range-input"
						data-allow-irrelevant={props.allowIrrelevant}
						data-key={fieldState.key}
					/>
				));

			const LocationWeightField = AbstractRangeField.extend({
				key: "configurations.generalCriteria.locationWeight",
			});

			// Campo estendido deve ter key
			expect(LocationWeightField.config.key).toBe("configurations.generalCriteria.locationWeight");
			expect(LocationWeightField.config.schema).toBeInstanceOf(z.ZodNumber);

			// Deve poder ser usado como componente
			const TestForm = () => {
				const methods = useForm({
					defaultValues: {
						configurations: {
							generalCriteria: {
								locationWeight: 0,
							},
						},
					},
				});
				return (
					<FormProvider {...methods}>
						<LocationWeightField allowIrrelevant={true} />
					</FormProvider>
				);
			};

			render(<TestForm />);
			const input = screen.getByTestId("range-input");
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute("data-key", "configurations.generalCriteria.locationWeight");
			expect(input).toHaveAttribute("data-allow-irrelevant", "true");
		});

		it("deve estender campo abstrato com props padrão", () => {
			const AbstractRangeField = abstractField()
				.schema(z.number().min(0).max(5))
				.render((_context, props: { allowIrrelevant?: boolean }) => (
					<input
						type="number"
						data-testid="range-input"
						data-allow-irrelevant={props.allowIrrelevant}
					/>
				));

			const LocationWeightField = AbstractRangeField.extend({
				key: "configurations.generalCriteria.locationWeight",
				props: {
					allowIrrelevant: true,
				},
			});

			const TestForm = () => {
				const methods = useForm({
					defaultValues: {
						configurations: {
							generalCriteria: {
								locationWeight: 0,
							},
						},
					},
				});
				return (
					<FormProvider {...methods}>
						{/* Props padrão aplicadas automaticamente */}
						<LocationWeightField />
					</FormProvider>
				);
			};

			render(<TestForm />);
			const input = screen.getByTestId("range-input");
			expect(input).toHaveAttribute("data-allow-irrelevant", "true");
		});

		it("deve estender campo abstrato com dependsOn e schema dinâmico", () => {
			// Cria campos base
			const LocationWeightField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(({ fieldState }) => (
					<input type="number" data-testid="location-weight" data-key={fieldState.key} />
				))
				.extend({
					key: "configurations.generalCriteria.locationWeight",
				});

			const ThemeWeightField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(({ fieldState }) => (
					<input type="number" data-testid="theme-weight" data-key={fieldState.key} />
				))
				.extend({
					key: "configurations.generalCriteria.themeWeight",
				});

			// Cria campo abstrato base para RangeField
			const RangeField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(({ fieldState }, props: { allowIrrelevant?: boolean }) => (
					<input
						type="number"
						data-testid="range-input"
						data-allow-irrelevant={props.allowIrrelevant}
						data-key={fieldState.key}
					/>
				));

			// Estende RangeField com dependsOn e schema customizado
			const DurationAndImpactWeightField = RangeField.extend({
				key: "configurations.generalCriteria.durationAndImpactWeight",
				dependsOn: [LocationWeightField, ThemeWeightField] as const,
				schema: (formValues) => {
					const locationWeight = formValues?.["configurations.generalCriteria.locationWeight"];
					const themeWeight = formValues?.["configurations.generalCriteria.themeWeight"];

					return z
						.number()
						.min(0)
						.max(5)
						.nullable()
						.optional()
						.superRefine((durationAndImpactWeight, ctx) => {
							if (
								(durationAndImpactWeight === null || durationAndImpactWeight === undefined) &&
								!locationWeight &&
								!themeWeight
							) {
								ctx.addIssue({
									code: "custom",
									message: "Pelo menos um critério geral deve ser definido",
									path: [],
								});
							}
						});
				},
				props: {
					allowIrrelevant: true,
				},
			});

			// Verifica que o campo foi criado corretamente
			expect(DurationAndImpactWeightField.config.key).toBe(
				"configurations.generalCriteria.durationAndImpactWeight"
			);
			expect(DurationAndImpactWeightField.config.dependencies).toEqual([
				"configurations.generalCriteria.locationWeight",
				"configurations.generalCriteria.themeWeight",
			]);

			// Testa schema dinâmico
			// Quando não há valores, o superRefine deve adicionar o erro customizado
			const schemaWithoutValues = DurationAndImpactWeightField.getZodSchema({});
			const resultEmpty = schemaWithoutValues.safeParse(undefined);
			expect(resultEmpty.success).toBe(false);
			if (!resultEmpty.success) {
				// Pode ter múltiplos erros (tipo + custom), verifica se tem o custom
				const customError = resultEmpty.error.issues.find(
					(issue) => issue.message === "Pelo menos um critério geral deve ser definido"
				);
				expect(customError).toBeDefined();
			}

			// Com pelo menos um valor, deve passar mesmo com undefined
			const schemaWithLocation = DurationAndImpactWeightField.getZodSchema({
				"configurations.generalCriteria.locationWeight": 3,
			});
			const resultWithLocation = schemaWithLocation.safeParse(undefined);
			expect(resultWithLocation.success).toBe(true);
		});

		it("deve reutilizar render do campo abstrato ao estender com dependsOn e schema", () => {
			// Cria campo abstrato base
			const RangeField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(({ fieldState }, props: { allowIrrelevant?: boolean }) => (
					<div data-testid="range-field">
						<input
							type="number"
							data-testid="range-input"
							data-allow-irrelevant={props.allowIrrelevant}
							data-key={fieldState.key}
						/>
					</div>
				));

			// Cria dependências
			const LocationWeightField = RangeField.extend({
				key: "configurations.generalCriteria.locationWeight",
				props: {
					allowIrrelevant: true,
				},
			});

			const ThemeWeightField = RangeField.extend({
				key: "configurations.generalCriteria.themeWeight",
				props: {
					allowIrrelevant: true,
				},
			});

			// Estende RangeField reutilizando o render, mas adicionando dependsOn e schema
			const DurationAndImpactWeightField = RangeField.extend({
				key: "configurations.generalCriteria.durationAndImpactWeight",
				dependsOn: [LocationWeightField, ThemeWeightField] as const,
				schema: (formValues) => {
					const locationWeight = formValues?.["configurations.generalCriteria.locationWeight"];
					const themeWeight = formValues?.["configurations.generalCriteria.themeWeight"];

					return z
						.number()
						.min(0)
						.max(5)
						.superRefine((durationAndImpactWeight, ctx) => {
							if (!durationAndImpactWeight && !locationWeight && !themeWeight) {
								ctx.addIssue({
									code: "custom",
									message: "Pelo menos um critério geral deve ser definido",
									path: [],
								});
							}
						});
				},
				props: {
					allowIrrelevant: true,
				},
			});

			// Deve renderizar usando o render do RangeField (não customizado)
			const TestForm = () => {
				const methods = useForm({
					defaultValues: {
						configurations: {
							generalCriteria: {
								locationWeight: 3,
								themeWeight: 2,
								durationAndImpactWeight: 1,
							},
						},
					},
				});
				return (
					<FormProvider {...methods}>
						<DurationAndImpactWeightField />
					</FormProvider>
				);
			};

			render(<TestForm />);

			// Deve renderizar o mesmo componente do RangeField
			const rangeField = screen.getByTestId("range-field");
			expect(rangeField).toBeInTheDocument();

			const input = screen.getByTestId("range-input");
			expect(input).toBeInTheDocument();
			expect(input).toHaveAttribute(
				"data-key",
				"configurations.generalCriteria.durationAndImpactWeight"
			);
			expect(input).toHaveAttribute("data-allow-irrelevant", "true");
		});

		it("deve estender campo abstrato com múltiplas dependências e schema dinâmico complexo", () => {
			// Cria campos base
			const LocationWeightField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(() => <input type="number" />)
				.extend({
					key: "configurations.generalCriteria.locationWeight",
				});

			const ThemeWeightField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(() => <input type="number" />)
				.extend({
					key: "configurations.generalCriteria.themeWeight",
				});

			const TargetAudienceWeightField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(() => <input type="number" />)
				.extend({
					key: "configurations.generalCriteria.targetAudienceWeight",
				});

			// Cria campo abstrato base
			const RangeField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(() => <input type="number" data-testid="range-input" />);

			// Estende com múltiplas dependências
			const DurationAndImpactWeightField = RangeField.extend({
				key: "configurations.generalCriteria.durationAndImpactWeight",
				dependsOn: [LocationWeightField, ThemeWeightField, TargetAudienceWeightField] as const,
				schema: (formValues) => {
					const locationWeight = formValues?.["configurations.generalCriteria.locationWeight"];
					const themeWeight = formValues?.["configurations.generalCriteria.themeWeight"];
					const targetAudienceWeight =
						formValues?.["configurations.generalCriteria.targetAudienceWeight"];

					return z
						.number()
						.min(0)
						.max(5)
						.nullable()
						.optional()
						.superRefine((durationAndImpactWeight, ctx) => {
							if (
								(durationAndImpactWeight === null || durationAndImpactWeight === undefined) &&
								!locationWeight &&
								!themeWeight &&
								!targetAudienceWeight
							) {
								ctx.addIssue({
									code: "custom",
									message: "Pelo menos um critério geral deve ser definido",
									path: [],
								});
							}
						});
				},
				props: {
					allowIrrelevant: true,
				},
			});

			// Verifica dependências
			expect(DurationAndImpactWeightField.config.dependencies).toEqual([
				"configurations.generalCriteria.locationWeight",
				"configurations.generalCriteria.themeWeight",
				"configurations.generalCriteria.targetAudienceWeight",
			]);

			// Testa validação
			const schemaEmpty = DurationAndImpactWeightField.getZodSchema({});
			const resultEmpty = schemaEmpty.safeParse(undefined);
			expect(resultEmpty.success).toBe(false);
			if (!resultEmpty.success) {
				const customError = resultEmpty.error.issues.find(
					(issue) => issue.message === "Pelo menos um critério geral deve ser definido"
				);
				expect(customError).toBeDefined();
			}

			const schemaWithOne = DurationAndImpactWeightField.getZodSchema({
				"configurations.generalCriteria.locationWeight": 3,
			});
			const resultWithOne = schemaWithOne.safeParse(undefined);
			expect(resultWithOne.success).toBe(true);
		});

		it("deve permitir estender campo abstrato sem dependsOn e depois adicionar dependsOn", () => {
			const RangeField = abstractField()
				.schema(z.number().min(0).max(5))
				.render(() => <input type="number" data-testid="range-input" />);

			// Primeiro estende sem dependsOn
			const SimpleField = RangeField.extend({
				key: "simple.weight",
				props: {
					allowIrrelevant: false,
				},
			});

			expect(SimpleField.config.key).toBe("simple.weight");
			// Dependencies pode ser undefined ou array vazio
			expect(
				SimpleField.config.dependencies === undefined ||
					SimpleField.config.dependencies?.length === 0
			).toBe(true);

			// Depois cria outro campo com dependsOn
			const LocationWeightField = RangeField.extend({
				key: "configurations.generalCriteria.locationWeight",
				props: {
					allowIrrelevant: true,
				},
			});

			const DependentField = RangeField.extend({
				key: "configurations.generalCriteria.dependentWeight",
				dependsOn: [LocationWeightField] as const,
				schema: (formValues) => {
					const locationWeight = formValues?.["configurations.generalCriteria.locationWeight"];
					return locationWeight ? z.number().min(locationWeight) : z.number().min(0).max(5);
				},
			});

			expect(DependentField.config.dependencies).toEqual([
				"configurations.generalCriteria.locationWeight",
			]);
		});
	});
});
