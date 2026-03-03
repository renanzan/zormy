import { Navbar } from "@/components/layout/Navbar";
import { Search } from "@/components/layout/search";
import { intl } from "@/translations";
import { notFound } from "next/navigation";
import { Layout } from "nextra-theme-docs";
import { Banner } from "nextra/components";
import { getPageMap } from "nextra/page-map";

import type { LandingLocale } from "@/translations";

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
	params: Promise<{ lang: LandingLocale }>;
}) {
	const { lang } = await params;

	if (!VALID_LANGS.has(lang)) {
		notFound();
	}

	const pageMap = await getPageMap(`/${lang}`);

	return (
		<Layout
			key="docs-layout"
			pageMap={pageMap}
			navbar={<Navbar lang={lang} />}
			search={
				<Search
					lang={lang}
					placeholder={intl("nextraThemeDocs", lang).search.placeholder}
					emptyResult={intl("nextraThemeDocs", lang).search.emptyResult}
					loading={intl("nextraThemeDocs", lang).search.loading}
				/>
			}
			toc={{
				title: intl("nextraThemeDocs", lang).TOC.title,
				backToTop: intl("nextraThemeDocs", lang).TOC.backToTop,
			}}
			editLink={intl("nextraThemeDocs", lang).editLink}
			feedback={{
				content: intl("nextraThemeDocs", lang).feedback.content,
				labels: intl("nextraThemeDocs", lang).feedback.labels,
			}}
			i18n={LOCALES}
			docsRepositoryBase="https://github.com/phucbm/nextra-docs-starter/tree/main"
			footer={null}
			copyPageButton={false}
			sidebar={{
				defaultMenuCollapseLevel: 1,
			}}
			banner={
				<Banner storageKey="v1-release">
					🚀 Chegou o Zormy v1! Experimente formulários com tipagem garantida e muito mais
					agilidade.
				</Banner>
			}
		>
			{children}
		</Layout>
	);
}
