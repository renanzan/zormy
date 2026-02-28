import Link from "next/link";

import { cn } from "../lib/utils";

import type { ReactNode } from "react";

interface BeautifulCardProps {
	title?: string;
	href?: string;
	children?: ReactNode;
	/** Ícone exibido acima do título (ex.: componente Lucide) */
	icon?: ReactNode;
}

function BeautifulCard({
	title,
	href,
	children,
	icon,
	...props
}: BeautifulCardProps & Record<string, any>) {
	// Handle both direct usage and Nextra's Card component structure
	const cardTitle = title || props.title;
	const cardHref = href || props.href;
	const cardChildren = children || props.children;
	const cardIcon = icon ?? props.icon;

	const cardContent = (
		<div className="group relative h-full overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 dark:border-gray-800 dark:bg-gray-800 dark:hover:border-blue-400 dark:hover:shadow-blue-400/20">
			<div className="space-y-3">
				{cardIcon && (
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 [&>svg]:size-5">
						{cardIcon}
					</div>
				)}
				{cardTitle && (
					<h3 className="text-lg font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
						{cardTitle}
					</h3>
				)}
				{cardChildren && (
					<p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{cardChildren}</p>
				)}
			</div>
			{/* Decorative gradient on hover */}
			<div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50/0 via-blue-50/0 to-blue-50/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-blue-950/0 dark:via-blue-950/0 dark:to-blue-950/0 dark:group-hover:from-blue-950/20 dark:group-hover:via-blue-950/10 dark:group-hover:to-blue-950/20" />
		</div>
	);

	if (cardHref) {
		return (
			<Link href={cardHref} className="block no-underline text-inherit">
				{cardContent}
			</Link>
		);
	}

	return cardContent;
}

interface BeautifulCardsProps {
	children: ReactNode;
	cols?: 1 | 2 | 3 | 4;
}

export function BeautifulCards({
	children,
	cols = 3,
	...props
}: BeautifulCardsProps & Record<string, any>) {
	const gridCols = {
		1: "grid-cols-1",
		2: "sm:grid-cols-2",
		3: "sm:grid-cols-2 lg:grid-cols-3",
		4: "sm:grid-cols-2 lg:grid-cols-4",
	}[cols];

	// Ensure children is an array and filter out null/undefined
	const childrenArray = Array.isArray(children)
		? children.filter(Boolean)
		: children
			? [children]
			: [];

	return (
		<div className={cn("my-8 grid grid-cols-1 gap-4", gridCols)} {...props}>
			{childrenArray}
		</div>
	);
}

BeautifulCards.Card = BeautifulCard;

export { BeautifulCards as Cards };
