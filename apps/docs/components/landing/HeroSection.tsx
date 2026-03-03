"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { intl } from "@/translations";
import { motion } from "framer-motion";
import { ArrowRight, Check, Copy, Github } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import type { LandingLocale } from "@/translations";

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
	<motion.div
		className={`absolute rounded-full blur-3xl opacity-20 ${className}`}
		animate={{
			y: [0, -30, 0],
			x: [0, 15, 0],
			scale: [1, 1.1, 1],
		}}
		transition={{
			duration: 8,
			repeat: Infinity,
			ease: "easeInOut",
			delay,
		}}
	/>
);

const HeroSection = () => {
	const params = useParams();
	const lang = (params?.lang as LandingLocale) ?? "en";
	const t = intl("landing", lang);
	const base = `/${lang}`;
	const [copied, setCopied] = useState(false);
	const installCmd = "pnpm add zormy zod react-hook-form";

	const handleCopy = () => {
		navigator.clipboard.writeText(installCmd);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const highlights = t.heroHighlights;

	return (
		<section id="hero" className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
			{/* Animated background orbs */}
			<FloatingOrb className="w-96 h-96 bg-primary -top-20 -left-40" delay={0} />
			<FloatingOrb className="w-80 h-80 bg-accent top-20 -right-32" delay={2} />
			<FloatingOrb className="w-64 h-64 bg-primary/50 bottom-0 left-1/3" delay={4} />

			{/* Grid pattern overlay */}
			<div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />

			<div className="container relative mx-auto px-4 lg:px-8 text-center">
				{/* Badge */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 animate-pulse-glow">
						🧠 {t.heroBadge}
					</Badge>
				</motion.div>

				{/* Title */}
				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
					className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto"
				>
					{t.heroTitle}
					<span className="text-gradient">{t.heroTitleHighlight}</span>
				</motion.h1>

				{/* Subtitle */}
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
				>
					{t.heroSubtitle}
				</motion.p>

				{/* CTAs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
				>
					<Button
						size="lg"
						className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base"
						asChild
					>
						<Link href={`${base}/docs/get-started`}>
							{t.heroCta} <ArrowRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>

					<Button
						size="lg"
						variant="outline"
						className="border-border/60 bg-secondary/30 hover:bg-secondary/60 h-12 text-base"
					>
						<Github className="mr-2 h-4 w-4" /> GitHub
					</Button>
				</motion.div>

				{/* Install command */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className="inline-flex items-center gap-3 glass rounded-lg px-5 py-3 mb-12"
				>
					<code className="code-block text-sm text-muted-foreground">
						<span className="text-primary">$</span> {installCmd}
					</code>
					<button
						onClick={handleCopy}
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						{copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
					</button>
				</motion.div>

				{/* Feature badges */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.5 }}
					className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto"
				>
					{highlights.map((h, i) => (
						<motion.div
							key={h}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3, delay: 0.5 + i * 0.05 }}
						>
							<Badge
								variant="outline"
								className="text-xs text-muted-foreground border-border/50 bg-secondary/30 px-3 py-1"
							>
								{h}
							</Badge>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
};

export default HeroSection;
