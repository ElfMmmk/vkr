import { OrderForm } from "@/components/order-form";
import { SectionHeading } from "@/components/section-heading";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublicServices } from "@/lib/data/public";

export default async function OrderPage({
  searchParams
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const services = await getPublicServices();

  return (
    <>
      <SiteHeader />
      <main className="container-shell grid gap-10 py-16 md:grid-cols-[0.8fr_1fr] md:py-24">
        <SectionHeading
          title="Оставить заявку"
          description="Опишите задачу, выберите направление и оставьте удобный способ связи. После отправки заявка появится в административной панели."
        />
        <section className="border border-line bg-white p-6 md:p-8">
          <OrderForm selectedServiceSlug={params.service} services={services} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
