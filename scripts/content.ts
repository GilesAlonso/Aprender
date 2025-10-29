#!/usr/bin/env tsx
import path from "node:path";
import process from "node:process";

import {
  buildWorkspace,
  computeContentMetrics,
  lintWorkspace,
  loadWorkspace,
  type BuildOutput,
  type ContentMetrics,
  type ContentModuleDocument,
  type LintIssue,
} from "../src/lib/content";

const formatIssue = (issue: LintIssue, index: number): string => {
  const prefix = issue.severity === "error" ? "❌" : "⚠️";
  const header = `${prefix}  [${issue.severity.toUpperCase()} #${index + 1}] ${issue.filePath}`;
  return issue.details
    ? `${header}\n    → ${issue.message}\n    ↪ ${issue.details}`
    : `${header}\n    → ${issue.message}`;
};

const printIssues = (issues: LintIssue[]): void => {
  issues.forEach((issue, index) => {
    console.log(formatIssue(issue, index));
  });
};

type ParsedOptions = {
  rootDir?: string;
  writeToDisk?: boolean;
  stage?: string;
  subjectSlug?: string;
  modules?: string[];
  format?: "table" | "json";
  failUnderModules?: number;
  failUnderActivities?: number;
  args: string[];
};

const parseOptions = (input: string[]): ParsedOptions => {
  const args: string[] = [];
  let rootDir: string | undefined;
  let writeToDisk: boolean | undefined;
  let stage: string | undefined;
  let subjectSlug: string | undefined;
  let format: "table" | "json" | undefined;
  let failUnderModules: number | undefined;
  let failUnderActivities: number | undefined;
  const moduleSlugs: string[] = [];

  const readValue = (
    flag: string,
    inlineValue: string | undefined,
    currentIndex: number
  ): { value: string; nextIndex: number } => {
    if (inlineValue !== undefined) {
      if (inlineValue.trim().length === 0) {
        throw new Error(`O parâmetro ${flag} requer um valor.`);
      }
      return { value: inlineValue, nextIndex: currentIndex };
    }

    const next = input[currentIndex + 1];
    if (!next) {
      throw new Error(`O parâmetro ${flag} requer um valor.`);
    }

    return { value: next, nextIndex: currentIndex + 1 };
  };

  for (let index = 0; index < input.length; index += 1) {
    const token = input[index];
    let flag = token;
    let inlineValue: string | undefined;

    if ((token.startsWith("--") || token.startsWith("-")) && token.includes("=")) {
      [flag, inlineValue] = token.split("=", 2);
    }

    if (flag === "--no-write") {
      if (inlineValue !== undefined) {
        throw new Error("O parâmetro --no-write não aceita valor.");
      }
      writeToDisk = false;
      continue;
    }

    if (flag === "--root" || flag === "-r") {
      const { value, nextIndex } = readValue(flag, inlineValue, index);
      rootDir = path.resolve(value);
      index = nextIndex;
      continue;
    }

    if (flag === "--stage") {
      const { value, nextIndex } = readValue(flag, inlineValue, index);
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        throw new Error("O parâmetro --stage requer um valor.");
      }
      stage = trimmed;
      index = nextIndex;
      continue;
    }

    if (flag === "--subject") {
      const { value, nextIndex } = readValue(flag, inlineValue, index);
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        throw new Error("O parâmetro --subject requer um valor.");
      }
      subjectSlug = trimmed;
      index = nextIndex;
      continue;
    }

    if (flag === "--modules") {
      const { value, nextIndex } = readValue(flag, inlineValue, index);
      const slugs = value
        .split(",")
        .map((slug) => slug.trim())
        .filter((slug) => slug.length > 0);

      if (slugs.length === 0) {
        throw new Error("O parâmetro --modules requer uma lista de slugs separados por vírgula.");
      }

      moduleSlugs.push(...slugs);
      index = nextIndex;
      continue;
    }

    if (flag === "--format") {
      const { value, nextIndex } = readValue(flag, inlineValue, index);
      const normalized = value.trim().toLowerCase();
      if (normalized !== "table" && normalized !== "json") {
        throw new Error("O parâmetro --format aceita apenas 'table' ou 'json'.");
      }
      format = normalized === "json" ? "json" : "table";
      index = nextIndex;
      continue;
    }

    if (flag === "--json") {
      if (inlineValue !== undefined) {
        throw new Error("O parâmetro --json não aceita valor.");
      }
      format = "json";
      continue;
    }

    if (flag === "--fail-under-modules") {
      const { value, nextIndex } = readValue(flag, inlineValue, index);
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        throw new Error("O parâmetro --fail-under-modules requer um valor numérico.");
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
        throw new Error(
          "O parâmetro --fail-under-modules requer um número inteiro maior ou igual a zero."
        );
      }
      failUnderModules = parsed;
      index = nextIndex;
      continue;
    }

    if (flag === "--fail-under-activities") {
      const { value, nextIndex } = readValue(flag, inlineValue, index);
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        throw new Error("O parâmetro --fail-under-activities requer um valor numérico.");
      }
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
        throw new Error(
          "O parâmetro --fail-under-activities requer um número inteiro maior ou igual a zero."
        );
      }
      failUnderActivities = parsed;
      index = nextIndex;
      continue;
    }

    args.push(token);
  }

  const modules =
    moduleSlugs.length > 0
      ? Array.from(
          moduleSlugs
            .reduce<Map<string, string>>((accumulator, slug) => {
              const normalized = slug.toLowerCase();
              if (!accumulator.has(normalized)) {
                accumulator.set(normalized, slug);
              }
              return accumulator;
            }, new Map<string, string>())
            .values()
        )
      : undefined;

  return {
    rootDir,
    writeToDisk,
    stage,
    subjectSlug,
    modules,
    format,
    failUnderModules,
    failUnderActivities,
    args,
  };
};

