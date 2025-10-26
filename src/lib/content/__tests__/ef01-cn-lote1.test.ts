import { describe, expect, it } from "vitest";

import { loadWorkspace } from "@/lib/content";

const NEW_MODULE_SLUGS = [
  "sentidos-curiosos",
  "cuidados-do-corpo",
  "animais-da-vizinhanca",
  "plantas-que-cuidamos",
  "ambientes-da-escola",
];

const REQUIRED_CODES = ["EF01CI01", "EF01CI02", "EF01CI03", "EF01CI04"];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

describe("EF01 Ciências lote 1", () => {
  const workspace = loadWorkspace();
  const newModules = workspace.filter((document) =>
    NEW_MODULE_SLUGS.includes(document.module.slug)
  );

  it("gera ao menos 60 atividades distribuídas em cinco módulos", () => {
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

  it("garante metadados completos e acessibilidade nas novas atividades", () => {
    for (const document of newModules) {
      for (const activity of document.activities) {
        // metadata básicos
        expect(activity.metadata).toBeDefined();
        const metadata = activity.metadata as Record<string, unknown>;
        expect(metadata.assetSlug).toMatch(/^cn-/);
        expect(typeof metadata.familiaEngajamento).toBe("string");
        expect(typeof metadata.modoCooperativo).toBe("boolean");

        // acessibilidade estruturada
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

  it("cobre códigos EF01CI01 a EF01CI04 em várias atividades", () => {
    const habilidadeCount = new Map<string, number>();

    for (const document of newModules) {
      for (const activity of document.activities) {
        habilidadeCount.set(activity.bncc.code, (habilidadeCount.get(activity.bncc.code) ?? 0) + 1);
        for (const habilidade of activity.bncc.habilidades) {
          habilidadeCount.set(habilidade, (habilidadeCount.get(habilidade) ?? 0) + 1);
        }
      }
    }

    for (const code of REQUIRED_CODES) {
      expect(habilidadeCount.get(code) ?? 0).toBeGreaterThanOrEqual(4);
    }
  });

  it("utiliza apenas assets de ciências", () => {
    for (const document of newModules) {
      for (const activity of document.activities) {
        const metadata = activity.metadata as Record<string, unknown>;
        expect(metadata.assetSlug).toMatch(/^cn-/);

        if (activity.accessibility?.assets) {
          for (const asset of activity.accessibility.assets) {
            if (isRecord(asset) && typeof asset.slug === "string") {
              expect(asset.slug).toMatch(/^cn-/);
            }
          }
        }

        if (activity.interactive?.accessibility?.assets) {
          for (const asset of activity.interactive.accessibility.assets) {
            if (isRecord(asset) && typeof asset.slug === "string") {
              expect(asset.slug).toMatch(/^cn-/);
            }
          }
        }
      }
    }
  });
});
