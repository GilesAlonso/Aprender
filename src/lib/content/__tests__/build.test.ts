import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { buildWorkspace } from "@/lib/content";

describe("content build", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T12:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("gera artefatos determinísticos a partir do workspace", () => {
    const output = buildWorkspace({ writeToDisk: false });

    const sanitized = {
      modules: {
        updatedAt: output.modules.updatedAt,
        hash: output.modules.hash,
        modules: output.modules.modules.map((module) => ({
          slug: module.slug,
          stage: module.stage,
          subjectSlug: module.subjectSlug,
          primaryBnccCode: module.primaryBnccCode,
          activityCount: module.activities.length,
          activities: module.activities.map((activity) => ({
            slug: activity.slug,
            difficulty: activity.difficulty,
            activityType: activity.activityType,
            bnccCode: activity.bnccCode,
            metadata: activity.metadata,
          })),
        })),
      },
      interactive: {
        updatedAt: output.interactive.updatedAt,
        hash: output.interactive.hash,
        activities: output.interactive.activities.map((activity) => ({
          slug: activity.slug,
          type: activity.type,
          difficulty: activity.difficulty,
          contentModuleSlug: activity.contentModuleSlug,
          activitySlug: activity.activitySlug,
        })),
      },
      index: {
        generatedAt: output.index.generatedAt,
        contentHash: output.index.contentHash,
        modulesBySubject: output.index.modulesBySubject,
        activitiesByDifficulty: output.index.activitiesByDifficulty,
      },
    };

    expect(sanitized).toMatchSnapshot();
  });

  it("aplica filtros ao compilar o workspace", () => {
    const output = buildWorkspace({
      writeToDisk: false,
      stage: "ef01",
      subjectSlug: "lingua-portuguesa",
      modules: ["bilhetes-e-recados"],
    });

    expect(output.modules.modules).toHaveLength(1);
    expect(output.modules.modules[0]?.slug).toBe("bilhetes-e-recados");

    expect(output.index.modulesByStage).toEqual({ ef01: ["bilhetes-e-recados"] });
    expect(output.index.modulesBySubject).toEqual({
      "lingua-portuguesa": ["bilhetes-e-recados"],
    });

    expect(
      output.interactive.activities.every(
        (activity) => activity.contentModuleSlug === "bilhetes-e-recados"
      )
    ).toBe(true);
  });
});
