import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { dispatchAnalyticsEvent } from "@/lib/analytics";
import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/json";
import { LEVEL_BASE_THRESHOLD, LEVEL_STEP, applyProgressUpdate } from "@/lib/progress";
import { LogAttemptInput, logAttemptSchema } from "@/lib/validation";

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as unknown;
    const input = logAttemptSchema.parse(payload) as LogAttemptInput;

    const [user, activity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          displayName: true,
          xp: true,
          level: true,
          nextLevelAt: true,
          currentStreak: true,
          longestStreak: true,
        },
      }),
      prisma.activity.findUnique({
        where: { id: input.activityId },
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
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    if (!activity) {
      return NextResponse.json({ message: "Atividade não encontrada" }, { status: 404 });
    }

    const submittedAt = new Date();

    const result = await prisma.$transaction((tx) =>
      applyProgressUpdate({
        tx,
        activity,
        userBefore: user,
        attemptInput: input,
        submittedAt,
      })
    );

    dispatchAnalyticsEvent({
      type: "attempt_logged",
      attemptId: result.attempt.id,
      activityId: result.attempt.activityId,
      userId: result.attempt.userId,
      success: result.attempt.success,
      score: result.attempt.score ?? null,
    });

    const levelFloor =
      result.user.level <= 1 ? 0 : LEVEL_BASE_THRESHOLD + (result.user.level - 2) * LEVEL_STEP;
    const xpSpan = result.user.nextLevelAt - levelFloor;
    const xpIntoLevel = result.user.xp - levelFloor;
    const xpProgressPercent = xpSpan > 0 ? clamp(Math.round((xpIntoLevel / xpSpan) * 100)) : 100;

    return NextResponse.json(
      {
        attempt: {
          id: result.attempt.id,
          userId: result.attempt.userId,
          activityId: result.attempt.activityId,
          success: result.attempt.success,
          score: result.attempt.score,
          accuracy: result.attempt.accuracy,
          timeSpentSeconds: result.attempt.timeSpentSeconds,
          submittedAt: result.attempt.submittedAt.toISOString(),
          metadata: safeJsonParse<Record<string, unknown>>(result.attempt.metadata),
        },
        moduleProgress: {
          id: result.moduleProgress.id,
          userId: result.moduleProgress.userId,
          contentModuleId: result.moduleProgress.contentModuleId,
          completion: result.moduleProgress.completion,
          status: result.moduleProgress.status,
          mastery: result.moduleProgress.mastery,
          currentStreak: result.moduleProgress.currentStreak,
          bestStreak: result.moduleProgress.bestStreak,
          averageAccuracy: result.moduleProgress.averageAccuracy,
          averageTimeSeconds: result.moduleProgress.averageTimeSeconds,
          totalAttempts: result.moduleProgress.totalAttempts,
          lastActivityAt: result.moduleProgress.lastActivityAt
            ? result.moduleProgress.lastActivityAt.toISOString()
            : null,
          updatedAt: result.moduleProgress.updatedAt.toISOString(),
          module: {
            id: activity.contentModule.id,
            slug: activity.contentModule.slug,
            title: activity.contentModule.title,
          },
        },
        competencyProgress: {
          id: result.competencyProgress.id,
          userId: result.competencyProgress.userId,
          curriculumStandardId: result.competencyProgress.curriculumStandardId,
          mastery: result.competencyProgress.mastery,
          currentStreak: result.competencyProgress.currentStreak,
          bestStreak: result.competencyProgress.bestStreak,
          accuracy: result.competencyProgress.accuracy,
          averageTimeSeconds: result.competencyProgress.averageTimeSeconds,
          attemptsCount: result.competencyProgress.attemptsCount,
          lastInteractionAt: result.competencyProgress.lastInteractionAt
            ? result.competencyProgress.lastInteractionAt.toISOString()
            : null,
          competency: {
            id: activity.curriculumStandard.id,
            bnccCode: activity.curriculumStandard.bnccCode,
            label: activity.curriculumStandard.competency,
          },
        },
        userProgress: {
          id: result.user.id,
          xp: result.user.xp,
          level: result.user.level,
          nextLevelAt: result.user.nextLevelAt,
          xpToNext: Math.max(0, result.user.nextLevelAt - result.user.xp),
          xpGained: result.xpGained,
          xpProgressPercent,
          currentStreak: result.user.currentStreak,
          longestStreak: result.user.longestStreak,
        },
        rewardsUnlocked: result.rewards.map((reward) => ({
          id: reward.id,
          code: reward.code,
          title: reward.title,
          category: reward.category,
          rarity: reward.rarity,
          xpAwarded: reward.xpAwarded,
          levelAchieved: reward.levelAchieved,
          unlockedAt: reward.unlockedAt.toISOString(),
          metadata: safeJsonParse<Record<string, unknown>>(reward.metadata),
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Dados inválidos para registrar tentativa",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Erro ao registrar tentativa", error);
    return NextResponse.json({ message: "Erro interno ao registrar tentativa" }, { status: 500 });
  }
}
