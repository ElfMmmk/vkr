"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type GallerySlide = {
  src: string;
  alt: string;
  caption?: string;
};

type ProjectGallerySliderProps = {
  slides: GallerySlide[];
};

export function ProjectGallerySlider({ slides }: ProjectGallerySliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultipleSlides = slides.length > 1;
  const activeSlide = slides[activeIndex] ?? slides[0];

  if (!activeSlide) {
    return (
      <div className="grid min-h-72 place-items-center border border-line bg-white text-sm text-muted">
        Изображения для галереи пока не добавлены
      </div>
    );
  }

  function goToPrevious() {
    setActiveIndex((current) => (current === 0 ? slides.length - 1 : current - 1));
  }

  function goToNext() {
    setActiveIndex((current) => (current === slides.length - 1 ? 0 : current + 1));
  }

  return (
    <section aria-label="Галерея проекта" className="space-y-4">
      <div className="overflow-hidden border border-line bg-white">
        <div className="group/slider relative aspect-[16/10] w-full bg-paper md:aspect-[16/9]">
          <Image
            alt={activeSlide.alt}
            className="object-contain"
            fill
            priority={activeIndex === 0}
            quality={90}
            sizes="(min-width: 900px) 980px, 100vw"
            src={activeSlide.src}
          />
          {hasMultipleSlides ? (
            <>
              <button
                aria-label="Предыдущее изображение"
                className="focus-ring absolute inset-y-0 left-0 grid w-20 place-items-center bg-ink/0 text-white opacity-75 transition hover:bg-ink/15 hover:opacity-100 active:bg-ink/25 md:opacity-0 md:group-hover/slider:opacity-100"
                onClick={goToPrevious}
                type="button"
              >
                <span className="grid h-11 w-11 place-items-center border border-white/40 bg-ink/45 backdrop-blur">
                  <ChevronLeft aria-hidden="true" size={20} />
                </span>
              </button>
              <button
                aria-label="Следующее изображение"
                className="focus-ring absolute inset-y-0 right-0 grid w-20 place-items-center bg-ink/0 text-white opacity-75 transition hover:bg-ink/15 hover:opacity-100 active:bg-ink/25 md:opacity-0 md:group-hover/slider:opacity-100"
                onClick={goToNext}
                type="button"
              >
                <span className="grid h-11 w-11 place-items-center border border-white/40 bg-ink/45 backdrop-blur">
                  <ChevronRight aria-hidden="true" size={20} />
                </span>
              </button>
            </>
          ) : null}
        </div>
        <div className="border-t border-line bg-white px-4 py-4">
          <p className="text-sm font-semibold text-ink">{activeSlide.caption ?? activeSlide.alt}</p>
          <p className="mt-1 text-xs text-muted">
            {activeIndex + 1} / {slides.length}
          </p>
        </div>
      </div>
      {hasMultipleSlides ? (
        <div className="flex flex-wrap gap-2" aria-label="Миниатюры галереи">
          {slides.map((slide, index) => (
            <button
              aria-label={`Открыть изображение ${index + 1}`}
              className={`focus-ring relative h-16 w-24 overflow-hidden border bg-white transition active:translate-y-px ${
                index === activeIndex ? "border-ink" : "border-line hover:border-muted hover:bg-paper"
              }`}
              key={`${slide.src}-${index}`}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image alt="" className="object-cover" fill quality={90} sizes="96px" src={slide.src} />
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
