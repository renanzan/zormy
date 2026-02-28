"use client";

import BuiltWith from "./landing/BuiltWith";
import CodePreview from "./landing/CodePreview";
import CTASection from "./landing/CTASection";
import Features from "./landing/Features";
import Footer from "./landing/Footer";
import HeroSection from "./landing/HeroSection";
import HowItWorks from "./landing/HowItWorks";

export function HomePage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<main>
				<HeroSection />
				<CodePreview />
				<Features />
				<HowItWorks />
				<BuiltWith />
				<CTASection />
			</main>
			<Footer />
		</div>
	);
}
