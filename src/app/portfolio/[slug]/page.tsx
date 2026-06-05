import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/button-link";
import { ProjectGallerySlider } from "@/components/project-gallery-slider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicProjectBySlug, getPublicProjects } from "@/lib/data/public";
import { getDictionary } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

type ProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const projects = await getPublicProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const dictionary = getDictionary(locale);
  const project = await getPublicProjectBySlug(slug, locale);

  if (!project) {
    notFound();
  }

  const primaryService = project.services[0];

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="container-shell py-10 md:py-16">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <nav
              className="flex flex-wrap items-center gap-2 text-sm text-muted"
              aria-label={locale === "en" ? "Breadcrumbs" : "Хлебные крошки"}
            >
              <Link className="hover:text-ink" href="/portfolio">
                {dictionary.nav.portfolio}
              </Link>
              <span>/</span>
              <Link className="hover:text-ink" href="/services">
                {dictionary.nav.services}
              </Link>
              <span>/</span>
              <span className="text-ink">{project.title}</span>
            </nav>
            <ButtonLink href="/portfolio" variant="secondary">
              {locale === "en" ? "Back to work" : "Назад к работам"}
            </ButtonLink>
          </div>
          <div className="grid gap-10 md:grid-cols-[0.72fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
                {locale === "en" ? "Case" : "Кейс"}
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{project.title}</h1>
              <p className="mt-6 text-lg leading-8 text-muted">{project.shortDescription}</p>
              <div className="mt-8 flex flex-wrap gap-2">
                {project.services.map((service) => (
                  <Link
                    className="focus-ring border border-line bg-white px-3 py-2 text-sm transition hover:border-ink hover:bg-paper active:translate-y-px"
                    href={`/portfolio?service=${service.slug}`}
                    key={service.id}
                  >
                    {service.title}
                  </Link>
                ))}
                {project.tags.map((tag) => (
                  <Link
                    className="focus-ring border border-cobalt/20 bg-cobalt/10 px-3 py-2 text-sm text-cobalt transition hover:border-cobalt hover:bg-cobalt hover:text-white active:translate-y-px"
                    href={`/portfolio?tag=${tag.slug}`}
                    key={tag.id}
                  >
                    #{tag.title}
                  </Link>
                ))}
              </div>
              <div className="mt-8">
                <ButtonLink
                  analyticsCta
                  analyticsLabel={locale === "en" ? "Order a similar project" : "Заказать похожий проект"}
                  href={primaryService ? `/order?service=${primaryService.slug}` : "/order"}
                >
                  {locale === "en" ? "Order a similar project" : "Заказать похожий проект"}
                </ButtonLink>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden bg-line shadow-soft">
              {project.coverImageUrl ? (
                <Image
                  alt={project.title}
                  className="object-cover"
                  fill
                  loading="eager"
                  sizes="(min-width: 900px) 54vw, 100vw"
                  src={project.coverImageUrl}
                />
              ) : (
                <div className="grid h-full place-items-center px-6 text-center text-sm text-muted">
                  {locale === "en" ? "Project cover has not been added yet" : "Обложка проекта пока не добавлена"}
                </div>
              )}
            </div>
          </div>
        </section>
        <section className="border-y border-line bg-white py-16">
          <div className="container-shell grid gap-10 md:grid-cols-[0.45fr_1fr]">
            <h2 className="text-3xl font-semibold">
              {locale === "en" ? "Task and result" : "Задача и результат"}
            </h2>
            <p className="text-xl leading-9 text-muted">{project.fullDescription}</p>
          </div>
        </section>
        <section className="container-shell py-16">
          <h2 className="mb-8 text-3xl font-semibold">
            {locale === "en" ? "Gallery" : "Галерея"}
          </h2>
          <ProjectGallerySlider
            slides={[project.coverImageUrl, ...project.gallery.map((image) => image.publicUrl)]
              .filter(Boolean)
              .map((imageUrl, index) => ({
                src: imageUrl,
                alt:
                  locale === "en"
                    ? `${project.title}, image ${index + 1}`
                    : `${project.title}, изображение ${index + 1}`,
                caption:
                  index === 0
                    ? project.title
                    : project.gallery[index - 1]?.caption || project.gallery[index - 1]?.title
              }))}
          />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
