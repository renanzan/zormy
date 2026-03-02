import { generateStaticParamsFor, importPage } from "nextra/pages";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

import { useMDXComponents as getMDXComponents } from "../../../mdx-components";

export const generateStaticParams = generateStaticParamsFor("mdxPath", "lang");

/** Paths that are static assets (public/) or non-content; should be served from root, not as MDX. */
function isStaticOrNonContentPath(mdxPath: string[] | undefined): boolean {
	const segs = Array.isArray(mdxPath) ? mdxPath : [];
	if (!segs.length) return false;
	const first = segs[0]?.toLowerCase() ?? "";
	const last = segs[segs.length - 1] ?? "";
	// Pasta public: images, favicon, etc. e arquivos sob .well-known
	if (first === "images" || first === ".well-known") return true;
	// Extensões de arquivo estático (não são páginas MDX)
	if (/\.(svg|ico|png|jpg|jpeg|gif|webp|json|xml|txt|woff2?)$/i.test(last)) return true;
	return false;
}

export async function generateMetadata(props: {
	params: Promise<{ lang: string; mdxPath: string[] }>;
}) {
	const params = await props.params;
	if (isStaticOrNonContentPath(params.mdxPath)) {
		return {};
	}
	try {
		const { metadata } = await importPage(params.mdxPath, params.lang);
		return metadata;
	} catch {
		return {};
	}
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: {
	params: Promise<{ lang: string; mdxPath: string[] }>;
}) {
	const params = await props.params;

	// Redireciona assets e rotas não-conteúdo para a URL sem locale (public/ na raiz)
	if (isStaticOrNonContentPath(params.mdxPath)) {
		const segs = Array.isArray(params.mdxPath) ? params.mdxPath.filter(Boolean) : [];
		redirect(segs.length ? "/" + segs.join("/") : "/");
	}

	let result;
	try {
		result = await importPage(params.mdxPath, params.lang);
	} catch {
		notFound();
	}
	const { default: MDXContent, toc, metadata } = result;

	const isIndex =
		result.metadata.filePath === `content/${params.lang}/index.mdx` ||
		result.metadata.filePath === "content/index.mdx";

	if (isIndex) {
		return <MDXContent {...props} params={params} />;
	}

	return (
		<div className="pt-14">
			{/* @ts-expect-error - TODO: fix this */}
			<Wrapper toc={toc} metadata={metadata}>
				<MDXContent {...props} params={params} />
			</Wrapper>
		</div>
	);
}
