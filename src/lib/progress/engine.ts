import { Prisma } from "@prisma/client";

import { safeJsonStringify } from "@/lib/json";
import type { LogAttemptInput } from "@/lib/validation";

export const LEVEL_BASE_THRESHOLD = 1000;
export const LEVEL_STEP = 500;
export const STREAK_REWARD_THRESHOLDS = [3, 5, 10];

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((acc, current) => acc + current, 0) / values.length;

const computeLevelTarget = (level: number) =>
  LEVEL_BASE_THRESHOLD + Math.max(0, level - 1) * LEVEL_STEP;

export const computeLevelFromXp = (xp: number) => {
  let level = 1;
  let nextThreshold = computeLevelTarget(level);

  while (xp >= nextThreshold) {
    level += 1;
    nextThreshold = computeLevelTarget(level);
  }

  return { level, nextLevelAt: nextThreshold };
};

const computeXpGain = (input: LogAttemptInput, streakBonus: number) => {
  const base = input.success ? 80 : 25;
  const scoreContribution = typeof input.score === "number" ? Math.round(input.score * 0.5) : 0;
  const accuracyContribution =
    typeof input.accuracy === "number" ? Math.round(input.accuracy * 60) : 0;
  const timeContribution =
    typeof input.timeSpentSeconds === "number" &&
    input.timeSpentSeconds >= 60 &&
    input.timeSpentSeconds <= 360
      ? 30
      : 0;

  return Math.max(
    15,
    base + scoreContribution + accuracyContribution + timeContribution + streakBonus
  );
};

const computeTimeBonus = (averageTimeSeconds: number) => {
  if (averageTimeSeconds === 0) return 0;
  if (averageTimeSeconds < 40) return -6;
  if (averageTimeSeconds <= 90) return 6;
  if (averageTimeSeconds <= 200) return 10;
  if (averageTimeSeconds <= 360) return 4;
  return -2;
};

const computeMastery = (
  successRate: number,
  scoreAverage: number,
  accuracyAverage: number,
  bestStreak: number,
  averageTimeSeconds: number
) => {
  const normalizedScore = scoreAverage > 0 ? scoreAverage : successRate * 100;
  const normalizedAccuracy = accuracyAverage > 0 ? accuracyAverage * 100 : normalizedScore;
  const masteryBase = normalizedScore * 0.5 + normalizedAccuracy * 0.3 + successRate * 100 * 0.2;
  const masteryWithBonuses =
    masteryBase + Math.min(bestStreak * 5, 25) + computeTimeBonus(averageTimeSeconds);

  return clamp(Math.round(masteryWithBonuses));
};

const computeCompletion = (successRate: number, scoreAverage: number) => {
  if (scoreAverage >= 95) return 100;
  const normalizedScore = scoreAverage > 0 ? scoreAverage : successRate * 100;
  const completionScore = normalizedScore * 0.7 + successRate * 100 * 0.3;
  return clamp(Math.round(completionScore));
};

const computeStreaks = (attempts: Array<{ success: boolean }>) => {
  let best = 0;
  let current = 0;

  for (const attempt of attempts) {
    if (attempt.success) {
      current += 1;
      if (current > best) {
        best = current;
      }
    } else {
      current = 0;
    }
  }

  return { current, best };
};

const deriveStatus = (completion: number) => {
  if (completion >= 100) return "COMPLETED" as const;
  if (completion > 0) return "IN_PROGRESS" as const;
  return "NOT_STARTED" as const;
};

export type TransactionClient = Prisma.TransactionClient;

export interface ActivityProgressContext {
  attempt: Prisma.AttemptGetPayload<{
    select: {
      id: true;
      userId: true;
      success: true;
      score: true;
      accuracy: true;
      timeSpentSeconds: true;
      submittedAt: true;
    };
  }>;
  moduleAttempts: Prisma.AttemptGetPayload<{
    select: {
      success: true;
      score: true;
      accuracy: true;
      timeSpentSeconds: true;
      submittedAt: true;
    };
  }>[];
  competencyAttempts: Prisma.AttemptGetPayload<{
    select: {
      success: true;
      score: true;
      accuracy: true;
      timeSpentSeconds: true;
      submittedAt: true;
    };
  }>[];
}

