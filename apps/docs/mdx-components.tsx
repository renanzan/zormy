import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { Callout, FileTree } from "nextra/components";

import { BeautifulCards } from "./components/BeautifulCards";
import { CodeExample } from "./components/CodeExample";
import { HomePage } from "./components/HomePage";
import { Playground } from "./components/Playground";

// Get the default MDX components
const themeComponents = getThemeComponents();

// Merge components
export function useMDXComponents() {
	return {
		...themeComponents,
		Callout: Callout,
		FileTree: FileTree,
		Cards: BeautifulCards,
		CodeExample,
		Playground,
		HomePage,
	};
}
