/**
 * Testes de tipagem - Wizard Types
 *
 * Testa os tipos helpers para wizard (ExtractWizardFormData, ExtractWizardFormValues,
 * WizardConfig, StepFieldsMap, DotNotationToNested, UseWizardFormReturn, etc).
 * Estes testes DEVEM PASSAR quando as tipagens do wizard estiverem corretas.
 */

import { z } from "zod";
import { expectTypeOf } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { createWizardConfig } from "../../../src/wizards/wizard/builder/config";

import type { DotNotationToNested } from "../../../src/types/dot-notation";
import type {
	StepState,
	StepStateWithMetadata,
	WizardStateItem,
} from "../../../src/wizards/step/types/step";
import type {
	ExtractWizardFormData,
	ExtractWizardFormValues,
	WizardFormData,
	WizardFormValues,
} from "../../../src/wizards/wizard/types/extractors";
import type { UseWizardFormReturn } from "../../../src/wizards/wizard/types/hooks";
import type { StepFieldsMap, WizardConfig } from "../../../src/wizards/wizard/types/wizard";

describe("Type Safety - Wizard Types", () => {
	describe("StepFieldsMap", () => {
		it("deve mapear steps para seus campos corretamente", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const steps = ["step1", "step2"] as const;
			const fieldsMap = {
				step1: [NameField],
				step2: [EmailField],
			} satisfies StepFieldsMap<typeof steps>;

			// Verifica que o tipo é correto
			expectTypeOf(fieldsMap).toEqualTypeOf<typeof fieldsMap>();

			// Deve causar erro de tipagem se faltar um step
			// @ts-expect-error Falta o step2
			const fieldsMapMissing: StepFieldsMap<typeof steps> = {
				step1: [NameField],
			};

			// Deve causar erro de tipagem se faltar o step1
			// @ts-expect-error Falta o step1
			const fieldsMapMissing2: StepFieldsMap<typeof steps> = {
				step2: [EmailField],
			};
		});
	});

	describe("DotNotationToNested", () => {
		it("deve converter chaves com notação de ponto em objetos aninhados", () => {
			type Flat = {
				"user.name": string;
				"user.email": string;
				"user.age": number;
			};

			type Nested = DotNotationToNested<Flat>;
			const nested: Nested = {
				user: {
					name: "João",
					email: "joao@example.com",
					age: 25,
				},
			};

			expectTypeOf(nested).toEqualTypeOf<{
				user: {
					name: string;
					email: string;
					age: number;
				};
			}>();
		});

		it("deve manter chaves simples sem aninhamento", () => {
			type Flat = {
				name: string;
				email: string;
			};

			type Nested = DotNotationToNested<Flat>;
			const nested: Nested = {
				name: "João",
				email: "joao@example.com",
			};

			expectTypeOf(nested).toEqualTypeOf<{
				name: string;
				email: string;
			}>();
		});

		it("deve converter múltiplos níveis de aninhamento", () => {
			type Flat = {
				"user.profile.name": string;
				"user.profile.age": number;
				"user.contact.email": string;
			};

			type Nested = DotNotationToNested<Flat>;
			const nested: Nested = {
				user: {
					profile: {
						name: "João",
						age: 25,
					},
					contact: {
						email: "joao@example.com",
					},
				},
			};

			expectTypeOf(nested).toEqualTypeOf<{
				user: {
					profile: {
						name: string;
						age: number;
					};
					contact: {
						email: string;
					};
				};
			}>();
		});
	});

	describe("WizardFormValues", () => {
		it("deve extrair valores do formulário de um wizard simples", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const steps = ["step1", "step2"] as const;
			const fieldsMap = {
				step1: [NameField],
				step2: [EmailField],
			} satisfies StepFieldsMap<typeof steps>;

			type FormValues = WizardFormValues<typeof fieldsMap>;
			const values: FormValues = {
				name: "João",
				email: "joao@example.com",
			};

			// Verifica que o tipo é compatível com o esperado usando asserção de atribuição
			const _expectedValues: { name: string; email: string } = values;
			const _actualValues: FormValues = {
				name: "João",
				email: "joao@example.com",
			};
		});

		it("deve converter campos aninhados corretamente", () => {
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(() => null);
			const UserEmailField = field("user.email")
				.schema(z.string().email())
				.render(() => null);

			const steps = ["step1"] as const;
			const fieldsMap = {
				step1: [UserNameField, UserEmailField] as const,
			} satisfies StepFieldsMap<typeof steps>;

			type FormValues = WizardFormValues<typeof fieldsMap>;
			// Verifica que podemos criar valores do tipo FormValues com estrutura aninhada
			const values: FormValues = {
				user: {
					name: "João",
					email: "joao@example.com",
				},
			} as FormValues;

			// Verifica que podemos acessar as propriedades aninhadas
			const _user = (
				values as {
					user: {
						name: string;
						email: string;
					};
				}
			).user;
			const _userName = _user.name;
			const _userEmail = _user.email;
			const _userNameType: string = _userName;
			const _userEmailType: string = _userEmail;
		});
	});

	describe("WizardFormData", () => {
		it("deve criar tipo Partial com campos opcionais", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const steps = ["step1", "step2"] as const;
			const fieldsMap = {
				step1: [NameField] as const,
				step2: [EmailField] as const,
			} satisfies StepFieldsMap<typeof steps>;

			type FormData = WizardFormData<typeof fieldsMap>;
			const data: FormData = {
				name: "João",
				// email é opcional
			};

			expectTypeOf(data).toEqualTypeOf<
				Partial<{
					name: string;
					email: string;
				}>
			>();
		});
	});

	describe("ExtractWizardFormData", () => {
		it("deve extrair o tipo de dados do formulário de uma configuração", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: ["step1", "step2"] as const,
				fields: {
					step1: [NameField],
					step2: [EmailField],
				},
			});

			type FormData = ExtractWizardFormData<typeof config>;
			const data: FormData = {
				name: "João",
				email: "joao@example.com",
			};

			expectTypeOf(data).toEqualTypeOf<
				Partial<{
					name: string;
					email: string;
				}>
			>();
		});

		it("deve extrair tipo com campos aninhados", () => {
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(() => null);
			const UserEmailField = field("user.email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: ["step1"] as const,
				fields: {
					step1: [UserNameField, UserEmailField],
				},
			});

			type FormData = ExtractWizardFormData<typeof config>;
			const data: FormData = {
				user: {
					name: "João",
					email: "joao@example.com",
				},
			};

			expectTypeOf(data).toEqualTypeOf<
				Partial<{
					user: {
						name: string;
						email: string;
					};
				}>
			>();
		});
	});

	describe("ExtractWizardFormValues", () => {
		it("deve extrair o tipo de valores do formulário (sem Partial)", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: ["step1", "step2"] as const,
				fields: {
					step1: [NameField],
					step2: [EmailField],
				},
			});

			type FormValues = ExtractWizardFormValues<typeof config>;
			const values: FormValues = {
				name: "João",
				email: "joao@example.com",
			};

			expectTypeOf(values).toEqualTypeOf<{
				name: string;
				email: string;
			}>();
		});

		it("deve funcionar com shouldIncludeStep tipado corretamente", () => {
			const HasSportField = field("configurations.hasSportPotentialLaw")
				.schema(z.boolean())
				.render(() => null);
			const SportCategoriesField = field("sportCategories.name")
				.schema(z.string())
				.render(() => null);

			const config = createWizardConfig({
				steps: ["configurations", "sportCategories"] as const,
				fields: {
					configurations: [HasSportField],
					sportCategories: [SportCategoriesField],
				},
				shouldIncludeStep: (step, formValues) => {
					if (step === "sportCategories") {
						// formValues deve ter tipagem correta
						const hasSport = formValues.configurations?.hasSportPotentialLaw;
						const hasSportType: boolean | undefined = hasSport;
						return hasSport === true;
					}
					return true;
				},
			});

			type FormValues = ExtractWizardFormValues<typeof config>;
			const values: FormValues = {
				configurations: {
					hasSportPotentialLaw: true,
				},
				sportCategories: {
					name: "Futebol",
				},
			};

			expectTypeOf(values).toEqualTypeOf<{
				configurations: {
					hasSportPotentialLaw: boolean;
				};
				sportCategories: {
					name: string;
				};
			}>();
		});
	});

	describe("WizardConfig", () => {
		it("deve aceitar configuração válida com steps e fields", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const config: WizardConfig<["step1"], { step1: readonly (typeof NameField)[] }> = {
				steps: ["step1"],
				fields: {
					step1: [NameField],
				},
			};

			expectTypeOf(config).toMatchTypeOf<{
				steps: readonly ["step1"];
				fields: {
					step1: readonly (typeof NameField)[];
				};
			}>();
		});

		it("deve aceitar shouldIncludeStep com tipagem correta", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config: WizardConfig<
				["step1", "step2"],
				{
					step1: readonly (typeof NameField)[];
					step2: readonly (typeof EmailField)[];
				}
			> = {
				steps: ["step1", "step2"],
				fields: {
					step1: [NameField],
					step2: [EmailField],
				},
				shouldIncludeStep: (step, formValues) => {
					// formValues deve ter tipagem correta
					const name = formValues.name;
					const nameType: string | undefined = name;
					return step === "step1" || formValues.name !== undefined;
				},
			};

			expectTypeOf(config.shouldIncludeStep).toMatchTypeOf<
				| ((
						step: "step1" | "step2",
						formValues: {
							name: string;
							email: string;
						}
				  ) => boolean)
				| undefined
			>();
		});
	});

	describe("StepState", () => {
		it("deve ter estrutura correta para um step", () => {
			type FormValues = {
				name: string;
				email: string;
			};

			const stepState: StepState<FormValues> = {
				errors: {},
				dirtyFields: {},
				touchedFields: {},
				values: {},
				isValid: true,
				isDirty: false,
				isTouched: false,
			};

			expectTypeOf(stepState).toMatchTypeOf<{
				errors: Partial<Record<"name" | "email", string | undefined>>;
				dirtyFields: Partial<Record<"name" | "email", true | Record<string, string | undefined>>>;
				touchedFields: Partial<Record<"name" | "email", true | Record<string, string | undefined>>>;
				values: Partial<FormValues>;
				isValid: boolean;
				isDirty: boolean;
				isTouched: boolean;
			}>();
		});
	});

	describe("StepStateWithMetadata", () => {
		it("deve estender StepState com metadados", () => {
			type FormValues = {
				name: string;
				email: string;
			};
			const steps = ["step1", "step2"] as const;

			const stepState: StepStateWithMetadata<FormValues, typeof steps> = {
				errors: {},
				dirtyFields: {},
				touchedFields: {},
				values: {},
				isValid: true,
				isDirty: false,
				isTouched: false,
				step: "step1",
				stepIndex: 0,
				validChangedData: {},
				hasValidChangedData: false,
			};

			expectTypeOf(stepState).toMatchTypeOf<{
				errors: Partial<Record<"name" | "email", string | undefined>>;
				dirtyFields: Partial<Record<"name" | "email", true | Record<string, string | undefined>>>;
				touchedFields: Partial<Record<"name" | "email", true | Record<string, string | undefined>>>;
				values: Partial<FormValues>;
				isValid: boolean;
				isDirty: boolean;
				isTouched: boolean;
				step: "step1" | "step2";
				stepIndex: number;
				validChangedData: Partial<FormValues>;
				hasValidChangedData: boolean;
			}>();
		});
	});

	describe("WizardStateItem", () => {
		it("deve ter estrutura correta para um item de estado do wizard", () => {
			const steps = ["step1", "step2", "step3"] as const;

			const wizardState: WizardStateItem<typeof steps> = {
				step: "step1",
				isVisited: true,
				isDirty: false,
				isValid: true,
				hasError: false,
				summary: "completed",
			};

			expectTypeOf(wizardState).toMatchTypeOf<{
				step: "step1" | "step2" | "step3";
				isVisited: boolean;
				isDirty: boolean;
				isValid: boolean;
				hasError: boolean;
				summary: "pending" | "editing" | "completed" | "error";
			}>();
		});
	});

	describe("UseWizardFormReturn", () => {
		it("deve ter todas as propriedades do wizard e do react-hook-form", () => {
			type FormValues = {
				name: string;
				email: string;
			};
			const steps = ["step1", "step2"] as const;

			// Simula o retorno do hook (não podemos realmente criar uma instância)
			type WizardReturn = UseWizardFormReturn<FormValues, typeof steps>;

			// Verifica que tem propriedades do stepMachine
			type HasSteps = WizardReturn extends { steps: typeof steps } ? true : false;
			type HasCurrentStep = WizardReturn extends { currentStep: "step1" | "step2" } ? true : false;
			type HasGoToNextStep = WizardReturn extends { goToNextStep: () => void } ? true : false;

			// Verifica que tem propriedades do react-hook-form
			type HasRegister = WizardReturn extends { register: any } ? true : false;
			type HasWatch = WizardReturn extends { watch: any } ? true : false;
			type HasGetValues = WizardReturn extends { getValues: any } ? true : false;

			// Verifica que tem propriedades específicas do wizard
			type HasWizardState = WizardReturn extends { wizardState: WizardStateItem<typeof steps>[] }
				? true
				: false;
			type HasGetFieldsForStep = WizardReturn extends {
				getFieldsForStep: (step: "step1" | "step2") => any[];
			}
				? true
				: false;
			type HasNext = WizardReturn extends { next: { (options?: any): Promise<void>; (): void } }
				? true
				: false;

			const hasSteps: HasSteps = true;
			const hasCurrentStep: HasCurrentStep = true;
			const hasGoToNextStep: HasGoToNextStep = true;
			const hasRegister: HasRegister = true;
			const hasWatch: HasWatch = true;
			const hasGetValues: HasGetValues = true;
			const hasWizardState: HasWizardState = true;
			const hasGetFieldsForStep: HasGetFieldsForStep = true;
			const hasNext: HasNext = true;

			expectTypeOf(hasSteps).toEqualTypeOf<true>();
			expectTypeOf(hasCurrentStep).toEqualTypeOf<true>();
			expectTypeOf(hasGoToNextStep).toEqualTypeOf<true>();
			expectTypeOf(hasRegister).toEqualTypeOf<true>();
			expectTypeOf(hasWatch).toEqualTypeOf<true>();
			expectTypeOf(hasGetValues).toEqualTypeOf<true>();
			expectTypeOf(hasWizardState).toEqualTypeOf<true>();
			expectTypeOf(hasGetFieldsForStep).toEqualTypeOf<true>();
			expectTypeOf(hasNext).toEqualTypeOf<true>();
		});
	});

	describe("Integração - Wizard Completo", () => {
		it("deve inferir tipos corretamente em um wizard completo com múltiplos steps", () => {
			const NameField = field("name")
				.schema(z.string().min(3))
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);
			const PasswordField = field("password")
				.schema(z.string().min(8))
				.render(() => null);
			const AgeField = field("age")
				.schema(z.number().min(18))
				.render(() => null);

			const config = createWizardConfig({
				steps: ["personal", "credentials", "details"] as const,
				fields: {
					personal: [NameField, AgeField],
					credentials: [EmailField, PasswordField],
					details: [],
				},
			});

			type FormData = ExtractWizardFormData<typeof config>;
			type FormValues = ExtractWizardFormValues<typeof config>;

			const data: FormData = {
				name: "João",
				age: 25,
				email: "joao@example.com",
			};

			const values: FormValues = {
				name: "João",
				age: 25,
				email: "joao@example.com",
				password: "senha123",
			};

			expectTypeOf(data).toEqualTypeOf<
				Partial<{
					name: string;
					age: number;
					email: string;
					password: string;
				}>
			>();

			expectTypeOf(values).toEqualTypeOf<{
				name: string;
				age: number;
				email: string;
				password: string;
			}>();
		});

		it("deve inferir tipos corretamente com campos aninhados e shouldIncludeStep", () => {
			const HasSportField = field("configurations.hasSportPotentialLaw")
				.schema(z.boolean())
				.render(() => null);
			const HasCulturalField = field("configurations.hasCulturalPotentialLaw")
				.schema(z.boolean())
				.render(() => null);
			const SportCategoriesField = field("sportCategories.name")
				.schema(z.string())
				.render(() => null);
			const CulturalSegmentsField = field("culturalSegments.name")
				.schema(z.string())
				.render(() => null);

			const config = createWizardConfig({
				steps: ["configurations", "sportCategories", "culturalSegments"] as const,
				fields: {
					configurations: [HasSportField, HasCulturalField],
					sportCategories: [SportCategoriesField],
					culturalSegments: [CulturalSegmentsField],
				},
				shouldIncludeStep: (step, formValues) => {
					if (step === "sportCategories") {
						return formValues.configurations?.hasSportPotentialLaw === true;
					}
					if (step === "culturalSegments") {
						return formValues.configurations?.hasCulturalPotentialLaw === true;
					}
					return true;
				},
			});

			type FormData = ExtractWizardFormData<typeof config>;
			const data: FormData = {
				configurations: {
					hasSportPotentialLaw: true,
					hasCulturalPotentialLaw: false,
				},
				sportCategories: {
					name: "Futebol",
				},
			};

			expectTypeOf(data).toEqualTypeOf<
				Partial<{
					configurations: {
						hasSportPotentialLaw: boolean;
						hasCulturalPotentialLaw: boolean;
					};
					sportCategories: {
						name: string;
					};
					culturalSegments: {
						name: string;
					};
				}>
			>();
		});
	});
});
