import { z } from "zod";

const difficultyValues = ["INICIAR", "PRATICAR", "DOMINAR"] as const;
const activityTypeValues = [
  "GAME",
  "PUZZLE",
  "QUIZ",
  "PROJECT",
  "PROJECT_BASED",
  "EXPERIMENT",
  "DISCUSSION",
] as const;

export const difficultyTierSchema = z.enum(difficultyValues);
export type DifficultyTier = z.infer<typeof difficultyTierSchema>;

export const contentActivityTypeSchema = z.enum(activityTypeValues);
export type ContentActivityType = z.infer<typeof contentActivityTypeSchema>;

const hintAudienceValues = ["ESTUDANTE", "EDUCADOR", "FAMILIA", "COORDENACAO"] as const;

const accessibilityHintSchema = z.union([
  z.string().min(1),
  z.object({
    audience: z.enum(hintAudienceValues).default("EDUCADOR"),
    text: z.string().min(1),
  }),
]);

const accessibilityFeedbackSchema = z
  .object({
    success: z.string().min(1).optional(),
    encouragement: z.string().min(1).optional(),
    retry: z.string().min(1).optional(),
    error: z.string().min(1).optional(),
    accessibility: z.string().min(1).optional(),
  })
  .partial();

const accessibilityAssetSchema = z.object({
  type: z.enum(["AUDIO", "VIDEO", "IMAGEM", "DOCUMENTO", "LINK"]).default("DOCUMENTO"),
  uri: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  altText: z.string().min(1).optional(),
});

const prerequisiteSchema = z.object({
  type: z.enum(["MODULE", "ACTIVITY", "SKILL", "CONTEXT"]).default("SKILL"),
  reference: z.string().min(1),
  description: z.string().min(1).optional(),
});

export const accessibilitySchema = z
  .object({
    hints: z.array(accessibilityHintSchema).optional(),
    feedback: accessibilityFeedbackSchema.optional(),
    assets: z.array(accessibilityAssetSchema).optional(),
    prerequisites: z.array(prerequisiteSchema).optional(),
  })
  .optional();

const bnccReferenceSchema = z.object({
  code: z.string().min(1),
  habilidades: z.array(z.string().min(1)).min(1),
});

const metadataSchema = z.record(z.string(), z.unknown());

const multipleChoiceOptionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  isCorrect: z.boolean(),
  feedback: z.string().min(1).optional(),
});

const quizQuestionMultipleChoiceSchema = z.object({
  id: z.string().min(1),
  type: z.literal("multiple-choice"),
  prompt: z.string().min(1),
  hint: z.string().min(1).optional(),
  options: z.array(multipleChoiceOptionSchema).min(2),
});

const quizQuestionTrueFalseSchema = z.object({
  id: z.string().min(1),
  type: z.literal("true-false"),
  prompt: z.string().min(1),
  hint: z.string().min(1).optional(),
  statement: z.string().min(1),
  answer: z.boolean(),
  feedback: z.object({
    true: z.string().min(1),
    false: z.string().min(1),
  }),
});

const quizQuestionOrderingSchema = z.object({
  id: z.string().min(1),
  type: z.literal("ordering"),
  prompt: z.string().min(1),
  hint: z.string().min(1).optional(),
  items: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
  correctOrder: z.array(z.string().min(1)).min(2),
  successFeedback: z.string().min(1).optional(),
  failureFeedback: z.string().min(1).optional(),
});

const quizActivitySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  type: z.literal("QUIZ"),
  bnccDescription: z.string().min(1),
  estimatedTimeMinutes: z.number().int().min(1),
  instructions: z.array(z.string().min(1)).nonempty(),
  objectives: z.array(z.string().min(1)).nonempty(),
  scoring: z
    .object({
      correct: z.number().min(0),
      incorrect: z.number().min(0),
    })
    .optional(),
  adaptive: z
    .object({
      increaseAfter: z.number().int().min(1).optional(),
      decreaseAfter: z.number().int().min(1).optional(),
    })
    .optional(),
  questions: z
    .array(
      z.discriminatedUnion("type", [
        quizQuestionMultipleChoiceSchema,
        quizQuestionTrueFalseSchema,
        quizQuestionOrderingSchema,
      ])
    )
    .min(1),
  accessibility: accessibilitySchema,
});

const puzzlePairSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  match: z.string().min(1),
  hint: z.string().min(1).optional(),
  feedback: z.string().min(1).optional(),
});

const puzzleActivitySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  type: z.literal("PUZZLE"),
  bnccDescription: z.string().min(1),
  estimatedTimeMinutes: z.number().int().min(1),
  instructions: z.array(z.string().min(1)).nonempty(),
  objectives: z.array(z.string().min(1)).nonempty(),
  puzzle: z.object({
    mode: z.literal("matching"),
    successFeedback: z.string().min(1).optional(),
    errorFeedback: z.string().min(1).optional(),
    pairs: z.array(puzzlePairSchema).min(1),
  }),
  accessibility: accessibilitySchema,
});

const gameLevelSchema = z.object({
  id: z.string().min(1),
  challenge: z.string().min(1),
  answer: z.union([z.string(), z.number()]),
  hint: z.string().min(1).optional(),
  successFeedback: z.string().min(1).optional(),
  failureFeedback: z.string().min(1).optional(),
});

const gameActivitySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  type: z.literal("GAME"),
  bnccDescription: z.string().min(1),
  estimatedTimeMinutes: z.number().int().min(1),
  instructions: z.array(z.string().min(1)).nonempty(),
  objectives: z.array(z.string().min(1)).nonempty(),
  game: z.object({
    mode: z.literal("math-challenge"),
    timeLimitSeconds: z.number().int().min(10).optional(),
    lives: z.number().int().min(1).optional(),
    victoryMessage: z.string().min(1).optional(),
    gameOverMessage: z.string().min(1).optional(),
    levels: z.array(gameLevelSchema).min(1),
  }),
  accessibility: accessibilitySchema,
});

export const interactiveDefinitionSchema = z.discriminatedUnion("type", [
  quizActivitySchema,
  puzzleActivitySchema,
  gameActivitySchema,
]);
export type InteractiveDefinition = z.infer<typeof interactiveDefinitionSchema>;

export const contentActivitySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
  summary: z.string().min(1).optional(),
  type: contentActivityTypeSchema,
  difficulty: difficultyTierSchema,
  bncc: bnccReferenceSchema,
  habilidadesDescription: z.array(z.string().min(1)).optional(),
  learningObjectives: z.array(z.string().min(1)).min(1),
  description: z.string().min(1).optional(),
  metadata: metadataSchema.optional(),
  notes: z.array(z.string().min(1)).optional(),
  accessibility: accessibilitySchema,
  prerequisites: z.array(prerequisiteSchema).optional(),
  interactive: interactiveDefinitionSchema.optional(),
});
export type ContentActivity = z.infer<typeof contentActivitySchema>;

export const contentModuleSchema = z.object({
  slug: z.string().min(1),
  stage: z.string().min(1),
  subjectSlug: z.string().min(1),
  subject: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  description: z.string().min(1),
  theme: z.string().min(1).optional(),
  discipline: z.string().min(1).optional(),
  ageGroupSlug: z.string().min(1),
  learningPathSlug: z.string().min(1).optional(),
  primaryBnccCode: z.string().min(1),
  secondaryBnccCodes: z.array(z.string().min(1)).optional(),
  learningOutcomes: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).optional(),
  estimatedDurationMinutes: z.number().int().min(10).optional(),
  summary: z.string().min(1).optional(),
  notes: z.array(z.string().min(1)).optional(),
});
export type ContentModule = z.infer<typeof contentModuleSchema>;

export const contentModuleFileSchema = z.object({
  module: contentModuleSchema,
  activities: z.array(contentActivitySchema).min(1),
  body: z.string().optional(),
});
export type ContentModuleFile = z.infer<typeof contentModuleFileSchema>;

export const workspaceSchema = z.object({
  modules: z.array(contentModuleFileSchema),
});
export type ContentWorkspace = z.infer<typeof workspaceSchema>;
