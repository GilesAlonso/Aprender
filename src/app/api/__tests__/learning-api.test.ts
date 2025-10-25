import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { GET as getModules } from "@/app/api/modules/route";
import { POST as postAttempt } from "@/app/api/attempts/route";

describe("Learning API", () => {
  it("retorna módulos filtrados por faixa etária", async () => {
    const request = NextRequest.from(
      new Request("http://localhost:3000/api/modules?ageGroupSlug=educacao-infantil")
    );

    const response = await getModules(request);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      modules: Array<{
        ageGroup: { slug: string };
        curriculumStandard: { bnccCode: string } | null;
        activities: unknown[];
      }>;
    };

    expect(Array.isArray(body.modules)).toBe(true);
    expect(body.modules.length).toBeGreaterThan(0);
    expect(body.modules.every((module) => module.ageGroup.slug === "educacao-infantil")).toBe(true);
    expect(body.modules[0]?.curriculumStandard?.bnccCode).toBe("EI03ET04");
    expect(body.modules[0]?.activities.length).toBeGreaterThan(0);
  });

  it("registra tentativas e atualiza progresso do estudante", async () => {
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

    const payload = {
      userId: user.id,
      activityId: activity.id,
      success: true,
      score: 95,
      metadata: {
        tentativa: "automática",
      },
    };

    const request = NextRequest.from(
      new Request("http://localhost:3000/api/attempts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );

    const response = await postAttempt(request);
    expect(response.status).toBe(201);

    const body = (await response.json()) as {
      attempt: { userId: string; metadata: { tentativa: string } | null };
      progress: { status: string; completion: number; totalAttempts: number };
    };

    expect(body.attempt.userId).toBe(user.id);
    expect(body.attempt.metadata?.tentativa).toBe("automática");
    expect(body.progress.status).toBe("COMPLETED");
    expect(body.progress.completion).toBe(100);
    expect(body.progress.totalAttempts).toBe(1);

    const storedProgress = await prisma.progress.findUniqueOrThrow({
      where: {
        userId_contentModuleId: {
          userId: user.id,
          contentModuleId: activity.contentModuleId,
        },
      },
    });

    expect(storedProgress.status).toBe("COMPLETED");
    expect(storedProgress.completion).toBe(100);
    expect(storedProgress.totalAttempts).toBe(1);
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
