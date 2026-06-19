import { describe, expect, it } from "vitest";

import { cleanupUploadedImage } from "@/lib/image-upload-cleanup";

describe("image upload rollback", () => {
  it("removes translation rows, image metadata and the storage object", async () => {
    const deletedTables: string[] = [];
    const removedPaths: string[][] = [];
    const client = {
      from: (table: string) => ({
        delete: () => ({
          eq: (_column: string, _value: string) => {
            deletedTables.push(table);

            return table === "entity_translations"
              ? {
                  eq: async () => ({ error: null })
                }
              : Promise.resolve({ error: null });
          }
        })
      }),
      storage: {
        from: (bucket: string) => {
          expect(bucket).toBe("portfolio-images");

          return {
            remove: async (paths: string[]) => {
              removedPaths.push(paths);

              return { error: null };
            }
          };
        }
      }
    };

    const errors = await cleanupUploadedImage(client as never, {
      imageId: "image-1",
      storagePath: "uploads/image-1.webp"
    });

    expect(errors).toEqual([]);
    expect(deletedTables).toEqual(["entity_translations", "images"]);
    expect(removedPaths).toEqual([["uploads/image-1.webp"]]);
  });

  it("continues cleanup and reports every failed cleanup operation", async () => {
    const client = {
      from: (table: string) => ({
        delete: () => ({
          eq: () =>
            table === "entity_translations"
              ? {
                  eq: async () => ({ error: new Error("translation cleanup failed") })
                }
              : Promise.resolve({ error: new Error("metadata cleanup failed") })
        })
      }),
      storage: {
        from: () => ({
          remove: async () => ({ error: new Error("storage cleanup failed") })
        })
      }
    };

    const errors = await cleanupUploadedImage(client as never, {
      imageId: "image-1",
      storagePath: "uploads/image-1.webp"
    });

    expect(errors.map((item) => item.stage)).toEqual([
      "translation",
      "metadata",
      "storage"
    ]);
  });
});
