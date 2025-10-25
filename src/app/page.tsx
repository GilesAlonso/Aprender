import Link from "next/link";
import { createTranslator } from "next-intl";
import { DEFAULT_LOCALE } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

export default async function HomePage() {
  const messages = await getDictionary(DEFAULT_LOCALE);
  const translator = createTranslator({
    locale: DEFAULT_LOCALE,
    messages,
  });
  const { home } = messages;

  return (
    <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 pb-24 pt-20 sm:pt-24 lg:gap-20 lg:pt-28">
      <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:gap-24">
        <section className="max-w-2xl space-y-6">
          <span className="badge">{home.badge}</span>
          <h1 className="text-balance text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl">
            {home.title}
          </h1>
          <p className="text-lg text-neutral-700 sm:text-xl">{home.description}</p>
          <p className="text-base text-neutral-600 sm:text-lg">{home.mission}</p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="mailto:contato@aprender.education" className="btn-primary">
              {home.cta}
            </Link>
            <Link href="#visao" className="btn-secondary">
              {home.secondaryCta}
            </Link>
          </div>
        </section>

        <aside className="relative mx-auto w-full max-w-md rounded-4xl bg-white/90 p-8 shadow-lg ring-1 ring-primary-100">
          <div
            className="absolute -top-8 right-6 h-20 w-20 animate-float rounded-full bg-primary-100"
            aria-hidden="true"
          />
          <div
            className="absolute bottom-5 -left-5 h-16 w-16 rounded-3xl bg-secondary-100"
            aria-hidden="true"
          />
          <h2 className="text-xl font-semibold text-neutral-900">{home.panelTitle}</h2>
          <ul className="mt-6 space-y-5 text-neutral-700">
            {home.highlights.map((highlight) => (
              <li key={highlight.title} className="flex gap-3">
                <span
                  className="mt-2 inline-flex h-2.5 w-2.5 flex-none rounded-full bg-primary-500"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-semibold text-neutral-900">{highlight.title}</p>
                  <p className="text-sm text-neutral-600">{highlight.description}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 rounded-3xl bg-primary-50 px-4 py-3 text-sm text-primary-700 shadow-inner">
            {home.disclaimer}
          </p>
        </aside>
      </div>

      <section id="visao" className="max-w-3xl space-y-4 border-t border-white/60 pt-8">
        <h2 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">{home.visionTitle}</h2>
        <p className="text-base text-neutral-600 sm:text-lg">{home.visionDescription}</p>
        <p className="text-sm text-neutral-500">
          {translator("home.badge")}
          {" • "}
          {translator("home.cta")}
        </p>
      </section>
    </main>
  );
}
