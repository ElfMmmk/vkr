import { describe, expect, it } from "vitest";

import { localizeNotificationBody } from "@/lib/data/notifications";
import type { AdminNotification } from "@/lib/types";

function notification(body: string): AdminNotification {
  return {
    id: "notification-1",
    type: "request_status_changed",
    title: "Статус заявки изменён",
    body,
    entityType: "request",
    entityId: "request-1",
    audienceRole: "manager",
    createdAt: "2026-06-15T20:00:00.000Z",
    readAt: null
  };
}

describe("notification copy", () => {
  it("localizes legacy request status bodies", () => {
    expect(localizeNotificationBody(notification("Заявка переведена в статус approved."))).toBe(
      "Заявка переведена в статус «Согласована»."
    );
    expect(localizeNotificationBody(notification("Заявка переведена в статус in_progress."))).toBe(
      "Заявка переведена в статус «В обработке»."
    );
    expect(localizeNotificationBody(notification("Заявка переведена в статус in_work."))).toBe(
      "Заявка переведена в статус «В работе»."
    );
  });
});
