import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Graphic Designer Portfolio",
  description:
    "Портфолио графического дизайнера с публичным сайтом, заявками и административной панелью."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="ru">
      <body>{children}</body>
    </html>
  );
}
