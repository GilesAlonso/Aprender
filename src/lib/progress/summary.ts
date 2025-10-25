import { Prisma, Reward } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/json";
import { LEVEL_BASE_THRESHOLD, LEVEL_STEP, STREAK_REWARD_THRESHOLDS } from "./engine";

const clamp = (value: number, min = 0, max = 100) => Math.min(Math.max(value, min), max);

type Client = Prisma.TransactionClient | typeof prisma;

export interface ProgressSummaryReward {
  id: string;
  code: string;
  title: string;
  category: string;
  rarity: string;
  xpAwarded: number;
  levelAchieved: number | null;
  unlockedAt: string;
  metadata: Record<string, unknown> | null;
}

export interface ProgressSummaryModule {
  id: string;
  title: string;
  slug: string;
  completion: number;
  status: string;
  mastery: number;
  currentStreak: number;
  bestStreak: number;
  averageAccuracy: number;
  averageTimeSeconds: number;
  lastActivityAt: string | null;
  bnccCode: string | null;
}

export interface ProgressSummaryCompetency {
  id: string;
  bnccCode: string;
  competency: string;
  mastery: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
  averageTimeSeconds: number;
  attemptsCount: number;
  lastInteractionAt: string | null;
}

export interface ProgressUpcomingGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  type: "module" | "competency" | "streak";
}

export interface ProgressSummaryData {
  user: {
    id: string;
    displayName: string | null;
    xp: number;
    level: number;
    nextLevelAt: number;
    xpToNext: number;
    xpProgressPercent: number;
    currentStreak: number;
    longestStreak: number;
  };
  modules: ProgressSummaryModule[];
  competencies: ProgressSummaryCompetency[];
  rewards: ProgressSummaryReward[];
  upcomingGoals: ProgressUpcomingGoal[];
}

export interface EducatorDigest {
  learner: {
    id: string;
    displayName: string | null;
    level: number;
    xp: number;
    xpToNext: number;
    masteryAverage: number;
    currentStreak: number;
    longestStreak: number;
    completedModules: number;
    rewardCount: number;
  };
  strengths: Array<{
    bnccCode: string;
    competency: string;
    mastery: number;
  }>;
  focusAreas: Array<{
    moduleId: string;
    title: string;
    mastery: number;
    recommendation: string;
  }>;
  recentRewards: Array<{
    id: string;
    title: string;
    category: string;
    rarity: string;
    unlockedAt: string;
  }>;
  upcomingGoals: ProgressUpcomingGoal[];
  recommendations: string[];
}

const parseRewardMetadata = (reward: Reward): Record<string, unknown> | null =>
  safeJsonParse<Record<string, unknown>>(reward.metadata) ?? null;

const getLevelFloor = (level: number) => {
  if (level <= 1) {
    return 0;
  }
  return LEVEL_BASE_THRESHOLD + (level - 2) * LEVEL_STEP;
};

const buildUpcomingGoals = (
  modules: ProgressSummaryModule[],
  competencies: ProgressSummaryCompetency[],
  userStreak: number
): ProgressUpcomingGoal[] => {
  const moduleGoals: ProgressUpcomingGoal[] = modules
    .filter((module) => module.completion < 100)
    .map((module) => ({
      id: `module:${module.id}`,
      title: module.title,
      description: "Complete as atividades restantes para desbloquear novas recompensas.",
      progress: module.completion,
      target: 100,
      type: "module" as const,
    }));

  const competencyGoals: ProgressUpcomingGoal[] = competencies
    .filter((competency) => competency.mastery < 80)
    .map((competency) => ({
      id: `competency:${competency.id}`,
      title: `Dominar ${competency.bnccCode}`,
      description: "Eleve sua maestria acima de 80 para celebrar uma nova conquista BNCC.",
      progress: competency.mastery,
      target: 80,
      type: "competency" as const,
    }));

  const nextStreakTarget = STREAK_REWARD_THRESHOLDS.find((threshold) => threshold > userStreak);
  const streakGoals: ProgressUpcomingGoal[] = nextStreakTarget
    ? [
        {
          id: `streak:${nextStreakTarget}`,
          title: `${nextStreakTarget} vitórias seguidas`,
          description: "Mantenha a sequência de acertos para liberar um bônus brilhante.",
          progress: userStreak,
          target: nextStreakTarget,
          type: "streak" as const,
        },
      ]
    : [];

  return [...moduleGoals, ...competencyGoals, ...streakGoals]
    .sort((a, b) => b.progress / b.target - a.progress / a.target)
    .slice(0, 6);
};

