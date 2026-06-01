import { describe, expect, it } from "vitest";

import { getRegistrationErrorMessage, registrationErrorMessages } from "@/lib/auth-errors";

describe("getRegistrationErrorMessage", () => {
  it("returns a clear Supabase Auth email rate-limit message by error code", () => {
    expect(
      getRegistrationErrorMessage({
        code: "over_email_send_rate_limit",
        message: "email rate limit exceeded",
        status: 429
      })
    ).toBe(registrationErrorMessages.emailRateLimit);
  });

  it("returns a rate-limit message by HTTP 429 status", () => {
    expect(getRegistrationErrorMessage({ message: "Too many requests", status: "429" })).toBe(
      registrationErrorMessages.emailRateLimit
    );
  });

  it("returns a clear message for Supabase built-in email authorization restrictions", () => {
    expect(
      getRegistrationErrorMessage({
        code: "email_address_not_authorized",
        message: "Email address not authorized"
      })
    ).toBe(registrationErrorMessages.emailNotAuthorized);
  });

  it("keeps the generic message for unrelated registration errors", () => {
    expect(getRegistrationErrorMessage({ message: "User already registered" })).toBe(
      registrationErrorMessages.default
    );
  });
});
