#!/usr/bin/env tsx
import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { Resvg } from "@resvg/resvg-js";
import { SVG, Svg, registerWindow } from "@svgdotjs/svg.js";
import tailwindConfig from "../tailwind.config";
import { createSVGWindow } from "svgdom";

type Ef01Subject = "lingua-portuguesa" | "ciencias";

type AssetDefinition = {
  slug: string;
  subject: Ef01Subject;
  theme: string;
  recommendedUsage: string;
  altText: string;
  colorProfile: string[];
  draw: (canvas: Svg, helpers: DrawingHelpers) => void;
};

type ManifestEntry = {
  slug: string;
  subject: Ef01Subject;
  theme: string;
  recommendedUsage: string;
  altText: string;
  colorProfile: string[];
  license: {
    name: string;
    url: string;
    document: string;
  };
  files: {
    svg: string;
    png: string;
  };
  hash: string;
};

type DrawingHelpers = {
  palette: PaletteAccessor;
  canvasSize: number;
};

type PaletteAccessor = {
  get: (token: string) => string;
};

type TailwindColorValue = string | Record<string, string>;
type TailwindPalette = Record<string, TailwindColorValue>;

type ManifestPayload = {
  version: string;
  generatedBy: string;
  assets: ManifestEntry[];
};

const CANVAS_SIZE = 256;
const PNG_SIZE = 512;
const ROOT = process.cwd();
const ASSETS_ROOT = path.join(ROOT, "public", "assets", "ef01");
const MANIFEST_PATH = path.join(ROOT, "data", "assets", "ef01-manifest.json");
const LICENSE_PATH = path.join(ASSETS_ROOT, "LICENSE.md");
const LICENSE_INFO = {
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
  document: "/assets/ef01/LICENSE.md",
};
const LICENSE_CONTENT = `# Licença dos assets EF01

Os arquivos vetoriais e raster presentes em \`public/assets/ef01\` foram gerados automaticamente pelo script \`scripts/generate-ef01-assets.ts\`.

## Termos de uso

- Licença: Creative Commons Attribution 4.0 International (CC BY 4.0).
- Autoria: Equipe pedagógica Aprender+ (ilustrações procedurais). Nenhum conteúdo de terceiros foi reutilizado.
- Uso permitido para fins educacionais, inclusive comerciais, desde que a atribuição seja mantida.

## Atribuição sugerida

> "Ilustrações EF01 geradas procedimentalmente por Aprender+ (\`scripts/generate-ef01-assets.ts\`), licenciadas sob CC BY 4.0."

Este arquivo é sobrescrito automaticamente durante a geração dos assets para garantir consistência de atribuição.
`;

const ensureDirectory = (target: string) => {
  mkdirSync(target, { recursive: true });
};

const prepareDirectories = (subjects: Ef01Subject[]) => {
  ensureDirectory(ASSETS_ROOT);

  for (const subject of subjects) {
    const subjectDir = path.join(ASSETS_ROOT, subject);
    if (existsSync(subjectDir)) {
      rmSync(subjectDir, { recursive: true, force: true });
    }
    ensureDirectory(subjectDir);
  }

  ensureDirectory(path.dirname(MANIFEST_PATH));
  writeFileSync(LICENSE_PATH, LICENSE_CONTENT);
};

const resolveTailwindPalette = (): TailwindPalette => {
  const colors = (tailwindConfig as { theme?: { extend?: { colors?: TailwindPalette } } })?.theme
    ?.extend?.colors;

  if (!colors) {
    throw new Error("Não foi possível carregar tokens de cor a partir do tailwind.config.ts");
  }

  return colors;
};

const createPaletteAccessor = (palette: TailwindPalette): PaletteAccessor => ({
  get: (token: string) => {
    const [group, shade] = token.split("-");
    const value = palette[group];

    if (!value) {
      throw new Error(`Token de cor desconhecido: ${token}`);
    }

    if (typeof value === "string") {
      return value;
    }

    if (!shade) {
      throw new Error(`Token de cor '${token}' requer um tom, ex: primary-500.`);
    }

    const shadeValue = value[shade];
    if (!shadeValue) {
      throw new Error(`Tom '${shade}' não encontrado para o token '${group}'.`);
    }

    return shadeValue;
  },
});

