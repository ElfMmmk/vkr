import Link from "next/link";

import { PortfolioSortSelect } from "@/components/portfolio-sort-select";
import { ProjectCard } from "@/components/project-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicProjects, getPublicServices, getPublicTags } from "@/lib/data/public";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

type PortfolioPageProps = {
  searchParams: Promise<{
    service?: string | string[];
    tag?: string | string[];
    sort?: string;
  }>;
};

type PortfolioSort = "default" | "newest" | "oldest";

function toList(value?: string | string[]): string[] {
  if (!value) {
    return [];
  }

  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function toggleValue(values: string[], value: string): string[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function portfolioHref(params: {
  services?: string[];
  tags?: string[];
  sort?: PortfolioSort;
}) {
  const search = new URLSearchParams();

  for (const service of params.services ?? []) {
    search.append("service", service);
  }

  for (const tag of params.tags ?? []) {
    search.append("tag", tag);
  }

  if (params.sort && params.sort !== "default") {
    search.set("sort", params.sort);
  }

  const query = search.toString();

  return query ? `/portfolio?${query}` : "/portfolio";
}

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const params = await searchParams;
  const selectedServices = toList(params.service);
  const selectedTags = toList(params.tag);
  const sort: PortfolioSort =
    params.sort === "oldest" ? "oldest" : params.sort === "newest" ? "newest" : "default";
  const hasActiveFilter = Boolean(selectedServices.length || selectedTags.length);
  const hasCustomState = hasActiveFilter || sort !== "default";
  const [services, tags, projects] = await Promise.all([
    getPublicServices(locale),
    getPublicTags(locale),
    getPublicProjects({ services: selectedServices, tags: selectedTags, sort }, locale)
  ]);
  const selectedServiceItems = services.filter((service) => selectedServices.includes(service.slug));
  const selectedTagItems = tags.filter((tag) => selectedTags.includes(tag.slug));

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell py-16 md:py-24">
        <SectionHeading
          title={dictionary.common.portfolio}
          description={
            locale === "en"
              ? "Filter cases by several services and tags. Items inside one group work as OR, while services and tags are combined as AND."
              : "Кейсы можно отфильтровать по нескольким услугам и тегам. Внутри одной группы выбранные пункты работают как «или», между услугами и тегами — как «и»."
          }
        />
        <div className="mt-10 border-y border-line py-6">
          <div className="grid gap-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {locale === "en" ? "By services" : "По услугам"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={`focus-ring inline-flex min-h-10 items-center border px-3 py-2 text-sm font-semibold transition hover:border-ink active:translate-y-px ${
                    !selectedServices.length ? "border-ink bg-ink text-white" : "border-line bg-white"
                  }`}
                  href={portfolioHref({ tags: selectedTags, sort })}
                >
                  {dictionary.common.allServices}
                </Link>
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.slug);

                  return (
                    <Link
                      className={`focus-ring inline-flex min-h-10 items-center border px-3 py-2 text-sm font-semibold transition hover:border-ink active:translate-y-px ${
                        isSelected ? "border-ink bg-ink text-white" : "border-line bg-white hover:bg-paper"
                      }`}
                      href={portfolioHref({
                        services: toggleValue(selectedServices, service.slug),
                        tags: selectedTags,
                        sort
                      })}
                      key={service.id}
                    >
                      {service.title}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {locale === "en" ? "By tags" : "По тегам"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={`focus-ring inline-flex min-h-10 items-center border px-3 py-2 text-sm font-semibold transition hover:border-cobalt active:translate-y-px ${
                    !selectedTags.length ? "border-cobalt bg-cobalt text-white" : "border-line bg-white text-muted hover:bg-paper hover:text-ink"
                  }`}
                  href={portfolioHref({ services: selectedServices, sort })}
                >
                  {dictionary.common.allTags}
                </Link>
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.slug);

                  return (
                    <Link
                      className={`focus-ring inline-flex min-h-10 items-center border px-3 py-2 text-sm transition active:translate-y-px ${
                        isSelected
                          ? "border-cobalt bg-cobalt text-white"
                          : "border-line bg-white text-muted hover:border-cobalt hover:bg-cobalt/10 hover:text-cobalt"
                      }`}
                      href={portfolioHref({
                        services: selectedServices,
                        tags: toggleValue(selectedTags, tag.slug),
                        sort
                      })}
                      key={tag.id}
                    >
                      #{tag.title}
                    </Link>
                  );
                })}
              </div>
            </div>
            {hasActiveFilter ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  {dictionary.common.selected}
                </span>
                {selectedServiceItems.map((service) => (
                  <Link
                    className="focus-ring inline-flex min-h-9 items-center gap-2 border border-ink bg-ink px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent active:translate-y-px"
                    href={portfolioHref({
                      services: selectedServices.filter((item) => item !== service.slug),
                      tags: selectedTags,
                      sort
                    })}
                    key={service.id}
                  >
                    {service.title}
                    <span aria-hidden="true">×</span>
                  </Link>
                ))}
                {selectedTagItems.map((tag) => (
                  <Link
                    className="focus-ring inline-flex min-h-9 items-center gap-2 border border-cobalt bg-cobalt px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-ink active:translate-y-px"
                    href={portfolioHref({
                      services: selectedServices,
                      tags: selectedTags.filter((item) => item !== tag.slug),
                      sort
                    })}
                    key={tag.id}
                  >
                    #{tag.title}
                    <span aria-hidden="true">×</span>
                  </Link>
                ))}
                <Link
                  className="focus-ring inline-flex min-h-9 items-center border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
                  href={portfolioHref({ sort })}
                >
                  {dictionary.common.resetFilters}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-ink">
              {dictionary.common.projectCount}: {projects.length}
            </p>
            {hasCustomState ? (
              <Link className="focus-ring mt-2 inline-flex text-sm font-semibold text-accent hover:text-ink" href="/portfolio">
                {dictionary.common.resetAll}
              </Link>
            ) : null}
          </div>
          <PortfolioSortSelect
            currentSort={sort}
            selectedServices={selectedServices}
            selectedTags={selectedTags}
          />
        </div>
        {projects.length ? (
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} priority={index < 3} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-12 border border-line bg-white p-10 text-center">
            <h2 className="text-2xl font-semibold">{dictionary.common.emptyProjectsTitle}</h2>
            <p className="mt-3 text-muted">{dictionary.common.emptyProjectsText}</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
