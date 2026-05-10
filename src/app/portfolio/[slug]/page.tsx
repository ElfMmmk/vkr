import Image from "next/image";
import { notFound } from "next/navigation";

import { ButtonLink } from "@/components/button-link";
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              Кейс
            </p>
            <h1 className="mt-4 text-5xl font-semibold leading-tight">{project.title}</h1>
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
            <Image
              alt={project.title}
              className="object-cover"
              fill
              priority
              sizes="(min-width: 900px) 54vw, 100vw"
              src={project.coverImageUrl}
            />
          </div>
        </section>
        <section className="border-y border-line bg-white py-16">
          <div className="container-shell grid gap-10 md:grid-cols-[0.45fr_1fr]">
            <h2 className="text-3xl font-semibold">Задача и результат</h2>
            <p className="text-xl leading-9 text-muted">{project.fullDescription}</p>
          </div>
        </section>
        <section className="container-shell py-16">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-3xl font-semibold">Галерея</h2>
            <ButtonLink href="/portfolio" variant="secondary">
              Назад к работам
            </ButtonLink>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {[project.coverImageUrl, ...project.gallery.map((image) => image.publicUrl)]
              .filter(Boolean)
              .map((imageUrl, index) => (
                <div className="relative aspect-[4/3] overflow-hidden bg-line" key={`${imageUrl}-${index}`}>
                  <Image
                    alt={`${project.title}, изображение ${index + 1}`}
                    className="object-cover"
                    fill
                    sizes="(min-width: 900px) 50vw, 100vw"
                    src={imageUrl}
                  />
                </div>
              ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
