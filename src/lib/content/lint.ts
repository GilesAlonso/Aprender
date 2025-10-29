import path from "node:path";

import { getBnccCodesByAgeGroup, getBnccHabilidadeCodes } from "@/lib/bncc";

import type { ContentModuleDocument } from "./workspace";
import { loadWorkspace } from "./workspace";

export type LintSeverity = "error" | "warning";

export type LintIssue = {
  severity: LintSeverity;
  filePath: string;
  message: string;
  details?: string;
};

export type LintResult = {
  modules: ContentModuleDocument[];
  issues: LintIssue[];
  errors: LintIssue[];
  warnings: LintIssue[];
};

export type LintOptions = {
  rootDir?: string;
  stage?: string;
  subjectSlug?: string;
  modules?: string[];
};

const addIssue = (collection: LintIssue[], issue: LintIssue) => {
  collection.push(issue);
};

const ensureActivitiesCount = (module: ContentModuleDocument, issues: LintIssue[]) => {
  if (module.activities.length < 2) {
    addIssue(issues, {
      severity: "error",
      filePath: module.relativePath,
      message: `O módulo '${module.module.slug}' precisa de pelo menos 2 atividades.`,
    });
  }
};

const ensureSlugMatchesFilename = (module: ContentModuleDocument, issues: LintIssue[]) => {
  const fileSlug = path.basename(module.filePath, path.extname(module.filePath));
  if (fileSlug !== module.module.slug) {
    addIssue(issues, {
      severity: "warning",
      filePath: module.relativePath,
      message: `Slug do módulo ('${module.module.slug}') difere do nome do arquivo ('${fileSlug}').`,
      details: "Recomenda-se manter slug e nome de arquivo alinhados para facilitar localização.",
    });
  }
};

const ensureStageConsistency = (module: ContentModuleDocument, issues: LintIssue[]) => {
  const expectedStage = module.relativePath.split(path.sep)[0];
  if (module.module.stage !== expectedStage) {
    addIssue(issues, {
      severity: "warning",
      filePath: module.relativePath,
      message: `Stage declarado ('${module.module.stage}') difere do diretório ('${expectedStage}').`,
    });
  }

  const expectedSubject = module.relativePath.split(path.sep)[1];
  if (module.module.subjectSlug !== expectedSubject) {
    addIssue(issues, {
      severity: "warning",
      filePath: module.relativePath,
      message: `subjectSlug declarado ('${module.module.subjectSlug}') difere do diretório ('${expectedSubject}').`,
    });
  }
};

const ensureBnccCoverage = (
  module: ContentModuleDocument,
  standardsByAgeGroup: Map<string, Set<string>>,
  habilidadesCodes: Set<string>,
  issues: LintIssue[]
) => {
  const ageGroupCodes = standardsByAgeGroup.get(module.module.ageGroupSlug);
  if (!ageGroupCodes) {
    addIssue(issues, {
      severity: "error",
      filePath: module.relativePath,
      message: `Faixa etária '${module.module.ageGroupSlug}' não encontrada no dataset BNCC.`,
    });
    return;
  }

  if (!ageGroupCodes.has(module.module.primaryBnccCode)) {
    addIssue(issues, {
      severity: "error",
      filePath: module.relativePath,
      message: `Código BNCC primário '${module.module.primaryBnccCode}' indisponível para '${module.module.ageGroupSlug}'.`,
    });
  }

  for (const activity of module.activities) {
    if (!ageGroupCodes.has(activity.bncc.code)) {
      addIssue(issues, {
        severity: "error",
        filePath: module.relativePath,
        message: `Atividade '${activity.slug}' referencia código BNCC '${activity.bncc.code}' inexistente para '${module.module.ageGroupSlug}'.`,
      });
    }

    for (const habilidade of activity.bncc.habilidades) {
      if (!habilidadesCodes.has(habilidade)) {
        addIssue(issues, {
          severity: "warning",
          filePath: module.relativePath,
          message: `Habilidade '${habilidade}' não encontrada no dataset BNCC.`,
          details: `Atividade '${activity.slug}' em '${module.module.slug}'.`,
        });
      }
    }
  }
};

