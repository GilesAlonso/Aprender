import { z } from "zod";

export const activityTypeValues = ["GAME", "PUZZLE", "QUIZ"] as const;
export const activityDifficultyValues = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;
export const progressStatusValues = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"] as const;

const metadataSchema = z.record(z.string(), z.unknown());

export const modulesQuerySchema = z.object({
  ageGroupSlug: z.string().min(1, "ageGroupSlug é obrigatório").optional(),
  overrideAgeGroupSlug: z.string().min(1, "overrideAgeGroupSlug é obrigatório").optional(),
  userId: z.string().cuid("userId inválido").optional(),
  age: z.coerce.number().int().min(4).max(17).optional(),
});

export const logAttemptSchema = z.object({
  userId: z.string().cuid("userId inválido"),
  activityId: z.string().cuid("activityId inválido"),
  success: z.boolean(),
  score: z.number().int().min(0).max(100).optional(),
  maxScore: z.number().int().min(1).max(100).optional(),
  accuracy: z.number().min(0).max(1).optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  metadata: metadataSchema.optional(),
});

export const progressMutationSchema = z.object({
  userId: z.string().cuid("userId inválido"),
  contentModuleId: z.string().cuid("contentModuleId inválido"),
  completion: z.number().int().min(0).max(100),
  status: z.enum(progressStatusValues).optional(),
  totalAttempts: z.number().int().min(0).optional(),
  lastActivityAt: z.string().datetime().optional(),
});

export const rewardsQuerySchema = z.object({
  userId: z.string().cuid("userId inválido"),
});

export const progressSummaryQuerySchema = z.object({
  userId: z.string().cuid("userId inválido"),
});

export type LogAttemptInput = z.infer<typeof logAttemptSchema>;
export type ProgressMutationInput = z.infer<typeof progressMutationSchema>;
export type ModulesQueryInput = z.infer<typeof modulesQuerySchema>;
export type RewardsQueryInput = z.infer<typeof rewardsQuerySchema>;
export type ProgressSummaryQueryInput = z.infer<typeof progressSummaryQuerySchema>;
