export const registrationErrorMessages = {
  default: "Не удалось зарегистрироваться. Проверьте email или попробуйте позже.",
  emailRateLimit: "Слишком много писем регистрации. Попробуйте позже или используйте демо-аккаунт.",
  emailNotAuthorized:
    "Email не разрешён встроенной отправкой Supabase. Настройте SMTP или используйте адрес участника проекта."
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

export function getRegistrationErrorMessage(error: unknown): string {
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
    return registrationErrorMessages.emailRateLimit;
  }

  if (
    code === "email_address_not_authorized" ||
    message.includes("email address not authorized") ||
    message.includes("email_address_not_authorized")
  ) {
    return registrationErrorMessages.emailNotAuthorized;
  }

  return registrationErrorMessages.default;
}
