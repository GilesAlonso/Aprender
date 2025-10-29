import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";

import type { ContentActivity, ContentModule } from "./schema";
import { buildEf01AssetIndex, loadEf01AssetManifest, type Ef01AssetManifestEntry } from "./assets";
import { loadWorkspace, CONTENT_DIR } from "./workspace";

export type BuildOptions = {
  rootDir?: string;
  writeToDisk?: boolean;
  stage?: string;
  subjectSlug?: string;
  modules?: string[];
};

export type ActivityIndexEntry = {
  moduleSlug: string;
  activitySlug: string;
  activityType: string;
};

export type ModulesDataset = {
  updatedAt: string;
  hash: string;
  modules: ContentModuleOutput[];
};

export type InteractiveDataset = {
  updatedAt: string;
  hash: string;
  activities: InteractiveActivityOutput[];
};

export type ContentIndexDataset = {
  generatedAt: string;
  contentHash: string;
  modulesBySubject: Record<string, string[]>;
  modulesByStage: Record<string, string[]>;
  activitiesByDifficulty: Record<string, ActivityIndexEntry[]>;
  interactiveMap: Record<string, ActivityIndexEntry>;
  bncc: {
    modules: Record<string, string>;
    activities: Record<string, string>;
  };
};

export type BuildOutput = {
  modules: ModulesDataset;
  interactive: InteractiveDataset;
  index: ContentIndexDataset;
};

type Ef01AssetIndex = Map<string, Ef01AssetManifestEntry>;

const difficultyToLegacy: Record<string, string> = {
  INICIAR: "BEGINNER",
  PRATICAR: "INTERMEDIATE",
  DOMINAR: "ADVANCED",
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeHints = (value: unknown): Array<Record<string, unknown>> | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const normalized = value
    .map((hint) => {
      if (typeof hint === "string") {
        return { text: hint } as Record<string, unknown>;
      }

      if (isPlainObject(hint)) {
        return hint as Record<string, unknown>;
      }

      return null;
    })
    .filter((hint): hint is Record<string, unknown> => hint !== null);

  return normalized.length > 0 ? normalized : undefined;
};

const removeEmpty = (value: Record<string, unknown>): Record<string, unknown> | undefined => {
  const entries = Object.entries(value).filter(([, entryValue]) => {
    if (entryValue === undefined || entryValue === null) {
      return false;
    }

    if (Array.isArray(entryValue)) {
      return entryValue.length > 0;
    }

    if (isPlainObject(entryValue)) {
      return Object.keys(entryValue).length > 0;
    }

    return true;
  });

  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

type AccessibilityValue = NonNullable<ContentActivity["accessibility"]>;

type AccessibilityContext = {
  moduleSlug: string;
  subjectSlug: string;
  activitySlug: string;
  scope: "activity" | "interactive";
  interactiveSlug?: string;
};

const normalizeSupportEntry = (entry: unknown): Record<string, unknown> | null => {
  if (typeof entry === "string") {
    const normalized = entry.trim();
    return normalized.length > 0 ? { description: normalized } : null;
  }

  if (isPlainObject(entry)) {
    const descriptionValue = entry["description"];
    const titleValue = entry["title"];
    const stepsValue = entry["steps"];

    const description =
      typeof descriptionValue === "string" && descriptionValue.trim().length > 0
        ? descriptionValue
        : undefined;

    if (!description) {
      return null;
    }

    const steps = Array.isArray(stepsValue)
      ? stepsValue
          .map((item) => (typeof item === "string" ? item.trim() : String(item)))
          .filter((item) => item.length > 0)
      : undefined;

    return (
      removeEmpty({
        title:
          typeof titleValue === "string" && titleValue.trim().length > 0 ? titleValue : undefined,
        description,
        steps,
      }) ?? null
    );
  }

  return null;
};

const normalizeSupportCollection = (value: unknown): Record<string, unknown>[] | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const items = Array.isArray(value) ? value : [value];
  const normalized = items
    .map((entry) => normalizeSupportEntry(entry))
    .filter((entry): entry is Record<string, unknown> => entry !== null);

  return normalized.length > 0 ? normalized : undefined;
};

