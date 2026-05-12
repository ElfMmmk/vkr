import type { Metadata } from "next";

import "@/app/globals.css";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "Graphic Designer Portfolio",
  description:
    "Портфолио графического дизайнера с публичным сайтом, заявками и административной панелью."
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html data-scroll-behavior="smooth" lang={locale}>
      <body>{children}</body>
    </html>
  );
}
