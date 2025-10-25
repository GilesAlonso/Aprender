import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { Baloo_2, Nunito } from "next/font/google";
import clsx from "clsx";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const baloo = Baloo_2({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Aprender | Educação personalizada com IA",
    template: "%s | Aprender",
  },
  description:
    "Aprender é uma plataforma educacional em português que utiliza inteligência artificial para criar jornadas de estudo alinhadas à BNCC, com o apoio de educadores, famílias e especialistas.",
  keywords: [
    "Aprender",
    "BNCC",
    "educação infantil",
    "inteligência artificial",
    "plataforma educacional",
  ],
  authors: [{ name: "Equipe Aprender" }],
  openGraph: {
    title: "Aprender | Educação personalizada com IA",
    description:
      "Descubra como a Aprender utiliza inteligência artificial para apoiar estudantes brasileiros com trilhas alinhadas à BNCC e experiências acolhedoras.",
    locale: "pt_BR",
    siteName: "Aprender",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aprender | Educação personalizada com IA",
    description:
      "Um ambiente de aprendizagem em português com inteligência artificial, preparado para apoiar estudantes, famílias e educadores.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getDictionary(DEFAULT_LOCALE);
  const currentYear = new Date().getFullYear();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={clsx(
          "relative min-h-screen bg-neutral-50 text-neutral-900 antialiased",
          nunito.variable,
          baloo.variable,
          "font-sans"
        )}
      >
        <NextIntlClientProvider locale={DEFAULT_LOCALE} messages={messages}>
          <div className="relative min-h-screen overflow-hidden bg-soft-grid bg-[length:56px_56px]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-radial-sunrise opacity-70"
            />
            <div className="relative isolate flex min-h-screen flex-col">
              {children}
              <footer className="mt-24 border-t border-white/40 bg-white/70 px-6 py-6 text-center text-sm text-neutral-500 backdrop-blur">
                © {currentYear} Aprender. Construindo futuros com educação, tecnologia e afeto.
              </footer>
            </div>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
