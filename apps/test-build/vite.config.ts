import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react()],
	resolve: {
		// NÃO usar condições "development" - queremos testar os arquivos compilados
		// Isso força o uso dos arquivos em dist/ mesmo em modo dev
		conditions: ["import", "module", "require"],
		// Adiciona extensões para resolver .jsx também (arquivos JSX compilados)
		extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
	},
	server: {
		port: 3000,
		open: true,
	},
});
