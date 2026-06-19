import { ButtonLink } from "@/components/button-link";
import { OrderSuccessClient } from "@/components/order-success-client";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/lib/i18n-server";

export default async function OrderSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ claim?: string; request?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const claimQuery = params.claim ? `?claim=${encodeURIComponent(params.claim)}` : "";
  const accountHref = params.request ? `/account/requests/${params.request}` : "/account";

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell grid min-h-[60vh] place-items-center py-16 text-center">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {locale === "en" ? "Request sent" : "Заказ отправлен"}
          </p>
          <h1 className="mt-4 text-5xl font-semibold leading-tight">
            {locale === "en" ? "Thank you for your request" : "Спасибо за заказ"}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            {locale === "en"
              ? "The designer will review the brief and preliminary estimate, clarify the details, and prepare the final order terms for approval."
              : "Дизайнер получит бриф, проверит предварительный расчёт, уточнит условия и подготовит заказ для согласования."}
          </p>
          <OrderSuccessClient locale={locale} />
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <div className="border border-line bg-white p-4">
              <h2 className="font-semibold">{locale === "en" ? "1. Brief review" : "1. Проверка брифа"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {locale === "en" ? "The designer reviews the task and materials." : "Дизайнер посмотрит задачу и материалы."}
              </p>
            </div>
            <div className="border border-line bg-white p-4">
              <h2 className="font-semibold">{locale === "en" ? "2. Clarification" : "2. Уточнение"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {locale === "en" ? "A manager may ask about scope and timing." : "Если нужно, менеджер задаст вопросы по срокам и составу."}
              </p>
            </div>
            <div className="border border-line bg-white p-4">
              <h2 className="font-semibold">{locale === "en" ? "3. Order terms" : "3. Заказ"}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {locale === "en" ? "The final terms will appear in your account." : "Финальные условия появятся в личном кабинете."}
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {params.claim ? (
              <>
                <ButtonLink href={`/account/register${claimQuery}`}>
                  {locale === "en" ? "Create an account and claim the request" : "Создать кабинет и забрать заявку"}
                </ButtonLink>
                <ButtonLink href={`/account/login${claimQuery}`} variant="secondary">
                  {locale === "en" ? "I already have an account" : "Уже есть кабинет"}
                </ButtonLink>
              </>
            ) : (
              <ButtonLink href={accountHref}>
                {locale === "en" ? "Open the request in my account" : "Открыть заявку в кабинете"}
              </ButtonLink>
            )}
            <ButtonLink href="/portfolio" variant="secondary">
              {locale === "en" ? "View work" : "Смотреть работы"}
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
