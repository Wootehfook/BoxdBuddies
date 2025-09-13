import { describe, it, expect } from "vitest";

import { normalizeTitleForSearch } from "../letterboxd/compare/index.ts";

describe("normalizeTitleForSearch", () => {
  it("decodes numeric entity fragment and double-escaped entity", () => {
    const a = normalizeTitleForSearch("The World#039;s End");
    const b = normalizeTitleForSearch("The World&amp;#039;s End");
    const c = normalizeTitleForSearch("The World’s End");

    expect(a.normalized).toBe("The World's End");
    expect(b.normalized).toBe("The World's End");
    expect(c.normalized).toBe("The World's End");
  });
  it("strips ampersands and collapses whitespace", () => {
    const a = normalizeTitleForSearch("Tom &amp; Jerry");
    const b = normalizeTitleForSearch("Tom & Jerry");
    expect(a.normalized).toBe("Tom & Jerry");
    expect(b.normalized).toBe("Tom & Jerry");
  });
  it("removes space before apostrophes from numeric fragments", () => {
    const a = normalizeTitleForSearch("The World #039;s End");
    const b = normalizeTitleForSearch("The World &#039;s End");
    expect(a.normalized).toBe("The World's End");
    expect(b.normalized).toBe("The World's End");
  });
});
