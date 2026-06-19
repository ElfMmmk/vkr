import type { Locale } from "@/lib/i18n";
import { accountActionMessages } from "@/lib/localized-action-messages";

export const registrationErrorMessages = {
  default: "Не удалось зарегистрироваться. Проверьте email или попробуйте позже.",
  emailRateLimit: "Слишком много писем регистрации. Попробуйте позже или используйте демо-аккаунт.",
  emailNotAuthorized:
    "Не удалось отправить письмо на этот адрес. Проверьте email или используйте другой адрес."
} as const;

function readErrorField(error: unknown, field: string): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const value = (error as Record<string, unknown>)[field];
  return typeof value === "string" ? value : "";
}

function readErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const value = (error as Record<string, unknown>).status;

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const status = Number(value);
    return Number.isFinite(status) ? status : undefined;
  }

  return undefined;
}

export function getRegistrationErrorMessage(error: unknown, locale: Locale = "ru"): string {
  const messages = accountActionMessages(locale);
  const code = readErrorField(error, "code").toLowerCase();
  const message =
    error instanceof Error ? error.message.toLowerCase() : readErrorField(error, "message").toLowerCase();
  const status = readErrorStatus(error);

  if (
    code === "over_email_send_rate_limit" ||
    status === 429 ||
    message.includes("email rate limit") ||
    message.includes("rate limit exceeded")
  ) {
    return messages.registrationRateLimit;
  }

  if (
    code === "email_address_not_authorized" ||
    message.includes("email address not authorized") ||
    message.includes("email_address_not_authorized")
  ) {
    return messages.registrationEmailNotAuthorized;
  }

  return messages.registrationDefault;
}
