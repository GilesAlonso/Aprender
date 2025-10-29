import { describe, expect, it } from "vitest";

import { lintWorkspace } from "@/lib/content";

describe("content lint", () => {
  it("valida o workspace sem erros", () => {
    const result = lintWorkspace();
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.modules.length).toBeGreaterThan(0);
  });

  it("filtra o lint por estágio e componente curricular", () => {
    const result = lintWorkspace({ stage: "ef01", subjectSlug: "lingua-portuguesa" });

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.modules.length).toBeGreaterThan(0);

    const stages = new Set(result.modules.map((document) => document.module.stage));
    const subjects = new Set(result.modules.map((document) => document.module.subjectSlug));

    expect(stages.size).toBe(1);
    expect(stages.has("ef01")).toBe(true);
    expect(subjects.size).toBe(1);
    expect(subjects.has("lingua-portuguesa")).toBe(true);
  });

  it("filtra o lint por slugs específicos", () => {
    const result = lintWorkspace({
      modules: ["bilhetes-e-recados", "palavras-em-acao"],
    });

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);

    const slugs = result.modules.map((document) => document.module.slug).sort();
    expect(slugs).toEqual(["bilhetes-e-recados", "palavras-em-acao"].sort());
  });

  it("reporta erro quando um slug não existe", () => {
    const result = lintWorkspace({ modules: ["slug-inexistente"] });

    expect(result.errors).toHaveLength(1);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors[0]?.filePath).toBe("(workspace)");
    expect(result.errors[0]?.message).toContain("Slug de módulo desconhecido");
    expect(result.modules).toHaveLength(0);
  });
});
