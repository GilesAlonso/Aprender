import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { loadEf01AssetManifest } from "@/lib/content";

describe("EF01 asset manifest", () => {
  const manifest = loadEf01AssetManifest();

  it("garante que cada entrada possui arquivos e descrição alternativa", () => {
    expect(manifest.assets.length).toBeGreaterThan(0);

    for (const asset of manifest.assets) {
      expect(asset.altText.trim().length).toBeGreaterThan(0);
      expect(asset.files.svg).toContain(".svg");
      expect(asset.files.png).toContain(".png");

      const svgPath = asset.files.svg.split("?")[0].replace(/^\//, "");
      const pngPath = asset.files.png.split("?")[0].replace(/^\//, "");

      expect(existsSync(path.join(process.cwd(), "public", svgPath))).toBe(true);
      expect(existsSync(path.join(process.cwd(), "public", pngPath))).toBe(true);
    }
  });

  it("mantém SVGs determinísticos para amostras representativas", () => {
    const sampleSlugs = ["lp-silaba-ba", "cn-animal-tucano"] as const;

    const samples = sampleSlugs.reduce<Record<string, string>>((accumulator, slug) => {
      const entry = manifest.assets.find((asset) => asset.slug === slug);
      expect(entry, `Asset '${slug}' precisa existir no manifest`).toBeDefined();
      if (!entry) {
        return accumulator;
      }

      const svgFile = entry.files.svg.split("?")[0].replace(/^\//, "");
      const svgContent = readFileSync(path.join(process.cwd(), "public", svgFile), "utf-8").trim();
      accumulator[slug] = svgContent;
      return accumulator;
    }, {});

    expect(samples).toMatchSnapshot();
  });
});
