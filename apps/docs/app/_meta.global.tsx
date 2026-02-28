import {
	BookOpen,
	Rocket,
	Download,
	Box,
	FileStack,
	GitBranch,
	FileCheck,
	Lightbulb,
	Code,
} from "lucide-react";
import type { MetaRecord } from "nextra";

const iconClass = "size-4 shrink-0";

const DOCS_ITEMS: MetaRecord = {
	index: (
		<span className="flex items-center gap-2">
			<BookOpen className={iconClass} aria-hidden />
			Introdução
		</span>
	),
	"get-started": (
		<span className="flex items-center gap-2">
			<Rocket className={iconClass} aria-hidden />
			Começando
		</span>
	),
	installation: (
		<span className="flex items-center gap-2">
			<Download className={iconClass} aria-hidden />
			Instalação
		</span>
	),
	fields: (
		<span className="flex items-center gap-2">
			<Box className={iconClass} aria-hidden />
			Fields
		</span>
	),
	forms: (
		<span className="flex items-center gap-2">
			<FileStack className={iconClass} aria-hidden />
			Forms
		</span>
	),
	wizards: (
		<span className="flex items-center gap-2">
			<GitBranch className={iconClass} aria-hidden />
			Wizards
		</span>
	),
	"zod-integration": (
		<span className="flex items-center gap-2">
			<FileCheck className={iconClass} aria-hidden />
			Integração Zod
		</span>
	),
	tips: (
		<span className="flex items-center gap-2">
			<Lightbulb className={iconClass} aria-hidden />
			Dicas
		</span>
	),
	"api-reference": (
		<span className="flex items-center gap-2">
			<Code className={iconClass} aria-hidden />
			Referência API
		</span>
	),
};

export default {
	index: {
		type: "page",
		theme: {
			layout: "full",
			toc: false,
			timestamp: false,
		},
	},
	docs: {
		type: "page",
		title: "Documentação",
		items: DOCS_ITEMS,
	},
	examples: {
		type: "page",
		title: "Exemplos",
	},
	playground: {
		type: "page",
		title: "Playground",
	},
	contact: {
		type: "page",
		title: "Contato",
	},
};
