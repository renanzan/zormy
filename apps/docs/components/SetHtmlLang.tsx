"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const LOCALES = ["en", "pt-BR"];

/**
 * Define document.documentElement.lang com base no primeiro segmento da URL (/en ou /pt-BR).
 */
export function SetHtmlLang() {
	const pathname = usePathname();

	useEffect(() => {
		const segment = pathname?.split("/")[1];
		const lang = LOCALES.includes(segment ?? "") ? segment : "pt-BR";
		document.documentElement.lang = lang;
	}, [pathname]);

	return null;
}
