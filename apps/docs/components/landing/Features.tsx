"use client";

import { intl } from "@/translations";
import { motion } from "framer-motion";
import { Box, CheckCircle, GitBranch, Layers, Shield, Zap } from "lucide-react";
import { useParams } from "next/navigation";

import type { LandingLocale } from "@/translations";

const Features = () => {
	const params = useParams();
	const lang = (params?.lang as LandingLocale) ?? "en";
	const t = intl("landing", lang);

	const features = [
		{ icon: Shield, titleKey: "feature1Title" as const, descKey: "feature1Desc" as const },
		{ icon: CheckCircle, titleKey: "feature2Title" as const, descKey: "feature2Desc" as const },
		{ icon: Box, titleKey: "feature3Title" as const, descKey: "feature3Desc" as const },
		{ icon: Layers, titleKey: "feature4Title" as const, descKey: "feature4Desc" as const },
		{ icon: GitBranch, titleKey: "feature5Title" as const, descKey: "feature5Desc" as const },
		{ icon: Zap, titleKey: "feature6Title" as const, descKey: "feature6Desc" as const },
	];

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
					<h2 className="text-3xl sm:text-4xl font-bold mb-4">{t.featuresTitle}</h2>
					<p className="text-muted-foreground text-lg max-w-xl mx-auto">{t.featuresSubtitle}</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
					{features.map((feature, i) => (
						<motion.div
							key={feature.titleKey}
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
							<h3 className="text-lg font-semibold mb-2">{t[feature.titleKey]}</h3>
							<p className="text-sm text-muted-foreground leading-relaxed">{t[feature.descKey]}</p>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default Features;
