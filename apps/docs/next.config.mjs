import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import nextra from "nextra";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve o caminho do zormy para usar o source TypeScript
const zormyPackagePath = resolve(__dirname, "../../packages/zormy");
const zormySrcPath = resolve(zormyPackagePath, "src/index.ts");
const zormyPathExists = existsSync(zormySrcPath);

if (!zormyPathExists) {
	console.warn(`⚠️  Caminho do zormy não encontrado: ${zormySrcPath}`);
}

const withNextra = nextra({
	search: true,
	defaultShowCopyCode: true,
});

export default withNextra({
	reactStrictMode: true,
	transpilePackages: ["zormy"],
	pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
	i18n: {
		locales: ["pt-BR", "en"],
		defaultLocale: "pt-BR",
	},
	// experimental: {
	//     mdxRs: false,
	//     // Desabilita Turbopack temporariamente para usar webpack com alias
	//     turbo: false
	// },
	webpack: (config, { isServer, dev }) => {
		if (!config.resolve) {
			config.resolve = {};
		}
		if (!config.resolve.alias) {
			config.resolve.alias = {};
		}

		// Adiciona condições para suportar a condição "development" do package.json
		if (!config.resolve.conditionNames) {
			config.resolve.conditionNames = [];
		}
		// Adiciona "development" no início para priorizar em modo dev
		if (dev && !config.resolve.conditionNames.includes("development")) {
			config.resolve.conditionNames.unshift("development");
		}

		config.resolve.alias = {
			...config.resolve.alias,
			"next-mdx-import-source-file": resolve(__dirname, "./mdx-components.tsx"),
			// Sempre usa o source TypeScript do zormy em vez da versão compilada
			...(zormyPathExists
				? {
						zormy: zormySrcPath,
						// Também resolve o diretório do pacote para importações internas
						"zormy/": resolve(zormyPackagePath, "src/"),
					}
				: {}),
		};

		// Adiciona extensões para resolver TypeScript
		if (!config.resolve.extensions) {
			config.resolve.extensions = [];
		}
		if (!config.resolve.extensions.includes(".ts")) {
			config.resolve.extensions.push(".ts", ".tsx");
		}

		return config;
	},
});
