import { SiteHeaderClient } from "@/components/site-header-client";
import { getLocale } from "@/lib/i18n-server";

export async function SiteHeader() {
  const locale = await getLocale();

  return <SiteHeaderClient locale={locale} />;
}
