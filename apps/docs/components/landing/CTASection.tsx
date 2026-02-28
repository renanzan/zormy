import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const CTASection = () => {
	return (
		<section className="relative py-20 lg:py-32 overflow-hidden">
			{/* Animated gradient background */}
			<motion.div
				className="absolute inset-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 50% at 50% 50%, hsl(217 91% 60% / 0.1) 0%, transparent 70%)",
				}}
				animate={{
					opacity: [0.5, 1, 0.5],
					scale: [1, 1.05, 1],
				}}
				transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
			/>

			<div className="container relative mx-auto px-4 lg:px-8 text-center">
				<motion.h2
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.6 }}
					className="text-3xl sm:text-4xl font-bold mb-4"
				>
					Pronto para <span className="text-gradient">começar</span>?
				</motion.h2>
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.1 }}
					className="text-muted-foreground text-lg max-w-md mx-auto mb-8"
				>
					Comece a criar formulários tipados e reutilizáveis em minutos.
				</motion.p>
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<Button
						size="lg"
						className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base"
						asChild
					>
						<Link href="/docs">
							Ver Documentação <ArrowRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</motion.div>
			</div>
		</section>
	);
};

export default CTASection;
