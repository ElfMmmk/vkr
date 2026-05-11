import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { FeaturedProjectRotator } from "@/components/featured-project-rotator";
import { PageExtraBlocks } from "@/components/page-extra-blocks";
import { ProjectCard } from "@/components/project-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicPage, getPublicProjects, getPublicServices } from "@/lib/data/public";

export default async function HomePage() {
  const [home, projects, services] = await Promise.all([
    getPublicPage("home"),
    getPublicProjects(),
    getPublicServices()
  ]);
  const featured = projects.slice(0, 6);
  const recentProjects = projects.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="container-shell grid items-center gap-8 py-10 md:min-h-[calc(100vh-80px)] md:grid-cols-[0.95fr_1.05fr] md:gap-10">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold leading-[1.03] text-ink sm:text-5xl md:text-7xl md:leading-[0.98]">
              {home.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-muted md:mt-7 md:text-xl">{home.body}</p>
            <div className="mt-7 flex flex-wrap gap-3 md:mt-9">
              <ButtonLink href="/order">{home.blocks.cta ?? "Оставить заявку"}</ButtonLink>
              <ButtonLink href="/portfolio" variant="secondary">
                {home.blocks.secondaryCta ?? "Смотреть портфолио"}
              </ButtonLink>
            </div>
          </div>
          <FeaturedProjectRotator projects={featured} />
          <div className="border-t border-line pt-6 md:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {services.slice(0, 5).map((service) => (
                <Link
                  className="focus-ring group block min-w-0 border border-transparent p-3 transition hover:border-line hover:bg-white active:translate-y-px"
                  href={`/portfolio?service=${service.slug}`}
                  key={service.id}
                >
                  <p className="text-sm font-semibold text-ink">{service.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted group-hover:text-ink">
                    {service.description}
                  </p>
                </Link>
              ))}
            </div>
            <Link
              className="focus-ring mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent transition hover:text-ink active:translate-y-px"
              href="/services"
            >
              Смотреть другие услуги
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </section>

        <section className="border-y border-line bg-white py-16">
          <div className="container-shell">
            <div className="mb-9 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                  Портфолио
                </p>
                <h2 className="mt-3 text-4xl font-semibold leading-tight">Недавние проекты</h2>
              </div>
              <ButtonLink href="/portfolio" variant="secondary">
                Все работы
              </ButtonLink>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {recentProjects.map((project, index) => (
                <ProjectCard key={project.id} priority={index === 0} project={project} />
              ))}
            </div>
          </div>
        </section>
        <PageExtraBlocks blocks={home.blocks} exclude={["cta", "secondaryCta"]} />
      </main>
      <SiteFooter />
    </>
  );
}
