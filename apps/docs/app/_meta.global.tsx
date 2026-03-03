import { MetaNavLabel } from "@/components/layout/MetaNavLabel";

import type { ReactNode } from "react";
import type { MetaRecord } from "nextra";

/** Nested items (subitems) for docs sidebar — Nextra supports this at runtime */
type MetaRecordWithNested = Record<
	string,
	MetaRecord[string] | { type: "page"; title: ReactNode; items: MetaRecord }
>;

const DOCS_ITEMS: MetaRecordWithNested = {
	index: <MetaNavLabel messageKey="docIndex" iconName="BookOpen" />,
	"get-started": <MetaNavLabel messageKey="docGetStarted" iconName="Rocket" />,
	installation: <MetaNavLabel messageKey="docInstallation" iconName="Download" />,
	fields: {
		title: <MetaNavLabel messageKey="docFields" iconName="Box" />,
		items: {
			index: <MetaNavLabel messageKey="docFieldsIndex" />,
			abstract: <MetaNavLabel messageKey="docFieldsAbstract" />,
			"custom-props": <MetaNavLabel messageKey="docFieldsCustomProps" />,
		},
	},
	forms: {
		title: <MetaNavLabel messageKey="docForms" iconName="FileStack" />,
		items: {
			index: <MetaNavLabel messageKey="docFormsIndex" />,
			hooks: <MetaNavLabel messageKey="docFormsHooks" />,
		},
	},
	wizards: {
		title: <MetaNavLabel messageKey="docWizards" iconName="GitBranch" />,
		items: {
			index: <MetaNavLabel messageKey="docWizardsIndex" />,
			"auto-save": <MetaNavLabel messageKey="docWizardsAutoSave" />,
			hooks: <MetaNavLabel messageKey="docWizardsHooks" />,
		},
	},
	resolver: <MetaNavLabel messageKey="docResolver" iconName="FileCheck" />,
	"zod-integration": <MetaNavLabel messageKey="docZodIntegration" iconName="FileCheck" />,
	"form-design": <MetaNavLabel messageKey="docFormDesign" iconName="Layers" />,
	tips: <MetaNavLabel messageKey="docTips" iconName="Lightbulb" />,
	"api-reference": <MetaNavLabel messageKey="docApiReference" iconName="Code" />,
};

const EXAMPLES_ITEMS: MetaRecord = {
	index: <MetaNavLabel messageKey="exampleIndex" iconName="BookOpen" />,
	"simple-form": <MetaNavLabel messageKey="exampleSimpleForm" iconName="FileStack" />,
	"dependent-fields": <MetaNavLabel messageKey="exampleDependentFields" iconName="Layers" />,
	"nested-fields": <MetaNavLabel messageKey="exampleNestedFields" iconName="Box" />,
	"multi-step-wizard": <MetaNavLabel messageKey="exampleMultiStepWizard" iconName="GitBranch" />,
	"address-cep": <MetaNavLabel messageKey="exampleAddressCep" iconName="Box" />,
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
		title: <MetaNavLabel messageKey="sectionDocs" />,
		items: DOCS_ITEMS as MetaRecord,
	},
	examples: {
		type: "page",
		title: <MetaNavLabel messageKey="sectionExamples" />,
		items: EXAMPLES_ITEMS,
	},
	playground: {
		type: "page",
		title: <MetaNavLabel messageKey="sectionPlayground" />,
	},
	contact: {
		type: "page",
		title: <MetaNavLabel messageKey="sectionContact" />,
	},
};
