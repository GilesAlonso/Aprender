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
  args: string[];
};

const parseOptions = (input: string[]): ParsedOptions => {
  const args: string[] = [];
  let rootDir: string | undefined;
  let writeToDisk: boolean | undefined;

  for (let index = 0; index < input.length; index += 1) {
    const value = input[index];

    if (value === "--root" || value === "-r") {
      const next = input[index + 1];
      if (!next) {
        throw new Error("O parâmetro --root requer um caminho.");
      }
      rootDir = path.resolve(next);
      index += 1;
      continue;
    }

    if (value === "--no-write") {
      writeToDisk = false;
      continue;
    }

    args.push(value);
  }

  return { rootDir, writeToDisk, args };
};

const summarizeBuild = (output: BuildOutput): void => {
  console.log("✅ Conteúdo compilado com sucesso.");
  console.log(`   • Módulos: ${output.modules.modules.length}`);
  console.log(`   • Atividades interativas: ${output.interactive.activities.length}`);
  console.log(`   • Hash combinado: ${output.index.contentHash}`);
};

const runLint = (options: ParsedOptions): number => {
  const result = lintWorkspace({ rootDir: options.rootDir });

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
  });

  summarizeBuild(output);
  return 0;
};

const printHelp = (): void => {
  console.log(
    `Uso: pnpm content:<comando> [opções]\n\nComandos disponíveis:\n  lint    Valida o conteúdo bruto sob data/content/raw\n  build   Valida e compila o conteúdo para JSON consumível pela aplicação\n\nOpções:\n  --root <caminho>   Altera o diretório raiz do workspace (padrão: data/content/raw)\n  --no-write         Durante o build, evita escrita em disco (somente saída no console)\n`
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
