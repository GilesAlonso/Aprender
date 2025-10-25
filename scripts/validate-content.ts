import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type CurriculumHabilidade = {
  codigo: string;
  descricao: string;
};

type BnccStandard = {
  bnccCode: string;
  ageGroupSlug: string;
  componenteCurricular: string;
  unidadeTematica: string;
  objetoConhecimento: string[] | string;
  competency: string;
  habilidades: CurriculumHabilidade[];
  descricao?: string;
};

type ModuleActivityDefinition = {
  slug: string;
  title: string;
  bnccCode: string;
  learningObjectives: string[];
};

type ModuleDefinition = {
  slug: string;
  title: string;
  ageGroupSlug: string;
  primaryBnccCode: string;
  learningOutcomes?: string[];
  activities: ModuleActivityDefinition[];
};

type DatasetFile<T> = {
  modules?: ModuleDefinition[];
  standards?: BnccStandard[];
};

type ValidationIssue = {
  type: "error" | "warning";
  message: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

const readJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(projectRoot, relativePath), "utf-8")) as T;

const bnccDataset = readJson<DatasetFile<BnccStandard>>("data/bncc/standards.json");
const contentDataset = readJson<DatasetFile<ModuleDefinition>>("data/content/modules.json");

const standards = bnccDataset.standards ?? [];
const modules = contentDataset.modules ?? [];

const bnccIndex = new Map<string, BnccStandard>();
for (const standard of standards) {
  bnccIndex.set(`${standard.ageGroupSlug}:${standard.bnccCode}`, standard);
}

const issues: ValidationIssue[] = [];

const report = (condition: boolean, issue: ValidationIssue) => {
  if (!condition) {
    issues.push(issue);
  }
};

const moduleSlugSet = new Set<string>();
const activitySlugSet = new Set<string>();

for (const module of modules) {
  report(Boolean(module.slug.trim()), {
    type: "error",
    message: `Módulo sem slug definido: ${JSON.stringify(module)}`,
  });

  if (moduleSlugSet.has(module.slug)) {
    report(false, {
      type: "error",
      message: `Slug de módulo duplicado: '${module.slug}'.`,
    });
  }
  moduleSlugSet.add(module.slug);

  report(Array.isArray(module.activities) && module.activities.length > 0, {
    type: "error",
    message: `Módulo '${module.slug}' não possui atividades cadastradas.`,
  });

  report(
    Array.isArray(module.learningOutcomes) && module.learningOutcomes.length > 0,
    {
      type: "error",
      message: `Módulo '${module.slug}' precisa declarar ao menos um learning outcome.`,
    }
  );

  const primaryKey = `${module.ageGroupSlug}:${module.primaryBnccCode}`;
  report(bnccIndex.has(primaryKey), {
    type: "error",
    message: `Código BNCC primário '${module.primaryBnccCode}' não encontrado para a faixa '${module.ageGroupSlug}' (módulo '${module.slug}').`,
  });

  for (const activity of module.activities) {
    report(Boolean(activity.slug.trim()), {
      type: "error",
      message: `Atividade sem slug no módulo '${module.slug}'.`,
    });

    if (activitySlugSet.has(activity.slug)) {
      report(false, {
        type: "error",
        message: `Slug de atividade duplicado: '${activity.slug}'.`,
      });
    }
    activitySlugSet.add(activity.slug);

    report(Array.isArray(activity.learningObjectives) && activity.learningObjectives.length > 0, {
      type: "error",
      message: `Atividade '${activity.slug}' do módulo '${module.slug}' precisa trazer objetivos de aprendizagem.`,
    });

    const activityKey = `${module.ageGroupSlug}:${activity.bnccCode}`;
    report(bnccIndex.has(activityKey), {
      type: "error",
      message: `Atividade '${activity.slug}' do módulo '${module.slug}' referencia código BNCC '${activity.bnccCode}' inexistente para '${module.ageGroupSlug}'.`,
    });
  }
}

const errors = issues.filter((issue) => issue.type === "error");
const warnings = issues.filter((issue) => issue.type === "warning");

if (warnings.length > 0) {
  console.warn("⚠️  Avisos durante a validação de conteúdo:");
  for (const warning of warnings) {
    console.warn(`  • ${warning.message}`);
  }
}

if (errors.length > 0) {
  console.error("❌ Falhas de validação encontradas:");
  for (const error of errors) {
    console.error(`  • ${error.message}`);
  }
  process.exit(1);
}

console.info("✅ Conteúdo alinhado à BNCC validado com sucesso.");
