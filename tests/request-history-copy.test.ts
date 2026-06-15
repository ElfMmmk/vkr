import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const clientRequestPage = readFileSync(
  join(process.cwd(), "src", "app", "account", "requests", "[id]", "page.tsx"),
  "utf8"
);
const clientAccountPage = readFileSync(
  join(process.cwd(), "src", "app", "account", "page.tsx"),
  "utf8"
);
const adminRequestPage = readFileSync(
  join(process.cwd(), "src", "app", "admin", "(protected)", "requests", "[id]", "page.tsx"),
  "utf8"
);
const adminRequestsPage = readFileSync(
  join(process.cwd(), "src", "app", "admin", "(protected)", "requests", "page.tsx"),
  "utf8"
);
const adminProjectsPage = readFileSync(
  join(process.cwd(), "src", "app", "admin", "(protected)", "projects", "page.tsx"),
  "utf8"
);
const adminServicesPage = readFileSync(
  join(process.cwd(), "src", "app", "admin", "(protected)", "services", "page.tsx"),
  "utf8"
);
const adminAnalyticsPage = readFileSync(
  join(process.cwd(), "src", "app", "admin", "(protected)", "analytics", "page.tsx"),
  "utf8"
);
const adminNotificationsPage = readFileSync(
  join(process.cwd(), "src", "app", "admin", "(protected)", "notifications", "page.tsx"),
  "utf8"
);

describe("client request history copy", () => {
  it("labels the order communication timeline as history", () => {
    expect(clientRequestPage).toContain(">История</h2>");
    expect(clientRequestPage).not.toContain(">Таймлайн</h2>");
  });

  it("renames contract-order UI copy to order", () => {
    const visiblePages = [clientRequestPage, clientAccountPage, adminRequestPage].join("\n");

    expect(visiblePages).toContain(">Заказ</h2>");
    expect(visiblePages).not.toContain("Договор-заказ");
    expect(visiblePages).not.toContain("договор-заказ");
  });

  it("shows order status tags on request cards and request details", () => {
    expect(adminRequestsPage).toContain("ContractStatusBadge");
    expect(adminRequestPage).toContain("ContractStatusBadge");
    expect(clientAccountPage).toContain("ContractStatusBadge");
    expect(clientRequestPage).toContain("ContractStatusBadge");
  });

  it("uses searchable multi-select for project gallery images", () => {
    expect(adminProjectsPage).toContain("AdminImageMultiSelect");
    expect(adminProjectsPage).not.toContain("function ImageChecks");
  });

  it("keeps services forms in collapsible full-width sections", () => {
    expect(adminServicesPage).toContain('title="Новая услуга"');
    expect(adminServicesPage).toContain("collapsible");
    expect(adminServicesPage).toContain(">Пакеты и дополнительные услуги</");
  });

  it("uses Russian analytics labels and notification pagination controls", () => {
    expect(adminAnalyticsPage).not.toContain("CTA");
    expect(adminAnalyticsPage).toContain("Клики по кнопкам");
    expect(adminAnalyticsPage).toContain("Конверсия кнопок");
    expect(adminAnalyticsPage).toContain("Средний чек");
    expect(adminNotificationsPage).toContain("Непрочитанные");
    expect(adminNotificationsPage).toContain("pageCount");
  });
});
