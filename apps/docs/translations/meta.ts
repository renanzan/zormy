/**
 * Traduções do _meta.global (sidebar/nav) — en / pt-BR
 * Usado pelos componentes de meta para exibir títulos e itens da doc por idioma.
 */

export const key = "meta" as const;

export const i18n = {
	en: {
		// Títulos das seções (sidebar)
		sectionDocs: "Documentation",
		sectionExamples: "Examples",
		sectionPlayground: "Playground",
		sectionContact: "Contact",

		// Itens da documentação
		docIndex: "Introduction",
		docGetStarted: "Get Started",
		docInstallation: "Installation",
		docFields: "Fields",
		docForms: "Forms",
		docWizards: "Wizards",
		docZodIntegration: "Zod Integration",
		docFormDesign: "Form design",
		docTips: "Tips",
		docApiReference: "API Reference",
		docResolver: "React Hook Form (resolver)",
		docFieldsIndex: "Overview",
		docFieldsAbstract: "Abstract fields",
		docFieldsCustomProps: "Custom props",
		docFormsIndex: "Overview",
		docFormsHooks: "useForm vs useZormy vs createForm",
		docWizardsIndex: "Overview",
		docWizardsAutoSave: "Auto save",
		docWizardsHooks: "useWizard vs createWizard",

		// Itens da seção Examples
		exampleIndex: "Overview",
		exampleSimpleForm: "Simple Form",
		exampleDependentFields: "Dependent Fields",
		exampleNestedFields: "Nested Fields",
		exampleMultiStepWizard: "Multi-Step Wizard",
		exampleAddressCep: "Address + CEP (API)",
	},
	"pt-BR": {
		sectionDocs: "Documentação",
		sectionExamples: "Exemplos",
		sectionPlayground: "Playground",
		sectionContact: "Contato",

		docIndex: "Introdução",
		docGetStarted: "Começando",
		docInstallation: "Instalação",
		docFields: "Fields",
		docForms: "Forms",
		docWizards: "Wizards",
		docZodIntegration: "Integração Zod",
		docFormDesign: "Design de formulários",
		docTips: "Dicas",
		docApiReference: "Referência API",
		docResolver: "React Hook Form (resolver)",
		docFieldsIndex: "Visão geral",
		docFieldsAbstract: "Campos abstratos",
		docFieldsCustomProps: "Props customizadas",
		docFormsIndex: "Visão geral",
		docFormsHooks: "useForm vs useZormy vs createForm",
		docWizardsIndex: "Visão geral",
		docWizardsAutoSave: "Auto save",
		docWizardsHooks: "useWizard vs createWizard",

		exampleIndex: "Visão geral",
		exampleSimpleForm: "Formulário Simples",
		exampleDependentFields: "Campos com Dependências",
		exampleNestedFields: "Campos Aninhados",
		exampleMultiStepWizard: "Wizard Multi-Step",
		exampleAddressCep: "Endereço + CEP (API)",
	},
} as const;
