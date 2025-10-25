import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  getStageConfigForAge,
  resolveStudentAgeGroup,
} from "@/lib/personalization/age-groups";

const AGE_CASES = [
  { age: 4, slug: "educacao-infantil" },
  { age: 6, slug: "fundamental-anos-iniciais" },
  { age: 10, slug: "fundamental-anos-iniciais" },
  { age: 12, slug: "fundamental-anos-finais" },
  { age: 15, slug: "ensino-medio" },
  { age: 17, slug: "ensino-medio" },
] as const;

describe("Mapeamento de faixas etárias da BNCC", () => {
  it.each(AGE_CASES)("mapeia idade %i para o grupo %s", async ({ age, slug }) => {
    const stage = getStageConfigForAge(age);
    expect(stage.slug).toBe(slug);

    const resolved = await resolveStudentAgeGroup({
      age,
      ignoreCookie: true,
      ignoreProfile: true,
    });

    expect(resolved.ageGroup.slug).toBe(slug);
  });

  it("permite sobrescrever a etapa manualmente", async () => {
    const resolved = await resolveStudentAgeGroup({
      age: 7,
      overrideSlug: "ensino-medio",
      ignoreCookie: true,
      ignoreProfile: true,
    });

    expect(resolved.ageGroup.slug).toBe("ensino-medio");
    expect(resolved.source).toBe("override");
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
