import { motion } from "framer-motion";
import { Box, CheckCircle, GitBranch, Layers, Shield, Zap } from "lucide-react";

const features = [
	{
		icon: Shield,
		title: "Tipagem Forte",
		description:
			"Inferência automática de tipos dos seus campos para o formulário. Zero casting manual.",
	},
	{
		icon: CheckCircle,
		title: "Validação Zod",
		description: "Validação declarativa integrada. Defina o schema uma vez, use em todo lugar.",
	},
	{
		icon: Box,
		title: "Campos Reutilizáveis",
		description: "Crie campos isolados com render e schema próprio. Componha como blocos.",
	},
	{
		icon: Layers,
		title: "Wizards Multi-Step",
		description: "Monte wizards com múltiplos steps tipados. Dados agregados automaticamente.",
	},
	{
		icon: GitBranch,
		title: "Campos Aninhados",
		description: "Suporte a objetos e arrays aninhados com tipagem e validação profundas.",
	},
	{
		icon: Zap,
		title: "Dependências Dinâmicas",
		description: "Campos que reagem a outros campos. Lógica condicional com tipagem preservada.",
	},
];

const Features = () => {
	return (
		<section id="features" className="py-20 lg:py-32">
			<div className="container mx-auto px-4 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-16"
				>
					<h2 className="text-3xl sm:text-4xl font-bold mb-4">Características</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">
						Tudo que você precisa para construir formulários modernos
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
					{features.map((feature, i) => (
						<motion.div
							key={feature.title}
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, delay: i * 0.08 }}
							whileHover={{ y: -6, transition: { duration: 0.2 } }}
							className="group relative glass rounded-xl p-6 glow-border transition-all duration-300"
						>
							<div className="mb-4 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
								<feature.icon className="h-5 w-5 text-primary" />
							</div>
							<h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Features;
