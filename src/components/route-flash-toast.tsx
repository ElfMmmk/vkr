"use client";

import { CheckCircle2, Info, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ToastTone = "success" | "error" | "info";

const routeNotices: Record<string, { message: string; tone: ToastTone }> = {
  "signed-in": { message: "Вы вошли в кабинет", tone: "success" },
  "admin-signed-in": { message: "Вход в административную панель выполнен", tone: "success" },
  "registered": { message: "Кабинет создан", tone: "success" },
  "signed-out": { message: "Вы вышли из кабинета", tone: "info" },
  "service-saved": { message: "Услуга сохранена", tone: "success" },
  "service-deleted": { message: "Услуга удалена", tone: "success" },
  "service-package-saved": { message: "Пакет услуги сохранён", tone: "success" },
  "service-package-deleted": { message: "Пакет услуги удалён", tone: "success" },
  "service-addon-saved": { message: "Доплата сохранена", tone: "success" },
  "service-addon-deleted": { message: "Доплата удалена", tone: "success" },
  "services-reordered": { message: "Порядок услуг сохранён", tone: "success" },
  "tag-saved": { message: "Тег сохранён", tone: "success" },
  "tag-deleted": { message: "Тег удалён", tone: "success" },
  "project-saved": { message: "Проект сохранён", tone: "success" },
  "project-deleted": { message: "Проект удалён", tone: "success" },
  "projects-reordered": { message: "Порядок проектов сохранён", tone: "success" },
  "request-status-updated": { message: "Статус заявки сохранён", tone: "success" },
  "request-deleted": { message: "Заявка удалена", tone: "success" },
  "order-contract-saved": { message: "Договор-заказ сохранён", tone: "success" },
  "order-contract-locked": { message: "Принятый договор-заказ нельзя изменить", tone: "info" },
  "order-contract-accepted": { message: "Договор-заказ принят", tone: "success" },
  "order-contract-accept-failed": { message: "Не удалось принять договор-заказ. Обновите страницу и попробуйте ещё раз.", tone: "error" },
  "image-deleted": { message: "Изображение удалено", tone: "success" },
  "notification-read": { message: "Уведомление отмечено как прочитанное", tone: "success" },
  "user-role-updated": { message: "Роль пользователя сохранена", tone: "success" }
};

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  error: "border-accent/30 bg-accent/10 text-accent",
  info: "border-cobalt/25 bg-cobalt/10 text-cobalt"
};

const toneIcons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
};

export function ToastMessage({
  message,
  tone = "success"
}: {
  message?: string;
  tone?: ToastTone;
}) {
  const [visible, setVisible] = useState(true);
  const Icon = toneIcons[tone];

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeout = window.setTimeout(() => setVisible(false), 3600);

    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed right-4 top-4 z-50 flex max-w-sm items-start gap-3 border px-4 py-3 text-sm leading-6 shadow-soft ${toneStyles[tone]}`}
      role={tone === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function RouteFlashToastContent() {
  const searchParams = useSearchParams();
  const notice = searchParams.get("notice");
  const config = notice ? routeNotices[notice] : undefined;

  if (!config) {
    return null;
  }

  return <ToastMessage key={notice} message={config.message} tone={config.tone} />;
}

export function RouteFlashToast() {
  return (
    <Suspense fallback={null}>
      <RouteFlashToastContent />
    </Suspense>
  );
}
