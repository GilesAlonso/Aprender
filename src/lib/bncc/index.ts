import { readFileSync } from "node:fs";
import path from "node:path";

import type { BnccDataset, BnccStandard } from "./types";

const BNCC_DATASET_PATH = path.join(process.cwd(), "data", "bncc", "standards.json");

let cachedDataset: BnccDataset | null = null;
let cachedStandardsByCode: Map<string, BnccStandard> | null = null;
let cachedHabilidadeCodes: Set<string> | null = null;
let cachedCodesByAgeGroup: Map<string, Set<string>> | null = null;

const loadDatasetFromDisk = (): BnccDataset => {
  const content = readFileSync(BNCC_DATASET_PATH, "utf-8");
  const dataset = JSON.parse(content) as BnccDataset;

  if (!Array.isArray(dataset.standards)) {
    throw new Error("O arquivo standards.json não contém uma lista de padrões BNCC válida.");
  }

  return dataset;
};

export const loadBnccDataset = (): BnccDataset => {
  if (!cachedDataset) {
    cachedDataset = loadDatasetFromDisk();
  }

  return cachedDataset;
};

const ensureStandardsByCode = (): void => {
  if (cachedStandardsByCode) {
    return;
  }

  const dataset = loadBnccDataset();
  cachedStandardsByCode = new Map(dataset.standards.map((standard) => [standard.bnccCode, standard]));
};

const ensureHabilidadeCodes = (): void => {
  if (cachedHabilidadeCodes) {
    return;
  }

  ensureStandardsByCode();
  cachedHabilidadeCodes = new Set<string>();

  for (const standard of cachedStandardsByCode!.values()) {
    for (const habilidade of standard.habilidades) {
      cachedHabilidadeCodes.add(habilidade.codigo);
    }
  }
};

const ensureCodesByAgeGroup = (): void => {
  if (cachedCodesByAgeGroup) {
    return;
  }

  const dataset = loadBnccDataset();
  cachedCodesByAgeGroup = new Map<string, Set<string>>();

  for (const standard of dataset.standards) {
    if (!cachedCodesByAgeGroup.has(standard.ageGroupSlug)) {
      cachedCodesByAgeGroup.set(standard.ageGroupSlug, new Set());
    }

    cachedCodesByAgeGroup.get(standard.ageGroupSlug)!.add(standard.bnccCode);
  }
};

export const getBnccStandards = (): BnccStandard[] => [...loadBnccDataset().standards];

export const getBnccStandardsByCode = (): Map<string, BnccStandard> => {
  ensureStandardsByCode();
  return new Map(cachedStandardsByCode!);
};

export const getBnccHabilidadeCodes = (): Set<string> => {
  ensureHabilidadeCodes();
  return new Set(cachedHabilidadeCodes!);
};

export const getBnccCodesByAgeGroup = (): Map<string, Set<string>> => {
  ensureCodesByAgeGroup();
  return new Map(Array.from(cachedCodesByAgeGroup!.entries(), ([slug, codes]) => [slug, new Set(codes)]));
};