const createCanvas = (): Svg => {
  const window = createSVGWindow();
  const document = window.document;
  registerWindow(window, document);

  const canvas = SVG().size(CANVAS_SIZE, CANVAS_SIZE);
  canvas.viewbox(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  canvas.attr({ xmlns: "http://www.w3.org/2000/svg" });

  return canvas;
};

const addRoundedBackground = (canvas: Svg, color: string) => {
  canvas.rect(CANVAS_SIZE, CANVAS_SIZE).fill(color).radius(48);
};

const drawLetterTile = (canvas: Svg, helpers: DrawingHelpers, letter: string, colors: string[]) => {
  const [background, accent, text] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);
  canvas
    .circle(192)
    .fill(accent)
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2);

  const glyph = canvas
    .text(letter.toUpperCase())
    .font({
      family: "'Baloo 2', 'Nunito', 'Inter', sans-serif",
      size: 148,
      anchor: "middle",
      leading: "1",
      weight: "700",
    })
    .fill(text);

  glyph.center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 12);

  canvas
    .circle(36)
    .fill(helpers.palette.get("surface-300"))
    .opacity(0.65)
    .center(CANVAS_SIZE / 2 + 70, CANVAS_SIZE / 2 - 70);
};

const drawSilabaTile = (canvas: Svg, helpers: DrawingHelpers, silaba: string, colors: string[]) => {
  const [background, accent, text] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  canvas
    .rect(208, 160)
    .fill(accent)
    .radius(36)
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 12);

  const glyph = canvas
    .text(silaba.toUpperCase())
    .font({
      family: "'Baloo 2', 'Nunito', 'Inter', sans-serif",
      size: 120,
      anchor: "middle",
      leading: "1",
      weight: "700",
    })
    .fill(text);

  glyph.center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 18);

  canvas
    .rect(72, 20)
    .fill(helpers.palette.get("accent-200"))
    .radius(10)
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 92);
};

const drawNotebook = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, cover, page, detail] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  const book = canvas.group();
  book
    .rect(184, 208)
    .fill(page)
    .stroke({ color: helpers.palette.get("neutral-200"), width: 4 })
    .radius(28)
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 6);

  book
    .rect(188, 32)
    .radius(16)
    .fill(detail)
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 92);

  const spiral = book.group();
  const startX = CANVAS_SIZE / 2 - 68;
  for (let index = 0; index < 6; index += 1) {
    spiral
      .rect(18, 12)
      .radius(4)
      .fill(helpers.palette.get("neutral-300"))
      .center(startX + index * 27, CANVAS_SIZE / 2 - 74);
  }

  const pencil = canvas.group();
  pencil
    .rect(20, 140)
    .radius(12)
    .fill(cover)
    .center(CANVAS_SIZE / 2 + 60, CANVAS_SIZE / 2 + 20)
    .rotate(20);

  pencil
    .rect(20, 32)
    .radius(8)
    .fill(helpers.palette.get("secondary-400"))
    .center(CANVAS_SIZE / 2 + 60, CANVAS_SIZE / 2 - 58)
    .rotate(20);

  pencil
    .polygon("0,0 20,0 10,18")
    .fill(helpers.palette.get("surface-200"))
    .move(CANVAS_SIZE / 2 + 50, CANVAS_SIZE / 2 + 86)
    .rotate(20, CANVAS_SIZE / 2 + 60, CANVAS_SIZE / 2 + 94);
};

const drawMagnifier = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, frame, glass, detail] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  const magnifier = canvas.group();
  magnifier
    .circle(172)
    .fill(glass)
    .stroke({ color: frame, width: 18 })
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 10);

  magnifier
    .rect(36, 118)
    .radius(22)
    .fill(frame)
    .center(CANVAS_SIZE / 2 + 80, CANVAS_SIZE / 2 + 98)
    .rotate(40);

  magnifier
    .rect(12, 64)
    .radius(8)
    .fill(detail)
    .center(CANVAS_SIZE / 2 + 68, CANVAS_SIZE / 2 - 40)
    .rotate(42);

  canvas
    .circle(32)
    .fill(helpers.palette.get("success-400"))
    .center(CANVAS_SIZE / 2 - 44, CANVAS_SIZE / 2 - 62)
    .opacity(0.85);

  canvas
    .circle(22)
    .fill(helpers.palette.get("accent-400"))
    .center(CANVAS_SIZE / 2 + 18, CANVAS_SIZE / 2 - 98)
    .opacity(0.7);
};

