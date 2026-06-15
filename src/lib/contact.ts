import { AsYouType, parsePhoneNumberFromString } from "libphonenumber-js";

export const contactMethods = ["Telegram", "Email", "Телефон", "Другой способ"] as const;
export type ContactMethod = typeof contactMethods[number];

type ContactValidationResult =
  | { ok: true; value: string }
  | { ok: false; error: string };

function normalizeRussianPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("8") && digits.length >= 2) {
    return `+7${digits.slice(1, 11)}`;
  }

  if (digits.startsWith("7") && digits.length >= 2) {
    return `+${digits.slice(0, 11)}`;
  }

  return value.trim();
}

function formatRussianPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^8/, "7").slice(0, 11);

  if (!digits.startsWith("7")) {
    return new AsYouType().input(value);
  }

  const local = digits.slice(1);
  const parts = [
    local.slice(0, 3),
    local.slice(3, 6),
    local.slice(6, 8),
    local.slice(8, 10)
  ].filter(Boolean);

  return `+7${parts.length ? ` ${parts.join("-").replace(/^(\d{3})-(\d{1,3})/, "$1 $2")}` : ""}`;
}

export function formatContactInput(method: string, value: string): string {
  if (method !== "Телефон") {
    return value;
  }

  const normalized = normalizeRussianPhoneInput(value);

  if (normalized.startsWith("+7")) {
    return formatRussianPhone(normalized);
  }

  return new AsYouType().input(value);
}

export function normalizeAndValidateContact(
  method: string,
  value: string
): ContactValidationResult {
  const trimmed = value.trim();

  if (!trimmed) {
    return { ok: false, error: "Укажите контакт" };
  }

  if (method === "Email") {
    const normalized = trimmed.toLowerCase();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);

    return isValid
      ? { ok: true, value: normalized }
      : { ok: false, error: "Укажите корректный email" };
  }

  if (method === "Telegram") {
    const normalized = trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
    const isValid = /^@[A-Za-z0-9_]{5,32}$/.test(normalized);

    return isValid
      ? { ok: true, value: normalized }
      : { ok: false, error: "Укажите Telegram в формате @username" };
  }

  if (method === "Телефон") {
    const normalizedInput = normalizeRussianPhoneInput(trimmed);
    const phone = parsePhoneNumberFromString(normalizedInput, "RU");

    return phone?.isValid()
      ? {
          ok: true,
          value: phone.country === "RU" ? formatRussianPhone(phone.number) : phone.formatInternational()
        }
      : { ok: false, error: "Укажите корректный номер телефона" };
  }

  if (trimmed.length > 180) {
    return { ok: false, error: "Контакт слишком длинный" };
  }

  return { ok: true, value: trimmed };
}
