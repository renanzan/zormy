"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { intl } from "@/translations";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";

import type { LandingLocale } from "@/translations";

export const highlightCode = (code: string) => {
	const escaped = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

	const tokens: string[] = [];
	const addToken = (match: string, className: string) => {
		const id = `\x01${tokens.length}\x02`;
		tokens.push(`<span class="${className}">${match}</span>`);
		return id;
	};

	let processed = escaped
		// 1. Comentários e Strings
		.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, (m) => addToken(m, "code-comment"))
		.replace(/('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\$]|\\.|(\$\{[^}]+\}))*`)/g, (m) =>
			addToken(m, "code-string")
		)

		// 2. JSX Tags (Início e Fim: <input, />, >)
		.replace(/(&lt;\/?[a-z][A-Z0-9]*|(?<!=)&gt;|\/&gt;)/gi, (m) => addToken(m, "code-tag"))

		// 3. Keywords
		.replace(
			/\b(const|let|var|return|import|from|export|default|async|await|type|interface|as)\b/g,
			(m) => addToken(m, "code-keyword")
		)

		// 4. ATRIBUTOS JSX E CHAVES DE OBJETO
		.replace(/\b(\w+)(?==|:)/g, (m) => addToken(m, "code-property"))

		// 5. FUNÇÕES E MÉTODOS
		.replace(/(?:\b|(?<=\.))([a-z_][a-zA-Z0-9_]*)(?=\s*\()/g, (m) => addToken(m, "code-function"))

		// 6. COMPONENTES E CLASSES
		.replace(/\b([A-Z][a-zA-Z0-9]*)\b/g, (m) => addToken(m, "code-type"))

		// 7. Brackets
		.replace(/[{}()\[\]]/g, (m) => addToken(m, "code-bracket"))

		// 8. Punctuation & Operators (COMPLETO)
		// Adicionado: ..., ??, ?., comparações (!==, <=), matemática (+=, *) e operadores lógicos
		.replace(
			/(\.\.\.|&amp;&amp;|\|\||\?\?|=&gt;|&lt;=|&gt;=|&lt;|&gt;|!==|!=|===|==|=|\?\.|\+=|-=|\*=|\/=|\+|-|\*|\/|\.|\,|:|(?<!&(?:amp|lt|gt));|\!|\?)/g,
			(m) => addToken(m, "code-punctuation")
		)

		// 9. VARIÁVEIS DE ESCOPO
		.replace(/\b(value|onChange|error|data|props|fieldState|register)\b/g, (m) =>
			addToken(m, "code-variable")
		);

	// Reinsere os tokens
	tokens.forEach((token, i) => {
		processed = processed.replace(new RegExp(`\\x01${i}\\x02`, "g"), token);
	});

	return processed.split("\n").map((line, i) => (
		<div key={i} className="flex font-mono text-[13px] leading-6 group hover:bg-white/[0.02]">
			<span className="w-10 shrink-0 text-right pr-4 text-gray-500/40 select-none border-r border-white/5 mr-4">
				{i + 1}
			</span>
			<span className="whitespace-pre" dangerouslySetInnerHTML={{ __html: line || " " }} />
		</div>
	));
};

const CodePreview = () => {
	const params = useParams();
	const lang = (params?.lang as LandingLocale) ?? "en";
	const t = intl("landing", lang);

	const simpleFormCode = `import { createForm, field } from 'zormy'
import { z } from 'zod'

const UsernameField = field("username")
	.schema(z.string().min(2))
	.render(({ register }) => (
		<input placeholder="Username" {...register()} />
	));

const PasswordField = field("password")
	.schema(z.string().min(8))
	.render(({ register }) => (
		<input type="password" placeholder="Password" {...register()} />
	));
	
return (
	<Form
		fields={[UsernameField, PasswordField]}
		onSubmit={({ username, password }) => {
			// data é tipado: { username: string; password: string }
			console.log({ username, password })
		}}
	>
		<UsernameField />
		<PasswordField />
		
		<button type="submit">Submit</button>
	</Form>
);`;

	const wizardCode = `import { createWizard, step } from 'zormy';

const { Wizard, Step, methods } = createWizard({
	steps: ["step1", "step2"] as const,
	fields: {
		step1: [NameField, EmailField],
		step2: [AddressField, PhoneField],
	},
	onComplete: (data) => {
		// data: { name: string; email: string; address: string; phone: string }
		${t.codePreviewCommentWizard}
		api.createUser(data)
	}
});

return (
	<Wizard>
		<Step step="step1">
			<NameField />
			<EmailField />
		</Step>
		
		<Step step="step2">
			<AddressField />
			<PhoneField />
		</Step>

		{!methods.isFirstStep && (
			<button type="button" onClick={methods.back}>Back</button>
		)}
		
		{!methods.isLastStep && (
			<button type="button" onClick={methods.next}>Next</button>
		)}
		
		{methods.isLastStep && (
			<button type="submit">Submit</button>
		)}
	</Wizard>
);`;

	return (
		<section id="code-preview" className="py-20 lg:py-32">
			<div className="container mx-auto px-4 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12"
				>
					<h2 className="text-3xl sm:text-4xl font-bold mb-4">
						{t.codePreviewTitle}
						<span className="text-gradient">{t.codePreviewTitleBrand}</span>
						{t.codePreviewTitleSuffix}
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">{t.codePreviewSubtitle}</p>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 40 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.7, delay: 0.1 }}
					className="max-w-3xl mx-auto"
				>
					<Tabs defaultValue="simple" className="w-full">
						<TabsList className="bg-secondary/50 border border-border/40 mb-0 rounded-b-none">
							<TabsTrigger
								value="simple"
								className="data-[state=active]:bg-card data-[state=active]:text-foreground"
							>
								{t.codePreviewTabSimple}
							</TabsTrigger>
							<TabsTrigger
								value="wizard"
								className="data-[state=active]:bg-card data-[state=active]:text-foreground"
							>
								{t.codePreviewTabWizard}
							</TabsTrigger>
						</TabsList>

						<div className="glass rounded-lg rounded-tl-none overflow-hidden animate-pulse-glow">
							<div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
								<div className="w-3 h-3 rounded-full bg-destructive/60" />
								<div className="w-3 h-3 rounded-full bg-accent/60" />
								<div className="w-3 h-3 rounded-full bg-primary/60" />
								<span className="ml-3 text-xs text-muted-foreground/60">form.tsx</span>
							</div>

							<div className="p-4 overflow-x-auto code-block">
								<TabsContent value="simple" className="mt-0">
									{highlightCode(simpleFormCode)}
								</TabsContent>
								<TabsContent value="wizard" className="mt-0">
									{highlightCode(wizardCode)}
								</TabsContent>
							</div>
						</div>
					</Tabs>
				</motion.div>
			</div>
		</section>
	);
};

export default CodePreview;
