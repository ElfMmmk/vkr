import { ButtonLink } from "@/components/button-link";
import { PageExtraBlocks } from "@/components/page-extra-blocks";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicPage } from "@/lib/data/public";
import { getLocale } from "@/lib/i18n-server";

const workflowRu = [
  {
    title: "Бриф",
    description: "Уточняем задачу, аудиторию, ограничения, сроки и материалы, которые уже есть."
  },
  {
    title: "Концепция",
    description: "Собираем направление: визуальные референсы, тон, логику носителей и первые решения."
  },
  {
    title: "Дизайн-система",
    description: "Переводим концепцию в набор правил, макетов и элементов, которые можно повторять."
  },
  {
    title: "Передача материалов",
    description: "Готовим финальные файлы, исходники и короткие пояснения для дальнейшего использования."
  }
];

const workflowEn = [
  {
    title: "Brief",
    description: "We clarify the task, audience, constraints, timing, and available materials."
  },
  {
    title: "Concept",
    description: "We define the visual direction, references, tone, asset logic, and first solutions."
  },
  {
    title: "Design system",
    description: "The concept becomes a repeatable set of rules, layouts, and visual elements."
  },
  {
    title: "Delivery",
    description: "Final files, source materials, and concise usage notes are prepared for handoff."
  }
];

export default async function AboutPage() {
  const locale = await getLocale();
  const page = await getPublicPage("about", locale);
  const workflow = locale === "en" ? workflowEn : workflowRu;

  return (
    <>
      <SiteHeader />
      <main id="main-content">
        <section className="container-shell py-16 md:py-24">
          <SectionHeading title={page.title} description={page.body} />
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <div className="border-t border-line pt-5">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                {locale === "en" ? "Experience" : "Опыт"}
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {page.blocks.experience ?? (locale === "en" ? "5+ years" : "5+ лет")}
              </p>
            </div>
            <div className="border-t border-line pt-5">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                {locale === "en" ? "Focus" : "Фокус"}
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {page.blocks.focus ?? (locale === "en" ? "branding and digital" : "брендинг и digital")}
              </p>
            </div>
            <div className="border-t border-line pt-5">
              <p className="text-sm uppercase tracking-[0.18em] text-muted">
                {locale === "en" ? "Approach" : "Подход"}
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {locale === "en"
                  ? "a clear task, a coherent system, and practical delivery"
                  : "ясность задачи, аккуратная система, готовность к применению"}
              </p>
            </div>
          </div>
          <div className="mt-14 border border-line bg-white p-8 md:p-10">
            <h2 className="text-3xl font-semibold">
              {locale === "en" ? "How the work is structured" : "Как строится работа"}
            </h2>
            <div className="mt-8 grid gap-6 md:grid-cols-4">
              {workflow.map((step, index) => (
                <div className="border-l border-line pl-4" key={step.title}>
                  <p className="text-sm text-accent">0{index + 1}</p>
                  <p className="mt-2 font-semibold">{step.title}</p>
                  <p className="mt-3 text-sm leading-6 text-muted">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <ButtonLink
                analyticsCta
                analyticsLabel={locale === "en" ? "Discuss a project" : "Обсудить задачу"}
                href="/order"
              >
                {locale === "en" ? "Discuss a project" : "Обсудить задачу"}
              </ButtonLink>
            </div>
          </div>
        </section>
        <PageExtraBlocks blocks={page.blocks} exclude={["experience", "focus"]} />
      </main>
      <SiteFooter />
    </>
  );
}
