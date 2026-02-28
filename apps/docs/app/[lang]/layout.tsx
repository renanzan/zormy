import Navbar from "@/components/landing/Navbar";
import { getPagesFromPageMap } from "@/lib/getPagesFromPageMap";
import { Footer, Layout } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";
import { notFound } from "next/navigation";

const LOCALES = [
	{ locale: "pt-BR", name: "Português" },
	{ locale: "en", name: "English" },
] as const;

const VALID_LANGS = new Set(LOCALES.map((l) => l.locale));

const footer = (
	<Footer>
		<div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-600 dark:text-gray-400">
			<div>MIT {new Date().getFullYear()} © Zormy.</div>
			<div className="flex items-center gap-4">
				<a
					href="https://github.com"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
				>
					GitHub
				</a>
			</div>
		</div>
	</Footer>
);

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
