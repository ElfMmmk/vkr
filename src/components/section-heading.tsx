type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-4xl font-semibold leading-[1.08] text-ink md:text-6xl md:leading-[1.05]">{title}</h1>
      {description ? (
        <p className="mt-5 text-lg leading-8 text-muted md:text-xl">{description}</p>
      ) : null}
    </div>
  );
}