const drawToucan = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, body, beak, foliage] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  const branch = canvas
    .rect(220, 20)
    .radius(10)
    .fill(helpers.palette.get("warning-500"))
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 72);

  branch.rotate(-3);

  const bird = canvas.group();
  bird
    .ellipse(150, 120)
    .fill(body)
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 16);

  bird
    .circle(70)
    .fill(body)
    .center(CANVAS_SIZE / 2 + 46, CANVAS_SIZE / 2 - 44);

  bird
    .ellipse(68, 32)
    .fill(beak)
    .center(CANVAS_SIZE / 2 + 90, CANVAS_SIZE / 2 - 60)
    .rotate(-8);

  bird
    .circle(16)
    .fill(helpers.palette.get("surface-50"))
    .center(CANVAS_SIZE / 2 + 24, CANVAS_SIZE / 2 - 40);

  bird
    .circle(8)
    .fill(helpers.palette.get("neutral-800"))
    .center(CANVAS_SIZE / 2 + 28, CANVAS_SIZE / 2 - 40);

  bird
    .path("M138 168 Q154 196 170 168")
    .stroke({ color: helpers.palette.get("neutral-900"), width: 8, linecap: "round" })
    .fill("none");

  canvas
    .ellipse(82, 46)
    .fill(foliage)
    .center(CANVAS_SIZE / 2 - 78, CANVAS_SIZE / 2 + 36)
    .rotate(-22);

  canvas
    .ellipse(58, 30)
    .fill(helpers.palette.get("success-400"))
    .center(CANVAS_SIZE / 2 - 98, CANVAS_SIZE / 2 + 68)
    .rotate(-18);
};

const drawBoto = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, body, water, sparkle] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  canvas
    .path("M40 190 C80 150 176 150 216 190")
    .stroke({ color: water, width: 18, linecap: "round" })
    .fill("none")
    .opacity(0.85);

  const dolphin = canvas.group();
  dolphin
    .path("M70 150 C80 80 210 80 190 150 C200 150 220 160 210 180 C200 202 150 170 120 170")
    .fill(body)
    .stroke({ color: helpers.palette.get("accent-200"), width: 4, linecap: "round" });

  dolphin.circle(12).fill(helpers.palette.get("neutral-800")).center(176, 130);

  dolphin
    .path("M180 116 Q194 126 206 120")
    .stroke({ color: sparkle, width: 8, linecap: "round" })
    .fill("none");

  canvas.circle(22).fill(sparkle).center(88, 88).opacity(0.6);

  canvas.circle(12).fill(sparkle).center(116, 66).opacity(0.6);
};

const drawForest = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, canopy, trunk, sun] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  canvas
    .circle(72)
    .fill(sun)
    .center(CANVAS_SIZE / 2 + 70, CANVAS_SIZE / 2 - 82)
    .opacity(0.9);

  const tree = (x: number, scale: number) => {
    const group = canvas.group();
    group
      .rect(18 * scale, 86 * scale)
      .radius(12 * scale)
      .fill(trunk)
      .center(x, CANVAS_SIZE / 2 + 72);

    group
      .ellipse(120 * scale, 104 * scale)
      .fill(canopy)
      .center(x, CANVAS_SIZE / 2);

    group
      .ellipse(92 * scale, 86 * scale)
      .fill(helpers.palette.get("success-300"))
      .center(x - 24 * scale, CANVAS_SIZE / 2 - 28 * scale);

    group
      .ellipse(92 * scale, 86 * scale)
      .fill(helpers.palette.get("success-500"))
      .center(x + 32 * scale, CANVAS_SIZE / 2 - 24 * scale);
  };

  tree(CANVAS_SIZE / 2 - 52, 0.9);
  tree(CANVAS_SIZE / 2 + 58, 1.05);
};

