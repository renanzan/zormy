interface TechIconProps {
	className?: string;
}

export function TypeScriptIcon({ className = "w-6 h-6" }: TechIconProps) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect width="24" height="24" rx="5" fill="#3178C6" />
			<path
				d="M1.125 0C.502 0 0 .502 0 1.125v21.75C0 23.498.502 24 1.125 24h21.75c.623 0 1.125-.502 1.125-1.125V1.125C24 .502 23.498 0 22.875 0zm17.363 9.75c.612 0 1.154.037 1.627.111a6.38 6.38 0 0 1 1.306.34v2.458a3.95 3.95 0 0 0-.643-.361 5.093 5.093 0 0 0-.717-.26 5.453 5.453 0 0 0-1.426-.2c-.3 0-.573.028-.819.086a2.1 2.1 0 0 0-.623.242c-.17.104-.3.229-.393.374a.888.888 0 0 0-.14.49c0 .196.053.373.156.529.104.156.252.304.443.444s.423.276.696.41c.273.135.582.274.926.416.47.197.892.407 1.266.628.374.222.695.473.963.753.268.279.472.598.614.957.142.359.214.776.214 1.253 0 .657-.125 1.21-.373 1.656a3.033 3.033 0 0 1-1.012 1.085 4.38 4.38 0 0 1-1.487.596c-.566.12-1.163.18-1.79.18a9.916 9.916 0 0 1-1.84-.164 5.544 5.544 0 0 1-1.512-.493v-2.63a5.033 5.033 0 0 0 3.237 1.2c.333 0 .624-.03.872-.09.249-.06.456-.144.623-.25.166-.108.29-.234.373-.38a1.023 1.023 0 0 0-.074-1.089 2.12 2.12 0 0 0-.537-.5 5.597 5.597 0 0 0-.807-.444 7.305 7.305 0 0 0-1.007-.436c-.918-.383-1.602-.877-2.053-1.482-.45-.605-.676-1.38-.676-2.325 0-.614.123-1.141.369-1.582.246-.441.58-.804 1.004-1.089a4.494 4.494 0 0 1 1.47-.629 5.933 5.933 0 0 1 1.77-.257zm-15.113.188h9.563v2.166H9.506v9.646H6.789v-9.646H3.375z"
				fill="white"
			/>
		</svg>
	);
}

export function ReactIcon({ className = "w-6 h-6" }: TechIconProps) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<circle cx="12" cy="12" r="2.5" fill="#61DAFB" />
			<ellipse
				cx="12"
				cy="12"
				rx="11"
				ry="4.2"
				stroke="#61DAFB"
				strokeWidth="1.5"
				fill="none"
				opacity="0.4"
			/>
			<ellipse
				cx="12"
				cy="12"
				rx="11"
				ry="4.2"
				stroke="#61DAFB"
				strokeWidth="1.5"
				fill="none"
				opacity="0.4"
				transform="rotate(60 12 12)"
			/>
			<ellipse
				cx="12"
				cy="12"
				rx="11"
				ry="4.2"
				stroke="#61DAFB"
				strokeWidth="1.5"
				fill="none"
				opacity="0.4"
				transform="rotate(-60 12 12)"
			/>
		</svg>
	);
}

export function ZodIcon({ className = "w-6 h-6" }: TechIconProps) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect width="24" height="24" rx="5" fill="#3E63DD" />
			<path
				d="M12 3L4 7.5v9L12 21l8-4.5v-9L12 3zm0 2.25l5.5 3.093v5.814L12 17.25l-5.5-3.093V8.343L12 5.25z"
				fill="white"
			/>
			<path
				d="M12 10.5L7.5 8.343v5.814L12 16.5l4.5-2.343V8.343L12 10.5z"
				fill="white"
				opacity="0.6"
			/>
		</svg>
	);
}

export function ReactHookFormIcon({ className = "w-6 h-6" }: TechIconProps) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect width="24" height="24" rx="5" fill="#EC5990" />
			<path
				d="M12 3L6 6.75v10.5L12 21l6-3.75V6.75L12 3zm0 2.625l4.125 2.578v5.194L12 16.125l-4.125-2.728V8.203L12 5.625z"
				fill="white"
			/>
			<circle cx="12" cy="12" r="2.5" fill="white" opacity="0.9" />
		</svg>
	);
}

export function NextJSIcon({ className = "w-6 h-6" }: TechIconProps) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
			<rect
				width="24"
				height="24"
				rx="5"
				fill="currentColor"
				className="text-black dark:text-white"
			/>
			<path
				d="M11.5715 13.1818L20.4165 4H18.9382L11.5715 12.0852L4.20482 4H2.72656L11.5715 13.1818ZM11.5715 14.4545L2.72656 23.6364H4.20482L11.5715 15.5513L18.9382 23.6364H20.4165L11.5715 14.4545Z"
				fill="currentColor"
				className="text-white dark:text-black"
			/>
		</svg>
	);
}
