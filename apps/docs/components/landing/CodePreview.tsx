import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const simpleFormCode = `import { createForm, field } from 'zormy'
import { z } from 'zod'

const EmailField = field({
  schema: z.string().email(),
  render: ({ value, onChange, error }) => (
    <div>
      <input value={value} onChange={onChange} />
      {error && <span>{error}</span>}
    </div>
  ),
})

const NameField = field({
  schema: z.string().min(2),
  render: ({ value, onChange }) => (
    <input value={value} onChange={onChange} />
  ),
})

const MyForm = createForm({
  fields: { email: EmailField, name: NameField },
  onSubmit: (data) => {
    // data é tipado: { email: string; name: string }
    console.log(data)
  },
})`;

const wizardCode = `import { createWizard, step } from 'zormy'

const Step1 = step({
  fields: {
    name: NameField,
    email: EmailField,
  },
})

const Step2 = step({
  fields: {
    address: AddressField,
    phone: PhoneField,
  },
})

const SignupWizard = createWizard({
  steps: [Step1, Step2],
  onComplete: (allData) => {
    // allData é a interseção tipada de todos os steps
    api.createUser(allData)
  },
})`;

const highlightCode = (code: string) => {
	return code.split("\n").map((line, i) => {
		const highlighted = line
			.replace(/(import|from|const|return|export)/g, '<span class="code-keyword">$1</span>')
			.replace(/('.*?'|".*?"|`.*?`)/g, '<span class="code-string">$1</span>')
			.replace(
				/(createForm|createWizard|field|step|console\.log|api\.createUser)/g,
				'<span class="code-function">$1</span>'
			)
			.replace(
				/(z\.string|z\.email|z\.min|email|name|address|phone|onChange|value|error|data|allData)/g,
				'<span class="code-type">$1</span>'
			)
			.replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>');

		return (
			<div key={i} className="flex">
				<span className="w-8 text-right pr-4 text-muted-foreground/40 select-none text-xs leading-7">
					{i + 1}
				</span>
				<span dangerouslySetInnerHTML={{ __html: highlighted }} />
			</div>
		);
	});
};

const CodePreview = () => {
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
						Veja o <span className="text-gradient">Zormy</span> em ação
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">
						Código limpo, tipado e declarativo. Sem boilerplate.
					</p>
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
								Formulário Simples
							</TabsTrigger>
							<TabsTrigger
								value="wizard"
								className="data-[state=active]:bg-card data-[state=active]:text-foreground"
							>
								Wizard Multi-Step
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
