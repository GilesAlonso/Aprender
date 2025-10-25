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
  descricao: string;
};

type BnccReference = {
  documento: string;
  secao?: string;
  paginaInicial?: number;
  paginaFinal?: number;
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
    tag: string;
    competency: string;
    description: string | null;
    componenteCurricular: string;
    unidadeTematica: string;
    objetoConhecimento: string[];
    referencias: BnccReference[];
    habilidades: CurriculumHabilidade[];
  } | null;
  learningOutcomes: string[];
  bnccTag: string | null;
  activities: Array<{
    id: string;
    slug: string;
    title: string;
    prompt: string | null;
    activityType: string;
    difficulty: string;
    description: string | null;
    metadata: Record<string, unknown> | null;
    learningObjectives: string[];
    curriculumStandard: {
      id: string;
      bnccCode: string;
      tag: string;
      componenteCurricular: string;
      unidadeTematica: string;
      habilidades: CurriculumHabilidade[];
    } | null;
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
        include: {
          curriculumStandard: true,
        },
      },
    },
    orderBy: {
      title: "asc",
    },
  });

type ModuleWithRelations = Awaited<ReturnType<typeof fetchModulesForAgeGroup>>[number];

const parseJsonArray = <T>(value: string | null | undefined): T[] =>
  safeJsonParse<T[]>(value) ?? [];

const normalizeHabilidades = (
  habilidades: Array<{ codigo: string; descricao?: string; habilidade?: string }>
): CurriculumHabilidade[] =>
  habilidades.map(({ codigo, descricao, habilidade }) => ({
    codigo,
    descricao: ((descricao ?? habilidade) ?? "").toString(),
  }));

const serializeModule = (
  module: ModuleWithRelations,
  access: ModuleAccessStatus,
  lockMessage: string | null
): ModuleResponse => {
  const moduleStandardRaw = module.curriculumStandard;

  const moduleStandard = moduleStandardRaw
    ? {
        id: moduleStandardRaw.id,
        bnccCode: moduleStandardRaw.bnccCode,
        tag: `BNCC ${moduleStandardRaw.bnccCode}`,
        competency: moduleStandardRaw.competency,
        description: moduleStandardRaw.description,
        componenteCurricular: moduleStandardRaw.componenteCurricular,
        unidadeTematica: moduleStandardRaw.unidadeTematica,
        objetoConhecimento: parseJsonArray<string>(moduleStandardRaw.objetoConhecimento),
        referencias: parseJsonArray<BnccReference>(moduleStandardRaw.referencias),
        habilidades: normalizeHabilidades(
          parseJsonArray<{ codigo: string; descricao?: string; habilidade?: string }>(
            moduleStandardRaw.habilidades
          )
        ),
      }
    : null;

  const activities = module.activities.map((activity) => {
    const metadataRaw = safeJsonParse<Record<string, unknown>>(activity.metadata);
    const metadataClone = metadataRaw ? { ...metadataRaw } : null;
    const objectivesSource = metadataRaw as { learningObjectives?: unknown } | null;
    const learningObjectivesRaw = objectivesSource?.learningObjectives;
    const learningObjectives = Array.isArray(learningObjectivesRaw)
      ? learningObjectivesRaw
          .map((item) => `${item}`.trim())
          .filter((item) => item.length > 0)
      : [];

    if (metadataClone && "learningObjectives" in metadataClone) {
      delete (metadataClone as { learningObjectives?: unknown }).learningObjectives;
    }

    const cleanedMetadata = metadataClone && Object.keys(metadataClone).length > 0 ? metadataClone : null;

    const activityStandardRaw = activity.curriculumStandard ?? moduleStandardRaw;
    const activityStandard = activityStandardRaw
      ? {
          id: activityStandardRaw.id,
          bnccCode: activityStandardRaw.bnccCode,
          tag: `BNCC ${activityStandardRaw.bnccCode}`,
          componenteCurricular: activityStandardRaw.componenteCurricular,
          unidadeTematica: activityStandardRaw.unidadeTematica,
          habilidades: parseJsonArray<CurriculumHabilidade>(activityStandardRaw.habilidades),
        }
      : null;

    return {
      id: activity.id,
      slug: activity.slug,
      title: activity.title,
      prompt: activity.prompt,
      activityType: activity.activityType,
      difficulty: activity.difficulty,
      description: activity.description,
      metadata: cleanedMetadata,
      learningObjectives,
      curriculumStandard: activityStandard,
    };
  });

  return {
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
    curriculumStandard: moduleStandard,
    learningOutcomes: parseJsonArray<string>(module.learningOutcomes),
    bnccTag: moduleStandard?.tag ?? null,
    activities,
    access,
    lockMessage,
  };
};

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
