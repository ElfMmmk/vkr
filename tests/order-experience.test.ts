import { describe, expect, it } from "vitest";

import {
  ORDER_DRAFT_VERSION,
  appendBriefChip,
  parseOrderDraft
} from "@/lib/order-draft";
import { parsePackageIncludedItems } from "@/lib/service-package-marketing";
import {
  MAX_ORDER_ATTACHMENT_BYTES,
  MAX_ORDER_ATTACHMENT_COUNT,
  validateOrderAttachmentFile,
  validateOrderAttachmentList
} from "@/lib/order-attachments";
import {
  CLAIM_TOKEN_TTL_HOURS,
  createClaimTokenExpiresAt,
  hashClaimToken,
  isClaimTokenExpired
} from "@/lib/request-claim";
import {
  deleteOrderAttachmentFile,
  uploadOrderAttachmentFiles
} from "@/lib/order-attachment-storage";
import {
  quizAnswersToBrief,
  recommendOrderSetup,
  type OrderQuizAnswers
} from "@/lib/order-quiz";
import { findFirstInvalidStepBeforeTarget } from "@/lib/order-step-navigation";
import { buildRequestTimeline } from "@/lib/request-timeline";
import {
  formatDurationRange,
  formatPriceRange
} from "@/lib/order-calculator";
import {
  contractFeedbackRoleLabels,
  contractStatusLabels
} from "@/lib/contract-status";
import type { OrderRequest, Service } from "@/lib/types";

const services: Service[] = [
  {
    id: "svc-brand",
    title: "Айдентика бренда",
    slug: "brand-identity",
    description: "",
    details: "",
    displayOrder: 10,
    isActive: true,
    packages: [
      {
        id: "pkg-brand-start",
        serviceId: "svc-brand",
        title: "Старт",
        description: "",
        badge: "",
        bestFor: "",
        outcome: "",
        includedItems: [],
        priceFrom: 25000,
        priceTo: 45000,
        durationFromDays: 7,
        durationToDays: 12,
        displayOrder: 10,
        isActive: true,
        isRecommended: false,
        recommendationTags: {}
      }
    ],
    addons: []
  },
  {
    id: "svc-presentation",
    title: "Презентация",
    slug: "presentation-design",
    description: "",
    details: "",
    displayOrder: 20,
    isActive: true,
    packages: [
      {
        id: "pkg-presentation-start",
        serviceId: "svc-presentation",
        title: "Старт",
        description: "",
        badge: "",
        bestFor: "",
        outcome: "",
        includedItems: [],
        priceFrom: 15000,
        priceTo: 30000,
        durationFromDays: 5,
        durationToDays: 8,
        displayOrder: 10,
        isActive: true,
        isRecommended: false,
        recommendationTags: {}
      }
    ],
    addons: []
  }
];