const summarizeBuild = (output: BuildOutput): void => {
  console.log("✅ Conteúdo compilado com sucesso.");
  console.log(`   • Módulos: ${output.modules.modules.length}`);
  console.log(`   • Atividades interativas: ${output.interactive.activities.length}`);
  console.log(`   • Hash combinado: ${output.index.contentHash}`);
};

type CoverageRow = {
  stage: string;
  subject: string;
  modules: number;
  activities: number;
};

const buildCoverageRows = (metrics: ContentMetrics): CoverageRow[] => {
  const rows: CoverageRow[] = [];

  for (const [stageSlug, stageMetrics] of Object.entries(metrics.stages)) {
    const subjectEntries = Object.entries(stageMetrics.subjects);
    if (subjectEntries.length === 0) {
      rows.push({
        stage: stageSlug,
        subject: "—",
        modules: stageMetrics.modules,
        activities: stageMetrics.activities,
      });
      continue;
    }

    for (const [subjectSlug, subjectMetrics] of subjectEntries) {
      rows.push({
        stage: stageSlug,
        subject: subjectSlug,
        modules: subjectMetrics.modules,
        activities: subjectMetrics.activities,
      });
    }
  }

  return rows;
};

const printDifficultySummary = (difficulty: ContentMetrics["difficulty"]): void => {
  console.log("Distribuição de dificuldade:");
  const entries = Object.entries(difficulty);
  const labelWidth = Math.max(1, ...entries.map(([tier]) => tier.length));
  const countWidth = Math.max(1, ...entries.map(([, value]) => value.toString().length));

  for (const [tier, value] of entries) {
    console.log(`  ${tier.padEnd(labelWidth)}  ${value.toString().padStart(countWidth)}`);
  }
};

const printKeyValueBlock = (title: string, data: Record<string, number>): void => {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return;
  }

  const keyWidth = Math.max(1, ...entries.map(([key]) => key.length));
  const countWidth = Math.max(1, ...entries.map(([, value]) => value.toString().length));

  console.log(title + ":");
  for (const [key, value] of entries) {
    console.log(`  ${key.padEnd(keyWidth)}  ${value.toString().padStart(countWidth)}`);
  }
};

