import { describe, expect, it } from "vitest";

import { loadWorkspace } from "@/lib/content";

const NEW_MODULE_SLUGS = [
  "historias-rimadas",
  "hora-do-dialogo",
  "palavras-compostas",
  "pontuacao-animada",
  "jornal-da-turma",
];

const REQUIRED_HABILIDADES = [
  "EF01LP11",
  "EF01LP12",
  "EF01LP13",
  "EF01LP14",
  "EF01LP15",
  "EF01LP16",
  "EF01LP17",
  "EF01LP18",
  "EF01LP19",
  "EF01LP20",
  "EF01LP21",
  "EF01LP22",
  "EF01LP23",
  "EF01LP24",
];

describe("EF01 LP lote 2", () => {
  const workspace = loadWorkspace();
  const newModules = workspace.filter((document) =>
    NEW_MODULE_SLUGS.includes(document.module.slug)
  );

  it("produz entre 12 e 15 atividades por módulo e soma pelo menos 70", () => {
    expect(newModules).toHaveLength(NEW_MODULE_SLUGS.length);

    const totalActivities = newModules.reduce(
      (total, document) => total + document.activities.length,
      0
    );

    expect(totalActivities).toBeGreaterThanOrEqual(70);

    newModules.forEach((document) => {
      expect(document.activities.length).toBeGreaterThanOrEqual(12);
      expect(document.activities.length).toBeLessThanOrEqual(15);
    });
  });

  it("garante distribuição de dificuldades e novos campos de acessibilidade", () => {
    newModules.forEach((document) => {
      const difficultyCounts: Record<string, number> = {
        INICIAR: 0,
        PRATICAR: 0,
        DOMINAR: 0,
      };

      document.activities.forEach((activity) => {
        difficultyCounts[activity.difficulty] += 1;

        const metadata = activity.metadata as Record<string, unknown> | undefined;
        if (activity.bncc.habilidades.length > 1) {
          const secondary = metadata?.habilidadesSecundarias as string[] | undefined;
          expect(Array.isArray(secondary)).toBe(true);
          expect(secondary?.length).toBe(activity.bncc.habilidades.length - 1);
        }

        const accessibility = activity.accessibility;
        expect(accessibility).toBeDefined();
        expect(accessibility?.alternatives?.length ?? 0).toBeGreaterThan(0);
        expect(accessibility?.audioCue).toBeDefined();
        expect(accessibility?.motorSupport?.length ?? 0).toBeGreaterThan(0);

        if (activity.interactive) {
          const interactiveAccessibility = activity.interactive.accessibility;
          expect(interactiveAccessibility).toBeDefined();
          expect(interactiveAccessibility?.alternatives?.length ?? 0).toBeGreaterThan(0);
          expect(interactiveAccessibility?.audioCue).toBeDefined();
          expect(interactiveAccessibility?.motorSupport?.length ?? 0).toBeGreaterThan(0);
        }
      });

      expect(difficultyCounts.INICIAR).toBeGreaterThanOrEqual(2);
      expect(difficultyCounts.PRATICAR).toBeGreaterThanOrEqual(2);
      expect(difficultyCounts.DOMINAR).toBeGreaterThanOrEqual(2);
    });
  });

  it("cobre habilidades EF01LP11 a EF01LP24", () => {
    const habilidadesCobertas = new Set<string>();

    newModules.forEach((document) => {
      document.activities.forEach((activity) => {
        activity.bncc.habilidades.forEach((habilidade) => {
          habilidadesCobertas.add(habilidade);
        });
      });
    });

    REQUIRED_HABILIDADES.forEach((habilidade) => {
      expect(habilidadesCobertas.has(habilidade)).toBe(true);
    });
  });

  it("amplia o catálogo EF01 de Língua Portuguesa para no mínimo 10 módulos e 130 atividades", () => {
    const ef01LpModules = workspace.filter(
      (document) =>
        document.module.stage === "ef01" && document.module.subjectSlug === "lingua-portuguesa"
    );

    expect(ef01LpModules.length).toBeGreaterThanOrEqual(10);

    const totalActivities = ef01LpModules.reduce(
      (total, document) => total + document.activities.length,
      0
    );

    expect(totalActivities).toBeGreaterThanOrEqual(130);
  });
});
