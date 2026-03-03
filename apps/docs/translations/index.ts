import * as landingI18n from "./landing";
import * as metaI18n from "./meta";
import * as nextraThemeDocsI18n from "./nextra-theme-docs";

export type LandingLocale = "en" | "pt-BR";

const translations = {
	[landingI18n.key]: landingI18n.i18n,
	[metaI18n.key]: metaI18n.i18n,
	[nextraThemeDocsI18n.key]: nextraThemeDocsI18n.i18n,
};

type Translations = {
	[K in keyof typeof translations]: (typeof translations)[K]["en"];
};

export function intl<T extends keyof typeof translations>(messages: T, lang: LandingLocale) {
	return (translations[messages][lang as LandingLocale] ??
		translations[messages]["en"]) as Translations[T];
}
