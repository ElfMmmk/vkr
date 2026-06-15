import { OrderForm } from "@/components/order-form";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicProjects, getPublicServices } from "@/lib/data/public";
import { getLocale } from "@/lib/i18n-server";

export default async function OrderPage({
  searchParams
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const [services, projects] = await Promise.all([
    getPublicServices(locale),
    getPublicProjects({}, locale)
  ]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell py-12 md:py-20">
        <SectionHeading
          title={locale === "en" ? "Place an order" : "Оформить заказ"}
          description={
            locale === "en"
              ? "Choose a service package, add-ons and a reference example. The form will show a preliminary price and timing before submission."
              : "Выберите услугу и пакет, при необходимости добавьте дополнительные работы и проект из портфолио как ориентир."
          }
        />
        <section className="mt-8 border border-line bg-white p-4 sm:p-6 md:mt-10 md:p-8">
          <OrderForm projects={projects} selectedServiceSlug={params.service} services={services} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