const drawRiver = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, water, bank, mountain] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  canvas
    .path("M20 186 C80 150 108 160 148 132 C196 96 216 120 236 74")
    .stroke({ color: water, width: 48, linecap: "round" })
    .fill("none")
    .opacity(0.92);

  canvas
    .path("M30 206 C96 156 108 162 148 132")
    .stroke({ color: bank, width: 18, linecap: "round" })
    .opacity(0.6);

  canvas.path("M82 94 L120 44 L154 94 Z").fill(mountain).opacity(0.9);

  canvas.path("M140 94 L188 32 L222 94 Z").fill(helpers.palette.get("neutral-500")).opacity(0.8);

  canvas
    .circle(44)
    .fill(helpers.palette.get("warning-200"))
    .center(CANVAS_SIZE / 2 + 70, CANVAS_SIZE / 2 - 86);
};

const drawHandWashing = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, soap, water, hand] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  canvas
    .path("M180 42 C190 48 204 56 214 78")
    .stroke({ color: water, width: 16, linecap: "round" })
    .fill("none")
    .opacity(0.7);

  const hands = canvas.group();
  hands
    .path("M64 178 C68 126 140 128 176 132 C192 134 196 146 190 160 C182 178 96 210 64 178")
    .fill(hand)
    .stroke({ color: helpers.palette.get("neutral-200"), width: 4 });

  hands
    .circle(48)
    .fill(soap)
    .center(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 12)
    .opacity(0.92);

  canvas
    .path("M112 98 Q138 78 170 90")
    .stroke({ color: water, width: 14, linecap: "round" })
    .fill("none")
    .opacity(0.75);

  for (let index = 0; index < 3; index += 1) {
    canvas
      .circle(16 - index * 3)
      .fill(soap)
      .center(116 + index * 24, 118 - index * 16)
      .opacity(0.8 - index * 0.15);
  }
};

const drawToothBrushing = (canvas: Svg, helpers: DrawingHelpers, colors: string[]) => {
  const [background, brush, foam, tooth] = colors.map(helpers.palette.get);

  addRoundedBackground(canvas, background);

  const molar = canvas.group();
  molar
    .path("M90 210 C80 150 96 96 128 96 C160 96 176 150 166 210 C150 234 106 234 90 210")
    .fill(tooth)
    .stroke({ color: helpers.palette.get("surface-200"), width: 4 });

  const bristles = canvas.group();
  bristles
    .rect(150, 24)
    .radius(12)
    .fill(brush)
    .center(CANVAS_SIZE / 2 + 12, CANVAS_SIZE / 2 - 44)
    .rotate(-10);

  bristles
    .rect(110, 16)
    .radius(8)
    .fill(helpers.palette.get("secondary-500"))
    .center(CANVAS_SIZE / 2 + 36, CANVAS_SIZE / 2 - 16)
    .rotate(-10);

  canvas
    .rect(20, 120)
    .radius(12)
    .fill(brush)
    .center(CANVAS_SIZE / 2 - 56, CANVAS_SIZE / 2 - 10)
    .rotate(-10);

  for (let index = 0; index < 4; index += 1) {
    canvas
      .circle(26 - index * 3)
      .fill(foam)
      .center(112 + index * 32, 118 - index * 10)
      .opacity(0.88 - index * 0.12);
  }
};

