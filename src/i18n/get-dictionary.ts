import { DEFAULT_LOCALE, type Locale } from "./config";

export type HighlightMessage = {
  title: string;
  description: string;
};

export type Messages = {
  home: {
    badge: string;
    title: string;
    description: string;
    mission: string;
    cta: string;
    secondaryCta: string;
    panelTitle: string;
    highlights: HighlightMessage[];
    disclaimer: string;
    visionTitle: string;
    visionDescription: string;
  };
};

type DictionaryLoader = () => Promise<Messages>;

const dictionaries: Record<string, DictionaryLoader> = {
  "pt-BR": () => import("./messages/pt-BR.json").then((module) => module.default as Messages),
  en: () => import("./messages/en.json").then((module) => module.default as Messages),
};

export async function getDictionary(locale: Locale = DEFAULT_LOCALE): Promise<Messages> {
  const loadDictionary = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
  return loadDictionary();
}