export interface RewardsEvaluationContext {
  moduleId: string;
  moduleSlug: string;
  moduleTitle: string;
  curriculumStandardId: string;
  bnccCode: string;
  competencyLabel: string;
  previousModuleProgress?: { completion: number; currentStreak: number; mastery: number } | null;
  previousCompetencyProgress?: { mastery: number; currentStreak: number } | null;
  previousLevel: number;
  userStreakBefore: number;
}

export interface ModuleProgressMetrics {
  completion: number;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  currentStreak: number;
  bestStreak: number;
  averageAccuracy: number;
  averageTimeSeconds: number;
  mastery: number;
  totalAttempts: number;
}

export interface CompetencyProgressMetrics {
  mastery: number;
  currentStreak: number;
  bestStreak: number;
  accuracy: number;
  averageTimeSeconds: number;
  attemptsCount: number;
}

export const computeModuleMetrics = (
  attempts: Prisma.AttemptGetPayload<{
    select: {
      success: true;
      score: true | null;
      accuracy: true | null;
      timeSpentSeconds: true | null;
    };
  }>[]
): ModuleProgressMetrics => {
  if (attempts.length === 0) {
    return {
      completion: 0,
      status: "NOT_STARTED",
      currentStreak: 0,
      bestStreak: 0,
      averageAccuracy: 0,
      averageTimeSeconds: 0,
      mastery: 0,
      totalAttempts: 0,
    };
  }

  const successValues = attempts.map((attempt) => (attempt.success ? 1 : 0));
  const successRate = average(successValues);
  const scoreAverage = average(
    attempts
      .map((attempt) => (typeof attempt.score === "number" ? attempt.score : null))
      .filter((value): value is number => value !== null)
  );
  const accuracyAverage = average(
    attempts
      .map((attempt) => (typeof attempt.accuracy === "number" ? attempt.accuracy : null))
      .filter((value): value is number => value !== null)
  );
  const timeAverage = average(
    attempts
      .map((attempt) =>
        typeof attempt.timeSpentSeconds === "number" ? attempt.timeSpentSeconds : null
      )
      .filter((value): value is number => value !== null)
  );

  const streaks = computeStreaks(attempts);
  const completion = computeCompletion(successRate, scoreAverage);
  const mastery = computeMastery(
    successRate,
    scoreAverage,
    accuracyAverage,
    streaks.best,
    timeAverage
  );

  return {
    completion,
    status: deriveStatus(completion),
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    averageAccuracy: Number(accuracyAverage.toFixed(4)),
    averageTimeSeconds: Math.round(timeAverage),
    mastery,
    totalAttempts: attempts.length,
  };
};

export const computeCompetencyMetrics = (
  attempts: Prisma.AttemptGetPayload<{
    select: {
      success: true;
      score: true | null;
      accuracy: true | null;
      timeSpentSeconds: true | null;
    };
  }>[]
): CompetencyProgressMetrics => {
  if (attempts.length === 0) {
    return {
      mastery: 0,
      currentStreak: 0,
      bestStreak: 0,
      accuracy: 0,
      averageTimeSeconds: 0,
      attemptsCount: 0,
    };
  }

  const successValues = attempts.map((attempt) => (attempt.success ? 1 : 0));
  const successRate = average(successValues);
  const scoreAverage = average(
    attempts
      .map((attempt) => (typeof attempt.score === "number" ? attempt.score : null))
      .filter((value): value is number => value !== null)
  );
  const accuracyAverage = average(
    attempts
      .map((attempt) => (typeof attempt.accuracy === "number" ? attempt.accuracy : null))
      .filter((value): value is number => value !== null)
  );
  const timeAverage = average(
    attempts
      .map((attempt) =>
        typeof attempt.timeSpentSeconds === "number" ? attempt.timeSpentSeconds : null
      )
      .filter((value): value is number => value !== null)
  );

  const streaks = computeStreaks(attempts);
  const mastery = computeMastery(
    successRate,
    scoreAverage,
    accuracyAverage,
    streaks.best,
    timeAverage
  );

  return {
    mastery,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    accuracy: Number(accuracyAverage.toFixed(4)),
    averageTimeSeconds: Math.round(timeAverage),
    attemptsCount: attempts.length,
  };
};

