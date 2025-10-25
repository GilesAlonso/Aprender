export const SUPPORTED_LOCALES = ["pt-BR"] as const;
export const DEFAULT_LOCALE = "pt-BR" as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
};
