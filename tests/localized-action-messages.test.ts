import { describe, expect, it } from "vitest";

import {
  accountActionMessages,
  orderActionMessages
} from "../src/lib/localized-action-messages";

describe("localized server-action messages", () => {
  it("returns English order validation and failure messages in English mode", () => {
    const messages = orderActionMessages("en");

    expect(messages.requiredFields).toBe("Complete the required fields.");
    expect(messages.invalidService).toBe("Choose a service from the list.");
    expect(messages.saveFailed).toBe("The order could not be saved. Please try again later.");
    expect(Object.values(messages).join(" ")).not.toMatch(/[А-Яа-яЁё]/);
  });

  it("returns English account validation and failure messages in English mode", () => {
    const messages = accountActionMessages("en");

    expect(messages.invalidEmail).toBe("Enter a valid email address.");
    expect(messages.signInFailed).toBe("Sign-in failed. Check your email and password.");
    expect(messages.registrationUnavailable).toBe(
      "Registration is temporarily unavailable. Please try again later."
    );
    expect(Object.values(messages).join(" ")).not.toMatch(/[А-Яа-яЁё]/);
  });

  it("keeps Russian messages as the default", () => {
    expect(orderActionMessages("ru").requiredFields).toMatch(/[А-Яа-яЁё]/);
    expect(accountActionMessages("ru").invalidEmail).toMatch(/[А-Яа-яЁё]/);
  });
});