export interface ApplyProgressUpdateParams {
  tx: TransactionClient;
  activity: Prisma.ActivityGetPayload<{
    select: {
      id: true;
      title: true;
      slug: true;
      contentModuleId: true;
      curriculumStandardId: true;
      contentModule: { select: { id: true; slug: true; title: true } };
      curriculumStandard: { select: { id: true; bnccCode: true; competency: true } };
    };
  }>;
  userBefore: Prisma.UserGetPayload<{
    select: {
      id: true;
      xp: true;
      level: true;
      nextLevelAt: true;
      currentStreak: true;
      longestStreak: true;
    };
  }>;
  attemptInput: LogAttemptInput;
  submittedAt: Date;
}

export interface ProgressUpdateResult {
  attempt: Prisma.AttemptGetPayload<{
    select: {
      id: true;
      userId: true;
      activityId: true;
      success: true;
      score: true;
      maxScore: true;
      accuracy: true;
      timeSpentSeconds: true;
      submittedAt: true;
      metadata: true;
    };
  }>;
  moduleProgress: Prisma.ProgressGetPayload<{
    select: {
      id: true;
      userId: true;
      contentModuleId: true;
      completion: true;
      status: true;
      totalAttempts: true;
      currentStreak: true;
      bestStreak: true;
      averageAccuracy: true;
      averageTimeSeconds: true;
      mastery: true;
      updatedAt: true;
      lastActivityAt: true;
    };
  }>;
  competencyProgress: Prisma.CompetencyProgressGetPayload<{
    select: {
      id: true;
      userId: true;
      curriculumStandardId: true;
      mastery: true;
      currentStreak: true;
      bestStreak: true;
      accuracy: true;
      averageTimeSeconds: true;
      attemptsCount: true;
      lastInteractionAt: true;
    };
  }>;
  user: Prisma.UserGetPayload<{
    select: {
      id: true;
      xp: true;
      level: true;
      nextLevelAt: true;
      currentStreak: true;
      longestStreak: true;
    };
  }>;
  xpGained: number;
  rewards: Prisma.RewardGetPayload<{
    select: {
      id: true;
      code: true;
      title: true;
      description: true;
      criteria: true;
      icon: true;
      category: true;
      rarity: true;
      xpAwarded: true;
      levelAchieved: true;
      metadata: true;
      unlockedAt: true;
    };
  }>;
}

const deriveRewardRarity = (threshold: number) => {
  if (threshold >= 10) return "LEGENDARY";
  if (threshold >= 5) return "EPIC";
  return "RARE";
};

const buildRewardPayload = (params: {
  code: string;
  title: string;
  description?: string;
  criteria?: string;
  icon?: string;
  category: string;
  rarity: string;
  xpAwarded?: number;
  levelAchieved?: number | null;
  metadata?: Record<string, unknown> | null;
  unlockedAt: Date;
}) => ({
  code: params.code,
  title: params.title,
  description: params.description ?? null,
  criteria: params.criteria ?? null,
  icon: params.icon ?? null,
  category: params.category,
  rarity: params.rarity,
  xpAwarded: params.xpAwarded ?? 0,
  levelAchieved: params.levelAchieved ?? null,
  metadata: safeJsonStringify(params.metadata ?? null),
  unlockedAt: params.unlockedAt,
});

