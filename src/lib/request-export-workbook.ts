import ExcelJS from "exceljs";

import {
  formatDurationRange,
  formatPriceRange
} from "@/lib/order-calculator";
import { requestStatusLabels } from "@/lib/request-status";
import type { OrderRequest } from "@/lib/types";

export function createRequestsWorkbook(requests: OrderRequest[]): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Graphic Designer Portfolio";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Заявки");

  sheet.columns = [
    { header: "Дата", key: "createdAt", width: 22 },
    { header: "Клиент", key: "clientName", width: 28 },
    { header: "Способ связи", key: "contactMethod", width: 18 },
    { header: "Контакт", key: "contactValue", width: 30 },
    { header: "Услуга", key: "serviceTitle", width: 30 },
    { header: "Пакет", key: "packageTitle", width: 24 },
    { header: "Предварительная стоимость", key: "estimatePrice", width: 26 },
    { header: "Предварительный срок", key: "estimateDuration", width: 24 },
    { header: "Статус", key: "status", width: 18 },
    { header: "Ожидаемый результат", key: "resultDescription", width: 60 }
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: "middle" };

  for (const item of requests) {
    sheet.addRow({
      createdAt: new Date(item.createdAt).toLocaleString("ru-RU"),
      clientName: item.clientName,
      contactMethod: item.contactMethod,
      contactValue: item.contactValue,
      serviceTitle: item.serviceTitle || "Не выбрана",
      packageTitle: item.packageTitle || "Не выбран",
      estimatePrice: formatPriceRange(item.estimatedPriceFrom, item.estimatedPriceTo),
      estimateDuration: formatDurationRange(
        item.estimatedDurationFromDays,
        item.estimatedDurationToDays
      ),
      status: requestStatusLabels[item.status],
      resultDescription: item.resultDescription || item.comment
    });
  }

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { vertical: "top", wrapText: true };
    });
  });

  return workbook;
}

export async function createRequestsWorkbookBuffer(
  requests: OrderRequest[]
): Promise<ArrayBuffer> {
  return createRequestsWorkbook(requests).xlsx.writeBuffer();
}
