/**
 * Traduções da landing page (en / pt-BR).
 * Use com useParams().lang e getLandingT(lang).
 */

export type LandingLocale = "en" | "pt-BR";

export const landingI18n = {
	en: {
		// Hero
		heroBadge: "Smart forms",
		heroTitle: "Build ",
		heroTitleHighlight: "typed and reusable forms",
		heroSubtitle:
			"Zormy combines Zod and React Hook Form to build dynamic forms and wizards with componentized fields, strong typing, and automatic validation.",
		heroCta: "Get Started",
		heroHighlights: [
			"Automatic type inference",
			"Declarative validation with Zod",
			"Reusable fields",
			"Multi-step wizards",
			"Nested fields",
			"Dynamic dependencies",
		],

		// Nav
		navDocs: "Documentation",
		navGetStarted: "Get Started",
		navExamples: "Examples",
		navPlayground: "Playground",
		navSearchPlaceholder: "Search...",
		navMenuOpen: "Open menu",
		navMenuClose: "Close menu",

		// Code preview
		codePreviewTitle: "See ",
		codePreviewTitleBrand: "Zormy",
		codePreviewTitleSuffix: " in action",
		codePreviewSubtitle: "Clean, typed, declarative code. No boilerplate.",
		codePreviewTabSimple: "Simple Form",
		codePreviewTabWizard: "Multi-Step Wizard",
		codePreviewCommentSimple: "// data is typed: { email: string; name: string }",
		codePreviewCommentWizard: "// allData is the typed intersection of all steps",

		// Features
		featuresTitle: "Features",
		featuresSubtitle: "Everything you need to build modern forms",
		feature1Title: "Strong Typing",
		feature1Desc:
			"Automatic type inference from your fields to the form. Zero manual casting.",
		feature2Title: "Zod Validation",
		feature2Desc:
			"Built-in declarative validation. Define the schema once, use it everywhere.",
		feature3Title: "Reusable Fields",
		feature3Desc:
			"Create isolated fields with their own render and schema. Compose like building blocks.",
		feature4Title: "Multi-Step Wizards",
		feature4Desc:
			"Build wizards with multiple typed steps. Data aggregated automatically.",
		feature5Title: "Nested Fields",
		feature5Desc:
			"Support for nested objects and arrays with deep typing and validation.",
		feature6Title: "Dynamic Dependencies",
		feature6Desc:
			"Fields that react to other fields. Conditional logic with preserved typing.",

		// How it works
		howTitle: "How it ",
		howTitleHighlight: "works",
		howSubtitle: "Three simple steps to perfect forms",
		howStep1Title: "Define your fields with Zod",
		howStep2Title: "Compose your form",
		howStep3Title: "Automatic typing and validation",
		howStep3Comment: "// Fully typed and validated!",

		// Built with
		builtWith: "Built with",

		// CTA
		ctaTitle: "Ready to ",
		ctaTitleHighlight: "get started",
		ctaTitleSuffix: "?",
		ctaSubtitle: "Start building typed, reusable forms in minutes.",
		ctaButton: "View Documentation",

		// Footer
		footerCopyright: "Open source under MIT.",
	},
	"pt-BR": {
		// Hero
		heroBadge: "Formulários inteligentes",
		heroTitle: "Construa formulários ",
		heroTitleHighlight: "tipados e reutilizáveis",
		heroSubtitle:
			"Zormy combina Zod e React Hook Form para criar formulários e wizards dinâmicos com campos componentizados, tipagem forte e validação automática.",
		heroCta: "Começar Agora",
		heroHighlights: [
			"Inferência automática de tipos",
			"Validação declarativa com Zod",
			"Campos reutilizáveis",
			"Wizards multi-step",
			"Campos aninhados",
			"Dependências dinâmicas",
		],

		// Nav
		navDocs: "Documentação",
		navGetStarted: "Começar",
		navExamples: "Exemplos",
		navPlayground: "Playground",
		navSearchPlaceholder: "Buscar...",
		navMenuOpen: "Abrir menu",
		navMenuClose: "Fechar menu",

		// Code preview
		codePreviewTitle: "Veja o ",
		codePreviewTitleBrand: "Zormy",
		codePreviewTitleSuffix: " em ação",
		codePreviewSubtitle: "Código limpo, tipado e declarativo. Sem boilerplate.",
		codePreviewTabSimple: "Formulário Simples",
		codePreviewTabWizard: "Wizard Multi-Step",
		codePreviewCommentSimple: "// data é tipado: { email: string; name: string }",
		codePreviewCommentWizard: "// allData é a interseção tipada de todos os steps",

		// Features
		featuresTitle: "Características",
		featuresSubtitle: "Tudo que você precisa para construir formulários modernos",
		feature1Title: "Tipagem Forte",
		feature1Desc:
			"Inferência automática de tipos dos seus campos para o formulário. Zero casting manual.",
		feature2Title: "Validação Zod",
		feature2Desc:
			"Validação declarativa integrada. Defina o schema uma vez, use em todo lugar.",
		feature3Title: "Campos Reutilizáveis",
		feature3Desc:
			"Crie campos isolados com render e schema próprio. Componha como blocos.",
		feature4Title: "Wizards Multi-Step",
		feature4Desc:
			"Monte wizards com múltiplos steps tipados. Dados agregados automaticamente.",
		feature5Title: "Campos Aninhados",
		feature5Desc:
			"Suporte a objetos e arrays aninhados com tipagem e validação profundas.",
		feature6Title: "Dependências Dinâmicas",
		feature6Desc:
			"Campos que reagem a outros campos. Lógica condicional com tipagem preservada.",

		// How it works
		howTitle: "Como ",
		howTitleHighlight: "funciona",
		howSubtitle: "Três passos simples para formulários perfeitos",
		howStep1Title: "Defina seus campos com Zod",
		howStep2Title: "Componha seu formulário",
		howStep3Title: "Tipagem e validação automáticas",
		howStep3Comment: "// Totalmente tipado e validado!",

		// Built with
		builtWith: "Construído com",

		// CTA
		ctaTitle: "Pronto para ",
		ctaTitleHighlight: "começar",
		ctaTitleSuffix: "?",
		ctaSubtitle: "Comece a criar formulários tipados e reutilizáveis em minutos.",
		ctaButton: "Ver Documentação",

		// Footer
		footerCopyright: "Open source sob MIT.",
	},
} as const;

export type LandingT = (typeof landingI18n)[LandingLocale];

export function getLandingT(lang: string) {
	return landingI18n[lang as LandingLocale] ?? landingI18n["en"];
}
