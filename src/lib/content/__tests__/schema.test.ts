import { describe, expect, it } from "vitest";

import { loadWorkspace } from "@/lib/content";

describe("content schema", () => {
  const documents = loadWorkspace();

  it("carrega todos os módulos do workspace", () => {
    expect(documents).not.toHaveLength(0);
    const moduleSlugs = documents.map((document) => document.module.slug);
    expect(moduleSlugs).toContain("clubinho-das-palavras");
    expect(moduleSlugs).toContain("estudio-dados-solidarios");
  });

  it("normaliza metadados de módulo a partir do caminho", () => {
    const historias = documents.find(
      (document) => document.module.slug === "historias-em-movimento"
    );
    expect(historias).toBeDefined();
    expect(historias?.module.stage).toBe("ei");
    expect(historias?.module.subjectSlug).toBe("linguagens");
    expect(historias?.module.learningOutcomes).toHaveLength(3);
  });

  it("garante que atividades usem dificuldades na nova taxonomia", () => {
    const rota = documents.find((document) => document.module.slug === "rota-das-operacoes");
    expect(rota).toBeDefined();
    const activity = rota?.activities.find(
      (item) => item.slug === "missao-equipes-multiplicadoras"
    );
    expect(activity?.difficulty).toBe("PRATICAR");
    expect(activity?.bncc.habilidades).toContain("EF05MA08");
  });
});
