import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
	title: {
		default: "Zormy - Formulários Tipados e Reutilizáveis",
		template: "%s | Zormy",
	},
	description:
		"Biblioteca moderna para criar formulários complexos com TypeScript, Zod e React Hook Form",
	icons: {
		icon: "/images/general/icon.svg",
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR" dir="ltr" suppressHydrationWarning>
			<body className="flex flex-col min-h-screen">{children}</body>
		</html>
	);
}
