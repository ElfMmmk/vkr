import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";

import { createRequestsWorkbookBuffer } from "@/lib/request-export-workbook";
import type { OrderRequest } from "@/lib/types";

describe("request XLSX export", () => {
  it("creates a readable workbook with the expected headers and request row", async () => {
    const request: OrderRequest = {
      id: "request-1",
      attachments: [],
      clientName: "QA Client",
      contactMethod: "Email",
      contactValue: "qa@example.test",
      serviceId: "service-1",
      serviceTitle: "Айдентика",
      packageId: "package-1",
      packageTitle: "Старт",
      packageDescription: "",
      packagePriceFrom: 25000,
      packagePriceTo: 45000,
      packageDurationFromDays: 7,
      packageDurationToDays: 12,
      selectedAddons: [],
      referenceProjectId: null,
      referenceProjectTitle: "",
      referenceProjectSlug: "",
      resultDescription: "Нужен фирменный стиль",
      stylePreferences: "",
      materials: "",
      desiredDeadline: "",
      estimatedPriceFrom: 25000,
      estimatedPriceTo: 45000,
      estimatedDurationFromDays: 7,
      estimatedDurationToDays: 12,
      comment: "",
      status: "new",
      createdAt: "2026-06-19T10:00:00.000Z"
    };

    const buffer = await createRequestsWorkbookBuffer([request]);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet("Заявки");

    expect(sheet).toBeDefined();
    expect(sheet?.getRow(1).values).toEqual([
      undefined,
      "Дата",
      "Клиент",
      "Способ связи",
      "Контакт",
      "Услуга",
      "Пакет",
      "Предварительная стоимость",
      "Предварительный срок",
      "Статус",
      "Ожидаемый результат"
    ]);
    expect(sheet?.getRow(2).getCell(2).value).toBe("QA Client");
    expect(sheet?.getRow(2).getCell(6).value).toBe("Старт");
    expect(sheet?.getRow(2).getCell(10).value).toBe("Нужен фирменный стиль");
  });
});
