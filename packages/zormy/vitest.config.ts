import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./__tests__/setup.ts"],
		include: ["__tests__/**/*.{test,spec}.ts", "__tests__/**/*.{test,spec}.tsx"],
		exclude: [...configDefaults.exclude, "**/*.zod4.test.ts", "**/*.zod4.test.tsx"],
		typecheck: {
			enabled: true,
			include: ["__tests__/**/*.test-d.ts"],
			exclude: ["__tests__/**/*.zod4.test-d.ts"],
			tsconfig: "./tsconfig.json",
		},
		benchmark: {
			include: ["__tests__/**/*.bench.ts", "__tests__/**/*.bench.tsx"],
			exclude: ["**/node_modules/**", "**/dist/**"],
		},
	},
});