const assetDefinitions: AssetDefinition[] = [
  {
    slug: "lp-letra-a",
    subject: "lingua-portuguesa",
    theme: "letters",
    recommendedUsage: "Atividades de reconhecimento de letras iniciais e jogos de alfabeto.",
    altText: "Letra A maiúscula estilizada sobre círculos coloridos.",
    colorProfile: ["primary-500", "accent-200", "surface-200"],
    draw: (canvas, helpers) =>
      drawLetterTile(canvas, helpers, "A", ["primary-100", "primary-500", "surface-50"]),
  },
  {
    slug: "lp-letra-e",
    subject: "lingua-portuguesa",
    theme: "letters",
    recommendedUsage: "Sequências alfabéticas e murais de sons vocálicos.",
    altText: "Letra E maiúscula com toque lúdico e esfera brilhante.",
    colorProfile: ["primary-400", "calm-200", "surface-100"],
    draw: (canvas, helpers) =>
      drawLetterTile(canvas, helpers, "E", ["surface-200", "calm-300", "primary-700"]),
  },
  {
    slug: "lp-silaba-ba",
    subject: "lingua-portuguesa",
    theme: "silabas",
    recommendedUsage: "Jogos de montar palavras simples com sílabas diretas.",
    altText: "Cartão com a sílaba BA em destaque sobre faixa colorida.",
    colorProfile: ["secondary-400", "surface-200", "primary-700"],
    draw: (canvas, helpers) =>
      drawSilabaTile(canvas, helpers, "BA", ["secondary-100", "secondary-400", "surface-50"]),
  },
  {
    slug: "lp-silaba-la",
    subject: "lingua-portuguesa",
    theme: "silabas",
    recommendedUsage: "Painéis de leitura compartilhada com sílabas da família do L.",
    altText: "Símbolo da sílaba LA com barra superior decorada.",
    colorProfile: ["accent-400", "surface-100", "primary-800"],
    draw: (canvas, helpers) =>
      drawSilabaTile(canvas, helpers, "LA", ["accent-100", "accent-400", "surface-50"]),
  },
  {
    slug: "lp-material-caderno",
    subject: "lingua-portuguesa",
    theme: "materiais-escolares",
    recommendedUsage: "Cartazes de rotinas de escrita e produção de textos.",
    altText: "Caderno espiral colorido com lápis apoiado na capa.",
    colorProfile: ["surface-200", "primary-400", "surface-50", "secondary-400"],
    draw: (canvas, helpers) =>
      drawNotebook(canvas, helpers, ["surface-200", "primary-400", "surface-50", "accent-300"]),
  },
  {
    slug: "cn-material-lupa",
    subject: "ciencias",
    theme: "materiais-escolares",
    recommendedUsage: "Explorações científicas e observação de pequenos objetos.",
    altText: "Lupa azul com reflexos verdes e detalhes em amarelo.",
    colorProfile: ["calm-200", "primary-600", "surface-50", "accent-300"],
    draw: (canvas, helpers) =>
      drawMagnifier(canvas, helpers, ["calm-100", "primary-600", "surface-50", "accent-300"]),
  },
  {
    slug: "cn-animal-tucano",
    subject: "ciencias",
    theme: "animais-brasileiros",
    recommendedUsage: "Estudos sobre aves da fauna brasileira e biodiversidade.",
    altText: "Tucano estilizado de corpo azul escuro e bico alaranjado pousado em galho.",
    colorProfile: ["primary-200", "primary-800", "warning-400", "success-400"],
    draw: (canvas, helpers) =>
      drawToucan(canvas, helpers, ["primary-200", "primary-800", "warning-400", "success-500"]),
  },
  {
    slug: "cn-animal-boto",
    subject: "ciencias",
    theme: "animais-brasileiros",
    recommendedUsage: "Atividades sobre ecossistemas aquáticos da Amazônia.",
    altText: "Boto cor-de-rosa saltando sobre ondas brilhantes.",
    colorProfile: ["calm-200", "accent-300", "calm-500", "accent-100"],
    draw: (canvas, helpers) =>
      drawBoto(canvas, helpers, ["calm-100", "accent-300", "calm-500", "accent-100"]),
  },
  {
    slug: "cn-natureza-floresta",
    subject: "ciencias",
    theme: "elementos-naturais",
    recommendedUsage: "Mapas visuais de biomas brasileiros e ciclos da natureza.",
    altText: "Dois ipês coloridos com sol ao fundo representando a floresta brasileira.",
    colorProfile: ["success-200", "success-500", "warning-600", "warning-200"],
    draw: (canvas, helpers) =>
      drawForest(canvas, helpers, ["success-200", "success-500", "warning-600", "warning-200"]),
  },
  {
    slug: "cn-natureza-rio",
    subject: "ciencias",
    theme: "elementos-naturais",
    recommendedUsage: "Discussões sobre ciclos da água e paisagens naturais.",
    altText: "Rio sinuoso em tons azuis com montanhas ao fundo.",
    colorProfile: ["calm-300", "calm-500", "neutral-200", "neutral-500"],
    draw: (canvas, helpers) =>
      drawRiver(canvas, helpers, ["calm-200", "calm-500", "neutral-200", "neutral-500"]),
  },
  {
    slug: "cn-higiene-lavar-maos",
    subject: "ciencias",
    theme: "rotinas-de-higiene",
    recommendedUsage: "Rotinas de prevenção e lavagem correta das mãos.",
    altText: "Mãos rosadas ensaboadas sob gotas de água.",
    colorProfile: ["surface-200", "accent-200", "calm-400", "neutral-200"],
    draw: (canvas, helpers) =>
      drawHandWashing(canvas, helpers, ["surface-200", "accent-200", "calm-400", "neutral-200"]),
  },
  {
    slug: "cn-higiene-escovar-dentes",
    subject: "ciencias",
    theme: "rotinas-de-higiene",
    recommendedUsage: "Materiais de educação em saúde sobre cuidados com os dentes.",
    altText: "Escova azul com espuma limpando um dente branco.",
    colorProfile: ["surface-100", "primary-500", "accent-200", "surface-50"],
    draw: (canvas, helpers) =>
      drawToothBrushing(canvas, helpers, [
        "surface-100",
        "primary-500",
        "accent-200",
        "surface-50",
      ]),
  },
];

