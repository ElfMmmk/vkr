import { ButtonLink } from "@/components/button-link";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicPage } from "@/lib/data/public";

export default async function ContactsPage() {
  const page = await getPublicPage("contacts");

  return (
    <>
      <SiteHeader />
      <main className="container-shell py-16 md:py-24">
        <SectionHeading title={page.title} description={page.body} />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="min-w-0 border border-line bg-white p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Email</p>
            <p className="mt-4 max-w-full break-words text-xl font-semibold leading-tight [overflow-wrap:anywhere] lg:text-2xl">
              {page.blocks.email ?? "designer@example.com"}
            </p>
          </div>
          <div className="min-w-0 border border-line bg-white p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-muted">Telegram</p>
            <p className="mt-4 max-w-full break-words text-xl font-semibold leading-tight [overflow-wrap:anywhere] lg:text-2xl">
              {page.blocks.telegram ?? "@design_portfolio"}
            </p>
          </div>
          <div className="border border-line bg-ink p-6 text-white">
            <p className="text-sm uppercase tracking-[0.18em] text-white/60">Заявка</p>
            <p className="mt-4 text-2xl font-semibold">Короткая форма для описания задачи</p>
            <div className="mt-6">
              <ButtonLink href="/order" variant="secondary">
                Перейти к форме
              </ButtonLink>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
