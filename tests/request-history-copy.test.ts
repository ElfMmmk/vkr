import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const clientRequestPage = readFileSync(
  join(process.cwd(), "src", "app", "account", "requests", "[id]", "page.tsx"),
  "utf8"
);

describe("client request history copy", () => {
  it("labels the order communication timeline as history", () => {
    expect(clientRequestPage).toContain(">История</h2>");
    expect(clientRequestPage).not.toContain(">Таймлайн</h2>");
  });
});
