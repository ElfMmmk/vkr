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
  }>;
};

export default async function PortfolioPage({ searchParams }: PortfolioPageProps) {
  const params = await searchParams;
  const hasActiveFilter = Boolean(params.service || params.tag);
  const [services, tags, projects] = await Promise.all([
    getPublicServices(),
    getPublicTags(),
    getPublicProjects({ service: params.service, tag: params.tag })
  ]);

  return (
    <>
      <SiteHeader />
      <main className="container-shell py-16 md:py-24">
        <SectionHeading
          title="Портфолио"
          description="Кейсы сгруппированы по услугам и тегам, чтобы быстрее найти близкую задачу и перейти к заявке."
        />
        <div className="mt-10 border-y border-line py-6">
          <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">
              Фильтры проектов
            </p>
            {hasActiveFilter ? (
              <Link
                className="focus-ring inline-flex min-h-10 items-center justify-center border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-ink"
                href="/portfolio"
              >
                Сбросить фильтры
              </Link>
            ) : null}
          </div>
          <div className="grid gap-5">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                По услугам
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  className={`focus-ring border px-3 py-2 text-sm font-semibold hover:border-ink ${
                    !hasActiveFilter ? "border-ink bg-ink text-white" : "border-line bg-white"
                  }`}
                  href="/portfolio"
                >
                  Все проекты
                </Link>
                {services.map((service) => (
                  <Link
                    className={`focus-ring border px-3 py-2 text-sm font-semibold hover:border-ink ${
                      params.service === service.slug
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-white"
                    }`}
                    href={`/portfolio?service=${service.slug}`}
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
                    className={`focus-ring border px-3 py-2 text-sm text-muted hover:border-ink hover:text-ink ${
                      params.tag === tag.slug
                        ? "border-cobalt bg-cobalt text-white"
                        : "border-line bg-white"
                    }`}
                    href={`/portfolio?tag=${tag.slug}`}
                    key={tag.id}
                  >
                    #{tag.title}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        {projects.length ? (
          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-12 border border-line bg-white p-10 text-center">
            <h2 className="text-2xl font-semibold">Проекты не найдены</h2>
            <p className="mt-3 text-muted">Сбросьте фильтр или выберите другое направление.</p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
