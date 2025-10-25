import type { AgeGroup } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { BnccStageConfig } from "./age-stages";
import { BNCC_STAGE_CONFIG } from "./age-stages";

const ORDERED_STAGE_CONFIG = [...BNCC_STAGE_CONFIG].sort((a, b) => a.minAge - b.minAge);

export type ResolutionSource = "override" | "profile" | "cookie" | "age" | "default";

export type AgeGroupSummary = {
  id: string;
  slug: string;
  name: string;
  minAge: number;
  maxAge: number;
  description: string | null;
  stage: string;
  label: string;
  guidanceNote: string | null;
  competencies: string[];
  habilidades: string[];
};

export type ResolvedAgeGroup = {
  ageGroup: AgeGroup;
  stageConfig: BnccStageConfig | undefined;
  source: ResolutionSource;
};

export const getStageConfigBySlug = (slug: string): BnccStageConfig | undefined =>
  BNCC_STAGE_CONFIG.find((stage) => stage.slug === slug);

export const getStageConfigForAge = (age: number): BnccStageConfig => {
  const stage = ORDERED_STAGE_CONFIG.find((entry) => age >= entry.minAge && age <= entry.maxAge);
  if (stage) {
    return stage;
  }

  if (age < ORDERED_STAGE_CONFIG[0]!.minAge) {
    return ORDERED_STAGE_CONFIG[0]!;
  }

  return ORDERED_STAGE_CONFIG[ORDERED_STAGE_CONFIG.length - 1]!;
};

const fetchAgeGroupBySlug = async (slug: string): Promise<AgeGroup | null> =>
  prisma.ageGroup.findUnique({ where: { slug } });

export const buildAgeGroupSummary = (
  ageGroup: AgeGroup,
  stageConfig?: BnccStageConfig
): AgeGroupSummary => {
  const config = stageConfig ?? getStageConfigBySlug(ageGroup.slug);

  return {
    id: ageGroup.id,
    slug: ageGroup.slug,
    name: ageGroup.name,
    minAge: ageGroup.minAge,
    maxAge: ageGroup.maxAge,
    description: ageGroup.description ?? config?.educatorSummary ?? null,
    stage: config?.stage ?? ageGroup.name,
    label: config?.label ?? ageGroup.name,
    guidanceNote: config?.guidanceNote ?? null,
    competencies: config?.competencies ?? [],
    habilidades: config?.habilidades ?? [],
  };
};

const ensureStageConfig = (slug: string): BnccStageConfig | undefined =>
  getStageConfigBySlug(slug ?? "");

export interface ResolveAgeGroupOptions {
  age?: number;
  overrideSlug?: string | null;
  userId?: string | null;
  cookieSlug?: string | null;
  ignoreProfile?: boolean;
  ignoreCookie?: boolean;
}

export const resolveStudentAgeGroup = async (
  options: ResolveAgeGroupOptions
): Promise<ResolvedAgeGroup> => {
  const { age, overrideSlug, userId, cookieSlug, ignoreProfile, ignoreCookie } = options;

  if (overrideSlug) {
    const ageGroup = await fetchAgeGroupBySlug(overrideSlug);
    if (ageGroup) {
      return {
        ageGroup,
        stageConfig: ensureStageConfig(ageGroup.slug),
        source: "override",
      };
    }
  }

  if (!ignoreProfile && userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ageGroup: true },
    });
    if (user?.ageGroup) {
      return {
        ageGroup: user.ageGroup,
        stageConfig: ensureStageConfig(user.ageGroup.slug),
        source: "profile",
      };
    }
  }

  if (!ignoreCookie && cookieSlug) {
    const cookieGroup = await fetchAgeGroupBySlug(cookieSlug);
    if (cookieGroup) {
      return {
        ageGroup: cookieGroup,
        stageConfig: ensureStageConfig(cookieGroup.slug),
        source: "cookie",
      };
    }
  }

  if (typeof age === "number" && !Number.isNaN(age)) {
    const stage = getStageConfigForAge(age);
    const ageGroup = await fetchAgeGroupBySlug(stage.slug);
    if (ageGroup) {
      return {
        ageGroup,
        stageConfig: stage,
        source: "age",
      };
    }
  }

  const fallbackStage = ORDERED_STAGE_CONFIG[0]!;
  const fallbackAgeGroup =
    (await fetchAgeGroupBySlug(fallbackStage.slug)) ??
    (await prisma.ageGroup.findFirst({ orderBy: { minAge: "asc" } }));

  if (!fallbackAgeGroup) {
    throw new Error("Nenhum AgeGroup configurado na base de dados");
  }

  return {
    ageGroup: fallbackAgeGroup,
    stageConfig: ensureStageConfig(fallbackAgeGroup.slug),
    source: "default",
  };
};

export const resolveRequestedAgeGroup = async (
  slug: string | undefined,
  fallback: ResolvedAgeGroup
): Promise<ResolvedAgeGroup> => {
  if (!slug) {
    return fallback;
  }

  const ageGroup = await fetchAgeGroupBySlug(slug);
  if (!ageGroup) {
    return fallback;
  }

  return {
    ageGroup,
    stageConfig: ensureStageConfig(ageGroup.slug),
    source: fallback.source,
  };
};
