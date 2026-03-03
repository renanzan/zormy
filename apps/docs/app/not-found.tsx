import { Navbar } from "@/components/layout/Navbar";
import { Layout, NotFoundPage } from "nextra-theme-docs";
import { getPageMap } from "nextra/page-map";

const DEFAULT_LOCALE = "pt-BR";
const DOCS_REPO_BASE = "https://github.com/renanzan/zormy/tree/main";
const LOCALES: { locale: string; name: string }[] = [
	{ locale: "pt-BR", name: "Português" },
	{ locale: "en", name: "English" },
];

/**
 * 404 usando NotFoundPage do Nextra. Renderiza o Layout do tema com locale padrão
 * para que o contexto (docsRepositoryBase etc.) esteja disponível.
 */
export default async function NotFound() {
	const pageMap = await getPageMap(`/${DEFAULT_LOCALE}`);

	return (
		<Layout
			navbar={<Navbar lang={DEFAULT_LOCALE} />}
			pageMap={pageMap}
			docsRepositoryBase={DOCS_REPO_BASE}
			footer={null}
			search={null}
			i18n={LOCALES}
		>
			<NotFoundPage content="Enviar issue" labels="broken-link">
				<h1>Página não encontrada</h1>
				<p className="mt-4">
					<a
						href={`/${DEFAULT_LOCALE}`}
						className="text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
					>
						Voltar ao início
					</a>
				</p>
			</NotFoundPage>
		</Layout>
	);
}