describe("order experience helpers", () => {
  it("parses package included items from textarea without blank rows", () => {
    expect(parsePackageIncludedItems("Logo\n\n Palette \r\nLogo\n  Brand guide  ")).toEqual([
      "Logo",
      "Palette",
      "Brand guide"
    ]);
  });

  it("builds a dated client request timeline from request events", () => {
    const request: OrderRequest = {
      id: "request-1",
      attachments: [
        {
          id: "attachment-1",
          requestId: "request-1",
          storagePath: "request-1/brief.pdf",
          fileName: "brief.pdf",
          contentType: "application/pdf",
          size: 1000,
          createdAt: "2026-06-06T10:30:00.000Z"
        }
      ],
      clientName: "QA Client",
      contactMethod: "Email",
      contactValue: "qa@example.test",
      serviceId: "service-1",
      serviceTitle: "Identity",
      packageId: "package-1",
      packageTitle: "System",
      packageDescription: "",
      packagePriceFrom: 100,
      packagePriceTo: 200,
      packageDurationFromDays: 3,
      packageDurationToDays: 5,
      selectedAddons: [],
      referenceProjectId: null,
      referenceProjectTitle: "",
      referenceProjectSlug: "",
      resultDescription: "Detailed brief",
      stylePreferences: "Minimal",
      materials: "",
      desiredDeadline: "",
      estimatedPriceFrom: 100,
      estimatedPriceTo: 200,
      estimatedDurationFromDays: 3,
      estimatedDurationToDays: 5,
      comment: "",
      status: "approved",
      createdAt: "2026-06-06T10:00:00.000Z",
      contract: {
        id: "contract-1",
        requestId: "request-1",
        finalPrice: 180,
        finalDurationDays: 4,
        workScope: "Scope",
        materials: "",
        managerComment: "",
        status: "accepted",
        acceptedAt: "2026-06-06T12:00:00.000Z",
        createdAt: "2026-06-06T11:00:00.000Z",
        updatedAt: "2026-06-06T11:45:00.000Z",
        feedback: [
          {
            id: "feedback-1",
            contractId: "contract-1",
            requestId: "request-1",
            authorRole: "client",
            message: "Комментарий без смены статуса.",
            createdAt: "2026-06-06T11:40:00.000Z"
          }
        ]
      },
      statusHistory: [
        {
          id: "history-1",
          requestId: "request-1",
          fromStatus: "new",
          toStatus: "in_progress",
          changedByRole: "manager",
          createdAt: "2026-06-06T10:20:00.000Z"
        },
        {
          id: "history-2",
          requestId: "request-1",
          fromStatus: "in_progress",
          toStatus: "approved",
          changedByRole: "manager",
          createdAt: "2026-06-06T11:30:00.000Z"
        }
      ]
    };

    expect(buildRequestTimeline(request).map((event) => event.title)).toEqual([
      "Условия приняты",
      "Условия обновлены и отправлены",
      "Статус: Согласована",
      "Условия отправлены на согласование",
      "Материал загружен",
      "Статус: В обработке",
      "Заявка создана"
    ]);
  });

  it("formats public price and timing ranges for the selected locale", () => {
    expect(formatPriceRange(25000, 45000, "en")).toBe("RUB 25,000 – RUB 45,000");
    expect(formatDurationRange(10, 18, "en")).toBe("10 – 18 business days");
    expect(formatPriceRange(null, null, "en")).toBe("Price to be confirmed");
    expect(formatDurationRange(null, null, "en")).toBe("Timing to be confirmed");
  });

  it("blocks forward step jumps until every previous order step is valid", () => {
    const stepIds = ["service", "extras", "brief", "contact", "review"] as const;
    const invalidStep = findFirstInvalidStepBeforeTarget(4, stepIds, (stepId) =>
      stepId === "brief" ? "Заполните бриф." : null
    );

    expect(invalidStep).toEqual({
      error: "Заполните бриф.",
      index: 2,
      stepId: "brief"
    });
    expect(
      findFirstInvalidStepBeforeTarget(2, stepIds, (stepId) =>
        stepId === "contact" ? "Укажите контакт." : null
      )
    ).toBeNull();
    expect(
      findFirstInvalidStepBeforeTarget(0, stepIds, () => "Даже не проверяем текущий шаг")
    ).toBeNull();
  });

  it("uses client-facing order status and feedback role labels", () => {
    expect(contractStatusLabels).toMatchObject({
      draft: "Черновик",
      sent: "На согласовании",
      revision_requested: "На доработке",
      accepted: "Принят",
      cancelled: "Отменён"
    });
    expect(contractFeedbackRoleLabels).toEqual({
      client: "Клиент",
      manager: "Дизайнер",
      admin: "Дизайнер"
    });
  });

  it("parses only compatible order drafts", () => {
    expect(parseOrderDraft("not json")).toBeNull();
    expect(parseOrderDraft(JSON.stringify({ version: 999 }))).toBeNull();

    const draft = parseOrderDraft(
      JSON.stringify({
        version: ORDER_DRAFT_VERSION,
        stepId: "brief",
        values: {
          clientName: "Анна",
          contactMethod: "Email",
          contactValue: "anna@example.test",
          serviceId: "svc-brand",
          packageId: "pkg-brand-start",
          addonIds: ["addon-fast"],
          referenceProjectId: "",
          resultDescription: "Нужна айдентика для кофейни.",
          stylePreferences: "Спокойно и премиально.",
          materials: "Есть логотип.",
          desiredDeadline: "до конца месяца",
          comment: ""
        },
        quizAnswers: {
          taskType: "brand",
          goal: "launch",
          urgency: "standard",
          materials: "partial",
          scope: "full"
        }
      })
    );

    expect(draft?.stepId).toBe("brief");
    expect(draft?.values.clientName).toBe("Анна");
    expect(draft?.values.addonIds).toEqual(["addon-fast"]);
    expect(draft?.quizAnswers?.taskType).toBe("brand");
  });

  it("migrates six-step version 1 drafts to the combined service step", () => {
    const draft = parseOrderDraft(
      JSON.stringify({
        version: 1,
        stepId: "package",
        values: {
          clientName: "Анна",
          contactMethod: "Телефон",
          contactValue: "+7 999 123-45-67",
          serviceId: "svc-brand",
          packageId: "pkg-brand-logo",
          addonIds: [],
          referenceProjectId: "",
          resultDescription: "",
          stylePreferences: "",
          materials: "",
          desiredDeadline: "",
          comment: ""
        }
      })
    );

    expect(ORDER_DRAFT_VERSION).toBe(2);
    expect(draft?.version).toBe(2);
    expect(draft?.stepId).toBe("service");
    expect(draft?.values.packageId).toBe("pkg-brand-logo");
  });

  it("appends brief chips without removing custom text or duplicating phrases", () => {
    const first = appendBriefChip("Нужен логотип", "брендбук");
    const second = appendBriefChip(first, "брендбук");

    expect(first).toBe("Нужен логотип, брендбук");
    expect(second).toBe("Нужен логотип, брендбук");
    expect(appendBriefChip("", "минимализм")).toBe("минимализм");
    expect(appendBriefChip("Нужен логотип.", "брендбук")).toBe("Нужен логотип. брендбук");
    expect(appendBriefChip("Нужен логотип, ", "брендбук")).toBe("Нужен логотип, брендбук");
    expect(appendBriefChip("Нужен логотип; ", "брендбук")).toBe("Нужен логотип, брендбук");
  });

  it("does not invent a contract resend when acceptance updates the contract", () => {
    const request: OrderRequest = {
      id: "request-accepted",
      attachments: [],
      clientName: "QA Client",
      contactMethod: "Email",
      contactValue: "qa@example.test",
      serviceId: "service-1",
      serviceTitle: "Identity",
      packageId: "package-1",
      packageTitle: "System",
      packageDescription: "",
      packagePriceFrom: 100,
      packagePriceTo: 200,
      packageDurationFromDays: 3,
      packageDurationToDays: 5,
      selectedAddons: [],
      referenceProjectId: null,
      referenceProjectTitle: "",
      referenceProjectSlug: "",
      resultDescription: "Detailed brief",
      stylePreferences: "Minimal",
      materials: "",
      desiredDeadline: "",
      estimatedPriceFrom: 100,
      estimatedPriceTo: 200,
      estimatedDurationFromDays: 3,
      estimatedDurationToDays: 5,
      comment: "",
      status: "approved",
      createdAt: "2026-06-06T10:00:00.000Z",
      contract: {
        id: "contract-accepted",
        requestId: "request-accepted",
        finalPrice: 180,
        finalDurationDays: 4,
        workScope: "Scope",
        materials: "",
        managerComment: "",
        status: "accepted",
        acceptedAt: "2026-06-06T12:00:00.000Z",
        createdAt: "2026-06-06T11:00:00.000Z",
        updatedAt: "2026-06-06T12:00:00.000Z",
        feedback: [
          {
            id: "feedback-accepted",
            contractId: "contract-accepted",
            requestId: "request-accepted",
            authorRole: "client",
            message: "Please adjust the scope.",
            createdAt: "2026-06-06T11:40:00.000Z"
          }
        ]
      },
      statusHistory: []
    };

    const titles = buildRequestTimeline(request).map((event) => event.title);

    expect(titles).toContain("Условия приняты");
    expect(titles).not.toContain("Условия обновлены и отправлены");
  });

  it("recommends an existing service and first active package from quiz answers", () => {
    const answers: OrderQuizAnswers = {
      taskType: "presentation",
      goal: "sell",
      urgency: "standard",
      materials: "ready",
      scope: "single"
    };

    expect(recommendOrderSetup(answers, services)).toEqual({
      serviceId: "svc-presentation",
      packageId: "pkg-presentation-start"
    });
    expect(quizAnswersToBrief(answers, "en")).toBe(
      "Task: a presentation for sales and presenting an offer; source materials are ready."
    );
  });

  it("validates private order attachment file type, size and count", () => {
    expect(
      validateOrderAttachmentFile({
        name: "brief.pdf",
        size: 1024,
        type: "application/pdf"
      })
    ).toBeNull();
    expect(
      validateOrderAttachmentFile({
        name: "script.exe",
        size: 1024,
        type: "application/x-msdownload"
      })
    ).toContain("PDF");
    expect(
      validateOrderAttachmentFile({
        name: "large.pdf",
        size: MAX_ORDER_ATTACHMENT_BYTES + 1,
        type: "application/pdf"
      })
    ).toContain("10 МБ");
    expect(
      validateOrderAttachmentList(
        Array.from({ length: MAX_ORDER_ATTACHMENT_COUNT + 1 }, (_, index) => ({
          name: `file-${index}.txt`,
          size: 100,
          type: "text/plain"
        }))
      )
    ).toContain("5 файлов");
  });

  it("removes uploaded attachment metadata when a later file upload fails", async () => {
    const removedStoragePaths: string[][] = [];
    const deletedAttachmentIds: string[] = [];
    let uploadCalls = 0;

    const client = {
      storage: {
        from: () => ({
          upload: async () => {
            uploadCalls += 1;

            if (uploadCalls === 2) {
              return { error: new Error("upload failed") };
            }

            return { error: null };
          },
          remove: async (paths: string[]) => {
            removedStoragePaths.push(paths);

            return { error: null };
          }
        })
      },
      from: () => ({
        insert: (payload: Record<string, unknown>) => ({
          select: () => ({
            single: async () => ({
              data: {
                id: "attachment-1",
                created_at: "2026-06-06T10:00:00.000Z",
                ...payload
              },
              error: null
            })
          })
        }),
        delete: () => ({
          in: async (_column: string, ids: string[]) => {
            deletedAttachmentIds.push(...ids);

            return { error: null };
          }
        })
      })
    };

    const result = await uploadOrderAttachmentFiles(client as never, {
      clientUserId: "client-1",
      files: [
        {
          arrayBuffer: async () => new ArrayBuffer(8),
          name: "brief.txt",
          size: 8,
          type: "text/plain"
        } as File,
        {
          arrayBuffer: async () => new ArrayBuffer(8),
          name: "brand.pdf",
          size: 8,
          type: "application/pdf"
        } as File
      ],
      requestId: "request-1"
    });

    expect(result.ok).toBe(false);
    expect(deletedAttachmentIds).toEqual(["attachment-1"]);
    expect(removedStoragePaths).toHaveLength(1);
    expect(removedStoragePaths[0]?.[0]).toMatch(/^request-1\/.+\.txt$/);
  });

  it("deletes an order attachment from storage and metadata", async () => {
    const removedStoragePaths: string[][] = [];
    const deletedAttachmentIds: string[] = [];

    const client = {
      from: (table: string) => ({
        select: () => ({
          eq: (_column: string, value: string) => ({
            maybeSingle: async () => ({
              data: table === "order_attachments"
                ? {
                    id: value,
                    request_id: "request-1",
                    client_user_id: "client-1",
                    storage_path: "request-1/brief.pdf"
                  }
                : null,
              error: null
            })
          })
        }),
        delete: () => ({
          eq: async (_column: string, id: string) => {
            deletedAttachmentIds.push(id);

            return { error: null };
          }
        })
      }),
      storage: {
        from: () => ({
          remove: async (paths: string[]) => {
            removedStoragePaths.push(paths);

            return { error: null };
          }
        })
      }
    };

    const result = await deleteOrderAttachmentFile(client as never, {
      actorUserId: "client-1",
      attachmentId: "attachment-1",
      canDeleteAny: false
    });

    expect(result).toEqual({ ok: true, requestId: "request-1" });
    expect(removedStoragePaths).toEqual([["request-1/brief.pdf"]]);
    expect(deletedAttachmentIds).toEqual(["attachment-1"]);
  });

  it("hashes claim tokens and treats them as expired after ttl", () => {
    const now = new Date("2026-06-06T10:00:00.000Z");
    const expiresAt = createClaimTokenExpiresAt(now);

    expect(hashClaimToken("secret-token")).toHaveLength(64);
    expect(hashClaimToken("secret-token")).toBe(hashClaimToken("secret-token"));
    expect(expiresAt).toBe("2026-06-07T10:00:00.000Z");
    expect(CLAIM_TOKEN_TTL_HOURS).toBe(24);
    expect(isClaimTokenExpired(expiresAt, new Date("2026-06-07T09:59:59.000Z"))).toBe(false);
    expect(isClaimTokenExpired(expiresAt, new Date("2026-06-07T10:00:01.000Z"))).toBe(true);
  });
});