const describeAccessibilityContext = (context: AccessibilityContext): string => {
  if (context.scope === "interactive") {
    return `interativo '${context.interactiveSlug ?? "desconhecido"}' da atividade '${context.activitySlug}' no módulo '${context.moduleSlug}'`;
  }

  return `atividade '${context.activitySlug}' no módulo '${context.moduleSlug}'`;
};

const normalizeAccessibility = (
  accessibility: ContentActivity["accessibility"],
  assetIndex: Ef01AssetIndex,
  context: AccessibilityContext
): Record<string, unknown> | undefined => {
  if (!accessibility) {
    return undefined;
  }

  if (!isPlainObject(accessibility)) {
    return undefined;
  }

  const data = accessibility as Record<string, unknown>;

  const hints = normalizeHints(data["hints"]);

  const feedbackRaw = data["feedback"];
  const feedback = isPlainObject(feedbackRaw)
    ? (feedbackRaw as Record<string, unknown>)
    : undefined;

  const prerequisitesRaw = data["prerequisites"];
  const prerequisites =
    Array.isArray(prerequisitesRaw) && prerequisitesRaw.length > 0
      ? (prerequisitesRaw as unknown[])
      : undefined;

  const assetsRaw = data["assets"];

  const assets =
    Array.isArray(assetsRaw) && assetsRaw.length > 0
      ? (assetsRaw as AccessibilityValue["assets"])
          .map((asset) => {
            const base: Record<string, unknown> = {
              type: asset.type,
              slug: asset.slug,
              uri: asset.uri,
              title: asset.title,
              description: asset.description,
              altText: asset.altText,
            };

            if (asset.slug) {
              const manifestEntry = assetIndex.get(asset.slug);
              if (!manifestEntry) {
                const location = describeAccessibilityContext(context);
                throw new Error(
                  `Asset '${asset.slug}' referenciado em ${location} não existe no manifest EF01.`
                );
              }

              const resolvedUri = asset.uri ?? manifestEntry.files.svg;
              const normalized = removeEmpty({
                ...base,
                subject: manifestEntry.subject,
                theme: manifestEntry.theme,
                uri: resolvedUri,
                png: manifestEntry.files.png,
                altText: asset.altText ?? manifestEntry.altText,
                recommendedUsage: manifestEntry.recommendedUsage,
                colorProfile: manifestEntry.colorProfile,
                hash: manifestEntry.hash,
                license: manifestEntry.license,
              });

              if (!normalized || !normalized["uri"]) {
                const location = describeAccessibilityContext(context);
                throw new Error(`Asset '${asset.slug}' em ${location} não pôde ser normalizado.`);
              }

              return normalized;
            }

            if (!asset.uri) {
              const location = describeAccessibilityContext(context);
              throw new Error(
                `Asset sem slug nem URI encontrado em ${location}. Verifique o conteúdo.`
              );
            }

            if (asset.type === "IMAGEM" && !asset.altText) {
              const location = describeAccessibilityContext(context);
              throw new Error(
                `Asset de imagem '${asset.uri}' em ${location} precisa informar 'altText' ou referenciar um slug válido.`
              );
            }

            return removeEmpty(base) ?? undefined;
          })
          .filter(
            (value): value is Record<string, unknown> =>
              value !== undefined && Object.keys(value).length > 0
          )
      : undefined;

  const alternatives = normalizeSupportCollection(data["alternatives"]);
  const audioCueCollection = normalizeSupportCollection(data["audioCue"]);
  const audioCue = audioCueCollection ? audioCueCollection[0] : undefined;
  const motorSupport = normalizeSupportCollection(data["motorSupport"]);

  return (
    removeEmpty({
      hints,
      feedback,
      assets,
      prerequisites,
      alternatives,
      audioCue,
      motorSupport,
    }) ?? undefined
  );
};

