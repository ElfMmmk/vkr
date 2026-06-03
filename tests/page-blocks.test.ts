import { describe, expect, it } from "vitest";

import {
  movePageBlockRow,
  movePageBlockRowByIndex,
  pageBlocksToRows,
  rowsToPageBlocks,
  serializePageBlockRows
} from "@/lib/page-blocks";

describe("page block helpers", () => {
  it("converts saved blocks into stable editable rows", () => {
    expect(pageBlocksToRows({ intro: "Intro", details: "Details" }, "page-home")).toEqual([
      { id: "page-home-intro", key: "intro", value: "Intro" },
      { id: "page-home-details", key: "details", value: "Details" }
    ]);
  });

  it("omits rows with empty keys when serializing", () => {
    expect(
      rowsToPageBlocks([
        { id: "1", key: "intro", value: "Intro" },
        { id: "2", key: "   ", value: "Ignored" },
        { id: "3", key: "", value: "Also ignored" }
      ])
    ).toEqual({ intro: "Intro" });
  });

  it("keeps block order and lets the last duplicate key win", () => {
    const blocks = rowsToPageBlocks([
      { id: "1", key: "first", value: "First" },
      { id: "2", key: "second", value: "Second" },
      { id: "3", key: "first", value: "Updated first" }
    ]);

    expect(Object.keys(blocks)).toEqual(["first", "second"]);
    expect(blocks).toEqual({ first: "Updated first", second: "Second" });
  });

  it("preserves values when rows are reordered", () => {
    const rows = [
      { id: "intro", key: "intro", value: "Intro" },
      { id: "process", key: "process", value: "Process" },
      { id: "cta", key: "cta", value: "CTA" }
    ];

    const movedByDrop = movePageBlockRow(rows, "cta", "intro");
    expect(movedByDrop.map((row) => row.value)).toEqual(["CTA", "Intro", "Process"]);

    const movedByButton = movePageBlockRowByIndex(movedByDrop, 0, 1);
    expect(movedByButton.map((row) => row.value)).toEqual(["Intro", "CTA", "Process"]);
  });

  it("serializes rows into JSON for the existing server action", () => {
    expect(
      serializePageBlockRows([
        { id: "1", key: "intro", value: "Intro" },
        { id: "2", key: "details", value: "Details" }
      ])
    ).toBe('{"intro":"Intro","details":"Details"}');
  });
});
