"use client";

import { Sandpack } from "@codesandbox/sandpack-react";
import { cn } from "@/lib/utils";

interface CodeExampleProps {
	/** Código do componente principal (deve ter `export default` para o template react-ts) */
	code: string;
	files?: Record<string, string>;
	template?: "react" | "react-ts" | "vanilla" | "vanilla-ts";
	dependencies?: Record<string, string>;
	/** Altura do editor em px (padrão: 420) */
	editorHeight?: number;
	/** Classe CSS do container (estilo alinhado aos blocos de código da doc) */
	className?: string;
}

/**
 * Bloco de código executável com Sandpack. Mantém o estilo visual dos blocos
 * de código da documentação (borda, cantos arredondados, overflow).
 */
export function CodeExample({
	code,
	files,
	template = "react-ts",
	dependencies = {},
	editorHeight = 420,
	className,
}: CodeExampleProps) {
	const defaultFiles = {
		"/App.tsx": code,
		...files,
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
					showNavigator: true,
					showTabs: true,
					closableTabs: false,
					editorHeight,
					editorWidthPercentage: 55,
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
