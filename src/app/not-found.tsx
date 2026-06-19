import { ButtonLink } from "@/components/button-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getLocale } from "@/lib/i18n-server";

export default async function NotFound() {
  const locale = await getLocale();

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell grid min-h-[60vh] place-items-center py-16 text-center">
        <div>
          <h1 className="text-5xl font-semibold">
            {locale === "en" ? "Page not found" : "Страница не найдена"}
          </h1>
          <p className="mt-4 text-muted">
            {locale === "en" ? "The requested page does not exist or is no longer public." : "Запрошенный раздел отсутствует или был скрыт."}
          </p>
          <div className="mt-8">
            <ButtonLink href="/">
              {locale === "en" ? "Return home" : "Вернуться на главную"}
            </ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