const printCoverageSummary = (metrics: ContentMetrics): void => {
  console.log("Resumo por etapa/componente curricular:");
  console.log();

  const rows = buildCoverageRows(metrics);

  const stageHeader = "Stage";
  const subjectHeader = "Subject";
  const modulesHeader = "Modules";
  const activitiesHeader = "Activities";

  const stageValues = [...rows.map((row) => row.stage), "TOTAL"];
  const subjectValues = rows.length > 0 ? rows.map((row) => row.subject) : ["—"];
  const modulesValues = [
    ...rows.map((row) => row.modules.toString()),
    metrics.totals.modules.toString(),
  ];
  const activitiesValues = [
    ...rows.map((row) => row.activities.toString()),
    metrics.totals.activities.toString(),
  ];

  const stageWidth = Math.max(stageHeader.length, ...stageValues.map((value) => value.length));
  const subjectWidth = Math.max(
    subjectHeader.length,
    ...subjectValues.map((value) => value.length)
  );
  const modulesWidth = Math.max(
    modulesHeader.length,
    ...modulesValues.map((value) => value.length)
  );
  const activitiesWidth = Math.max(
    activitiesHeader.length,
    ...activitiesValues.map((value) => value.length)
  );

  const header =
    `${stageHeader.padEnd(stageWidth)}  ` +
    `${subjectHeader.padEnd(subjectWidth)}  ` +
    `${modulesHeader.padStart(modulesWidth)}  ` +
    `${activitiesHeader.padStart(activitiesWidth)}`;

  console.log(header);
  console.log(
    `${"-".repeat(stageWidth)}  ${"-".repeat(subjectWidth)}  ${"-".repeat(modulesWidth)}  ${"-".repeat(activitiesWidth)}`
  );

  for (const row of rows) {
    console.log(
      `${row.stage.padEnd(stageWidth)}  ` +
        `${row.subject.padEnd(subjectWidth)}  ` +
        `${row.modules.toString().padStart(modulesWidth)}  ` +
        `${row.activities.toString().padStart(activitiesWidth)}`
    );
  }

  console.log(
    `${"TOTAL".padEnd(stageWidth)}  ` +
      `${"".padEnd(subjectWidth)}  ` +
      `${metrics.totals.modules.toString().padStart(modulesWidth)}  ` +
      `${metrics.totals.activities.toString().padStart(activitiesWidth)}`
  );

  if (rows.length === 0) {
    console.log("(nenhum módulo encontrado)");
  }

  console.log();

  printDifficultySummary(metrics.difficulty);

  if (Object.keys(metrics.bncc.codes).length > 0) {
    console.log();
    printKeyValueBlock("Cobertura por código BNCC", metrics.bncc.codes);
  }

  if (Object.keys(metrics.bncc.habilidades).length > 0) {
    console.log();
    printKeyValueBlock("Cobertura por habilidade BNCC", metrics.bncc.habilidades);
  }
};

const runLint = (options: ParsedOptions): number => {
  const result = lintWorkspace({
    rootDir: options.rootDir,
    stage: options.stage,
    subjectSlug: options.subjectSlug,
    modules: options.modules,
  });

  if (result.errors.length > 0) {
    console.log("❌ Falhas de validação encontradas:\n");
    printIssues(result.errors);

    if (result.warnings.length > 0) {
      console.log("\n⚠️  Avisos encontrados:\n");
      printIssues(result.warnings);
    }

    console.log(`\n${result.errors.length} erro(s), ${result.warnings.length} aviso(s).`);
    return 1;
  }

  if (result.warnings.length > 0) {
    console.log("⚠️  Validação concluída com avisos:\n");
    printIssues(result.warnings);
    console.log(`\n${result.warnings.length} aviso(s) relatado(s).`);
  } else {
    console.log("✅ Workspace de conteúdo validado com sucesso. Sem avisos.");
  }

  return 0;
};

