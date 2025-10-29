import { difficultyTierSchema, type DifficultyTier } from "./schema";
import type { ContentModuleDocument } from "./workspace";

export type ContentTotals = {
  modules: number;
  activities: number;
};

export type StageSubjectMetrics = ContentTotals;

export type StageMetrics = ContentTotals & {
  subjects: Record<string, StageSubjectMetrics>;
};

export type BNCCMetrics = {
  codes: Record<string, number>;
  habilidades: Record<string, number>;
};

export type DifficultyDistribution = Record<DifficultyTier, number>;

export type ContentMetrics = {
  totals: ContentTotals;
  stages: Record<string, StageMetrics>;
  bncc: BNCCMetrics;
  difficulty: DifficultyDistribution;
};

type SubjectAccumulator = {
  modules: number;
  activities: number;
};

type StageAccumulator = {
  modules: number;
  activities: number;
  subjects: Map<string, SubjectAccumulator>;
};

const difficultyTiers = difficultyTierSchema.options;

const createDifficultyDistribution = (): DifficultyDistribution => {
  const distribution = {} as DifficultyDistribution;
  for (const tier of difficultyTiers) {
    distribution[tier] = 0;
  }
  return distribution;
};

const sortEntries = <T>(input: Iterable<[string, T]>): Array<[string, T]> =>
  Array.from(input).sort((a, b) => a[0].localeCompare(b[0]));

const toRecord = (entries: Iterable<[string, number]>): Record<string, number> => {
  const result: Record<string, number> = {};
  for (const [key, value] of sortEntries(entries)) {
    result[key] = value;
  }
  return result;
};

export const computeContentMetrics = (documents: ContentModuleDocument[]): ContentMetrics => {
  const totals: ContentTotals = {
    modules: documents.length,
    activities: 0,
  };

  const difficulty = createDifficultyDistribution();
  const bnccCodeCounts = new Map<string, number>();
  const habilidadeCounts = new Map<string, number>();
  const stageMap = new Map<string, StageAccumulator>();

  const getStageAccumulator = (stageSlug: string): StageAccumulator => {
    const normalized = stageSlug.toLowerCase();
    let stage = stageMap.get(normalized);
    if (!stage) {
      stage = {
        modules: 0,
        activities: 0,
        subjects: new Map<string, SubjectAccumulator>(),
      };
      stageMap.set(normalized, stage);
    }
    return stage;
  };

  const getSubjectAccumulator = (
    stage: StageAccumulator,
    subjectSlug: string
  ): SubjectAccumulator => {
    const normalized = subjectSlug.toLowerCase();
    let subject = stage.subjects.get(normalized);
    if (!subject) {
      subject = { modules: 0, activities: 0 };
      stage.subjects.set(normalized, subject);
    }
    return subject;
  };

  for (const document of documents) {
    const stageAccumulator = getStageAccumulator(document.module.stage);
    const subjectAccumulator = getSubjectAccumulator(stageAccumulator, document.module.subjectSlug);

    stageAccumulator.modules += 1;
    stageAccumulator.activities += document.activities.length;
    subjectAccumulator.modules += 1;
    subjectAccumulator.activities += document.activities.length;

    totals.activities += document.activities.length;

    for (const activity of document.activities) {
      difficulty[activity.difficulty] += 1;

      const bnccCode = activity.bncc.code;
      bnccCodeCounts.set(bnccCode, (bnccCodeCounts.get(bnccCode) ?? 0) + 1);

      for (const habilidade of activity.bncc.habilidades) {
        habilidadeCounts.set(habilidade, (habilidadeCounts.get(habilidade) ?? 0) + 1);
      }
    }
  }

  const stages: Record<string, StageMetrics> = {};

  for (const [stageSlug, accumulator] of sortEntries(stageMap)) {
    const subjects: Record<string, StageSubjectMetrics> = {};
    for (const [subjectSlug, subjectAccumulator] of sortEntries(accumulator.subjects)) {
      subjects[subjectSlug] = {
        modules: subjectAccumulator.modules,
        activities: subjectAccumulator.activities,
      };
    }

    stages[stageSlug] = {
      modules: accumulator.modules,
      activities: accumulator.activities,
      subjects,
    };
  }

  return {
    totals,
    stages,
    bncc: {
      codes: toRecord(bnccCodeCounts),
      habilidades: toRecord(habilidadeCounts),
    },
    difficulty,
  };
};
