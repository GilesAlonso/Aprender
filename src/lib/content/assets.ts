import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

export const EF01_ASSETS_DIR = path.join(process.cwd(), "public", "assets", "ef01");
export const EF01_MANIFEST_PATH = path.join(process.cwd(), "data", "assets", "ef01-manifest.json");

const ef01AssetEntrySchema = z.object({
  slug: z.string().min(1),
  subject: z.enum(["lingua-portuguesa", "ciencias"]),
  theme: z.string().min(1),
  recommendedUsage: z.string().min(1),
  altText: z.string().min(1),
  colorProfile: z.array(z.string().min(1)).nonempty(),
  license: z.object({
    name: z.string().min(1),
    url: z.string().url(),
    document: z.string().min(1),
  }),
  files: z.object({
    svg: z.string().min(1),
    png: z.string().min(1),
  }),
  hash: z.string().min(6),
});

const ef01ManifestSchema = z.object({
  version: z.string().min(1),
  generatedBy: z.string().min(1),
  assets: z.array(ef01AssetEntrySchema).nonempty(),
});

export type Ef01AssetManifestEntry = z.infer<typeof ef01AssetEntrySchema>;
export type Ef01AssetManifest = z.infer<typeof ef01ManifestSchema>;

export const loadEf01AssetManifest = (): Ef01AssetManifest => {
  const content = readFileSync(EF01_MANIFEST_PATH, "utf-8");
  const parsed = ef01ManifestSchema.parse(JSON.parse(content));

  for (const entry of parsed.assets) {
    const svgPath = path.join(
      process.cwd(),
      "public",
      entry.files.svg.split("?")[0].replace(/^\//, "")
    );
    const pngPath = path.join(
      process.cwd(),
      "public",
      entry.files.png.split("?")[0].replace(/^\//, "")
    );

    if (!existsSync(svgPath)) {
      throw new Error(
        `Arquivo SVG ausente para o asset EF01 '${entry.slug}' em '${entry.files.svg}'.`
      );
    }

    if (!existsSync(pngPath)) {
      throw new Error(
        `Arquivo PNG ausente para o asset EF01 '${entry.slug}' em '${entry.files.png}'.`
      );
    }
  }

  return parsed;
};

export const buildEf01AssetIndex = (
  manifest: Ef01AssetManifest
): Map<string, Ef01AssetManifestEntry> => {
  const index = new Map<string, Ef01AssetManifestEntry>();

  for (const entry of manifest.assets) {
    index.set(entry.slug, entry);
  }

  return index;
};