const mapDifficulty = (difficulty: string): string => difficultyToLegacy[difficulty] ?? difficulty;

const computeHash = (value: unknown): string => {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(value));
  return hash.digest("hex");
};

type ModuleActivityOutput = {
  slug: string;
  title: string;
  prompt: string;
  activityType: string;
  difficulty: string;
  bnccCode: string;
  learningObjectives: string[];
  description?: string;
  metadata?: Record<string, unknown>;
  summary?: string;
};

type ContentModuleOutput = {
  slug: string;
  stage: string;
  subjectSlug: string;
  subject: string;
  title: string;
  subtitle?: string;
  description: string;
  theme?: string;
  discipline?: string;
  ageGroupSlug: string;
  learningPathSlug?: string;
  primaryBnccCode: string;
  secondaryBnccCodes?: string[];
  learningOutcomes: string[];
  tags?: string[];
  estimatedDurationMinutes?: number;
  summary?: string;
  notes?: string[];
  activities: ModuleActivityOutput[];
};

type InteractiveActivityOutput = {
  slug: string;
  title: string;
  type: string;
  bnccCode: string;
  bnccDescription: string;
  contentModuleSlug: string;
  activitySlug: string;
  difficulty: string;
  estimatedTimeMinutes: number;
  instructions: string[];
  objectives: string[];
  accessibility?: Record<string, unknown>;
  quiz?: Record<string, unknown>;
  puzzle?: Record<string, unknown>;
  game?: Record<string, unknown>;
};

const buildActivityMetadata = (
  activity: ContentActivity,
  module: ContentModule,
  assetIndex: Ef01AssetIndex
): Record<string, unknown> | undefined => {
  const base: Record<string, unknown> = activity.metadata ? { ...activity.metadata } : {};

  base.bncc = {
    code: activity.bncc.code,
    habilidades: activity.bncc.habilidades,
  };

  if (activity.habilidadesDescription) {
    base.habilidadesDescription = activity.habilidadesDescription;
  }

  base.difficultyTier = activity.difficulty;

  const accessibility = normalizeAccessibility(activity.accessibility, assetIndex, {
    moduleSlug: module.slug,
    subjectSlug: module.subjectSlug,
    activitySlug: activity.slug,
    scope: "activity",
  });

  if (accessibility) {
    base.accessibility = accessibility;
  }

  if (activity.prerequisites && activity.prerequisites.length > 0) {
    base.prerequisites = activity.prerequisites;
  }

  if (activity.notes && activity.notes.length > 0) {
    base.notes = activity.notes;
  }

  if (activity.interactive) {
    base.interactiveSlug = activity.interactive.slug;
    base.interactiveType = activity.interactive.type;
  }

  return removeEmpty(base);
};

const buildInteractiveEntry = (
  module: ContentModule,
  activity: ContentActivity,
  difficulty: string,
  assetIndex: Ef01AssetIndex
): InteractiveActivityOutput | null => {
  if (!activity.interactive) {
    return null;
  }

  const { interactive } = activity;
  const base: InteractiveActivityOutput = {
    slug: interactive.slug,
    title: interactive.title,
    type: interactive.type,
    bnccCode: activity.bncc.code,
    bnccDescription: interactive.bnccDescription,
    contentModuleSlug: module.slug,
    activitySlug: activity.slug,
    difficulty,
    estimatedTimeMinutes: interactive.estimatedTimeMinutes,
    instructions: [...interactive.instructions],
    objectives: [...interactive.objectives],
  };

  const accessibility = normalizeAccessibility(interactive.accessibility, assetIndex, {
    moduleSlug: module.slug,
    subjectSlug: module.subjectSlug,
    activitySlug: activity.slug,
    scope: "interactive",
    interactiveSlug: interactive.slug,
  });

  if (accessibility) {
    base.accessibility = accessibility;
  }

  if (interactive.type === "QUIZ") {
    base.quiz = {
      ...(interactive.scoring ? { scoring: interactive.scoring } : {}),
      ...(interactive.adaptive ? { adaptive: interactive.adaptive } : {}),
      questions: interactive.questions,
    };
  } else if (interactive.type === "PUZZLE") {
    base.puzzle = interactive.puzzle;
  } else if (interactive.type === "GAME") {
    base.game = interactive.game;
  }

  return base;
};

