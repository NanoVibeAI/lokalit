import type { Metadata } from "next";
import Link from "next/link";
import homeContent from "@/content/home.json";
import type { HomePageContent } from "@/types/home";

const content = homeContent as HomePageContent;

export const metadata: Metadata = {
  title: content.seo.title,
  description: content.seo.description,
  keywords: content.seo.keywords,
  openGraph: {
    title: content.seo.title,
    description: content.seo.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: content.seo.title,
    description: content.seo.description,
  },
};

export default function RootPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(60%_50%_at_50%_0%,rgba(0,245,160,0.14),transparent_70%)]">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
        <section className="rounded-3xl border border-spring-green-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm lg:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-spring-green-700">
            {content.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            {content.hero.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            {content.hero.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={content.hero.primaryCta.href}
              className="inline-flex items-center rounded-xl bg-spring-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-spring-green-700"
            >
              {content.hero.primaryCta.label}
            </Link>
            {content.hero.secondaryCta?.label && (
              <Link
                href={content.hero.secondaryCta.href}
                className="inline-flex items-center rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                {content.hero.secondaryCta.label}
              </Link>
            )}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">
            {content.howItWorks.title}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {content.howItWorks.steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-border bg-card p-6">
                <p className="text-sm font-semibold text-spring-green-700">0{index + 1}</p>
                <h3 className="mt-2 text-lg font-semibold text-card-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">{content.faq.title}</h2>
          <div className="mt-6 space-y-3">
            {content.faq.items.map((item) => (
              <details key={item.question} className="rounded-xl border border-border bg-card p-5">
                <summary className="cursor-pointer list-none text-base font-semibold text-card-foreground">
                  {item.question}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
