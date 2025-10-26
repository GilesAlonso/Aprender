#!/usr/bin/env tsx
import process from "node:process";

import { lintWorkspace, type LintIssue } from "../src/lib/content";

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

const main = (): void => {
  console.warn(
    "⚠️  'scripts/validate-content.ts' está depreciado e será removido em breve. Utilize 'pnpm content:lint'.\n"
  );

  const result = lintWorkspace();

  if (result.errors.length > 0) {
    console.log("❌ Falhas de validação encontradas:\n");
    printIssues(result.errors);

    if (result.warnings.length > 0) {
      console.log("\n⚠️  Avisos encontrados:\n");
      printIssues(result.warnings);
    }

    console.log(`\n${result.errors.length} erro(s), ${result.warnings.length} aviso(s).`);
    process.exit(1);
    return;
  }

  if (result.warnings.length > 0) {
    console.log("⚠️  Validação concluída com avisos:\n");
    printIssues(result.warnings);
    console.log(`\n${result.warnings.length} aviso(s) relatado(s).`);
    process.exit(0);
    return;
  }

  console.log("✅ Workspace de conteúdo validado com sucesso. Sem avisos.");
  process.exit(0);
};

main();
