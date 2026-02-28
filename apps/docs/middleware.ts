import { proxy } from "nextra/locales";

export default proxy;

export const config = {
	// Não passar pelo proxy: api, _next, arquivos estáticos (public/) e .well-known
	matcher: [
		"/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|manifest|_pagefind|images/|\\.well-known/).*)",
	],
};
