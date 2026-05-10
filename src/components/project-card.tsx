import Image from "next/image";
import Link from "next/link";

import type { Project } from "@/lib/types";

type ProjectCardProps = {
  project: Project;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="group">
      <Link className="focus-ring block" href={`/portfolio/${project.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-line">
          <Image
            alt={project.title}
            className="object-cover transition duration-700 group-hover:scale-105"
            fill
            sizes="(min-width: 900px) 33vw, 100vw"
            src={project.coverImageUrl}
          />
        </div>
        <div className="mt-5 flex items-start justify-between gap-5 border-t border-line pt-4">
          <div>
            <h2 className="text-2xl font-semibold leading-tight">{project.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{project.shortDescription}</p>
          </div>
          <span className="text-sm text-accent">Открыть</span>
        </div>
      </Link>
    </article>
  );
}
