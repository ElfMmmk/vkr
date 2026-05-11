import Link from "next/link";

import { ProjectCard } from "@/components/project-card";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicProjects, getPublicServices, getPublicTags } from "@/lib/data/public";

type PortfolioPageProps = {
  searchParams: Promise<{
    service?: string;
    tag?: string;
    sort?: string;
  }>;
};

function portfolioHref(params: { service?: string; tag?: string; sort?: string }) {
  const search = new URLSearchParams();

  if (params.service) {
    search.set("service", params.service);
  }

  if (params.tag) {
    search.set("tag", params.tag);
  }

  if (params.sort && params.sort !== "newest") {
    search.set("sort", params.sort);
  }

  const query = search.toString();

  return query ? `/portfolio?${query}` : "/portfolio";
}

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  const params = await searchParams;
  const sort = params.sort === "oldest" ? "oldest" : "newest";
  const hasActiveFilter = Boolean(params.service || params.tag);
  const [services, tags, projects] = await Promise.all([
    getPublicServices(),
    getPublicTags(),
    getPublicProjects({ service: params.service, tag: params.tag, sort })
  ]);
  const selectedService = services.find((service) => service.slug === params.service);
  const selectedTag = tags.find((tag) => tag.slug === params.tag);

  return (
    <>
      <SiteHeader />
      <main className="container-shell py-16 md:py-24">
        <SectionHeading
          title="Портфолио"
          description="Кейсы сгруппированы по услугам и тегам, чтобы быстрее найти близкую задачу и перейти к заявке"
        />
        <div className="mt-10 border-y border-line py-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              Фильтры проектов
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                className={`focus-ring inline-flex min-h-10 items-center justify-center border px-4 py-2 text-sm font-semibold transition hover:border-ink active:translate-y-px ${
                  sort === "newest" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-paper"
                }`}
                href={portfolioHref({ service: params.service, tag: params.tag, sort: "newest" })}
              >
                Сначала новые
              </Link>
              <Link
                className={`focus-ring inline-flex min-h-10 items-center justify-center border px-4 py-2 text-sm font-semibold transition hover:border-ink active:translate-y-px ${
                  sort === "oldest" ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:bg-paper"
                }`}
                href={portfolioHref({ service: params.service, tag: params.tag, sort: "oldest" })}
              >
                Сначала старые
              </Link>
            </div>
          </div>
          <div className="grid gap-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                По услугам
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={`focus-ring inline-flex min-h-10 items-center border px-3 py-2 text-sm font-semibold transition hover:border-ink active:translate-y-px ${
                    !params.service ? "border-ink bg-ink text-white" : "border-line bg-white"
                  }`}
                  href={portfolioHref({ tag: params.tag, sort })}
                >
                  Все услуги
                </Link>
                {services.map((service) => (
                  <Link
                    className={`focus-ring inline-flex min-h-10 items-center border px-3 py-2 text-sm font-semibold transition hover:border-ink active:translate-y-px ${
                      params.service === service.slug
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white"
                    }`}
                    href={portfolioHref({ service: service.slug, tag: params.tag, sort })}
                    key={service.id}
                  >
                    {service.title}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                По тегам
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Link
                    className={`focus-ring inline-flex min-h-10 items-center border px-3 py-2 text-sm text-muted transition hover:border-ink hover:text-ink active:translate-y-px ${
                      params.tag === tag.slug
                        ? "border-cobalt bg-cobalt text-white"
                        : "border-line bg-white"
                    }`}
                    href={portfolioHref({ service: params.service, tag: tag.slug, sort })}
                    key={tag.id}
                  >
                    #{tag.title}
                  </Link>
                ))}
              </div>
            </div>
            {hasActiveFilter ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  Выбрано
                </span>
                {selectedService ? (
                  <Link
                    className="focus-ring inline-flex min-h-9 items-center gap-2 border border-ink bg-ink px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-accent active:translate-y-px"
                    href={portfolioHref({ tag: params.tag, sort })}
                  >
                    {selectedService.title}
                    <span aria-hidden="true">×</span>
                  </Link>
                ) : null}
                {selectedTag ? (
                  <Link
                    className="focus-ring inline-flex min-h-9 items-center gap-2 border border-cobalt bg-cobalt px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-ink active:translate-y-px"
                    href={portfolioHref({ service: params.service, sort })}
                  >
                    #{selectedTag.title}
                    <span aria-hidden="true">×</span>
                  </Link>
                ) : null}
                <Link
                  className="focus-ring inline-flex min-h-9 items-center border border-line bg-white px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
                  href={portfolioHref({ sort })}
                >
                  Сбросить фильтры
                </Link>
              </div>
            ) : null}
          </div>
        </div>
        {projects.length ? (
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, index) => (
              <ProjectCard key={project.id} priority={index < 3} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-12 border border-line bg-white p-10 text-center">
            <h2 className="text-2xl font-semibold">Проекты не найдены</h2>
            <p className="mt-3 text-muted">Сбросьте фильтр или выберите другое направление</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
