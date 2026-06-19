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
const contractFeedbackThread = readFileSync(
  join(process.cwd(), "src", "components", "contract-feedback-thread.tsx"),
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
    expect(clientRequestPage).toContain('history: "История"');
    expect(clientRequestPage).toContain("{copy.history}</h2>");
    expect(clientRequestPage).not.toContain(">Таймлайн</h2>");
  });

  it("renames contract-order UI copy to order terms", () => {
    const visiblePages = [clientRequestPage, clientAccountPage, adminRequestPage].join("\n");

    expect(clientRequestPage).toContain('terms: "Условия заказа"');
    expect(clientRequestPage).toContain("{copy.terms}</h2>");
    expect(visiblePages).not.toContain("Договор-заказ");
    expect(visiblePages).not.toContain("договор-заказ");
    expect(clientRequestPage).not.toContain('"draft", "sent"');
  });

  it("shows order status tags only in the admin-facing request UI", () => {
    expect(adminRequestsPage).toContain("ContractStatusBadge");
    expect(adminRequestPage).toContain("ContractStatusBadge");
    expect(clientAccountPage).not.toContain("ContractStatusBadge");
    expect(clientRequestPage).not.toContain("ContractStatusBadge");
  });

  it("labels order chat as discussion and removes legacy manager explanation copy", () => {
    expect(contractFeedbackThread).toContain("Обсуждение заказа");
    expect(contractFeedbackThread).not.toContain("Комментарии к заказу");
    expect(adminRequestPage).not.toContain("Пояснение для клиента");
  });

  it("highlights the newest history item with a non-cobalt border", () => {
    expect(clientRequestPage).toContain('index === 0 ? "border-accent" : "border-cobalt/30"');
  });

  it("uses searchable multi-select for project gallery images", () => {
    expect(adminProjectsPage).toContain("AdminImageMultiSelect");
    expect(adminProjectsPage).not.toContain("function ImageChecks");
  });

  it("keeps services forms in collapsible full-width sections", () => {
    expect(adminServicesPage).toContain('title="Новая услуга"');
    expect(adminServicesPage).toContain("collapsible");
    expect(adminServicesPage).toContain("Пакеты");
    expect(adminServicesPage).toContain("Дополнительные услуги");
    expect(adminServicesPage).not.toContain("Пакеты и дополнительные услуги");
  });

  it("separates service management tools from existing service cards", () => {
    expect(adminServicesPage).toContain("Управление услугами");
    expect(adminServicesPage).toContain('title="Новая услуга"');
    expect(adminServicesPage).toContain('title="Порядок на сайте"');
    expect(adminServicesPage).toContain("Список услуг");
    expect(adminServicesPage).toContain("Редактируйте уже созданные услуги");
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
