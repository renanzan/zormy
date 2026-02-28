"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Github, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NextraSearchDialog } from "../nextra-search-dialog";

import type { FC } from "react";
import type { PageItem } from "@/lib/getPagesFromPageMap";

const NAV_LINKS = [
	{ href: "/docs", label: "Documentação" },
	{ href: "/docs/get-started", label: "Começar" },
	{ href: "/examples", label: "Exemplos" },
	{ href: "/playground", label: "Playground" },
] as const;

type Props = {
	lang: string;
	pages: PageItem[];
};

const Navbar: FC<Props> = ({ lang, pages }) => {
	const pathname = usePathname();
	const [searchOpen, setSearchOpen] = useState(false);
	const base = `/${lang}`;

	return (
		<>
			<header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
				<nav className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
					<Link href={base} className="flex items-center gap-2.5">
						<Image
							src="/images/general/logo.svg"
							alt="Zormy"
							height={16}
							width={16}
							className="w-4 h-4"
						/>

						<span className="text-2xl font-bold tracking-tight text-foreground">Zormy</span>
					</Link>

					<div className="hidden md:flex items-center gap-6">
						{NAV_LINKS.map(({ href, label }) => {
							const fullHref = href === "/" ? base : `${base}${href}`;
							const isActive = pathname === fullHref || pathname.startsWith(fullHref + "/");

							return (
								<Link
									key={href}
									href={fullHref}
									className={cn(
										"text-sm text-muted-foreground hover:text-foreground transition-colors",
										isActive
											? "text-blue-600 dark:text-blue-400"
											: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
									)}
								>
									{label}
								</Link>
							);
						})}
					</div>

					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							className="hidden sm:flex items-center gap-2 text-muted-foreground border-border/60 bg-secondary/50 hover:bg-secondary"
							onClick={() => setSearchOpen(true)}
						>
							<Search className="h-3.5 w-3.5" />
							<span className="text-xs">Buscar...</span>
							<kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
								⌘K
							</kbd>
						</Button>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
						>
							<Github className="h-5 w-5" />
						</a>
					</div>
				</nav>
			</header>

			<NextraSearchDialog
				pages={pages}
				placeholder="Buscar..."
				open={searchOpen}
				onOpenChange={setSearchOpen}
				hideDefaultTrigger
			/>
		</>
	);
};

export default Navbar;
