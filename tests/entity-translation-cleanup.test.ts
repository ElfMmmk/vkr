import { describe, expect, it } from "vitest";

import { deleteEntityTranslations } from "@/lib/entity-translation-cleanup";

describe("entity translation cleanup", () => {
  it("deletes every locale for grouped entity references", async () => {
    const calls: Array<{ entityType: string; ids: string[] }> = [];
    const client = {
      from: (table: string) => {
        expect(table).toBe("entity_translations");

        return {
          delete: () => ({
            eq: (_column: string, entityType: string) => ({
              in: async (_idColumn: string, ids: string[]) => {
                calls.push({ entityType, ids });

                return { error: null };
              }
            })
          })
        };
      }
    };

    await deleteEntityTranslations(client as never, [
      { entityType: "service", entityId: "service-1" },
      { entityType: "service_package", entityId: "package-1" },
      { entityType: "service_package", entityId: "package-2" },
      { entityType: "service_addon", entityId: "addon-1" }
    ]);

    expect(calls).toEqual([
      { entityType: "service", ids: ["service-1"] },
      { entityType: "service_package", ids: ["package-1", "package-2"] },
      { entityType: "service_addon", ids: ["addon-1"] }
    ]);
  });

  it("throws when cleanup cannot remove a translation group", async () => {
    const client = {
      from: () => ({
        delete: () => ({
          eq: () => ({
            in: async () => ({ error: new Error("cleanup failed") })
          })
        })
      })
    };

    await expect(
      deleteEntityTranslations(client as never, [
        { entityType: "project", entityId: "project-1" }
      ])
    ).rejects.toThrow("cleanup failed");
  });
});
