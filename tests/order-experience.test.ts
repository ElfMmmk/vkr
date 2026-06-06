import { describe, expect, it } from "vitest";

import {
  ORDER_DRAFT_VERSION,
  appendBriefChip,
  parseOrderDraft
} from "@/lib/order-draft";
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
import { uploadOrderAttachmentFiles } from "@/lib/order-attachment-storage";
import { recommendOrderSetup, type OrderQuizAnswers } from "@/lib/order-quiz";
import type { Service } from "@/lib/types";

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
        priceFrom: 25000,
        priceTo: 45000,
        durationFromDays: 7,
        durationToDays: 12,
        displayOrder: 10,
        isActive: true
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
        priceFrom: 15000,
        priceTo: 30000,
        durationFromDays: 5,
        durationToDays: 8,
        displayOrder: 10,
        isActive: true
      }
    ],
    addons: []
  }
];

describe("order experience helpers", () => {
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

  it("appends brief chips without removing custom text or duplicating phrases", () => {
    const first = appendBriefChip("Нужен логотип", "брендбук");
    const second = appendBriefChip(first, "брендбук");

    expect(first).toBe("Нужен логотип, брендбук");
    expect(second).toBe("Нужен логотип, брендбук");
    expect(appendBriefChip("", "минимализм")).toBe("минимализм");
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
