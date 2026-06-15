import Image from "next/image";
import Link from "next/link";

import type { Project } from "@/lib/types";

type ProjectCardProps = {
  project: Project;
  priority?: boolean;
};

export function ProjectCard({ project, priority = false }: ProjectCardProps) {
  return (
    <article className="group">
      <Link className="focus-ring block transition active:translate-y-px" href={`/portfolio/${project.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-line">
          {project.coverImageUrl ? (
            <Image
              alt={project.title}
              className="object-cover transition duration-700 group-hover:scale-105"
              fill
              loading={priority ? undefined : "lazy"}
              priority={priority}
              quality={90}
              sizes="(min-width: 900px) 33vw, 100vw"
              src={project.coverImageUrl}
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-muted">
              Обложка пока не добавлена
            </div>
          )}
        </div>
      </Link>
      <div className="mt-5 flex min-w-0 items-start justify-between gap-5 border-t border-line pt-4">
        <div className="min-w-0">
          <Link className="focus-ring inline-block" href={`/portfolio/${project.slug}`}>
            <h2 className="text-2xl font-semibold leading-tight transition hover:text-accent active:translate-y-px">
              {project.title}
            </h2>
          </Link>
          <p className="mt-2 text-sm leading-6 text-muted">{project.shortDescription}</p>
          {project.services.length || project.tags.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {project.services.slice(0, 2).map((service) => (
                <Link
                  className="focus-ring border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-ink hover:bg-paper active:translate-y-px"
                  href={`/portfolio?service=${service.slug}`}
                  key={service.id}
                >
                  {service.title}
                </Link>
              ))}
              {project.tags.slice(0, 3).map((tag) => (
                <Link
                  className="focus-ring border border-cobalt/20 bg-cobalt/10 px-2.5 py-1 text-xs font-semibold text-cobalt transition hover:border-cobalt hover:bg-cobalt hover:text-white active:translate-y-px"
                  href={`/portfolio?tag=${tag.slug}`}
                  key={tag.id}
                >
                  #{tag.title}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        <Link
          className="focus-ring shrink-0 text-sm text-accent transition hover:text-ink active:translate-y-px"
          href={`/portfolio/${project.slug}`}
        >
          Открыть
        </Link>
      </div>
    </article>
  );
}
