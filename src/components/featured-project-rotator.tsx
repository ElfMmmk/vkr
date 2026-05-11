"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { Project } from "@/lib/types";

type FeaturedProjectRotatorProps = {
  projects: Project[];
};

export function FeaturedProjectRotator({ projects }: FeaturedProjectRotatorProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeProject = projects[activeIndex] ?? projects[0];

  useEffect(() => {
    if (projects.length < 2) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % projects.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [projects.length]);

  if (!activeProject) {
    return (
      <div className="grid aspect-[4/3] min-h-0 place-items-center bg-line px-6 text-center text-sm text-muted shadow-soft">
        Обложка проекта пока не добавлена
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] min-h-0 overflow-hidden bg-line shadow-soft">
      <Link
        className="focus-ring group block h-full"
        href={`/portfolio/${activeProject.slug}`}
        aria-label={`Открыть кейс ${activeProject.title}`}
      >
        {activeProject.coverImageUrl ? (
          <Image
            key={activeProject.id}
            alt={activeProject.title}
            className="object-cover transition duration-700 group-hover:scale-105"
            fill
            priority={activeIndex === 0}
            sizes="(min-width: 900px) 52vw, 100vw"
            src={activeProject.coverImageUrl}
          />
        ) : (
          <div className="grid h-full min-h-[260px] place-items-center px-6 text-center text-sm text-muted">
            Обложка проекта пока не добавлена
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-ink/82 p-6 text-white backdrop-blur">
          <p className="text-sm uppercase tracking-[0.16em] text-white/65">Featured case</p>
          <div className="mt-2 flex items-end justify-between gap-4">
            <p className="min-w-0 text-2xl font-semibold leading-tight">{activeProject.title}</p>
            <span className="shrink-0 text-sm font-semibold text-white/75 transition group-hover:text-white">
              Открыть
            </span>
          </div>
        </div>
      </Link>
      {projects.length > 1 ? (
        <div className="absolute right-4 top-4 flex gap-2">
          {projects.map((project, index) => (
            <button
              aria-label={`Показать кейс ${project.title}`}
              className={`focus-ring h-2.5 w-7 border border-white/50 transition active:translate-y-px ${
                index === activeIndex ? "bg-white" : "bg-white/25 hover:bg-white/70"
              }`}
              key={project.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
