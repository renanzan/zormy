import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
	{
		ignores: [
			"**/node_modules/**",
			"**/dist/**",
			"**/build/**",
			"**/.next/**",
			"**/out/**",
			"**/.cache/**",
			"**/coverage/**",
			"**/*.config.js",
			"**/*.config.mjs",
			"**/*.config.ts",
		],
	},
	...tseslint.configs.recommended,
	prettier,
	{
		files: ["**/*.{js,jsx,ts,tsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
		},
		rules: {
			"@typescript-eslint/consistent-type-imports": [
				"error",
				{
					prefer: "type-imports",
					fixStyle: "separate-type-imports",
				},
			],
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/explicit-module-boundary-types": "off",
			"@typescript-eslint/no-non-null-assertion": "warn",
		},
	},
	{
		files: ["apps/docs/**/*.{js,jsx,ts,tsx}"],
		plugins: {
			"@next/next": nextPlugin,
		},
		rules: {
			...nextPlugin.configs.recommended.rules,
			...nextPlugin.configs["core-web-vitals"].rules,
		},
	},
	{
		// Desabilita no-unused-vars para arquivos de teste de type-safety
		// Esses arquivos frequentemente declaram variáveis apenas para verificar tipos
		files: ["**/*.test-d.ts"],
		rules: {
			"@typescript-eslint/no-unused-vars": "off",
		},
	}
);
