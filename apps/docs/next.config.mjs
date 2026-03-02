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
	turbopack: {
		rules: {
			"*.svg": {
				loaders: [
					{
						loader: "@svgr/webpack",
						options: {
							// Remove width/height do SVG para que className (ex.: w-4 h-4) controle o tamanho
							dimensions: false,
							// Mantém viewBox para escalar corretamente
							svgoConfig: {
								plugins: [
									{
										name: "preset-default",
										params: {
											overrides: {
												removeViewBox: false,
											},
										},
									},
								],
							},
						},
					},
				],
				as: "*.js",
			},
		},
	},
});
