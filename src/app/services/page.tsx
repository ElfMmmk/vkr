import Link from "next/link";

import { PageExtraBlocks } from "@/components/page-extra-blocks";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicPage, getPublicServices } from "@/lib/data/public";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatDurationRange, formatPriceRange } from "@/lib/order-calculator";

export default async function ServicesPage() {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const [page, services] = await Promise.all([
    getPublicPage("services", locale),
    getPublicServices(locale)
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="container-shell py-16 md:py-24">
          <SectionHeading title={page.title} description={page.body} />
          <div className="mt-12 divide-y divide-line border-y border-line bg-white">
            {services.map((service, index) => (
              <article
                className="grid gap-6 px-5 py-8 md:grid-cols-[minmax(220px,0.55fr)_minmax(0,1fr)_auto] md:items-center md:px-8"
                key={service.id}
              >
                <div className="min-w-0">
                  <p className="text-sm text-muted">{String(index + 1).padStart(2, "0")}</p>
                  <h2 className="mt-2 text-3xl font-semibold">{service.title}</h2>
                </div>
                <div className="min-w-0 md:pr-6">
                  <p className="text-lg leading-8 text-ink">{service.description}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{service.details}</p>
                  {service.packages.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {service.packages.slice(0, 2).map((item) => (
                        <span
                          className="border border-cobalt/25 bg-cobalt/10 px-3 py-1.5 text-sm font-semibold text-cobalt"
                          key={item.id}
                        >
                          {item.title}: {formatPriceRange(item.priceFrom, item.priceTo, locale)},{" "}
                          {formatDurationRange(item.durationFromDays, item.durationToDays, locale)}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 md:flex-col">
                  <Link
                    className="focus-ring inline-flex min-h-12 min-w-36 items-center justify-center border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
                    data-analytics-cta="true"
                    data-analytics-label={`${service.title}: examples`}
                    href={`/portfolio?service=${service.slug}`}
                  >
                    {dictionary.common.serviceExamples}
                  </Link>
                  <Link
                    className="focus-ring inline-flex min-h-12 min-w-36 items-center justify-center border border-ink bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:border-accent hover:bg-accent active:translate-y-px"
                    data-analytics-cta="true"
                    data-analytics-label={`${service.title}: order`}
                    href={`/order?service=${service.slug}`}
                  >
                    {dictionary.common.order}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
        <PageExtraBlocks blocks={page.blocks} />
      </main>
      <SiteFooter />
    </>
  );
}
