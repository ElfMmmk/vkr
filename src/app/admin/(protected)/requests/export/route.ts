import ExcelJS from "exceljs";
import type { NextRequest } from "next/server";

import { requireRequestManager } from "@/lib/auth";
import { listAdminRequests } from "@/lib/data/admin";
import { formatDurationRange, formatPriceRange } from "@/lib/order-calculator";
import { requestStatusLabels } from "@/lib/request-status";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<Response> {
  await requireRequestManager();
  const searchParams = request.nextUrl.searchParams;
  const requests = await listAdminRequests({
    query: searchParams.get("query") ?? undefined,
    serviceId: searchParams.get("serviceId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sort: searchParams.get("sort") === "oldest" ? "oldest" : "newest",
    limit: null
  });
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

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `requests-${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "no-store"
    }
  });
}
