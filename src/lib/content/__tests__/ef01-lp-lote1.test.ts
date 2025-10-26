import { describe, expect, it } from "vitest";

import { loadWorkspace } from "@/lib/content";

const NEW_MODULE_SLUGS = [
  "brincando-com-sons",
  "familia-das-vogais",
  "palavras-em-acao",
  "frases-divertidas",
  "bilhetes-e-recados",
];

const REQUIRED_HABILIDADES = [
  "EF01LP01",
  "EF01LP02",
  "EF01LP03",
  "EF01LP04",
  "EF01LP05",
  "EF01LP06",
  "EF01LP07",
  "EF01LP08",
  "EF01LP09",
  "EF01LP10",
];

describe("EF01 LP lote 1", () => {
  const workspace = loadWorkspace();
  const newModules = workspace.filter((document) =>
    NEW_MODULE_SLUGS.includes(document.module.slug)
  );

  it("produz pelo menos 60 atividades novas", () => {
    expect(newModules).toHaveLength(NEW_MODULE_SLUGS.length);
    const activityTotal = newModules.reduce(
      (total, document) => total + document.activities.length,
      0
    );
    expect(activityTotal).toBeGreaterThanOrEqual(60);

    newModules.forEach((document) => {
      expect(document.activities.length).toBeGreaterThanOrEqual(12);
    });
  });

  it("garante metadados de acessibilidade completos nas novas atividades", () => {
    for (const document of newModules) {
      for (const activity of document.activities) {
        expect(activity.accessibility).toBeDefined();
        expect(activity.accessibility?.hints?.length ?? 0).toBeGreaterThan(0);
        expect(activity.accessibility?.feedback).toBeDefined();
        expect(Object.keys(activity.accessibility?.feedback ?? {}).length).toBeGreaterThan(0);
        expect(activity.accessibility?.assets?.length ?? 0).toBeGreaterThan(0);

        if (activity.interactive) {
          expect(activity.interactive.accessibility).toBeDefined();
          expect(activity.interactive.accessibility?.hints?.length ?? 0).toBeGreaterThan(0);
          expect(activity.interactive.accessibility?.feedback).toBeDefined();
          expect(
            Object.keys(activity.interactive.accessibility?.feedback ?? {}).length
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("cobre habilidades EF01LP01 a EF01LP10 ao menos duas vezes", () => {
    const habilidadeCount = new Map<string, number>();

    for (const document of newModules) {
      for (const activity of document.activities) {
        for (const habilidade of activity.bncc.habilidades) {
          habilidadeCount.set(habilidade, (habilidadeCount.get(habilidade) ?? 0) + 1);
        }
      }
    }

    for (const habilidade of REQUIRED_HABILIDADES) {
      expect(habilidadeCount.get(habilidade) ?? 0).toBeGreaterThanOrEqual(2);
    }
  });
});
