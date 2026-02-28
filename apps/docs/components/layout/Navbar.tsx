"use client";

import { useState } from "react";
import { NextraSearchDialog } from "@/components/nextra-search-dialog";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { Menu, SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { FC } from "react";
import type { PageItem } from "@/lib/getPagesFromPageMap";

const NAV_LINKS = [
	{ href: "/docs", label: "Documentação" },
	{ href: "/docs/get-started", label: "Começar" },
	{ href: "/examples", label: "Exemplos" },
	{ href: "/playground", label: "Playground" },
] as const;

const GITHUB_URL = "https://github.com";

type Props = {
	pages?: PageItem[];
	/** Placeholder do campo de busca */
	searchPlaceholder?: string;
	className?: string;
};

export const DocsNavbar: FC<Props> = ({
	pages = [],
	searchPlaceholder = "Buscar...",
	className,
}) => {
	const pathname = usePathname();
	const [searchOpen, setSearchOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	return (
		<>
			<header
				role="banner"
				className={cn(
					"sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/80",
					className
				)}
			>
				<div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
					{/* Logo */}
					<Link
						href="/"
						className="flex shrink-0 items-center gap-2 text-gray-900 dark:text-white"
						aria-label="Zormy - Página inicial"
					>
						<img
							src="/images/general/logo.svg"
							alt="Zormy"
							width={100}
							height={20}
							className="h-5 w-auto"
						/>
					</Link>

					{/* Desktop: nav links */}
					<nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
						{NAV_LINKS.map(({ href, label }) => {
							const isActive =
								pathname === href || pathname.startsWith(href + "/");
							return (
								<Link
									key={href}
									href={href}
									className={cn(
										"rounded-md px-3 py-2 text-sm font-medium transition-colors",
										isActive
											? "text-blue-600 dark:text-blue-400"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
									)}
								>
									{label}
								</Link>
							);
						})}
					</nav>

					{/* Right: search, github */}
					<div className="flex shrink-0 items-center gap-2">
						{/* Botão de busca */}
						<button
							type="button"
							onClick={() => setSearchOpen(true)}
							className={cn(
								"inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-600 transition-colors",
								"hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900",
								"dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:hover:text-white",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
							)}
							aria-label="Abrir busca (Ctrl+K)"
						>
							<SearchIcon className="size-4 shrink-0" />
							<span className="hidden sm:inline">{searchPlaceholder}</span>
							<Kbd className="hidden sm:inline-flex">
								<span className="text-xs">⌘</span>K
							</Kbd>
						</button>

						{/* GitHub */}
						<a
							href={GITHUB_URL}
							target="_blank"
							rel="noopener noreferrer"
							className={cn(
								"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 transition-colors",
								"hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
							)}
							aria-label="Abrir repositório no GitHub"
						>
							<svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
								<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
							</svg>
						</a>

						{/* Mobile menu trigger */}
						<button
							type="button"
							onClick={() => setMobileMenuOpen((o) => !o)}
							className={cn(
								"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-600 md:hidden",
								"hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
							)}
							aria-expanded={mobileMenuOpen}
							aria-label="Abrir menu"
						>
							<Menu className="size-5" />
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				{mobileMenuOpen && (
					<div
						className="border-t border-gray-200 dark:border-gray-800 md:hidden"
						role="dialog"
						aria-label="Menu de navegação"
					>
						<nav className="flex flex-col gap-1 px-4 py-3">
							{NAV_LINKS.map(({ href, label }) => (
								<Link
									key={href}
									href={href}
									onClick={() => setMobileMenuOpen(false)}
									className={cn(
										"rounded-md px-3 py-2 text-sm font-medium",
										pathname === href || pathname.startsWith(href + "/")
											? "text-blue-600 dark:text-blue-400 bg-gray-100 dark:bg-gray-800"
											: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
									)}
								>
									{label}
								</Link>
							))}
						</nav>
					</div>
				)}
			</header>

			<NextraSearchDialog
				pages={pages}
				placeholder={searchPlaceholder}
				open={searchOpen}
				onOpenChange={setSearchOpen}
				hideDefaultTrigger
			/>
		</>
	);
};
