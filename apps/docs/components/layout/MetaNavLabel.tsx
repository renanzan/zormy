"use client";

import { intl } from "@/translations";
import {
	BookOpen,
	Box,
	Code,
	Download,
	FileCheck,
	FileStack,
	GitBranch,
	Layers,
	Lightbulb,
	Rocket,
} from "lucide-react";
import { useParams } from "next/navigation";

import type { i18n as metaI18n } from "@/translations/meta";

const iconClass = "size-4 shrink-0";

const ICONS: Record<
	string,
	React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
> = {
	BookOpen,
	Rocket,
	Download,
	Box,
	FileStack,
	GitBranch,
	FileCheck,
	Layers,
	Lightbulb,
	Code,
};

type MetaMessageKey = keyof typeof metaI18n.en;
type IconName = keyof typeof ICONS;

export function MetaNavLabel({
	messageKey,
	iconName,
}: {
	messageKey: MetaMessageKey;
	iconName?: IconName;
}) {
	const params = useParams();
	const lang = (params?.lang as "en" | "pt-BR") ?? "pt-BR";
	const label = intl("meta", lang)[messageKey];
	const Icon = iconName ? ICONS[iconName] : null;

	if (Icon) {
		return (
			<span className="flex items-center gap-2">
				<Icon className={iconClass} aria-hidden />
				{label}
			</span>
		);
	}
	return <>{label}</>;
}
