"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const hasMultipleProjects = projects.length > 1;

  useEffect(() => {
    if (!hasMultipleProjects) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % projects.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [hasMultipleProjects, projects.length]);

  function goToPrevious() {
    setActiveIndex((current) => (current === 0 ? projects.length - 1 : current - 1));
  }

  function goToNext() {
    setActiveIndex((current) => (current === projects.length - 1 ? 0 : current + 1));
  }

  if (!activeProject) {
    return (
      <div className="grid aspect-[4/3] min-h-0 place-items-center bg-line px-6 text-center text-sm text-muted shadow-soft">
        Обложка проекта пока не добавлена
      </div>
    );
  }

  return (
    <div className="relative aspect-[4/3] min-h-0 overflow-hidden bg-line shadow-soft">
      {activeProject.coverImageUrl ? (
        <Image
          key={activeProject.id}
          alt={activeProject.title}
          className="object-cover transition duration-700"
          fill
          priority={activeIndex === 0}
          quality={90}
          sizes="(min-width: 900px) 52vw, 100vw"
          src={activeProject.coverImageUrl}
        />
      ) : (
        <div className="grid h-full min-h-[260px] place-items-center px-6 text-center text-sm text-muted">
          Обложка проекта пока не добавлена
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-ink/82 p-6 text-white backdrop-blur">
        <p className="text-sm uppercase tracking-[0.16em] text-white/65">Featured case</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="min-w-0 text-2xl font-semibold leading-tight">{activeProject.title}</p>
          <span className="shrink-0 text-sm font-semibold text-white/75">Открыть</span>
        </div>
      </div>
      <Link
        aria-label={`Открыть кейс ${activeProject.title}`}
        className="focus-ring absolute inset-y-0 left-1/4 right-1/4 z-10 transition hover:bg-white/5 active:bg-white/10"
        href={`/portfolio/${activeProject.slug}`}
      />
      {hasMultipleProjects ? (
        <>
          <button
            aria-label="Предыдущий кейс"
            className="focus-ring absolute inset-y-0 left-0 z-20 grid w-1/4 place-items-center bg-ink/0 text-white transition hover:bg-ink/18 active:bg-ink/28"
            onClick={goToPrevious}
            type="button"
          >
            <span className="grid h-10 w-10 place-items-center border border-white/40 bg-ink/35 backdrop-blur">
              <ChevronLeft aria-hidden="true" size={20} />
            </span>
          </button>
          <button
            aria-label="Следующий кейс"
            className="focus-ring absolute inset-y-0 right-0 z-20 grid w-1/4 place-items-center bg-ink/0 text-white transition hover:bg-ink/18 active:bg-ink/28"
            onClick={goToNext}
            type="button"
          >
            <span className="grid h-10 w-10 place-items-center border border-white/40 bg-ink/35 backdrop-blur">
              <ChevronRight aria-hidden="true" size={20} />
            </span>
          </button>
          <div className="absolute right-4 top-4 z-30 flex gap-2">
            {projects.map((project, index) => (
              <button
                aria-label={`Показать кейс ${project.title}`}
                className="focus-ring grid h-6 w-8 place-items-center transition active:translate-y-px"
                key={project.id}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={`h-2.5 w-7 border border-white/50 transition ${
                    index === activeIndex ? "bg-white" : "bg-white/25 hover:bg-white/70"
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
