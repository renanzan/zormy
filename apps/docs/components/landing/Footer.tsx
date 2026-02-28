import { motion } from "framer-motion";
import { Github } from "lucide-react";
import Image from "next/image";

const Footer = () => {
	return (
		<motion.footer
			initial={{ opacity: 0 }}
			whileInView={{ opacity: 1 }}
			viewport={{ once: true }}
			transition={{ duration: 0.5 }}
			className="border-t border-border/40 py-8"
		>
			<div className="container mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<Image
						src="/images/general/logo.svg"
						alt="Zormy"
						width={20}
						height={20}
						className="h-5 w-5"
					/>
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} Zormy. Open source under MIT.
					</p>
				</div>
				<div className="flex items-center gap-4">
					<a
						href="https://github.com"
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						<Github className="h-4 w-4" />
					</a>
				</div>
			</div>
		</motion.footer>
	);
};

export default Footer;
