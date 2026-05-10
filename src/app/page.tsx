import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
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
  const featured = projects.slice(0, 3);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="container-shell grid min-h-[calc(100vh-80px)] items-center gap-10 py-10 md:grid-cols-[0.95fr_1.05fr]">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-semibold leading-[0.98] text-ink md:text-7xl">
              {home.title}
            </h1>
            <p className="mt-7 text-lg leading-8 text-muted md:text-xl">{home.body}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/order">{home.blocks.cta ?? "Оставить заявку"}</ButtonLink>
              <ButtonLink href="/portfolio" variant="secondary">
                {home.blocks.secondaryCta ?? "Смотреть портфолио"}
              </ButtonLink>
            </div>
            <div className="mt-12 grid gap-4 border-t border-line pt-6 sm:grid-cols-3">
              {services.slice(0, 3).map((service) => (
                <Link
                  className="focus-ring group block"
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
          </div>
          <div className="relative min-h-[520px] overflow-hidden bg-line shadow-soft">
            {featured[0] ? (
              <Image
                alt={featured[0].title}
                className="object-cover"
                fill
                priority
                sizes="(min-width: 900px) 52vw, 100vw"
                src={featured[0].coverImageUrl}
              />
            ) : null}
            <div className="absolute bottom-0 left-0 right-0 bg-ink/82 p-6 text-white backdrop-blur">
              <p className="text-sm uppercase tracking-[0.16em] text-white/65">Featured case</p>
              <p className="mt-2 text-2xl font-semibold">{featured[0]?.title ?? "Portfolio"}</p>
            </div>
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
              {featured.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
