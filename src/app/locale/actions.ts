"use server";

import { cookies } from "next/headers";

import { normalizeLocale } from "@/lib/i18n";

export async function setLocaleAction(formData: FormData): Promise<void> {
  const locale = normalizeLocale(String(formData.get("locale") ?? ""));
  const cookieStore = await cookies();

  cookieStore.set("NEXT_LOCALE", locale, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
}
