/**
 * Traduções da nextra-theme-docs (en / pt-BR)
 * Use com useParams().lang e intl("nextraThemeDocs", lang) para acessar as traduções
 */

export const key = "nextraThemeDocs" as const;

export const i18n = {
	en: {
		TOC: {
			title: "On this page",
			backToTop: "Back to top",
		},

		editLink: "Edit this page",

		feedback: {
			content: "Questions? Send us feedback",
			labels: "feedback",
		},

		search: {
			placeholder: "Search...",
			emptyResult: "No results found.",
			loading: "Loading...",
		},
	},
	"pt-BR": {
		TOC: {
			title: "Nesta página",
			backToTop: "Voltar para o topo",
		},

		editLink: "Editar esta página",

		feedback: {
			content: "Dúvidas? Envie um feedback",
			labels: "feedback",
		},

		search: {
			placeholder: "Pesquisar...",
			emptyResult: "Nenhum resultado encontrado.",
			loading: "Carregando...",
		},
	},
} as const;
