import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/button-link";
import { ProjectGallerySlider } from "@/components/project-gallery-slider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicProjectBySlug, getPublicProjects } from "@/lib/data/public";

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
  const project = await getPublicProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main>
        <section className="container-shell grid gap-10 py-14 md:grid-cols-[0.72fr_1fr] md:py-20">
          <div>
            <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted" aria-label="Хлебные крошки">
              <Link className="hover:text-ink" href="/portfolio">
                Портфолио
              </Link>
              <span>/</span>
              <Link className="hover:text-ink" href="/services">
                Услуги
              </Link>
              <span>/</span>
              <span className="text-ink">{project.title}</span>
            </nav>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Кейс
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{project.title}</h1>
            <p className="mt-6 text-lg leading-8 text-muted">{project.shortDescription}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {project.services.map((service) => (
                <span className="border border-line bg-white px-3 py-2 text-sm" key={service.id}>
                  {service.title}
                </span>
              ))}
              {project.tags.map((tag) => (
                <span className="border border-cobalt/20 bg-cobalt/10 px-3 py-2 text-sm text-cobalt" key={tag.id}>
                  #{tag.title}
                </span>
              ))}
            </div>
            <div className="mt-8">
              <ButtonLink href="/order">Заказать похожий проект</ButtonLink>
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
                Обложка проекта пока не добавлена.
              </div>
            )}
          </div>
        </section>
        <section className="border-y border-line bg-white py-16">
          <div className="container-shell grid gap-10 md:grid-cols-[0.45fr_1fr]">
            <h2 className="text-3xl font-semibold">Задача и результат</h2>
            <p className="text-xl leading-9 text-muted">{project.fullDescription}</p>
          </div>
        </section>
        <section className="container-shell py-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="text-3xl font-semibold">Галерея</h2>
            <ButtonLink href="/portfolio" variant="secondary">
              Назад к работам
            </ButtonLink>
          </div>
          <ProjectGallerySlider
            slides={[project.coverImageUrl, ...project.gallery.map((image) => image.publicUrl)]
              .filter(Boolean)
              .map((imageUrl, index) => ({
                src: imageUrl,
                alt: `${project.title}, изображение ${index + 1}`,
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