const evaluateRewards = (context: {
  metrics: ModuleProgressMetrics;
  competency: CompetencyProgressMetrics;
  userBefore: Prisma.UserGetPayload<{ select: { level: true; xp: true; currentStreak: true } }>;
  userAfter: Prisma.UserGetPayload<{ select: { level: true; xp: true; currentStreak: true } }>;
  details: RewardsEvaluationContext;
  xpGained: number;
  submittedAt: Date;
}) => {
  const rewards: ReturnType<typeof buildRewardPayload>[] = [];
  const { metrics, competency, userBefore, userAfter, details, xpGained, submittedAt } = context;

  if (metrics.completion >= 100 && (details.previousModuleProgress?.completion ?? 0) < 100) {
    rewards.push(
      buildRewardPayload({
        code: `module:${details.moduleId}:completion`,
        title: `Mestre de ${details.moduleTitle}`,
        description: `Concluiu 100% do módulo ${details.moduleTitle}.`,
        criteria: "Completar todas as atividades com desempenho alto.",
        icon: "trophy-gold",
        category: "BADGE",
        rarity: "EPIC",
        xpAwarded: 220,
        metadata: {
          moduleSlug: details.moduleSlug,
          bnccCode: details.bnccCode,
        },
        unlockedAt: submittedAt,
      })
    );
  }

  for (const threshold of STREAK_REWARD_THRESHOLDS) {
    const previousStreak = details.previousModuleProgress?.currentStreak ?? 0;
    if (metrics.currentStreak >= threshold && previousStreak < threshold) {
      rewards.push(
        buildRewardPayload({
          code: `module:${details.moduleId}:streak:${threshold}`,
          title: `${threshold} vitórias seguidas!`,
          description: `Manteve ${threshold} sucessos consecutivos no módulo ${details.moduleTitle}.`,
          criteria: `Alcançar ${threshold} tentativas bem-sucedidas sem interrupção.`,
          icon: "streak",
          category: "BADGE",
          rarity: deriveRewardRarity(threshold),
          xpAwarded: threshold * 40,
          metadata: {
            moduleSlug: details.moduleSlug,
            streak: threshold,
          },
          unlockedAt: submittedAt,
        })
      );
    }
  }

  if (competency.mastery >= 80 && (details.previousCompetencyProgress?.mastery ?? 0) < 80) {
    rewards.push(
      buildRewardPayload({
        code: `competency:${details.curriculumStandardId}:mastery80`,
        title: "Domínio comprovado!",
        description: `Alcançou domínio elevado na competência ${details.competencyLabel}.`,
        criteria: "Manter média acima de 80 nas tentativas alinhadas a esta competência.",
        icon: "medal-star",
        category: "BADGE",
        rarity: "EPIC",
        xpAwarded: 180,
        metadata: {
          bnccCode: details.bnccCode,
          mastery: competency.mastery,
        },
        unlockedAt: submittedAt,
      })
    );
  }

  if (competency.mastery >= 95 && (details.previousCompetencyProgress?.mastery ?? 0) < 95) {
    rewards.push(
      buildRewardPayload({
        code: `competency:${details.curriculumStandardId}:mastery95`,
        title: "Colecionadora de saberes",
        description: `Você transformou a competência ${details.competencyLabel} em superpoder!`,
        criteria: "Superar 95 pontos de maestria na competência da BNCC.",
        icon: "badge-legendary",
        category: "COLLECTIBLE",
        rarity: "LEGENDARY",
        xpAwarded: 260,
        metadata: {
          bnccCode: details.bnccCode,
          mastery: competency.mastery,
        },
        unlockedAt: submittedAt,
      })
    );
  }

  if (userAfter.level > userBefore.level) {
    rewards.push(
      buildRewardPayload({
        code: `level:${userAfter.level}`,
        title: `Nível ${userAfter.level} desbloqueado`,
        description: "Cada desafio enfrentado abre novas possibilidades!",
        criteria: "Acumular experiência suficiente para subir de nível.",
        icon: "level-up",
        category: "LEVEL",
        rarity: userAfter.level >= 4 ? "LEGENDARY" : "EPIC",
        xpAwarded: 0,
        levelAchieved: userAfter.level,
        metadata: {
          xpTotal: userAfter.xp,
          xpGained,
        },
        unlockedAt: submittedAt,
      })
    );
  }

  const previousMilestone = Math.floor(userBefore.xp / 500);
  const currentMilestone = Math.floor(userAfter.xp / 500);
  if (currentMilestone > previousMilestone) {
    rewards.push(
      buildRewardPayload({
        code: `xp:${currentMilestone * 500}`,
        title: "Marco de XP",
        description: `Você ultrapassou ${currentMilestone * 500} pontos de experiência acumulada!`,
        criteria: "Avançar 500 pontos de XP.",
        icon: "xp-gem",
        category: "XP",
        rarity: currentMilestone >= 4 ? "EPIC" : "RARE",
        xpAwarded: 0,
        metadata: {
          milestone: currentMilestone * 500,
        },
        unlockedAt: submittedAt,
      })
    );
  }

  return rewards;
};