const generateAssets = (
  definitions: AssetDefinition[],
  palette: PaletteAccessor
): ManifestEntry[] => {
  const helpers: DrawingHelpers = { palette, canvasSize: CANVAS_SIZE };
  const entries: ManifestEntry[] = [];

  for (const definition of definitions) {
    const canvas = createCanvas();
    definition.draw(canvas, helpers);

    const svgContent = canvas.svg().replace(/\s+$/, "\n");
    const svgPath = path.join(ASSETS_ROOT, definition.subject, `${definition.slug}.svg`);
    writeFileSync(svgPath, svgContent, "utf-8");

    const renderer = new Resvg(svgContent, {
      fitTo: { mode: "width", value: PNG_SIZE },
      background: "rgba(0,0,0,0)",
    });
    const pngData = renderer.render().asPng();
    const pngPath = path.join(ASSETS_ROOT, definition.subject, `${definition.slug}.png`);
    writeFileSync(pngPath, pngData);

    const hash = createHash("sha256").update(svgContent).update(pngData).digest("hex").slice(0, 12);

    const svgPublicPath = `/assets/ef01/${definition.subject}/${definition.slug}.svg?v=${hash}`;
    const pngPublicPath = `/assets/ef01/${definition.subject}/${definition.slug}.png?v=${hash}`;

    entries.push({
      slug: definition.slug,
      subject: definition.subject,
      theme: definition.theme,
      recommendedUsage: definition.recommendedUsage,
      altText: definition.altText,
      colorProfile: definition.colorProfile,
      license: LICENSE_INFO,
      files: {
        svg: svgPublicPath,
        png: pngPublicPath,
      },
      hash,
    });
  }

  return entries.sort((a, b) => a.slug.localeCompare(b.slug));
};

const buildManifest = (entries: ManifestEntry[]): ManifestPayload => {
  const manifestHash = createHash("sha256")
    .update(JSON.stringify(entries))
    .digest("hex")
    .slice(0, 16);

  return {
    version: manifestHash,
    generatedBy: "scripts/generate-ef01-assets.ts",
    assets: entries,
  };
};

const writeManifest = (payload: ManifestPayload) => {
  const formatted = `${JSON.stringify(payload, null, 2)}\n`;
  writeFileSync(MANIFEST_PATH, formatted, "utf-8");
};

const main = () => {
  const subjects = Array.from(new Set(assetDefinitions.map((definition) => definition.subject)));
  prepareDirectories(subjects);

  const palette = createPaletteAccessor(resolveTailwindPalette());
  const entries = generateAssets(assetDefinitions, palette);
  const manifest = buildManifest(entries);
  writeManifest(manifest);

  console.log(`✅ Gerados ${entries.length} assets EF01 com manifest versão ${manifest.version}.`);
};

main();
