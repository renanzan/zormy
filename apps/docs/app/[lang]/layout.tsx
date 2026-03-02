import Navbar from "@/components/landing/Navbar";
import { getPagesFromPageMap } from "@/lib/getPagesFromPageMap";
import { notFound } from "next/navigation";
import { Layout } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";

const LOCALES = [
	{ locale: "pt-BR", name: "Português" },
	{ locale: "en", name: "English" },
];

const VALID_LANGS = new Set(LOCALES.map((l) => l.locale));

export async function generateStaticParams() {
	return LOCALES.map(({ locale }) => ({ lang: locale }));
}

export default async function LangLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ lang: string }>;
}) {
	const { lang } = await params;

	// Evita que URLs como /.well-known/... ou /images/... disparem getPageMap com "lang" inválido
	if (!VALID_LANGS.has(lang)) {
		notFound();
	}

	const pageMap = await getPageMap(`/${lang}`);
	const pages = await getPagesFromPageMap({ pageMapArray: pageMap });

	return (
		<Layout
			key="docs-layout"
			navbar={<Navbar lang={lang} pages={pages} />}
			pageMap={pageMap}
			docsRepositoryBase="https://github.com/phucbm/nextra-docs-starter/tree/main"
			footer={null}
			search={null}
			i18n={LOCALES}
		>
			{children}
		</Layout>
	);
}
