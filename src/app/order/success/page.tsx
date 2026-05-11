import { ButtonLink } from "@/components/button-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function OrderSuccessPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-shell grid min-h-[60vh] place-items-center py-16 text-center">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            Заявка отправлена
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">Спасибо за обращение</h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            Дизайнер получит заявку и свяжется с нами в течение одного рабочего дня.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <ButtonLink href="/">На главную</ButtonLink>
            <ButtonLink href="/portfolio" variant="secondary">
              Смотреть работы
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
