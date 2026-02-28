import { NotFoundPage } from "nextra-theme-docs";

/**
 * 404 dentro de [lang]. Usado quando notFound() é chamado da página (ex.: rota inexistente).
 * Nesse caso já estamos dentro do Layout do tema, então o contexto está disponível.
 */
export default function LangNotFound() {
	return (
		<NotFoundPage content="Enviar issue" labels="broken-link">
			<h1>Página não encontrada</h1>
			<p className="mt-4">
				<a
					href="/pt-BR"
					className="text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
				>
					Voltar ao início
				</a>
			</p>
		</NotFoundPage>
	);
}