const runBuild = (options: ParsedOptions): number => {
  const lintExitCode = runLint(options);
  if (lintExitCode !== 0) {
    return lintExitCode;
  }

  const output = buildWorkspace({
    rootDir: options.rootDir,
    writeToDisk: options.writeToDisk,
    stage: options.stage,
    subjectSlug: options.subjectSlug,
    modules: options.modules,
  });

  summarizeBuild(output);
  return 0;
};

const runReport = (options: ParsedOptions): number => {
  let documents: ContentModuleDocument[];
  try {
    documents = loadWorkspace({
      rootDir: options.rootDir,
      stage: options.stage,
      subjectSlug: options.subjectSlug,
      modules: options.modules,
    });
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  const metrics = computeContentMetrics(documents);
  const format = options.format ?? "table";
  const isJson = format === "json";

  if (isJson) {
    console.log(JSON.stringify(metrics, null, 2));
  } else {
    printCoverageSummary(metrics);
  }

  const violations: string[] = [];

  if (options.failUnderModules !== undefined && metrics.totals.modules < options.failUnderModules) {
    violations.push(
      `Total de módulos (${metrics.totals.modules}) abaixo do limite mínimo (${options.failUnderModules}).`
    );
  }

  if (
    options.failUnderActivities !== undefined &&
    metrics.totals.activities < options.failUnderActivities
  ) {
    violations.push(
      `Total de atividades (${metrics.totals.activities}) abaixo do limite mínimo (${options.failUnderActivities}).`
    );
  }

  if (violations.length > 0) {
    console.error(
      `\n❌ Cobertura insuficiente:\n${violations
        .map((violation) => `   • ${violation}`)
        .join("\n")}`
    );
    return 1;
  }

  if (
    !isJson &&
    (options.failUnderModules !== undefined || options.failUnderActivities !== undefined)
  ) {
    console.log("\n✅ Cobertura atende os limites mínimos definidos.");
  }

  return 0;
};

const printHelp = (): void => {
  console.log(
    `Uso: pnpm content:<comando> [opções]

Comandos disponíveis:
  lint      Valida o conteúdo bruto sob data/content/raw
  build     Valida e compila o conteúdo para JSON consumível pela aplicação
  report    Gera um relatório de cobertura de módulos/atividades alinhado à BNCC

Opções:
  --root <caminho>                 Altera o diretório raiz do workspace (padrão: data/content/raw)
  --stage <slug>                   Limita o processamento a um estágio específico (ex: ef01)
  --subject <slug>                 Limita o processamento a um componente curricular (ex: lingua-portuguesa)
  --modules=a,b                    Avalia apenas os módulos informados (slugs separados por vírgula)
  --no-write                       Durante o build, evita escrita em disco (somente saída no console)
  --format <table|json>            Define o formato de saída do report (padrão: table)
  --json                           Atalho para --format=json
  --fail-under-modules <número>    Exige um mínimo de módulos quando executando o report
  --fail-under-activities <número> Exige um mínimo de atividades quando executando o report`
  );
};

const main = (): void => {
  const [, , rawCommand, ...rest] = process.argv;

  if (!rawCommand || rawCommand === "help" || rawCommand === "--help" || rawCommand === "-h") {
    printHelp();
    process.exit(0);
  }

  let options: ParsedOptions;
  try {
    options = parseOptions(rest);
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
    return;
  }

  let exitCode = 0;

  if (rawCommand === "lint") {
    exitCode = runLint(options);
  } else if (rawCommand === "build") {
    exitCode = runBuild(options);
  } else if (rawCommand === "report") {
    exitCode = runReport(options);
  } else {
    console.error(`❌ Comando desconhecido: ${rawCommand}`);
    printHelp();
    process.exit(1);
    return;
  }

  process.exit(exitCode);
};

main();
