import { motion } from "framer-motion";

const ZormyLogo = ({ size = 32, animated = true }: { size?: number; animated?: boolean }) => {
	const Wrapper = animated ? motion.div : "div";
	const wrapperProps = animated
		? {
				whileHover: { scale: 1.05 },
				transition: { type: "spring", stiffness: 400, damping: 15 },
			}
		: {};

	return (
		<Wrapper {...(wrapperProps as any)} className="inline-flex items-center gap-2">
			<svg
				width={size}
				height={size}
				viewBox="0 0 40 40"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<linearGradient
						id="zormy-bg"
						x1="0"
						y1="0"
						x2="40"
						y2="40"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="hsl(217 91% 60%)" />
						<stop offset="1" stopColor="hsl(260 70% 58%)" />
					</linearGradient>
					<linearGradient
						id="zormy-z"
						x1="10"
						y1="10"
						x2="30"
						y2="30"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="hsl(222 47% 6%)" />
						<stop offset="1" stopColor="hsl(222 47% 10%)" />
					</linearGradient>
					<filter id="zormy-glow">
						<feGaussianBlur stdDeviation="2" result="blur" />
						<feMerge>
							<feMergeNode in="blur" />
							<feMergeNode in="SourceGraphic" />
						</feMerge>
					</filter>
				</defs>

				{/* Background rounded square */}
				<rect width="40" height="40" rx="10" fill="url(#zormy-bg)" />

				{/* Inner subtle border */}
				<rect
					x="1"
					y="1"
					width="38"
					height="38"
					rx="9"
					fill="none"
					stroke="white"
					strokeOpacity="0.15"
					strokeWidth="0.5"
				/>

				{/* Z letter - bold geometric */}
				<path
					d="M12 12H28L16 28H28"
					stroke="url(#zormy-z)"
					strokeWidth="3.5"
					strokeLinecap="round"
					strokeLinejoin="round"
					filter="url(#zormy-glow)"
				/>

				{/* Accent dots */}
				<circle cx="12" cy="28" r="1.5" fill="hsl(222 47% 6%)" opacity="0.6" />
				<circle cx="28" cy="12" r="1.5" fill="hsl(222 47% 6%)" opacity="0.6" />

				{/* Shine overlay */}
				<rect width="40" height="20" rx="10" fill="white" opacity="0.06" />
			</svg>
		</Wrapper>
	);
};

export default ZormyLogo;
