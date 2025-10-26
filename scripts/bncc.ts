#!/usr/bin/env tsx
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import type { BnccDataset, BnccStandard } from "../src/lib/bncc/types";

const BNCC_DIR = path.join(process.cwd(), "data", "bncc");
const OUTPUT_FILE = path.join(BNCC_DIR, "standards.json");
const SOURCE_FILES = readdirSync(BNCC_DIR).filter((file) => file.endsWith(".json") && file !== "standards.json");

const SOURCE_ROOT = "docs/BNCC_EI_EF_110518_versaofinal_site.pdf";

const loadJson = <T>(filePath: string): T => {
  const raw = readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
};

const normalizeEntries = (value: unknown, fileName: string): BnccStandard[] => {
  if (Array.isArray(value)) {
    return value as BnccStandard[];
  }

  if (value && typeof value === "object" && Array.isArray((value as { entries?: unknown[] }).entries)) {
    return (value as { entries: BnccStandard[] }).entries;
  }

  throw new Error(`O arquivo '${fileName}' não contém uma lista de padrões BNCC válida.`);
};

const mergeStandards = (): BnccDataset => {
  const existing = loadJson<BnccDataset>(OUTPUT_FILE);
  const standardsByCode = new Map<string, BnccStandard>();

  for (const standard of existing.standards) {
    standardsByCode.set(standard.bnccCode, standard);
  }

  for (const fileName of SOURCE_FILES) {
    const filePath = path.join(BNCC_DIR, fileName);
    const content = loadJson<unknown>(filePath);
    const entries = normalizeEntries(content, fileName);

    for (const entry of entries) {
      standardsByCode.set(entry.bnccCode, entry);
    }
  }

  const standards = Array.from(standardsByCode.values()).sort((a, b) => a.bnccCode.localeCompare(b.bnccCode));

  return {
    generatedAt: new Date().toISOString().split("T")[0],
    source: SOURCE_ROOT,
    standards,
  } satisfies BnccDataset;
};

const main = (): void => {
  try {
    const dataset = mergeStandards();
    writeFileSync(OUTPUT_FILE, `${JSON.stringify(dataset, null, 2)}\n`);
    console.log(`✅ BNCC standards atualizados: ${dataset.standards.length} entradas.`);
  } catch (error) {
    console.error("❌ Falha ao agregar padrões BNCC:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
};

main();
