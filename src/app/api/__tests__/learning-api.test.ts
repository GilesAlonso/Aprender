import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { GET as getModules } from "@/app/api/modules/route";
import { POST as postAttempt } from "@/app/api/attempts/route";
import { clearAnalyticsHistory, getAnalyticsHistory } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

describe("Learning API", () => {
  it("retorna módulos com contexto de faixa etária e acesso liberado", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/modules?ageGroupSlug=educacao-infantil&age=5"
    );

    const response = await getModules(request);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      context: {
        studentAgeGroup: { slug: string };
        requestedAgeGroup: { slug: string };
        isLocked: boolean;
        message: string;
      };
      modules: Array<{
        ageGroup: { slug: string };
        curriculumStandard: { bnccCode: string } | null;
        activities: unknown[];
        access: string;
        lockMessage: string | null;
      }>;
      recommendedModules?: unknown[];
    };

    expect(body.context.studentAgeGroup.slug).toBe("educacao-infantil");
    expect(body.context.requestedAgeGroup.slug).toBe("educacao-infantil");
    expect(body.context.isLocked).toBe(false);
    expect(body.context.message).toMatch(/Conteúdo adaptado/i);
    expect(Array.isArray(body.modules)).toBe(true);
    expect(body.modules.length).toBeGreaterThan(0);
    expect(body.modules.every((module) => module.ageGroup.slug === "educacao-infantil")).toBe(true);
    expect(body.modules.every((module) => module.access === "available")).toBe(true);
    expect(body.modules[0]?.curriculumStandard?.bnccCode).toBe("EI03ET04");
    expect(body.modules[0]?.activities.length).toBeGreaterThan(0);
    expect(body.recommendedModules).toBeUndefined();
  });

  it("informa quando a etapa solicitada está bloqueada e sugere alternativas", async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: "bruno@aprender.dev" } });

    const request = new NextRequest(
      `http://localhost:3000/api/modules?userId=${user.id}&ageGroupSlug=ensino-medio`
    );

    const response = await getModules(request);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      context: {
        studentAgeGroup: { slug: string };
        requestedAgeGroup: { slug: string };
        isLocked: boolean;
        message: string;
      };
      modules: Array<{
        ageGroup: { slug: string };
        access: string;
        lockMessage: string | null;
      }>;
      recommendedModules?: Array<{
        ageGroup: { slug: string };
        access: string;
      }>;
    };

    expect(body.context.studentAgeGroup.slug).toBe("fundamental-anos-iniciais");
    expect(body.context.requestedAgeGroup.slug).toBe("ensino-medio");
    expect(body.context.isLocked).toBe(true);
    expect(body.modules.length).toBeGreaterThan(0);
    expect(body.modules.every((module) => module.access === "locked")).toBe(true);
    expect(body.modules[0]?.lockMessage).toMatch(/Combine com um educador/i);
    expect(body.recommendedModules?.length).toBeGreaterThan(0);
    expect(
      body.recommendedModules?.every(
        (module) => module.ageGroup.slug === "fundamental-anos-iniciais"
      )
    ).toBe(true);
    expect(body.recommendedModules?.every((module) => module.access === "available")).toBe(true);
  });

  it("registra tentativas, atualiza progresso e emite analytics", async () => {
    const testEmail = `teste-${Date.now()}@aprender.dev`;

    const [ageGroup, activity] = await Promise.all([
      prisma.ageGroup.findFirstOrThrow({ where: { slug: "fundamental-anos-finais" } }),
      prisma.activity.findFirstOrThrow({ where: { slug: "quiz-sustentabilidade" } }),
    ]);

    const user = await prisma.user.create({
      data: {
        email: testEmail,
        name: "Estudante Teste",
        displayName: "Teste",
        ageGroupId: ageGroup.id,
      },
    });

    clearAnalyticsHistory();

    const payload = {
      userId: user.id,
      activityId: activity.id,
      success: true,
      score: 95,
      metadata: {
        tentativa: "automática",
      },
    };

    const request = new NextRequest("http://localhost:3000/api/attempts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const response = await postAttempt(request);
    expect(response.status).toBe(201);

    const body = (await response.json()) as {
      attempt: {
        id: string;
        userId: string;
        activityId: string;
        metadata: { tentativa: string } | null;
        score: number | null;
      };
      moduleProgress: {
        status: string;
        completion: number;
        totalAttempts: number;
        mastery: number;
        currentStreak: number;
      };
      competencyProgress: {
        mastery: number;
        currentStreak: number;
      };
      userProgress: {
        level: number;
        xp: number;
        xpGained: number;
        xpProgressPercent: number;
      };
      rewardsUnlocked: Array<{ code: string }>;
    };

    expect(body.attempt.userId).toBe(user.id);
    expect(body.attempt.metadata?.tentativa).toBe("automática");
    expect(body.attempt.score).toBe(payload.score);
    expect(body.moduleProgress.status).toBe("COMPLETED");
    expect(body.moduleProgress.completion).toBeGreaterThanOrEqual(100);
    expect(body.moduleProgress.totalAttempts).toBe(1);
    expect(body.moduleProgress.mastery).toBeGreaterThan(0);
    expect(body.moduleProgress.currentStreak).toBe(1);
    expect(body.competencyProgress.mastery).toBeGreaterThan(0);
    expect(body.userProgress.xpGained).toBeGreaterThan(0);
    expect(body.userProgress.xp).toBeGreaterThanOrEqual(body.userProgress.xpGained);
    expect(body.userProgress.xpProgressPercent).toBeGreaterThan(0);

    const storedProgress = await prisma.progress.findUniqueOrThrow({
      where: {
        userId_contentModuleId: {
          userId: user.id,
          contentModuleId: activity.contentModuleId,
        },
      },
    });

    expect(storedProgress.status).toBe("COMPLETED");
    expect(storedProgress.completion).toBeGreaterThanOrEqual(100);
    expect(storedProgress.totalAttempts).toBe(1);
    expect(storedProgress.currentStreak).toBe(1);

    const competencyProgress = await prisma.competencyProgress.findUniqueOrThrow({
      where: {
        userId_curriculumStandardId: {
          userId: user.id,
          curriculumStandardId: activity.curriculumStandardId,
        },
      },
    });

    expect(competencyProgress.mastery).toBeGreaterThan(0);
    expect(competencyProgress.attemptsCount).toBe(1);

    const history = getAnalyticsHistory();
    const analyticsAttempt = history.find((event) => event.type === "attempt_logged");
    expect(analyticsAttempt).toBeDefined();
    if (analyticsAttempt?.type === "attempt_logged") {
      expect(analyticsAttempt.activityId).toBe(body.attempt.activityId);
      expect(analyticsAttempt.userId).toBe(user.id);
      expect(analyticsAttempt.attemptId).toBe(body.attempt.id);
      expect(analyticsAttempt.score).toBe(payload.score);
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
