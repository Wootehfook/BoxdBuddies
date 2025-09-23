// AI Generated: GitHub Copilot - 2025-09-18
import { describe, it, expect } from "vitest";

// This test asserts the SQL condition used to select "missing" genre rows.
// We can't run SQL here, but we validate the predicate strings used in the code
// match the intended patterns. If the code embeds this SQL, the string should
// contain the alphabetic check and null/empty checks.

import fs from "fs";
import path from "path";

describe("backfill selection SQL", () => {
  it("contains alphabetic character check and empty/null/array checks", () => {
    const filePath = path.resolve(
      process.cwd(),
      "functions",
      "admin",
      "tmdb-sync",
      "index.ts"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const src = fs.readFileSync(filePath, "utf8");

    // Check for the NOT GLOB alphabetic check we added
    expect(
      src.includes("NOT GLOB '*[A-Za-z]*'") ||
        src.includes('NOT GLOB "*[A-Za-z]*"')
    ).toBe(true);

    // Check for conditions matching empty array or '[]' or 'null' or NULL
    expect(src.match(/genres\s+IS\s+NULL/)).toBeTruthy();
    expect(src.includes("genres = '[]'") || src.includes('genres = "[]"')).toBe(
      true
    );
  });
});
