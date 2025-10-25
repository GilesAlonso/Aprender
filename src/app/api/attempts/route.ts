import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { safeJsonParse, safeJsonStringify } from "@/lib/json";
import { dispatchAnalyticsEvent } from "@/lib/analytics";
import { LogAttemptInput, logAttemptSchema, progressStatusValues } from "@/lib/validation";

const PROGRESS_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const satisfies Record<(typeof progressStatusValues)[number], string>;

const computeStatusFromAttempt = (existingCompletion: number, success: boolean, score?: number) => {
  if (!success) {
    if (existingCompletion >= 100) {
      return PROGRESS_STATUS.COMPLETED;
    }

    return existingCompletion > 0 ? PROGRESS_STATUS.IN_PROGRESS : PROGRESS_STATUS.NOT_STARTED;
  }

  if (score !== undefined && score >= 90) {
    return PROGRESS_STATUS.COMPLETED;
  }

  return PROGRESS_STATUS.IN_PROGRESS;
};

const computeCompletion = (existingCompletion: number, success: boolean, score?: number) => {
  if (!success) {
    return existingCompletion;
  }

  if (score !== undefined) {
    if (score >= 90) {
      return 100;
    }

    return Math.max(existingCompletion, Math.min(100, score));
  }

  return existingCompletion > 0 ? existingCompletion : 50;
};

const buildResponse = (
  attempt: Awaited<ReturnType<typeof prisma.attempt.create>>,
  progress: Awaited<ReturnType<typeof prisma.progress.create>>
) => ({
  attempt: {
    id: attempt.id,
    userId: attempt.userId,
    activityId: attempt.activityId,
    success: attempt.success,
    score: attempt.score,
    maxScore: attempt.maxScore,
    accuracy: attempt.accuracy,
    timeSpentSeconds: attempt.timeSpentSeconds,
    submittedAt: attempt.submittedAt.toISOString(),
    completedAt: attempt.completedAt?.toISOString() ?? null,
    metadata: safeJsonParse<Record<string, unknown>>(attempt.metadata),
  },
  progress: {
    id: progress.id,
    userId: progress.userId,
    contentModuleId: progress.contentModuleId,
    completion: progress.completion,
    status: progress.status,
    lastActivityAt: progress.lastActivityAt?.toISOString() ?? null,
    totalAttempts: progress.totalAttempts,
    updatedAt: progress.updatedAt.toISOString(),
  },
});

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as unknown;
    const input = logAttemptSchema.parse(payload) as LogAttemptInput;

    const [user, activity] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.userId } }),
      prisma.activity.findUnique({
        where: { id: input.activityId },
        include: {
          contentModule: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    if (!activity) {
      return NextResponse.json({ message: "Atividade não encontrada" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (transaction) => {
      const submittedAt = new Date();

      const attempt = await transaction.attempt.create({
        data: {
          userId: input.userId,
          activityId: input.activityId,
          success: input.success,
          score: input.score,
          maxScore: input.maxScore,
          accuracy: input.accuracy,
          timeSpentSeconds: input.timeSpentSeconds,
          metadata: safeJsonStringify(input.metadata ?? null),
          submittedAt,
          completedAt: submittedAt,
        },
      });

      const existingProgress = await transaction.progress.findUnique({
        where: {
          userId_contentModuleId: {
            userId: input.userId,
            contentModuleId: activity.contentModuleId,
          },
        },
      });

      let progress;

      if (existingProgress) {
        const nextCompletion = computeCompletion(
          existingProgress.completion,
          input.success,
          input.score
        );
        const nextStatus =
          existingProgress.status === PROGRESS_STATUS.COMPLETED
            ? PROGRESS_STATUS.COMPLETED
            : computeStatusFromAttempt(existingProgress.completion, input.success, input.score);

        progress = await transaction.progress.update({
          where: { id: existingProgress.id },
          data: {
            completion: nextCompletion,
            status: nextStatus,
            totalAttempts: {
              increment: 1,
            },
            lastActivityAt: submittedAt,
          },
        });
      } else {
        const initialCompletion = computeCompletion(0, input.success, input.score);
        const initialStatus =
          initialCompletion >= 100
            ? PROGRESS_STATUS.COMPLETED
            : input.success
              ? PROGRESS_STATUS.IN_PROGRESS
              : PROGRESS_STATUS.NOT_STARTED;

        progress = await transaction.progress.create({
          data: {
            userId: input.userId,
            contentModuleId: activity.contentModuleId,
            completion: initialCompletion,
            status: initialStatus,
            totalAttempts: 1,
            lastActivityAt: submittedAt,
          },
        });
      }

      return buildResponse(attempt, progress);
    });

    dispatchAnalyticsEvent({
      type: "attempt_logged",
      attemptId: result.attempt.id,
      activityId: result.attempt.activityId,
      userId: result.attempt.userId,
      success: result.attempt.success,
      score: result.attempt.score ?? null,
    });

    return NextResponse.json(result, { status: 201 });
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
