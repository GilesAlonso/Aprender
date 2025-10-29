import { describe, expect, it } from "vitest";

import { loadWorkspace } from "@/lib/content";

const NEW_MODULE_SLUGS = ["escuta-em-roda", "historia-em-cenas"] as const;
const TARGET_HABILIDADES = ["EF01LP18", "EF01LP19", "EF01LP20"] as const;

describe("EF01 LP lote 3", () => {
  const workspace = loadWorkspace();
  const newModules = workspace.filter((document) =>
    NEW_MODULE_SLUGS.includes(document.module.slug as (typeof NEW_MODULE_SLUGS)[number])
  );

  it("carrega os módulos previstos com 12 a 15 atividades cada", () => {
    expect(newModules).toHaveLength(NEW_MODULE_SLUGS.length);

    const totalActivities = newModules.reduce(
      (total, document) => total + document.activities.length,
      0
    );

    expect(totalActivities).toBeGreaterThanOrEqual(24);

    newModules.forEach((document) => {
      expect(document.activities.length).toBeGreaterThanOrEqual(12);
      expect(document.activities.length).toBeLessThanOrEqual(15);
    });
  });

  it("distribui dificuldades e utiliza apenas assets com prefixo lp-", () => {
    newModules.forEach((document) => {
      const difficultyCounts: Record<string, number> = {
        INICIAR: 0,
        PRATICAR: 0,
        DOMINAR: 0,
      };

      document.activities.forEach((activity) => {
        difficultyCounts[activity.difficulty] += 1;

        const assetSlug = (activity.metadata as { assetSlug?: string } | undefined)?.assetSlug;
        expect(typeof assetSlug).toBe("string");
        expect(assetSlug?.startsWith("lp-")).toBe(true);

        if (activity.bncc.habilidades.length > 1) {
          const metadata = activity.metadata as { habilidadesSecundarias?: string[] } | undefined;
          const secondary = metadata?.habilidadesSecundarias;
          expect(Array.isArray(secondary)).toBe(true);
          expect(secondary?.length).toBe(activity.bncc.habilidades.length - 1);
        }

        expect(activity.interactive).toBeDefined();
      });

      expect(difficultyCounts.INICIAR).toBeGreaterThanOrEqual(4);
      expect(difficultyCounts.PRATICAR).toBeGreaterThanOrEqual(4);
      expect(difficultyCounts.DOMINAR).toBeGreaterThanOrEqual(4);
    });
  });

  it("garante cobertura reforçada das habilidades EF01LP18, EF01LP19 e EF01LP20", () => {
    const cobertura = new Map<string, number>();

    newModules.forEach((document) => {
      document.activities.forEach((activity) => {
        activity.bncc.habilidades.forEach((habilidade) => {
          cobertura.set(habilidade, (cobertura.get(habilidade) ?? 0) + 1);
        });
      });
    });

    TARGET_HABILIDADES.forEach((habilidade) => {
      expect(cobertura.get(habilidade) ?? 0).toBeGreaterThanOrEqual(4);
    });
  });
});
