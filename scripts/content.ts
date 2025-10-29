#!/usr/bin/env tsx
import path from "node:path";
import process from "node:process";

import {
  buildWorkspace,
  lintWorkspace,
  type BuildOutput,
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
  args: string[];
};

const parseOptions = (input: string[]): ParsedOptions => {
  const args: string[] = [];
  let rootDir: string | undefined;
  let writeToDisk: boolean | undefined;
  let stage: string | undefined;
  let subjectSlug: string | undefined;
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

  return { rootDir, writeToDisk, stage, subjectSlug, modules, args };
};

const summarizeBuild = (output: BuildOutput): void => {
  console.log("✅ Conteúdo compilado com sucesso.");
  console.log(`   • Módulos: ${output.modules.modules.length}`);
  console.log(`   • Atividades interativas: ${output.interactive.activities.length}`);
  console.log(`   • Hash combinado: ${output.index.contentHash}`);
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

const printHelp = (): void => {
  console.log(
    `Uso: pnpm content:<comando> [opções]\n\nComandos disponíveis:\n  lint    Valida o conteúdo bruto sob data/content/raw\n  build   Valida e compila o conteúdo para JSON consumível pela aplicação\n\nOpções:\n  --root <caminho>         Altera o diretório raiz do workspace (padrão: data/content/raw)\n  --stage <slug>           Limita o processamento a um estágio específico (ex: ef01)\n  --subject <slug>         Limita o processamento a um componente curricular (ex: lingua-portuguesa)\n  --modules=a,b            Avalia apenas os módulos informados (slugs separados por vírgula)\n  --no-write               Durante o build, evita escrita em disco (somente saída no console)\n`
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
  } else {
    console.error(`❌ Comando desconhecido: ${rawCommand}`);
    printHelp();
    process.exit(1);
    return;
  }

  process.exit(exitCode);
};

main();
