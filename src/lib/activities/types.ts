import { z } from "zod";

import { activityDifficultyValues } from "@/lib/validation";

export const activityCategorySchema = z.enum(["QUIZ", "PUZZLE", "GAME"]);
export type ActivityCategory = z.infer<typeof activityCategorySchema>;

export const activityDifficultySchema = z.enum(activityDifficultyValues);
export type ActivityDifficulty = z.infer<typeof activityDifficultySchema>;

const baseActivityCoreSchema = z.object({
  slug: z.string().min(1, "slug é obrigatório"),
  title: z.string().min(1, "title é obrigatório"),
  bnccCode: z.string().min(1, "bnccCode é obrigatório"),
  bnccDescription: z.string().min(1, "bnccDescription é obrigatória"),
  contentModuleSlug: z.string().min(1, "contentModuleSlug é obrigatório"),
  activitySlug: z.string().min(1, "activitySlug é obrigatório"),
  difficulty: activityDifficultySchema,
  estimatedTimeMinutes: z.number().int().min(1),
  instructions: z.array(z.string().min(1)).nonempty(),
  objectives: z.array(z.string().min(1)).nonempty(),
});

const multipleChoiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  feedback: z.string().optional(),
});

const quizQuestionMultipleChoiceSchema = z.object({
  id: z.string().min(1),
  type: z.literal("multiple-choice"),
  prompt: z.string().min(1),
  hint: z.string().optional(),
  options: z.array(multipleChoiceOptionSchema).min(2),
});

const quizQuestionTrueFalseSchema = z.object({
  id: z.string().min(1),
  type: z.literal("true-false"),
  prompt: z.string().min(1),
  hint: z.string().optional(),
  statement: z.string().min(1),
  answer: z.boolean(),
  feedback: z.object({
    true: z.string().min(1),
    false: z.string().min(1),
  }),
});

const orderingItemSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
});

const quizQuestionOrderingSchema = z.object({
  id: z.string().min(1),
  type: z.literal("ordering"),
  prompt: z.string().min(1),
  hint: z.string().optional(),
  items: z.array(orderingItemSchema).min(2),
  correctOrder: z.array(z.string().min(1)).min(2),
  successFeedback: z.string().optional(),
  failureFeedback: z.string().optional(),
});

export const quizQuestionSchema = z.discriminatedUnion("type", [
  quizQuestionMultipleChoiceSchema,
  quizQuestionTrueFalseSchema,
  quizQuestionOrderingSchema,
]);

const quizScoringSchema = z.object({
  correct: z.number().min(0),
  incorrect: z.number().min(0),
});

const quizAdaptiveSchema = z
  .object({
    increaseAfter: z.number().int().min(1).default(2),
    decreaseAfter: z.number().int().min(1).default(1),
  })
  .partial();

export const quizSchema = z.object({
  scoring: quizScoringSchema.optional(),
  adaptive: quizAdaptiveSchema.optional(),
  questions: z.array(quizQuestionSchema).min(1),
});

const puzzlePairSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  match: z.string().min(1),
  hint: z.string().optional(),
  feedback: z.string().optional(),
});

export const puzzleSchema = z.object({
  mode: z.literal("matching"),
  pairs: z.array(puzzlePairSchema).min(1),
  successFeedback: z.string().optional(),
  errorFeedback: z.string().optional(),
});

const gameLevelSchema = z.object({
  id: z.string().min(1),
  challenge: z.string().min(1),
  answer: z.union([z.string(), z.number()]),
  hint: z.string().optional(),
  successFeedback: z.string().optional(),
  failureFeedback: z.string().optional(),
});

export const gameSchema = z.object({
  mode: z.literal("math-challenge"),
  timeLimitSeconds: z.number().int().min(10).optional(),
  lives: z.number().int().min(1).default(3),
  victoryMessage: z.string().optional(),
  gameOverMessage: z.string().optional(),
  levels: z.array(gameLevelSchema).min(1),
});

export const quizActivitySchema = baseActivityCoreSchema.extend({
  type: z.literal("QUIZ"),
  quiz: quizSchema,
});

export const puzzleActivitySchema = baseActivityCoreSchema.extend({
  type: z.literal("PUZZLE"),
  puzzle: puzzleSchema,
});

export const gameActivitySchema = baseActivityCoreSchema.extend({
  type: z.literal("GAME"),
  game: gameSchema,
});

export const interactiveActivitySchema = z.union([
  quizActivitySchema,
  puzzleActivitySchema,
  gameActivitySchema,
]);

export const interactiveDatasetSchema = z.object({
  updatedAt: z.string().min(1),
  activities: z.array(interactiveActivitySchema),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizScoringConfig = z.infer<typeof quizScoringSchema>;
export type QuizAdaptiveConfig = z.infer<typeof quizAdaptiveSchema>;
export type QuizDefinition = z.infer<typeof quizSchema>;
export type PuzzleDefinition = z.infer<typeof puzzleSchema>;
export type GameDefinition = z.infer<typeof gameSchema>;
export type InteractiveActivity = z.infer<typeof interactiveActivitySchema>;
export type InteractiveActivityDataset = z.infer<typeof interactiveDatasetSchema>;
