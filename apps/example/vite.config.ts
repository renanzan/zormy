import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const zormyPackagePath = path.resolve(__dirname, "../../packages/zormy");
const zormySrcPath = path.resolve(zormyPackagePath, "src/index.ts");

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			zormy: zormySrcPath,
		},
	},
	server: {
		port: 3000,
		open: true,
	},
	optimizeDeps: {
		exclude: ["zormy"],
	},
});
