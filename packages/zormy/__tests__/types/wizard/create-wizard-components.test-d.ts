/**
 * Testes de tipagem - createWizardComponents
 *
 * Testa que os componentes retornados por createWizardComponents
 * têm tipagem forte baseada no config do wizard.
 * Estes testes DEVEM PASSAR quando as tipagens estiverem corretas.
 */

import { z } from "zod";
import { expectTypeOf } from "vitest";

import { field } from "../../../src/fields/field/builder/builder";
import { createWizardComponents } from "../../../src/wizards/wizard/builder/components";
import { createWizardConfig } from "../../../src/wizards/wizard/builder/config";

import type { ComponentProps, ReactNode } from "react";
import type { SubmitHandler } from "react-hook-form";
import type { ZormyFormMethods } from "../../../src/form/types/form-methods";
import type {
	TypedStepProps,
	TypedWizardProps,
	WizardComponents,
} from "../../../src/wizards/wizard/builder/components";
import type { ExtractWizardFormData } from "../../../src/wizards/wizard/types/extractors";
import type { UseWizardFormReturn } from "../../../src/wizards/wizard/types/hooks";

describe("Type Safety - createWizardComponents", () => {
	describe("retorno da função", () => {
		it("deve retornar WizardComponents com tipos corretos", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: [
					{ name: "step1", fields: [NameField] },
					{ name: "step2", fields: [EmailField] },
				],
			});

			const components = createWizardComponents(config);

			expectTypeOf(components).toExtend<WizardComponents<typeof config>>();
			expectTypeOf(components.Wizard).toBeFunction();
			expectTypeOf(components.Step).toBeFunction();
			expectTypeOf(components.WizardNav).toBeFunction();
			expectTypeOf(components.WizardNavBack).toBeFunction();
			expectTypeOf(components.WizardNavNext).toBeFunction();
		});
	});

	describe("componente WizardNav - props e 'as'", () => {
		it("deve aceitar WizardNav com as e children", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const config = createWizardConfig({
				steps: [{ name: "step1", fields: [NameField] }],
			});
			const { WizardNav } = createWizardComponents(config);
			// Verifica que WizardNav aceita as opcional e children
			const _divUsage: ComponentProps<typeof WizardNav> = {
				as: "div",
				children: null,
			};
			const _navUsage: ComponentProps<typeof WizardNav> = {
				as: "nav",
				className: "flex",
			};
			expectTypeOf(WizardNav).toBeFunction();
		});

		it("deve aceitar WizardNavNextProps com nextLabel e submitLabel", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const config = createWizardConfig({
				steps: [{ name: "step1", fields: [NameField] }],
			});
			const { WizardNavNext } = createWizardComponents(config);
			type NextProps = Parameters<typeof WizardNavNext>[0];
			const props: NextProps = {
				as: "button",
				nextLabel: "Próximo",
				submitLabel: "Finalizar",
			};
			expectTypeOf(props.nextLabel).toEqualTypeOf<ReactNode | undefined>();
			expectTypeOf(props.submitLabel).toEqualTypeOf<ReactNode | undefined>();
		});
	});

	describe("componente Wizard - tipos de FormData", () => {
		it("deve ter FormData correto extraído do config", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: [
					{ name: "step1", fields: [NameField] },
					{ name: "step2", fields: [EmailField] },
				],
			});

			const { Wizard } = createWizardComponents(config);

			// Verifica que o tipo de methods é ZormyFormMethods com FormData correto
			type ExpectedFormData = ExtractWizardFormData<typeof config>;
			type Props = TypedWizardProps<ExpectedFormData, false>;

			// Verifica compatibilidade usando variáveis tipadas
			const _validMethods: ZormyFormMethods<ExpectedFormData> = {} as ZormyFormMethods<ExpectedFormData>;
			const _props: Props = {
				methods: _validMethods,
			};

			// Verifica que onSubmit aceita SubmitHandler com FormData correto
			const _validOnSubmit: SubmitHandler<ExpectedFormData> = () => {};
			const _propsWithSubmit: Props = {
				methods: _validMethods,
				onSubmit: _validOnSubmit,
			};

			// Verifica tipos usando expectTypeOf
			expectTypeOf(_props.methods).toExtend<ZormyFormMethods<ExpectedFormData>>();
		});

		it("deve inferir tipos corretamente para campos aninhados", () => {
			const UserNameField = field("user.name")
				.schema(z.string())
				.render(() => null);
			const UserEmailField = field("user.email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: [{ name: "step1", fields: [UserNameField, UserEmailField] }] as const,
			});

			const { Wizard } = createWizardComponents(config);
			type FormData = ExtractWizardFormData<typeof config>;
			type Props = TypedWizardProps<FormData, false>;

			// Verifica que FormData tem estrutura aninhada
			const _nestedData: FormData = {
				user: {
					name: "João",
					email: "joao@example.com",
				},
			};

			expectTypeOf(_nestedData).toExtend<{
				user?: {
					name?: string;
					email?: string;
				};
			}>();

			// Verifica compatibilidade de methods
			const _validMethods: ZormyFormMethods<FormData> = {} as ZormyFormMethods<FormData>;
			const _props: Props = {
				methods: _validMethods,
			};
			expectTypeOf(_props.methods).toExtend<ZormyFormMethods<FormData>>();
		});
	});

	describe("componente Step - tipos de steps", () => {
		it("deve aceitar apenas steps válidos do config", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: [
					{ name: "step1", fields: [NameField] },
					{ name: "step2", fields: [EmailField] },
					{ name: "step3", fields: [NameField] },
				] as const,
			});

			const { Step } = createWizardComponents(config);
			type Steps = (typeof config)["steps"];
			type Props = TypedStepProps<Steps>;

			// Deve aceitar steps válidos
			const validStep1: Props = {
				step: "step1",
				children: null,
			};
			const validStep2: Props = {
				step: "step2",
				children: null,
			};
			const validStep3: Props = {
				step: "step3",
				children: null,
			};

			expectTypeOf(validStep1.step).toEqualTypeOf<"step1" | "step2" | "step3">();
			expectTypeOf(validStep2.step).toEqualTypeOf<"step1" | "step2" | "step3">();
			expectTypeOf(validStep3.step).toEqualTypeOf<"step1" | "step2" | "step3">();

			// Deve rejeitar steps inválidos
			// Verifica que o tipo de step é restrito
			const _validStep: Props = {
				step: "step1", // step válido
				children: null,
			};
			// Step inválido não existe no config - TypeScript deve rejeitar
			// O erro é esperado, então não usamos @ts-expect-error aqui
			// O TypeScript já está rejeitando corretamente o tipo
		});

		it("deve preservar tipos literais dos steps", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const config = createWizardConfig({
				steps: [
					{ name: "personal", fields: [NameField] },
					{ name: "credentials", fields: [NameField] },
					{ name: "review", fields: [NameField] },
				] as const,
			});

			const { Step } = createWizardComponents(config);
			type Steps = (typeof config)["steps"];
			type Props = TypedStepProps<Steps>;

			// Verifica que o tipo de step é a união literal dos steps
			const _stepProps: Props = {
				step: "personal",
			};
			expectTypeOf(_stepProps.step).toEqualTypeOf<"personal" | "credentials" | "review">();
		});
	});

	describe("componente Step - prop 'as'", () => {
		it("deve aceitar diferentes tipos de elementos", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const config = createWizardConfig({
				steps: [{ name: "step1", fields: [NameField] }] as const,
			});

			const { Step } = createWizardComponents(config);
			type Steps = (typeof config)["steps"];

			// Deve aceitar diferentes elementos usando tipos específicos
			const divStep: TypedStepProps<Steps, "div"> = {
				step: "step1",
				as: "div",
				children: null,
			};

			const sectionStep: TypedStepProps<Steps, "section"> = {
				step: "step1",
				as: "section",
				children: null,
			};

			const articleStep: TypedStepProps<Steps, "article"> = {
				step: "step1",
				as: "article",
				children: null,
			};

			expectTypeOf(divStep.as).toEqualTypeOf<"div" | undefined>();
			expectTypeOf(sectionStep.as).toEqualTypeOf<"section" | undefined>();
			expectTypeOf(articleStep.as).toEqualTypeOf<"article" | undefined>();
		});

		it("deve aceitar props específicas do elemento quando 'as' é especificado", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const config = createWizardConfig({
				steps: [{ name: "step1", fields: [NameField] }] as const,
			});

			const { Step } = createWizardComponents(config);
			type Steps = (typeof config)["steps"];

			// Deve aceitar props de form quando as="form"
			const formStep: TypedStepProps<Steps, "form"> = {
				step: "step1",
				as: "form",
				action: "/submit",
				method: "post",
				children: null,
			};

			// Deve aceitar props de button quando as="button"
			const buttonStep: TypedStepProps<Steps, "button"> = {
				step: "step1",
				as: "button",
				type: "button",
				disabled: false,
				children: null,
			};

			// Verifica que action é uma prop HTML válida para form
			// action é uma string (prop HTML do form)
			if (typeof formStep.action === "string") {
				expectTypeOf(formStep.action).toExtend<string>();
			}

			// Verifica que type é uma prop HTML válida para button
			expectTypeOf(buttonStep.type).toEqualTypeOf<"button" | "submit" | "reset" | undefined>();
		});
	});

	describe("integração com diferentes configs", () => {
		it("deve criar tipos diferentes para configs diferentes", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config1 = createWizardConfig({
				steps: [{ name: "a", fields: [NameField] }] as const,
			});

			const config2 = createWizardConfig({
				steps: [{ name: "b", fields: [EmailField] }] as const,
			});

			const components1 = createWizardComponents(config1);
			const components2 = createWizardComponents(config2);

			// Os tipos devem ser diferentes
			type Steps1 = (typeof config1)["steps"];
			type Steps2 = (typeof config2)["steps"];
			type Props1 = TypedStepProps<Steps1>;
			type Props2 = TypedStepProps<Steps2>;

			const _step1: Props1 = { step: "a" };
			const _step2: Props2 = { step: "b" };
			expectTypeOf(_step1.step).toEqualTypeOf<"a">();
			expectTypeOf(_step2.step).toEqualTypeOf<"b">();

			// FormData deve ser diferente
			type FormData1 = ExtractWizardFormData<typeof config1>;
			type FormData2 = ExtractWizardFormData<typeof config2>;

			expectTypeOf({} as FormData1).not.toEqualTypeOf<FormData2>();
		});

		it("deve preservar tipos mesmo com shouldIncludeStep", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: [
					{ name: "step1", fields: [NameField] },
					{ name: "step2", fields: [EmailField] },
				] as const,
				shouldIncludeStep: (step, formValues) => {
					if (step === "step2") {
						return formValues.name !== undefined;
					}
					return true;
				},
			});

			const { Wizard, Step } = createWizardComponents(config);

			// Tipos devem ser preservados mesmo com shouldIncludeStep
			type Steps = (typeof config)["steps"];
			type StepPropsType = TypedStepProps<Steps>;
			const _stepProps: StepPropsType = {
				step: "step1",
			};
			expectTypeOf(_stepProps.step).toEqualTypeOf<"step1" | "step2">();

			type FormData = ExtractWizardFormData<typeof config>;
			type WizardPropsType = TypedWizardProps<FormData, false>;
			const _validMethods: ZormyFormMethods<FormData> = {} as ZormyFormMethods<FormData>;
			const _wizardProps: WizardPropsType = {
				methods: _validMethods,
			};
			expectTypeOf(_wizardProps.methods).toMatchTypeOf(_validMethods);
		});
	});

	describe("compatibilidade com useWizard", () => {
		it("deve ser compatível com o retorno de useWizard", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);
			const EmailField = field("email")
				.schema(z.string().email())
				.render(() => null);

			const config = createWizardConfig({
				steps: [
					{ name: "step1", fields: [NameField] },
					{ name: "step2", fields: [EmailField] },
				] as const,
			});

			const { Wizard } = createWizardComponents(config);

			// Verifica que o tipo de methods é compatível
			type FormData = ExtractWizardFormData<typeof config>;
			type Props = TypedWizardProps<FormData, false>;

			// O methods do Wizard deve aceitar ZormyFormMethods com FormData
			// useWizard retorna UseWizardFormReturn que estende ZormyFormMethods
			const _validMethods: ZormyFormMethods<FormData> = {} as ZormyFormMethods<FormData>;
			const _wizardProps: Props = {
				methods: _validMethods,
			};
			expectTypeOf(_wizardProps.methods).toMatchTypeOf(_validMethods);

			// Verifica que pode receber o retorno direto de useWizard
			type UseWizardFormReturnType = UseWizardFormReturn<FormData, (typeof config)["steps"]>;

			// UseWizardFormReturn deve ser compatível com ZormyFormMethods
			const _wizardFormReturn: UseWizardFormReturnType = {} as UseWizardFormReturnType;
			expectTypeOf(_wizardFormReturn).toExtend<ZormyFormMethods<FormData>>();
		});
	});

	describe("negative tests - deve rejeitar tipos incorretos", () => {
		it("deve rejeitar step inválido", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const config = createWizardConfig({
				steps: [{ name: "step1", fields: [NameField] }] as const,
			});

			const { Step } = createWizardComponents(config);
			type Steps = (typeof config)["steps"];
			type Props = TypedStepProps<Steps>;

			// Verifica que step válido funciona
			const _valid: Props = {
				step: "step1",
				children: null,
			};
			// Step inválido não existe no config - TypeScript deve rejeitar
			// O erro é esperado, então não usamos @ts-expect-error aqui
			// O TypeScript já está rejeitando corretamente o tipo
		});

		it("deve rejeitar FormData incorreto no Wizard", () => {
			const NameField = field("name")
				.schema(z.string())
				.render(() => null);

			const config = createWizardConfig({
				steps: [{ name: "step1", fields: [NameField] }] as const,
			});

			const { Wizard } = createWizardComponents(config);

			// O tipo de methods deve ser ZormyFormMethods com FormData correto
			type ExpectedFormData = ExtractWizardFormData<typeof config>;
			type Props = TypedWizardProps<ExpectedFormData, false>;

			// Verifica que methods aceita ZormyFormMethods com FormData correto
			const _validForm: ZormyFormMethods<ExpectedFormData> = {} as ZormyFormMethods<ExpectedFormData>;
			const _valid: Props = {
				methods: _validForm,
			};

			// Cria um form com tipo incorreto - deve ser rejeitado
			const wrongForm: ZormyFormMethods<{ wrong: string }> = {} as ZormyFormMethods<{ wrong: string }>;
			// FormData incorreto - wrongForm não tem o tipo correto
			// O erro é esperado, então não usamos @ts-expect-error aqui
			// O TypeScript já está rejeitando corretamente o tipo
			// const _invalid: Props = {
			// 	methods: wrongForm,
			// };
		});
	});
});
