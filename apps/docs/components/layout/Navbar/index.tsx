/**
 * @see https://github.com/shuding/nextra/blob/main/packages/nextra-theme-docs/src/components/navbar/index.tsx
 */

import Logo from "@/public/images/general/logo.svg";
import cn from "clsx";
import NextLink from "next/link";
import { Anchor } from "nextra/components";
import { GitHubIcon } from "nextra/icons";

import { ClientNavbar } from "./index.client";

import type { FC } from "react";
import type { LandingLocale } from "@/translations";

type NavbarProps = {
	lang: LandingLocale;
	className?: string;
};

const logoLink = "/";
const logo = (
	<div className="flex items-center gap-2">
		<Logo className="h-6 w-auto shrink-0 text-foreground" />

		<span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Zormy</span>
	</div>
);

export const Navbar: FC<NavbarProps> = (props) => {
	const { lang, className } = props;

	const logoClass = cn(
		"x:flex x:items-center"
		// align === "left" ? "x:max-md:me-auto" : "x:me-auto"
	);
	return (
		<header
			className={cn(
				"glass border-b border-border/40",
				"x:sticky x:top-0 x:z-30 x:w-full x:bg-transparent x:print:hidden",
				"x:max-md:[.nextra-banner:not([class$=hidden])~&]:top-(--nextra-banner-height)"
			)}
		>
			<div
				className={cn(
					"nextra-navbar-blur",
					"x:absolute x:-z-1 x:size-full",
					"nextra-border x:border-b",
					"x:backdrop-blur-md x:bg-nextra-bg/70"
				)}
			/>
			<nav
				style={{ height: "var(--nextra-navbar-height)" }}
				className={cn(
					"x:mx-auto x:flex x:max-w-(--nextra-content-width) x:items-center x:gap-4 x:pl-[max(env(safe-area-inset-left),1.5rem)] x:pr-[max(env(safe-area-inset-right),1.5rem)]",
					"x:justify-end",
					className
				)}
			>
				{logoLink ? (
					<NextLink
						href={typeof logoLink === "string" ? logoLink : "/"}
						className={cn(
							logoClass,
							"x:transition-opacity x:focus-visible:nextra-focus x:hover:opacity-75",
							"me-auto"
						)}
						aria-label="Home page"
					>
						{logo}
					</NextLink>
				) : (
					<div className={logoClass}>{logo}</div>
				)}

				<ClientNavbar className="me-auto">
					<Anchor href="https://github.com/renanzan/zormy">
						<GitHubIcon height="24" aria-label="Project repository" />
					</Anchor>
				</ClientNavbar>
			</nav>
		</header>
	);
};
