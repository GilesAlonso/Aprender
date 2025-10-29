import { readFileSync } from "node:fs";
import path from "node:path";

import fg from "fast-glob";
import matter from "gray-matter";
import yaml from "js-yaml";

import { ContentModuleFile, contentModuleFileSchema } from "./schema";

export const CONTENT_DIR = path.join(process.cwd(), "data", "content");
export const RAW_CONTENT_DIR = path.join(CONTENT_DIR, "raw");

const MODULE_EXTENSIONS = new Set([".yml", ".yaml", ".md", ".mdx"]);

export type ContentModuleDocument = ContentModuleFile & {
  filePath: string;
  relativePath: string;
};

export type LoadWorkspaceOptions = {
  rootDir?: string;
  stage?: string;
  subjectSlug?: string;
  modules?: string[];
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toTitle = (slug: string): string =>
  slug
    .split(/[-_]/g)
    .filter((segment) => segment.trim().length > 0)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");

const mergeDeep = (base: unknown, override: unknown): unknown => {
  if (Array.isArray(base) && Array.isArray(override)) {
    return [...base, ...override];
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const result: Record<string, unknown> = { ...base };
    for (const [key, overrideValue] of Object.entries(override)) {
      if (overrideValue === undefined) continue;
      const baseValue = result[key];
      result[key] =
        baseValue === undefined ? overrideValue : (mergeDeep(baseValue, overrideValue) as unknown);
    }
    return result;
  }

  return override === undefined ? base : override;
};

const loadYamlObject = (filePath: string, content: string): Record<string, unknown> => {
  const parsed = yaml.load(content, { filename: filePath });
  if (parsed === undefined || parsed === null) {
    return {};
  }

  if (!isPlainObject(parsed)) {
    throw new Error(`Arquivo '${filePath}' não contém um objeto YAML válido.`);
  }

  return parsed;
};

const partialCache = new Map<string, Record<string, unknown>>();

const loadPartial = (originPath: string, partialSpecifier: unknown): Record<string, unknown> => {
  if (typeof partialSpecifier !== "string" || partialSpecifier.trim().length === 0) {
    throw new Error(
      `A atividade em '${originPath}' define um partial inválido. Esperado caminho relativo em formato string.`
    );
  }

  const partialPath = path.resolve(path.dirname(originPath), partialSpecifier);
  const cached = partialCache.get(partialPath);
  if (cached) {
    return cached;
  }

  const extension = path.extname(partialPath).toLowerCase();
  if (!MODULE_EXTENSIONS.has(extension)) {
    throw new Error(
      `Partial '${partialSpecifier}' referenciado em '${originPath}' possui extensão '${extension}' não suportada.`
    );
  }

  const partialContent = readFileSync(partialPath, "utf-8");
  const parsed = loadYamlObject(partialPath, partialContent);
  partialCache.set(partialPath, parsed);
  return parsed;
};

const applyActivityPartial = (activity: unknown, originPath: string): Record<string, unknown> => {
  if (!isPlainObject(activity)) {
    throw new Error(`Atividade inválida encontrada em '${originPath}'.`);
  }

  const cloned = { ...activity };
  const partialSpecifier = cloned.partial;
  if (!partialSpecifier) {
    return cloned;
  }

  delete cloned.partial;
  const partialObject = loadPartial(originPath, partialSpecifier);
  return mergeDeep(partialObject, cloned) as Record<string, unknown>;
};

const normalizeModulePayload = (
  rawModule: unknown,
  relativePath: string
): Record<string, unknown> => {
  if (!isPlainObject(rawModule)) {
    throw new Error(`Bloco "module" inválido em '${relativePath}'.`);
  }

  const moduleObject = rawModule as Record<string, unknown>;
  const segments = relativePath.split(path.sep);
  const stageSlug = segments[0];
  const subjectSlug = segments[1];
  const subjectValue =
    typeof moduleObject["subject"] === "string" ? (moduleObject["subject"] as string) : undefined;

  const defaults: Record<string, unknown> = {
    stage: stageSlug,
    subjectSlug,
    subject: subjectValue ?? toTitle(subjectSlug),
  };

  return { ...defaults, ...moduleObject };
};

const readModuleDocument = (filePath: string, rootDir: string): ContentModuleDocument => {
  const relativePath = path.relative(rootDir, filePath);
  const extension = path.extname(filePath).toLowerCase();
  if (!MODULE_EXTENSIONS.has(extension)) {
    throw new Error(`Extensão '${extension}' não suportada para '${relativePath}'.`);
  }

  const rawContent = readFileSync(filePath, "utf-8");
  let rawModuleBlock: unknown;
  let rawActivities: unknown;
  let body: string | undefined;

  if (extension === ".md" || extension === ".mdx") {
    const parsed = matter(rawContent);
    rawModuleBlock = parsed.data?.module ?? parsed.data ?? {};
    rawActivities = parsed.data?.activities ?? [];
    body = parsed.content.trim().length > 0 ? parsed.content : undefined;
  } else {
    const parsed = loadYamlObject(filePath, rawContent);
    rawModuleBlock = parsed.module ?? parsed;
    rawActivities = parsed.activities ?? [];
    body =
      typeof parsed.body === "string" && parsed.body.trim().length > 0 ? parsed.body : undefined;
  }

  const modulePayload = normalizeModulePayload(rawModuleBlock, relativePath);

  if (!Array.isArray(rawActivities)) {
    throw new Error(`Lista de atividades inválida em '${relativePath}'.`);
  }

  const activitiesPayload = rawActivities.map((activity, index) => {
    try {
      return applyActivityPartial(activity, filePath);
    } catch (error) {
      const prefix = `Erro ao processar atividade de índice ${index} em '${relativePath}':`;
      throw new Error(`${prefix} ${(error as Error).message}`);
    }
  });

  try {
    const parsed = contentModuleFileSchema.parse({
      module: modulePayload,
      activities: activitiesPayload,
      body,
    });

    return {
      ...parsed,
      filePath,
      relativePath,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Falha ao validar '${relativePath}': ${error.message}`);
    }
    throw error;
  }
};

export const loadWorkspace = (options: LoadWorkspaceOptions = {}): ContentModuleDocument[] => {
  const rootDir = options.rootDir ?? RAW_CONTENT_DIR;
  const absoluteRoot = path.resolve(rootDir);

  const stageValue = options.stage?.trim();
  const stageFilter = stageValue && stageValue.length > 0 ? stageValue.toLowerCase() : undefined;

  const subjectValue = options.subjectSlug?.trim();
  const subjectFilter =
    subjectValue && subjectValue.length > 0 ? subjectValue.toLowerCase() : undefined;

  const moduleSlugs =
    options.modules?.map((slug) => slug.trim()).filter((slug) => slug.length > 0) ?? [];

  const requestedModules =
    moduleSlugs.length > 0
      ? moduleSlugs.reduce<Map<string, string>>((accumulator, slug) => {
          const normalized = slug.toLowerCase();
          if (!accumulator.has(normalized)) {
            accumulator.set(normalized, slug);
          }
          return accumulator;
        }, new Map<string, string>())
      : undefined;

  partialCache.clear();

  const entries = fg.sync(["**/*.{yml,yaml,md,mdx}"], {
    cwd: absoluteRoot,
    absolute: true,
    dot: false,
  });

  const documents: ContentModuleDocument[] = [];
  const matchedModuleSlugs = new Set<string>();

  for (const entry of entries) {
    const relativePath = path.relative(absoluteRoot, entry);
    const segments = relativePath.split(path.sep);

    if (segments.includes("_partials")) {
      continue;
    }

    if (segments.length < 3) {
      continue;
    }

    const stageSlug = segments[0]?.toLowerCase();
    if (stageFilter && stageSlug !== stageFilter) {
      continue;
    }

    const subjectSlug = segments[1]?.toLowerCase();
    if (subjectFilter && subjectSlug !== subjectFilter) {
      continue;
    }

    const document = readModuleDocument(entry, absoluteRoot);

    if (requestedModules) {
      const normalizedModuleSlug = document.module.slug.toLowerCase();
      if (!requestedModules.has(normalizedModuleSlug)) {
        continue;
      }
      matchedModuleSlugs.add(normalizedModuleSlug);
    }

    documents.push(document);
  }

  if (requestedModules) {
    const missingModules = Array.from(requestedModules.keys()).filter(
      (slug) => !matchedModuleSlugs.has(slug)
    );

    if (missingModules.length > 0) {
      const missingList = missingModules
        .map((slug) => requestedModules.get(slug) ?? slug)
        .map((slug) => `'${slug}'`)
        .join(", ");
      const prefix =
        missingModules.length === 1
          ? "Slug de módulo desconhecido"
          : "Slugs de módulo desconhecidos";
      throw new Error(`${prefix}: ${missingList}.`);
    }
  }

  const hasFilters =
    stageFilter !== undefined || subjectFilter !== undefined || requestedModules !== undefined;

  if (hasFilters && documents.length === 0) {
    const appliedFilters: string[] = [];
    if (stageValue) {
      appliedFilters.push(`stage='${stageValue}'`);
    }
    if (subjectValue) {
      appliedFilters.push(`subject='${subjectValue}'`);
    }
    if (requestedModules && requestedModules.size > 0) {
      const modulesDescription = Array.from(requestedModules.values())
        .map((slug) => `'${slug}'`)
        .join(", ");
      appliedFilters.push(`modules=${modulesDescription}`);
    }

    throw new Error(
      `Nenhum módulo de conteúdo encontrado para os filtros fornecidos (${appliedFilters.join(
        ", "
      )}).`
    );
  }

  return documents.sort((a, b) => a.module.slug.localeCompare(b.module.slug));
};

export const clearPartialCache = () => {
  partialCache.clear();
};
