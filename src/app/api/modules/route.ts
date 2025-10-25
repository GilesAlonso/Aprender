import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/json";
import {
  AgeGroupSummary,
  ResolutionSource,
  buildAgeGroupSummary,
  resolveRequestedAgeGroup,
  resolveStudentAgeGroup,
} from "@/lib/personalization/age-groups";
import { ModulesQueryInput, modulesQuerySchema } from "@/lib/validation";

type CurriculumHabilidade = {
  codigo: string;
  habilidade: string;
};

type ModuleAccessStatus = "available" | "locked";

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
  access: ModuleAccessStatus;
  lockMessage: string | null;
};

type ModulesPayload = {
  context: {
    requestedAgeGroup: AgeGroupSummary;
    studentAgeGroup: AgeGroupSummary;
    isLocked: boolean;
    message: string;
    source: ResolutionSource;
  };
  modules: ModuleResponse[];
  recommendedModules?: ModuleResponse[];
};

const buildQuery = (request: NextRequest): ModulesQueryInput => {
  const { searchParams } = new URL(request.url);

  return modulesQuerySchema.parse({
    ageGroupSlug: searchParams.get("ageGroupSlug") ?? undefined,
    overrideAgeGroupSlug: searchParams.get("overrideAgeGroupSlug") ?? undefined,
    userId: searchParams.get("userId") ?? undefined,
    age: searchParams.get("age") ?? undefined,
  });
};

const fetchModulesForAgeGroup = async (ageGroupId: string) =>
  prisma.contentModule.findMany({
    where: {
      ageGroupId,
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

type ModuleWithRelations = Awaited<ReturnType<typeof fetchModulesForAgeGroup>>[number];

const serializeModule = (
  module: ModuleWithRelations,
  access: ModuleAccessStatus,
  lockMessage: string | null
): ModuleResponse => ({
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
  access,
  lockMessage,
});

const buildLockMessage = (
  requested: AgeGroupSummary,
  student: AgeGroupSummary
): string =>
  `Este conteúdo foi planejado para ${requested.stage}. A criança está na etapa ${student.stage}. Combine com um educador para desbloquear quando fizer sentido.`;

const buildContextMessage = (
  isLocked: boolean,
  requested: AgeGroupSummary,
  student: AgeGroupSummary
): string =>
  isLocked
    ? `Mostrando recomendações do estágio ${student.stage}. Conteúdo de ${requested.stage} ficará disponível com autorização de um educador.`
    : `Conteúdo adaptado para ${student.stage}.`; 

export async function GET(request: NextRequest) {
  try {
    const query = buildQuery(request);
    const cookieAgeGroup = request.cookies.get("ageGroupSlug")?.value ?? null;

    const studentResolution = await resolveStudentAgeGroup({
      age: query.age,
      overrideSlug: query.overrideAgeGroupSlug,
      userId: query.userId,
      cookieSlug: cookieAgeGroup,
    });

    const requestedResolution = await resolveRequestedAgeGroup(
      query.ageGroupSlug ?? query.overrideAgeGroupSlug ?? undefined,
      studentResolution
    );

    const studentSummary = buildAgeGroupSummary(
      studentResolution.ageGroup,
      studentResolution.stageConfig
    );
    const requestedSummary = buildAgeGroupSummary(
      requestedResolution.ageGroup,
      requestedResolution.stageConfig
    );

    const isLocked = requestedResolution.ageGroup.id !== studentResolution.ageGroup.id;
    const lockMessage = isLocked ? buildLockMessage(requestedSummary, studentSummary) : null;

    const modulesRaw = await fetchModulesForAgeGroup(requestedResolution.ageGroup.id);
    const modules = modulesRaw.map((module) =>
      serializeModule(module, isLocked ? "locked" : "available", lockMessage)
    );

    let recommendedModules: ModuleResponse[] | undefined;

    if (isLocked) {
      const recommendedRaw = await fetchModulesForAgeGroup(studentResolution.ageGroup.id);
      recommendedModules = recommendedRaw.map((module) => serializeModule(module, "available", null));
    }

    const payload: ModulesPayload = {
      context: {
        requestedAgeGroup: requestedSummary,
        studentAgeGroup: studentSummary,
        isLocked,
        message: buildContextMessage(isLocked, requestedSummary, studentSummary),
        source: studentResolution.source,
      },
      modules,
      recommendedModules,
    };

    return NextResponse.json(payload);
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
