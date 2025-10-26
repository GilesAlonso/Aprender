import { describe, expect, it } from "vitest";

import { lintWorkspace } from "@/lib/content";

describe("content lint", () => {
  it("valida o workspace sem erros", () => {
    const result = lintWorkspace();
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.modules.length).toBeGreaterThan(0);
  });
});
