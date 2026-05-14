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
      <main id="main-content" className="container-shell grid gap-10 py-16 md:grid-cols-[0.8fr_1fr] md:py-24">
        <SectionHeading
          title={locale === "en" ? "Place an order" : "Оформить заказ"}
          description={
            locale === "en"
              ? "Choose a service package, add-ons and a reference example. The form will show a preliminary price and timing before submission."
              : "Выберите пакет услуги, доплаты и пример работы. Форма покажет предварительную стоимость и срок до отправки заказа."
          }
        />
        <section className="border border-line bg-white p-6 md:p-8">
          <OrderForm projects={projects} selectedServiceSlug={params.service} services={services} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