const buildModuleEntry = (
  module: ContentModule,
  activities: ModuleActivityOutput[]
): ContentModuleOutput => ({
  slug: module.slug,
  stage: module.stage,
  subjectSlug: module.subjectSlug,
  subject: module.subject,
  title: module.title,
  subtitle: module.subtitle,
  description: module.description,
  theme: module.theme,
  discipline: module.discipline,
  ageGroupSlug: module.ageGroupSlug,
  learningPathSlug: module.learningPathSlug ?? undefined,
  primaryBnccCode: module.primaryBnccCode,
  secondaryBnccCodes: module.secondaryBnccCodes,
  learningOutcomes: module.learningOutcomes,
  tags: module.tags,
  estimatedDurationMinutes: module.estimatedDurationMinutes,
  summary: module.summary,
  notes: module.notes,
  activities,
});

const buildModuleActivityEntry = (
  activity: ContentActivity,
  module: ContentModule,
  assetIndex: Ef01AssetIndex
): ModuleActivityOutput => {
  const difficulty = mapDifficulty(activity.difficulty);
  const metadata = buildActivityMetadata(activity, module, assetIndex);

  return {
    slug: activity.slug,
    title: activity.title,
    prompt: activity.prompt,
    activityType: activity.type,
    difficulty,
    bnccCode: activity.bncc.code,
    learningObjectives: activity.learningObjectives,
    description: activity.description,
    metadata,
    summary: activity.summary,
  };
};