const ensureInteractiveConsistency = (
  module: ContentModuleDocument,
  activitySlugIndex: Map<string, { module: string; filePath: string }>,
  interactiveSlugIndex: Map<string, { module: string; activity: string; filePath: string }>,
  issues: LintIssue[]
) => {
  for (const activity of module.activities) {
    const existing = activitySlugIndex.get(activity.slug);
    if (existing) {
      addIssue(issues, {
        severity: "error",
        filePath: module.relativePath,
        message: `Slug de atividade duplicado '${activity.slug}'. Também utilizado em '${existing.filePath}'.`,
      });
    } else {
      activitySlugIndex.set(activity.slug, {
        module: module.module.slug,
        filePath: module.relativePath,
      });
    }

    if (activity.interactive) {
      if (activity.type !== activity.interactive.type) {
        addIssue(issues, {
          severity: "warning",
          filePath: module.relativePath,
          message: `Atividade '${activity.slug}' declara tipo '${activity.type}' mas o interativo usa '${activity.interactive.type}'.`,
        });
      }

      const existingInteractive = interactiveSlugIndex.get(activity.interactive.slug);
      if (existingInteractive) {
        addIssue(issues, {
          severity: "error",
          filePath: module.relativePath,
          message: `Slug de atividade interativa '${activity.interactive.slug}' duplicado. Também usado por '${existingInteractive.activity}' em '${existingInteractive.filePath}'.`,
        });
      } else {
        interactiveSlugIndex.set(activity.interactive.slug, {
          module: module.module.slug,
          activity: activity.slug,
          filePath: module.relativePath,
        });
      }

      const interactiveObjectives = new Set(activity.interactive.objectives);
      const learningObjectives = new Set(activity.learningObjectives);
      for (const objective of learningObjectives) {
        if (!interactiveObjectives.has(objective)) {
          addIssue(issues, {
            severity: "warning",
            filePath: module.relativePath,
            message: `Objetivo '${objective}' presente na atividade '${activity.slug}' mas ausente no interativo '${activity.interactive.slug}'.`,
          });
        }
      }
    }
  }
};

export const lintWorkspace = (options: LintOptions = {}): LintResult => {
  const issues: LintIssue[] = [];
  let modules: ContentModuleDocument[] = [];

  try {
    modules = loadWorkspace({
      rootDir: options.rootDir,
      stage: options.stage,
      subjectSlug: options.subjectSlug,
      modules: options.modules,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fatalIssue: LintIssue = {
      severity: "error",
      filePath: "(workspace)",
      message,
    };

    return {
      modules: [],
      issues: [fatalIssue],
      errors: [fatalIssue],
      warnings: [],
    };
  }

  if (modules.length === 0) {
    addIssue(issues, {
      severity: "error",
      filePath: "(workspace)",
      message: "Nenhum módulo de conteúdo encontrado em data/content/raw.",
    });

    return {
      modules,
      issues,
      errors: issues,
      warnings: [],
    };
  }

  let standardsByAgeGroup: Map<string, Set<string>>;
  let habilidadesCodes: Set<string>;
  try {
    standardsByAgeGroup = getBnccCodesByAgeGroup();
    habilidadesCodes = getBnccHabilidadeCodes();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fatalIssue: LintIssue = {
      severity: "error",
      filePath: "data/bncc/standards.json",
      message,
    };

    return {
      modules,
      issues: [fatalIssue],
      errors: [fatalIssue],
      warnings: [],
    };
  }

  const moduleSlugIndex = new Map<string, string>();
  const activitySlugIndex = new Map<string, { module: string; filePath: string }>();
  const interactiveSlugIndex = new Map<
    string,
    { module: string; activity: string; filePath: string }
  >();

  for (const moduleDocument of modules) {
    if (moduleSlugIndex.has(moduleDocument.module.slug)) {
      addIssue(issues, {
        severity: "error",
        filePath: moduleDocument.relativePath,
        message: `Slug de módulo duplicado '${moduleDocument.module.slug}'. Também utilizado em '${moduleSlugIndex.get(moduleDocument.module.slug)}'.`,
      });
    } else {
      moduleSlugIndex.set(moduleDocument.module.slug, moduleDocument.relativePath);
    }

    ensureActivitiesCount(moduleDocument, issues);
    ensureSlugMatchesFilename(moduleDocument, issues);
    ensureStageConsistency(moduleDocument, issues);
    ensureBnccCoverage(moduleDocument, standardsByAgeGroup, habilidadesCodes, issues);
    ensureInteractiveConsistency(moduleDocument, activitySlugIndex, interactiveSlugIndex, issues);
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  return {
    modules,
    issues,
    errors,
    warnings,
  };
};