export const applyProgressUpdate = async ({
  tx,
  activity,
  userBefore,
  attemptInput,
  submittedAt,
}: ApplyProgressUpdateParams): Promise<ProgressUpdateResult> => {
  const attempt = await tx.attempt.create({
    data: {
      userId: userBefore.id,
      activityId: activity.id,
      success: attemptInput.success,
      score: attemptInput.score,
      maxScore: attemptInput.maxScore ?? null,
      accuracy: attemptInput.accuracy,
      timeSpentSeconds: attemptInput.timeSpentSeconds,
      metadata: safeJsonStringify(attemptInput.metadata ?? null),
      submittedAt,
      completedAt: submittedAt,
    },
    select: {
      id: true,
      userId: true,
      activityId: true,
      success: true,
      score: true,
      maxScore: true,
      accuracy: true,
      timeSpentSeconds: true,
      submittedAt: true,
      metadata: true,
    },
  });

  const [moduleAttempts, competencyAttempts, previousModuleProgress, previousCompetencyProgress] =
    await Promise.all([
      tx.attempt.findMany({
        where: {
          userId: userBefore.id,
          activity: {
            contentModuleId: activity.contentModuleId,
          },
        },
        orderBy: {
          submittedAt: "asc",
        },
        select: {
          success: true,
          score: true,
          accuracy: true,
          timeSpentSeconds: true,
        },
      }),
      tx.attempt.findMany({
        where: {
          userId: userBefore.id,
          activity: {
            curriculumStandardId: activity.curriculumStandardId,
          },
        },
        orderBy: {
          submittedAt: "asc",
        },
        select: {
          success: true,
          score: true,
          accuracy: true,
          timeSpentSeconds: true,
        },
      }),
      tx.progress.findUnique({
        where: {
          userId_contentModuleId: {
            userId: userBefore.id,
            contentModuleId: activity.contentModuleId,
          },
        },
        select: {
          id: true,
          completion: true,
          currentStreak: true,
          mastery: true,
        },
      }),
      tx.competencyProgress.findUnique({
        where: {
          userId_curriculumStandardId: {
            userId: userBefore.id,
            curriculumStandardId: activity.curriculumStandardId,
          },
        },
        select: {
          id: true,
          mastery: true,
          currentStreak: true,
        },
      }),
    ]);

  const moduleMetrics = computeModuleMetrics(moduleAttempts);
  const competencyMetrics = computeCompetencyMetrics(competencyAttempts);

  const moduleProgressRecord = previousModuleProgress
    ? await tx.progress.update({
        where: { id: previousModuleProgress.id },
        data: {
          completion: moduleMetrics.completion,
          status: moduleMetrics.status,
          totalAttempts: moduleMetrics.totalAttempts,
          currentStreak: moduleMetrics.currentStreak,
          bestStreak: moduleMetrics.bestStreak,
          averageAccuracy: moduleMetrics.averageAccuracy,
          averageTimeSeconds: moduleMetrics.averageTimeSeconds,
          mastery: moduleMetrics.mastery,
          lastActivityAt: submittedAt,
        },
        select: {
          id: true,
          userId: true,
          contentModuleId: true,
          completion: true,
          status: true,
          totalAttempts: true,
          currentStreak: true,
          bestStreak: true,
          averageAccuracy: true,
          averageTimeSeconds: true,
          mastery: true,
          updatedAt: true,
          lastActivityAt: true,
        },
      })
    : await tx.progress.create({
        data: {
          userId: userBefore.id,
          contentModuleId: activity.contentModuleId,
          completion: moduleMetrics.completion,
          status: moduleMetrics.status,
          totalAttempts: moduleMetrics.totalAttempts,
          currentStreak: moduleMetrics.currentStreak,
          bestStreak: moduleMetrics.bestStreak,
          averageAccuracy: moduleMetrics.averageAccuracy,
          averageTimeSeconds: moduleMetrics.averageTimeSeconds,
          mastery: moduleMetrics.mastery,
          lastActivityAt: submittedAt,
        },
        select: {
          id: true,
          userId: true,
          contentModuleId: true,
          completion: true,
          status: true,
          totalAttempts: true,
          currentStreak: true,
          bestStreak: true,
          averageAccuracy: true,
          averageTimeSeconds: true,
          mastery: true,
          updatedAt: true,
          lastActivityAt: true,
        },
      });

  const competencyProgressRecord = previousCompetencyProgress
    ? await tx.competencyProgress.update({
        where: { id: previousCompetencyProgress.id },
        data: {
          mastery: competencyMetrics.mastery,
          currentStreak: competencyMetrics.currentStreak,
          bestStreak: competencyMetrics.bestStreak,
          accuracy: competencyMetrics.accuracy,
          averageTimeSeconds: competencyMetrics.averageTimeSeconds,
          attemptsCount: competencyMetrics.attemptsCount,
          lastInteractionAt: submittedAt,
        },
        select: {
          id: true,
          userId: true,
          curriculumStandardId: true,
          mastery: true,
          currentStreak: true,
          bestStreak: true,
          accuracy: true,
          averageTimeSeconds: true,
          attemptsCount: true,
          lastInteractionAt: true,
        },
      })
    : await tx.competencyProgress.create({
        data: {
          userId: userBefore.id,
          curriculumStandardId: activity.curriculumStandardId,
          mastery: competencyMetrics.mastery,
          currentStreak: competencyMetrics.currentStreak,
          bestStreak: competencyMetrics.bestStreak,
          accuracy: competencyMetrics.accuracy,
          averageTimeSeconds: competencyMetrics.averageTimeSeconds,
          attemptsCount: competencyMetrics.attemptsCount,
          lastInteractionAt: submittedAt,
        },
        select: {
          id: true,
          userId: true,
          curriculumStandardId: true,
          mastery: true,
          currentStreak: true,
          bestStreak: true,
          accuracy: true,
          averageTimeSeconds: true,
          attemptsCount: true,
          lastInteractionAt: true,
        },
      });

  const updatedUserStreak = attempt.success ? userBefore.currentStreak + 1 : 0;
  const updatedUserLongestStreak = Math.max(userBefore.longestStreak, updatedUserStreak);
  const streakBonus = updatedUserStreak >= 3 ? updatedUserStreak * 5 : 0;
  const xpGained = computeXpGain(attemptInput, streakBonus);
  const totalXp = userBefore.xp + xpGained;
  const { level: nextLevel, nextLevelAt } = computeLevelFromXp(totalXp);

  const updatedUser = await tx.user.update({
    where: { id: userBefore.id },
    data: {
      xp: totalXp,
      level: nextLevel,
      nextLevelAt,
      currentStreak: updatedUserStreak,
      longestStreak: updatedUserLongestStreak,
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

  const rewardContext: RewardsEvaluationContext = {
    moduleId: moduleProgressRecord.contentModuleId,
    moduleSlug: activity.contentModule.slug,
    moduleTitle: activity.contentModule.title,
    curriculumStandardId: activity.curriculumStandardId,
    bnccCode: activity.curriculumStandard.bnccCode,
    competencyLabel: activity.curriculumStandard.competency,
    previousModuleProgress: previousModuleProgress
      ? {
          completion: previousModuleProgress.completion,
          currentStreak: previousModuleProgress.currentStreak,
          mastery: previousModuleProgress.mastery,
        }
      : null,
    previousCompetencyProgress: previousCompetencyProgress
      ? {
          mastery: previousCompetencyProgress.mastery,
          currentStreak: previousCompetencyProgress.currentStreak,
        }
      : null,
    previousLevel: userBefore.level,
    userStreakBefore: userBefore.currentStreak,
  };

  const candidateRewards = evaluateRewards({
    metrics: moduleMetrics,
    competency: competencyMetrics,
    userBefore,
    userAfter: { ...updatedUser, xp: totalXp },
    details: rewardContext,
    xpGained,
    submittedAt,
  });

  const createdRewards = [] as ProgressUpdateResult["rewards"];

  for (const reward of candidateRewards) {
    try {
      const created = await tx.reward.create({
        data: {
          ...reward,
          userId: userBefore.id,
        },
        select: {
          id: true,
          code: true,
          title: true,
          description: true,
          criteria: true,
          icon: true,
          category: true,
          rarity: true,
          xpAwarded: true,
          levelAchieved: true,
          metadata: true,
          unlockedAt: true,
        },
      });
      createdRewards.push(created);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        continue;
      }
      throw error;
    }
  }

  return {
    attempt,
    moduleProgress: moduleProgressRecord,
    competencyProgress: competencyProgressRecord,
    user: updatedUser,
    xpGained,
    rewards: createdRewards,
  };
};
