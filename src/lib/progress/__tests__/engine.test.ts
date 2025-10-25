import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { applyProgressUpdate, computeLevelFromXp } from "@/lib/progress";
import type { LogAttemptInput } from "@/lib/validation";

describe("progress engine", () => {
  it("calcula o nível correto a partir do XP acumulado", () => {
    const firstThreshold = computeLevelFromXp(0);
    expect(firstThreshold.level).toBe(1);
    expect(firstThreshold.nextLevelAt).toBe(1000);

    const midProgress = computeLevelFromXp(1700);
    expect(midProgress.level).toBe(3);
    expect(midProgress.nextLevelAt).toBe(2000);

    const advanced = computeLevelFromXp(3200);
    expect(advanced.level).toBe(6);
    expect(advanced.nextLevelAt).toBe(3500);
  });

  it("atualiza métricas e desbloqueia recompensas após tentativa bem-sucedida", async () => {
    const activity = await prisma.activity.findFirstOrThrow({
      select: {
        id: true,
        slug: true,
        title: true,
        contentModuleId: true,
        curriculumStandardId: true,
        contentModule: {
          select: {
            id: true,
            slug: true,
            title: true,
            ageGroupId: true,
          },
        },
        curriculumStandard: {
          select: {
            id: true,
            bnccCode: true,
            competency: true,
          },
        },
      },
    });

    const user = await prisma.user.create({
      data: {
        email: `progress-test-${Date.now()}@aprender.dev`,
        name: "Teste",
        displayName: "Teste",
        ageGroupId: activity.contentModule?.ageGroupId ?? undefined,
      },
      select: {
        id: true,
        xp: true,
        level: true,
        nextLevelAt: true,
        currentStreak: true,
        longestStreak: true,
      },
    });

    const attemptInput: LogAttemptInput = {
      userId: user.id,
      activityId: activity.id,
      success: true,
      score: 100,
      maxScore: 100,
      metadata: {
        origem: "teste-automatizado",
      },
    };

    const submittedAt = new Date();

    const result = await prisma.$transaction((tx) =>
      applyProgressUpdate({
        tx,
        activity,
        userBefore: user,
        attemptInput,
        submittedAt,
      })
    );

    expect(result.moduleProgress.completion).toBe(100);
    expect(result.moduleProgress.mastery).toBeGreaterThanOrEqual(80);
    expect(result.moduleProgress.totalAttempts).toBe(1);
    expect(result.competencyProgress.mastery).toBeGreaterThanOrEqual(80);
    expect(result.user.xp).toBeGreaterThan(user.xp);
    expect(result.rewards.length).toBeGreaterThanOrEqual(2);

    const rewardCodes = result.rewards.map((reward) => reward.code);
    expect(rewardCodes).toContain(`module:${activity.contentModuleId}:completion`);
    expect(rewardCodes).toContain(`competency:${activity.curriculumStandardId}:mastery80`);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