export const buildWorkspace = (options: BuildOptions = {}): BuildOutput => {
  const documents = loadWorkspace({
    rootDir: options.rootDir,
    stage: options.stage,
    subjectSlug: options.subjectSlug,
    modules: options.modules,
  });
  const ef01Manifest = loadEf01AssetManifest();
  const ef01AssetIndex = buildEf01AssetIndex(ef01Manifest);
  const buildTimestamp = new Date().toISOString();

  const modulesBySubject: Record<string, Set<string>> = {};
  const modulesByStage: Record<string, Set<string>> = {};
  const activitiesByDifficulty: Record<string, ActivityIndexEntry[]> = {
    INICIAR: [],
    PRATICAR: [],
    DOMINAR: [],
  };
  const interactiveIndex: Record<string, ActivityIndexEntry> = {};
  const bnccModulesIndex: Record<string, string> = {};
  const bnccActivitiesIndex: Record<string, string> = {};

  const modulesOutput: ContentModuleOutput[] = [];
  const interactiveOutput: InteractiveActivityOutput[] = [];

  for (const document of documents) {
    bnccModulesIndex[document.module.slug] = document.module.primaryBnccCode;

    if (!modulesBySubject[document.module.subjectSlug]) {
      modulesBySubject[document.module.subjectSlug] = new Set();
    }
    modulesBySubject[document.module.subjectSlug].add(document.module.slug);

    if (!modulesByStage[document.module.stage]) {
      modulesByStage[document.module.stage] = new Set();
    }
    modulesByStage[document.module.stage].add(document.module.slug);

    const activityEntries = document.activities.map((activity) => {
      bnccActivitiesIndex[activity.slug] = activity.bncc.code;

      const difficulty = mapDifficulty(activity.difficulty);
      activitiesByDifficulty[activity.difficulty] =
        activitiesByDifficulty[activity.difficulty] ?? [];
      activitiesByDifficulty[activity.difficulty].push({
        moduleSlug: document.module.slug,
        activitySlug: activity.slug,
        activityType: activity.type,
      });

      const interactiveEntry = buildInteractiveEntry(
        document.module,
        activity,
        difficulty,
        ef01AssetIndex
      );
      if (interactiveEntry) {
        interactiveOutput.push(interactiveEntry);
        interactiveIndex[interactiveEntry.slug] = {
          moduleSlug: document.module.slug,
          activitySlug: activity.slug,
          activityType: activity.type,
        };
      }

      return buildModuleActivityEntry(activity, document.module, ef01AssetIndex);
    });

    modulesOutput.push(buildModuleEntry(document.module, activityEntries));
  }

  modulesOutput.sort((a, b) => a.slug.localeCompare(b.slug));
  interactiveOutput.sort((a, b) => a.slug.localeCompare(b.slug));

  const modulesDatasetWithoutHash = {
    updatedAt: buildTimestamp,
    modules: modulesOutput,
  };
  const modulesHash = computeHash(modulesDatasetWithoutHash);
  const modulesDataset: ModulesDataset = {
    ...modulesDatasetWithoutHash,
    hash: modulesHash,
  };

  const interactiveDatasetWithoutHash = {
    updatedAt: buildTimestamp,
    activities: interactiveOutput,
  };
  const interactiveHash = computeHash(interactiveDatasetWithoutHash);
  const interactiveDataset: InteractiveDataset = {
    ...interactiveDatasetWithoutHash,
    hash: interactiveHash,
  };

  const modulesBySubjectSorted = Object.fromEntries(
    Object.entries(modulesBySubject)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([subject, set]) => [subject, Array.from(set).sort((a, b) => a.localeCompare(b))])
  );

  const modulesByStageSorted = Object.fromEntries(
    Object.entries(modulesByStage)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([stage, set]) => [stage, Array.from(set).sort((a, b) => a.localeCompare(b))])
  );

  const activitiesByDifficultySorted = Object.fromEntries(
    Object.entries(activitiesByDifficulty).map(([difficulty, entries]) => [
      difficulty,
      entries
        .slice()
        .sort((a, b) =>
          a.moduleSlug === b.moduleSlug
            ? a.activitySlug.localeCompare(b.activitySlug)
            : a.moduleSlug.localeCompare(b.moduleSlug)
        ),
    ])
  );

  const interactiveMapSorted = Object.fromEntries(
    Object.entries(interactiveIndex).sort(([a], [b]) => a.localeCompare(b))
  );

  const bnccModulesSorted = Object.fromEntries(
    Object.entries(bnccModulesIndex).sort(([a], [b]) => a.localeCompare(b))
  );

  const bnccActivitiesSorted = Object.fromEntries(
    Object.entries(bnccActivitiesIndex).sort(([a], [b]) => a.localeCompare(b))
  );

  const indexDatasetWithoutHash: ContentIndexDataset = {
    generatedAt: buildTimestamp,
    contentHash: "",
    modulesBySubject: modulesBySubjectSorted,
    modulesByStage: modulesByStageSorted,
    activitiesByDifficulty: activitiesByDifficultySorted,
    interactiveMap: interactiveMapSorted,
    bncc: {
      modules: bnccModulesSorted,
      activities: bnccActivitiesSorted,
    },
  };

  const contentHash = computeHash({
    modules: modulesDatasetWithoutHash,
    interactive: interactiveDatasetWithoutHash,
    index: indexDatasetWithoutHash,
  });

  const indexDataset: ContentIndexDataset = {
    ...indexDatasetWithoutHash,
    contentHash,
  };

  if (options.writeToDisk ?? true) {
    const modulesPath = path.join(CONTENT_DIR, "modules.json");
    const interactivePath = path.join(CONTENT_DIR, "interactive-activities.json");
    const indexPath = path.join(CONTENT_DIR, "index.json");

    writeFileSync(modulesPath, `${JSON.stringify(modulesDataset, null, 2)}\n`);
    writeFileSync(interactivePath, `${JSON.stringify(interactiveDataset, null, 2)}\n`);
    writeFileSync(indexPath, `${JSON.stringify(indexDataset, null, 2)}\n`);
  }

  return {
    modules: modulesDataset,
    interactive: interactiveDataset,
    index: indexDataset,
  };
};
