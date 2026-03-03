import { useMDXComponents as getThemeComponents } from "nextra-theme-docs";
import { Callout, FileTree, Steps, Tabs } from "nextra/components";

import { Cards } from "./components/BeautifulCards";
import { CodeExample } from "./components/CodeExample";
import { HomePage } from "./components/HomePage";
import { Playground } from "./components/Playground";

const themeComponents = getThemeComponents();

export function useMDXComponents() {
	return {
		...themeComponents,
		wrapper: (props) => <div {...props}>{themeComponents.wrapper(props)}</div>,
		Callout,
		FileTree,
		Cards,
		Steps,
		Tabs,
		CodeExample,
		Playground,
		HomePage,
	};
}
