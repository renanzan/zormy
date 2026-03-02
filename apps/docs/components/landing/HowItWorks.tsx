"use client";

import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getLandingT } from "@/translations/landing";

const highlightMini = (code: string) => {
	return code.split("\n").map((line, i) => {
		const highlighted = line
			.replace(/(const|import|from|return)/g, '<span class="code-keyword">$1</span>')
			.replace(/('.*?'|".*?")/g, '<span class="code-string">$1</span>')
			.replace(/(field|createForm|saveUser)/g, '<span class="code-function">$1</span>')
			.replace(
				/(z\.string|z\.email|onChange|value|error|data)/g,
				'<span class="code-type">$1</span>'
			)
			.replace(/(\/\/.*)/g, '<span class="code-comment">$1</span>');

		return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
	});
};

const HowItWorks = () => {
	const params = useParams();
	const lang = (params?.lang as string) ?? "en";
	const t = getLandingT(lang);

	const steps = [
		{
			number: "01",
			title: t.howStep1Title,
			code: `const EmailField = field({
  schema: z.string().email(),
  render: ({ value, onChange, error }) => (
    <input value={value} onChange={onChange} />
  ),
})`,
		},
		{
			number: "02",
			title: t.howStep2Title,
			code: `const MyForm = createForm({
  fields: {
    email: EmailField,
    name: NameField,
  },
})`,
		},
		{
			number: "03",
			title: t.howStep3Title,
			code: `<MyForm onSubmit={(data) => {
  // data: { email: string; name: string }
  ${t.howStep3Comment}
  saveUser(data)
}} />`,
		},
	];

	return (
		<section className="relative py-20 lg:py-32 overflow-hidden">
			{/* Animated background */}
			<motion.div
				className="absolute inset-0 bg-gradient-hero"
				animate={{ opacity: [0.5, 1, 0.5] }}
				transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
			/>

			<div className="container relative mx-auto px-4 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-3xl sm:text-4xl font-bold mb-4">
						{t.howTitle}<span className="text-gradient">{t.howTitleHighlight}</span>
					</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">
						{t.howSubtitle}
					</p>
				</motion.div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
					{steps.map((step, idx) => (
						<motion.div
							key={step.number}
							initial={{ opacity: 0, y: 40 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, delay: idx * 0.15 }}
							className="relative"
						>
							<div className="mb-4 flex items-center gap-3">
								<span className="text-4xl font-black text-primary/20">{step.number}</span>
								<h3 className="text-lg font-semibold">{step.title}</h3>
							</div>
							<motion.div
								whileHover={{ scale: 1.02 }}
								transition={{ type: "spring", stiffness: 300, damping: 20 }}
								className="glass rounded-lg overflow-hidden"
							>
								<div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40">
									<div className="w-2 h-2 rounded-full bg-destructive/50" />
									<div className="w-2 h-2 rounded-full bg-accent/50" />
									<div className="w-2 h-2 rounded-full bg-primary/50" />
								</div>
								<div className="p-4 code-block text-xs leading-6">{highlightMini(step.code)}</div>
							</motion.div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default HowItWorks;