export const getProgressSummary = async (
  userId: string,
  client: Client = prisma
): Promise<ProgressSummaryData> => {
  const [user, modules, competencies, rewards] = await Promise.all([
    client.user.findUnique({
      where: { id: userId },
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
    client.progress.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        contentModuleId: true,
        completion: true,
        status: true,
        mastery: true,
        currentStreak: true,
        bestStreak: true,
        averageAccuracy: true,
        averageTimeSeconds: true,
        lastActivityAt: true,
        contentModule: {
          select: {
            id: true,
            slug: true,
            title: true,
            curriculumStandard: {
              select: {
                bnccCode: true,
              },
            },
          },
        },
      },
    }),
    client.competencyProgress.findMany({
      where: { userId },
      orderBy: { mastery: "desc" },
      select: {
        id: true,
        mastery: true,
        currentStreak: true,
        bestStreak: true,
        accuracy: true,
        averageTimeSeconds: true,
        attemptsCount: true,
        lastInteractionAt: true,
        curriculumStandard: {
          select: {
            id: true,
            bnccCode: true,
            competency: true,
          },
        },
      },
    }),
    client.reward.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
      take: 10,
    }),
  ]);

  if (!user) {
    throw new Error("Usuário não encontrado para gerar resumo de progresso");
  }

  const levelFloor = getLevelFloor(user.level);
  const xpSpan = user.nextLevelAt - levelFloor;
  const xpIntoLevel = user.xp - levelFloor;
  const xpProgressPercent = xpSpan > 0 ? clamp(Math.round((xpIntoLevel / xpSpan) * 100)) : 100;
  const xpToNext = Math.max(0, user.nextLevelAt - user.xp);

  const moduleSummaries: ProgressSummaryModule[] = modules.map((progress) => ({
    id: progress.contentModuleId,
    title: progress.contentModule.title,
    slug: progress.contentModule.slug,
    completion: progress.completion,
    status: progress.status,
    mastery: progress.mastery,
    currentStreak: progress.currentStreak,
    bestStreak: progress.bestStreak,
    averageAccuracy: Number(progress.averageAccuracy.toFixed(4)),
    averageTimeSeconds: progress.averageTimeSeconds,
    lastActivityAt: progress.lastActivityAt ? progress.lastActivityAt.toISOString() : null,
    bnccCode: progress.contentModule.curriculumStandard?.bnccCode ?? null,
  }));

  const competencySummaries: ProgressSummaryCompetency[] = competencies.map((competency) => ({
    id: competency.curriculumStandard.id,
    bnccCode: competency.curriculumStandard.bnccCode,
    competency: competency.curriculumStandard.competency,
    mastery: competency.mastery,
    accuracy: Number(competency.accuracy.toFixed(4)),
    currentStreak: competency.currentStreak,
    bestStreak: competency.bestStreak,
    averageTimeSeconds: competency.averageTimeSeconds,
    attemptsCount: competency.attemptsCount,
    lastInteractionAt: competency.lastInteractionAt
      ? competency.lastInteractionAt.toISOString()
      : null,
  }));

  const rewardSummaries: ProgressSummaryReward[] = rewards.map((reward) => ({
    id: reward.id,
    code: reward.code,
    title: reward.title,
    category: reward.category,
    rarity: reward.rarity,
    xpAwarded: reward.xpAwarded,
    levelAchieved: reward.levelAchieved,
    unlockedAt: reward.unlockedAt.toISOString(),
    metadata: parseRewardMetadata(reward),
  }));

  const upcomingGoals = buildUpcomingGoals(
    moduleSummaries,
    competencySummaries,
    user.currentStreak
  );

  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      xp: user.xp,
      level: user.level,
      nextLevelAt: user.nextLevelAt,
      xpToNext,
      xpProgressPercent,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    },
    modules: moduleSummaries,
    competencies: competencySummaries,
    rewards: rewardSummaries,
    upcomingGoals,
  };
};

export const getEducatorDigest = async (
  userId: string,
  client: Client = prisma
): Promise<EducatorDigest> => {
  const summary = await getProgressSummary(userId, client);

  const masteryAverage = summary.modules.length
    ? Math.round(
        summary.modules.reduce((accumulator, module) => accumulator + module.mastery, 0) /
          summary.modules.length
      )
    : 0;

  const strengths = summary.competencies
    .filter((competency) => competency.mastery >= 80)
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 3)
    .map((competency) => ({
      bnccCode: competency.bnccCode,
      competency: competency.competency,
      mastery: competency.mastery,
    }));

  const focusAreas = summary.modules
    .filter((module) => module.mastery < 70)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3)
    .map((module) => ({
      moduleId: module.id,
      title: module.title,
      mastery: module.mastery,
      recommendation:
        module.bnccCode !== null
          ? `Retomar o módulo "${module.title}" destacando a competência ${module.bnccCode}.`
          : `Retomar o módulo "${module.title}" reforçando evidências de aprendizagem.`,
    }));

  const recentRewards = summary.rewards.slice(0, 3).map((reward) => ({
    id: reward.id,
    title: reward.title,
    category: reward.category,
    rarity: reward.rarity,
    unlockedAt: reward.unlockedAt,
  }));

  const recommendations = new Set<string>();

  if (focusAreas[0]) {
    recommendations.add(
      `Planeje um acompanhamento dedicado para "${focusAreas[0].title}" e registre evidências de avanço.`
    );
  }

  if (summary.upcomingGoals[0]) {
    recommendations.add(
      `Combine uma rotina curta para atingir a meta "${summary.upcomingGoals[0].title}".`
    );
  }

  if (strengths[0]) {
    recommendations.add(
      `Compartilhe com a família o destaque em ${strengths[0].competency} e celebre a conquista.`
    );
  }

  if (summary.user.currentStreak >= 3) {
    recommendations.add(
      "Mantenha a sequência de estudos com atividades rápidas diárias para preservar a motivação."
    );
  }

  return {
    learner: {
      id: summary.user.id,
      displayName: summary.user.displayName,
      level: summary.user.level,
      xp: summary.user.xp,
      xpToNext: summary.user.xpToNext,
      masteryAverage,
      currentStreak: summary.user.currentStreak,
      longestStreak: summary.user.longestStreak,
      completedModules: summary.modules.filter((module) => module.completion >= 100).length,
      rewardCount: summary.rewards.length,
    },
    strengths,
    focusAreas,
    recentRewards,
    upcomingGoals: summary.upcomingGoals,
    recommendations: Array.from(recommendations),
  };
};
