"use client";

import { SANDPACK_PREVIEW_STYLES } from "@/lib/sandpack-preview-styles";
import { cn } from "@/lib/utils";
import { Sandpack } from "@codesandbox/sandpack-react";

const STYLES_IMPORT = 'import "./styles.css";';

// Script de configuração convertido em Data URI para ser aceito no externalResources
const TAILWIND_CONFIG = `
  tailwind.config = {
    corePlugins: {
      preflight: false,
    }
  }
`;
const TAILWIND_CONFIG_URL = `data:text/javascript;base64,${btoa(TAILWIND_CONFIG)}`;

interface CodeExampleProps {
	code: string;
	files?: Record<string, string>;
	template?: "react" | "react-ts" | "vanilla" | "vanilla-ts";
	dependencies?: Record<string, string>;
	editorHeight?: number;
	className?: string;
}

export function CodeExample({
	code,
	files,
	template = "react-ts",
	dependencies = {},
	editorHeight = 420,
	className,
}: CodeExampleProps) {
	const appCode = files?.["/App.tsx"] ?? code;
	const appCodeWithStyles =
		appCode.includes(STYLES_IMPORT) || appCode.includes('import "./styles.css"')
			? appCode
			: `${STYLES_IMPORT}\n\n${appCode}`;

	const defaultFiles = {
		...files,
		"/styles.css": SANDPACK_PREVIEW_STYLES,
		"/App.tsx": appCodeWithStyles,
	};

	return (
		<div
			className={cn(
				"my-6 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900/50",
				"[&_.sp-wrapper]:rounded-xl! [&_.sp-layout]:rounded-b-xl! [&_.sp-editor]:rounded-bl-xl! [&_.sp-preview-container]:rounded-br-xl!",
				className
			)}
		>
			<Sandpack
				template={template}
				files={defaultFiles}
				theme="auto"
				options={{
					showLineNumbers: true,
					showInlineErrors: true,
					showNavigator: false,
					showTabs: false,
					closableTabs: false,
					showRefreshButton: true,
					editorHeight,
					editorWidthPercentage: 55,
					// Injetamos o script do Tailwind e logo depois a nossa configuração via Data URI
					externalResources: ["https://cdn.tailwindcss.com", TAILWIND_CONFIG_URL],
				}}
				customSetup={{
					dependencies: {
						react: "^19.2.4",
						"react-dom": "^19.2.4",
						"react-hook-form": "^7.71.1",
						"@hookform/resolvers": "^5.2.2",
						zod: "^3.25.28",
						zormy: "latest",
						...dependencies,
					},
				}}
			/>
		</div>
	);
}
