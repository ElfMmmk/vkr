import { OrderForm } from "@/components/order-form";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicServices } from "@/lib/data/public";
import { getLocale } from "@/lib/i18n-server";

export default async function OrderPage({
  searchParams
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const locale = await getLocale();
  const services = await getPublicServices(locale);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="container-shell grid gap-10 py-16 md:grid-cols-[0.8fr_1fr] md:py-24">
        <SectionHeading
          title={locale === "en" ? "Send request" : "Оставить заявку"}
          description={
            locale === "en"
              ? "Describe the task, choose a service and leave a convenient contact method. After submission, the request appears in the admin panel and in your account if you are signed in."
              : "Опишите задачу, выберите направление и оставьте удобный способ связи. После отправки заявка появится в административной панели и в личном кабинете, если вы вошли в систему."
          }
        />
        <section className="border border-line bg-white p-6 md:p-8">
          <OrderForm selectedServiceSlug={params.service} services={services} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
