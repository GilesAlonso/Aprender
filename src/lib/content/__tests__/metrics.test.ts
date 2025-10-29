import { describe, expect, it } from "vitest";

import { computeContentMetrics, loadWorkspace } from "@/lib/content";

describe("content metrics", () => {
  it("aggregates EF01 língua portuguesa coverage", () => {
    const documents = loadWorkspace({ stage: "ef01", subjectSlug: "lingua-portuguesa" });
    const metrics = computeContentMetrics(documents);

    expect(metrics.totals.modules).toBe(11);
    expect(metrics.totals.activities).toBe(137);

    const stageMetrics = metrics.stages["ef01"];
    expect(stageMetrics).toBeDefined();
    expect(stageMetrics?.subjects["lingua-portuguesa"]).toEqual({
      modules: 11,
      activities: 137,
    });

    const difficultyTotal = Object.values(metrics.difficulty).reduce(
      (sum, value) => sum + value,
      0
    );
    expect(difficultyTotal).toBe(metrics.totals.activities);

    const codeTotal = Object.values(metrics.bncc.codes).reduce((sum, value) => sum + value, 0);
    expect(codeTotal).toBe(metrics.totals.activities);

    const habilidadesTotal = Object.values(metrics.bncc.habilidades).reduce(
      (sum, value) => sum + value,
      0
    );
    expect(habilidadesTotal).toBeGreaterThanOrEqual(metrics.totals.activities);
  });

  it("aggregates EF01 ciências coverage", () => {
    const documents = loadWorkspace({ stage: "ef01", subjectSlug: "ciencias" });
    const metrics = computeContentMetrics(documents);

    expect(metrics.totals.modules).toBe(5);
    expect(metrics.totals.activities).toBe(60);

    const stageMetrics = metrics.stages["ef01"];
    expect(stageMetrics).toBeDefined();
    expect(stageMetrics?.subjects["ciencias"]).toEqual({
      modules: 5,
      activities: 60,
    });

    const codeTotal = Object.values(metrics.bncc.codes).reduce((sum, value) => sum + value, 0);
    expect(codeTotal).toBe(metrics.totals.activities);
  });

  it("returns zeroed totals when no modules are provided", () => {
    const metrics = computeContentMetrics([]);
    expect(metrics.totals.modules).toBe(0);
    expect(metrics.totals.activities).toBe(0);
    expect(Object.keys(metrics.stages)).toHaveLength(0);

    const difficultyTotal = Object.values(metrics.difficulty).reduce(
      (sum, value) => sum + value,
      0
    );
    expect(difficultyTotal).toBe(0);

    expect(Object.keys(metrics.bncc.codes)).toHaveLength(0);
    expect(Object.keys(metrics.bncc.habilidades)).toHaveLength(0);
  });
});
