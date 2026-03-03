"use client";

import { intl } from "@/translations";
import { motion } from "framer-motion";
import Image from "next/image";
import { useParams } from "next/navigation";

import type { LandingLocale } from "@/translations";

const techs = [
	{
		name: "Zod",
		icon: <Image src="/images/techs/zod-logo.png" alt="Zod" width={36} height={36} />,
	},
	{
		name: "React Hook Form",
		icon: <Image src="/images/techs/rhf-logo.png" alt="React Hook Form" width={36} height={36} />,
	},
	{
		name: "TypeScript",
		icon: <Image src="/images/techs/typescript-logo.png" alt="TypeScript" width={36} height={36} />,
	},
	{
		name: "React",
		icon: <Image src="/images/techs/react-logo.png" alt="React" width={36} height={36} />,
	},
];

const BuiltWith = () => {
	const params = useParams();
	const lang = (params?.lang as LandingLocale) ?? "en";
	const t = intl("landing", lang);

	return (
		<section className="py-16 lg:py-24">
			<div className="container mx-auto px-4 lg:px-8 text-center">
				<motion.p
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
					className="text-sm text-muted-foreground uppercase tracking-widest mb-8"
				>
					{t.builtWith}
				</motion.p>
				<div className="flex flex-wrap items-center justify-center gap-10 lg:gap-16">
					{techs.map((tech, i) => (
						<motion.div
							key={tech.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.4, delay: i * 0.1 }}
							whileHover={{ y: -4, transition: { duration: 0.2 } }}
							className="flex flex-col items-center gap-2"
						>
							{tech.icon}
							<span className="text-xs text-muted-foreground">{tech.name}</span>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
};

export default BuiltWith;
