import { ButtonLink } from "@/components/button-link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell grid min-h-[60vh] place-items-center py-16 text-center">
        <div>
          <h1 className="text-5xl font-semibold">Страница не найдена</h1>
          <p className="mt-4 text-muted">Запрошенный раздел отсутствует или был скрыт.</p>
          <div className="mt-8">
            <ButtonLink href="/">Вернуться на главную</ButtonLink>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
