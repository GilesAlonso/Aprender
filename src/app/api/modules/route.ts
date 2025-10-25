import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/json";
import { ModulesQueryInput, modulesQuerySchema } from "@/lib/validation";

type CurriculumHabilidade = {
  codigo: string;
  habilidade: string;
};

type ModuleResponse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  theme: string | null;
  ageGroup: {
    id: string;
    slug: string;
    name: string;
    minAge: number;
    maxAge: number;
  };
  curriculumStandard: {
    id: string;
    bnccCode: string;
    competency: string;
    description: string | null;
    habilidades: CurriculumHabilidade[];
  } | null;
  activities: Array<{
    id: string;
    slug: string;
    title: string;
    prompt: string | null;
    activityType: string;
    difficulty: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
  }>;
};

const buildQuery = (request: NextRequest): ModulesQueryInput => {
  const { searchParams } = new URL(request.url);

  return modulesQuerySchema.parse({
    ageGroupSlug: searchParams.get("ageGroupSlug") ?? undefined,
  });
};

const toResponse = (modules: ModuleResponse[]): { modules: ModuleResponse[] } => ({
  modules,
});

export async function GET(request: NextRequest) {
  try {
    const query = buildQuery(request);

    const modules = await prisma.contentModule.findMany({
      where: {
        ageGroup: {
          slug: query.ageGroupSlug,
        },
      },
      include: {
        ageGroup: true,
        curriculumStandard: true,
        activities: {
          orderBy: {
            title: "asc",
          },
        },
      },
      orderBy: {
        title: "asc",
      },
    });

    const payload: ModuleResponse[] = modules.map((module) => ({
      id: module.id,
      slug: module.slug,
      title: module.title,
      subtitle: module.subtitle,
      description: module.description,
      theme: module.theme,
      ageGroup: {
        id: module.ageGroup.id,
        slug: module.ageGroup.slug,
        name: module.ageGroup.name,
        minAge: module.ageGroup.minAge,
        maxAge: module.ageGroup.maxAge,
      },
      curriculumStandard: module.curriculumStandard
        ? {
            id: module.curriculumStandard.id,
            bnccCode: module.curriculumStandard.bnccCode,
            competency: module.curriculumStandard.competency,
            description: module.curriculumStandard.description,
            habilidades:
              safeJsonParse<CurriculumHabilidade[]>(module.curriculumStandard.habilidades) ?? [],
          }
        : null,
      activities: module.activities.map((activity) => ({
        id: activity.id,
        slug: activity.slug,
        title: activity.title,
        prompt: activity.prompt,
        activityType: activity.activityType,
        difficulty: activity.difficulty,
        description: activity.description,
        metadata: safeJsonParse<Record<string, unknown>>(activity.metadata),
      })),
    }));

    return NextResponse.json(toResponse(payload));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Parâmetros inválidos",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Erro ao listar módulos", error);
    return NextResponse.json({ message: "Erro interno ao buscar módulos" }, { status: 500 });
  }
}
