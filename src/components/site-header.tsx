import { SiteHeaderClient } from "@/components/site-header-client";
import { getCurrentAppSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n-server";

export async function SiteHeader() {
  const [locale, session] = await Promise.all([getLocale(), getCurrentAppSession()]);

  return <SiteHeaderClient locale={locale} session={session} />;
}
