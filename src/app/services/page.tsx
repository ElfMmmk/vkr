import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicPage, getPublicServices } from "@/lib/data/public";

export default async function ServicesPage() {
  const [page, services] = await Promise.all([
    getPublicPage("services"),
    getPublicServices()
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-shell py-16 md:py-24">
        <SectionHeading title={page.title} description={page.body} />
        <div className="mt-12 divide-y divide-line border-y border-line bg-white">
          {services.map((service) => (
            <article
              className="grid gap-6 px-5 py-8 md:grid-cols-[minmax(220px,0.65fr)_minmax(0,1fr)_auto] md:items-center md:px-8"
              key={service.id}
            >
              <div className="min-w-0">
                <p className="text-sm text-muted">0{service.displayOrder / 10}</p>
                <h2 className="mt-2 text-3xl font-semibold">{service.title}</h2>
              </div>
              <div className="min-w-0 md:pr-6">
                <p className="text-lg leading-8 text-ink">{service.description}</p>
                <p className="mt-3 text-sm leading-6 text-muted">{service.details}</p>
              </div>
              <Link
                className="focus-ring inline-flex min-h-12 min-w-28 items-center justify-center self-start border border-line bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-ink md:self-center"
                href={`/portfolio?service=${service.slug}`}
              >
                Работы
              </Link>
            </article>
          ))}
        </div>
        <div className="mt-12">
          <ButtonLink href="/order">Оставить заявку</ButtonLink>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
