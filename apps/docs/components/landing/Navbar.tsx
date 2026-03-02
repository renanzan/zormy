"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/public/images/general/logo.svg";
import { Github, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NextraSearchDialog } from "../nextra-search-dialog";

import type { FC } from "react";
import type { PageItem } from "@/lib/getPagesFromPageMap";
import { getLandingT } from "@/translations/landing";

const NAV_HREFS = ["/docs", "/docs/get-started", "/examples", "/playground"] as const;
const NAV_KEYS = ["navDocs", "navGetStarted", "navExamples", "navPlayground"] as const;

type Props = {
	lang: string;
	pages: PageItem[];
};

const Navbar: FC<Props> = ({ lang, pages }) => {
	const pathname = usePathname();
	const [searchOpen, setSearchOpen] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const base = `/${lang}`;
	const t = getLandingT(lang);

	// Fecha o menu ao mudar de rota (navegação)
	useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

	// Fecha o menu ao redimensionar para desktop e evita scroll no body quando aberto
	useEffect(() => {
		const mq = window.matchMedia("(min-width: 768px)");
		const handler = () => {
			if (mq.matches) setMenuOpen(false);
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	useEffect(() => {
		if (menuOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [menuOpen]);

	const closeMenu = () => setMenuOpen(false);

	const navLinks = (
		<>
			{NAV_HREFS.map((href, i) => {
				const fullHref = `${base}${href}`;
				const isActive = pathname === fullHref || pathname.startsWith(fullHref + "/");
				const label = t[NAV_KEYS[i]];

				return (
					<Link
						key={href}
						href={fullHref}
						onClick={closeMenu}
						className={cn(
							"text-sm transition-colors py-2 md:py-0",
							isActive
								? "text-blue-600 dark:text-blue-400 font-medium"
								: "text-muted-foreground hover:text-foreground dark:text-gray-400 dark:hover:text-white"
						)}
					>
						{label}
					</Link>
				);
			})}
		</>
	);

	return (
		<>
			<header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
				<nav
					className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 lg:px-8"
					aria-label="Principal"
				>
					<Link href={base} className="flex items-center gap-2.5" onClick={closeMenu}>
						<Logo className="h-6 w-auto shrink-0 text-foreground" />
						<span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
							Zormy
						</span>
					</Link>

					{/* Desktop: links inline */}
					<div className="hidden md:flex items-center gap-6">{navLinks}</div>

					{/* Desktop: search + GitHub */}
					<div className="hidden md:flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							className="items-center gap-2 text-muted-foreground border-border/60 bg-secondary/50 hover:bg-secondary"
							onClick={() => setSearchOpen(true)}
						>
							<Search className="h-3.5 w-3.5" />
							<span className="text-xs">{t.navSearchPlaceholder}</span>
							<kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
								⌘K
							</kbd>
						</Button>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							aria-label="GitHub"
						>
							<Github className="h-5 w-5" />
						</a>
					</div>

					{/* Mobile: search icon + GitHub + hamburger */}
					<div className="flex md:hidden items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							className="size-9 text-muted-foreground"
							onClick={() => setSearchOpen(true)}
							aria-label={t.navSearchPlaceholder}
						>
							<Search className="h-5 w-5" />
						</Button>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md"
							aria-label="GitHub"
						>
							<Github className="h-5 w-5" />
						</a>
						<Button
							variant="ghost"
							size="icon"
							className="size-9 text-foreground"
							onClick={() => setMenuOpen((o) => !o)}
							aria-expanded={menuOpen}
							aria-controls="navbar-mobile-menu"
							aria-label={menuOpen ? t.navMenuClose : t.navMenuOpen}
						>
							{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>
					</div>
				</nav>
			</header>

			{/* Overlay para fechar ao clicar fora (mobile) — atrás do menu, atrás do header */}
			{menuOpen && (
				<button
					type="button"
					className="md:hidden fixed inset-0 z-[45] bg-black/30 backdrop-blur-[2px]"
					aria-label={t.navMenuClose}
					onClick={closeMenu}
				/>
			)}

			{/* Mobile: menu colapsável — fora do header para fixed funcionar em relação à viewport */}
			<div
				id="navbar-mobile-menu"
				role="dialog"
				aria-modal="true"
				aria-label="Menu de navegação"
				className={cn(
					"md:hidden fixed inset-x-0 top-14 sm:top-16 bottom-0 z-[50] bg-background border-t border-border/40 shadow-lg",
					"overflow-y-auto transition-[visibility,opacity,transform] duration-200 ease-out",
					menuOpen
						? "visible opacity-100 translate-y-0"
						: "invisible opacity-0 translate-y-2 pointer-events-none"
				)}
			>
				<div className="container mx-auto px-4 py-6 flex flex-col gap-1">
					{navLinks}
					<div className="border-t border-border/40 pt-4 mt-2 flex flex-col gap-2">
						<Button
							variant="outline"
							size="sm"
							className="w-full justify-start gap-2 text-muted-foreground border-border/60 bg-secondary/50 hover:bg-secondary"
							onClick={() => {
								setSearchOpen(true);
								closeMenu();
							}}
						>
							<Search className="h-4 w-4" />
							{t.navSearchPlaceholder}
						</Button>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							onClick={closeMenu}
							className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
						>
							<Github className="h-4 w-4" />
							GitHub
						</a>
					</div>
				</div>
			</div>

			<NextraSearchDialog
				pages={pages}
				placeholder={t.navSearchPlaceholder}
				open={searchOpen}
				onOpenChange={setSearchOpen}
				hideDefaultTrigger
			/>
		</>
	);
};

export default Navbar;
