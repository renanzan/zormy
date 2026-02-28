import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: [{ find: /^zod$/, replacement: "zod4" }],
	},
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./__tests__/setup.ts"],
		include: ["__tests__/zod4/**/*.zod4.test.ts", "__tests__/zod4/**/*.zod4.test.tsx"],
		typecheck: {
			enabled: true,
			include: ["__tests__/zod4/**/*.zod4.test-d.ts"],
			tsconfig: "./tsconfig.json",
		},
	},
});

