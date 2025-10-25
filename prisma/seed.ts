import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

import { BNCC_STAGE_CONFIG } from "../src/lib/personalization/age-stages";

const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..");

type CurriculumHabilidade = {
  codigo: string;
  descricao: string;
};

type ActivityMetadata = Record<string, unknown>;

type BnccReference = {
  documento: string;
  secao?: string;
  paginaInicial?: number;
  paginaFinal?: number;
};

type BnccStandardDefinition = {
  bnccCode: string;
  ageGroupSlug: string;
  componenteCurricular: string;
  unidadeTematica: string;
  objetoConhecimento: string[] | string;
  competency: string;
  habilidades: CurriculumHabilidade[];
  descricao?: string;
  referencias?: BnccReference[];
};

type BnccDataset = {
  generatedAt: string;
  source: string;
  standards: BnccStandardDefinition[];
};

type ModuleActivityDefinition = {
  slug: string;
  title: string;
  prompt?: string;
  activityType: string;
  difficulty: string;
  bnccCode: string;
  learningObjectives: string[];
  description?: string;
  metadata?: ActivityMetadata;
};

type ModuleDefinition = {
  slug: string;
  title: string;
  subtitle?: string;
  description?: string;
  theme?: string;
  discipline?: string;
  ageGroupSlug: string;
  learningPathSlug?: string | null;
  primaryBnccCode: string;
  learningOutcomes?: string[];
  activities: ModuleActivityDefinition[];
};

type ContentModuleDataset = {
  updatedAt: string;
  modules: ModuleDefinition[];
};

type RewardSeed = {
  title: string;
  description?: string;
  criteria?: string;
  icon?: string;
};

type AttemptSeed = {
  activitySlug: string;
  success: boolean;
  score?: number;
  metadata?: Record<string, unknown>;
};

type ProgressSeed = {
  contentModuleSlug: string;
  completion: number;
  status: string;
  totalAttempts: number;
};

type UserSeed = {
  email: string;
  name: string;
  displayName: string;
  ageGroupSlug: string;
  learningPathSlugs: string[];
  progress: ProgressSeed[];
  attempts: AttemptSeed[];
  rewards: RewardSeed[];
};

const ageGroupsData = BNCC_STAGE_CONFIG.map((stage) => ({
  slug: stage.slug,
  name: `${stage.stage} (${stage.minAge}-${stage.maxAge} anos)`,
  minAge: stage.minAge,
  maxAge: stage.maxAge,
  description: stage.educatorSummary,
}));

const learningPathsData = [
  {
    slug: "aventuras-letrinhas",
    title: "Aventuras com Letrinhas",
    description:
      "Sequência lúdica para apoiar crianças na consciência fonológica, oralidade e expressão corporal.",
    ageGroupSlug: "educacao-infantil",
  },
  {
    slug: "descobertas-palavras",
    title: "Descobertas das Palavras",
    description:
      "Trilha para alfabetização inicial com foco em leitura, produção de textos curtos e resolução de problemas.",
    ageGroupSlug: "fundamental-anos-iniciais",
  },
  {
    slug: "trilhas-numeros-vivos",
    title: "Trilhas de Números Vivos",
    description:
      "Itinerário matemático para fortalecer multiplicação e divisão contextualizadas.",
    ageGroupSlug: "fundamental-anos-iniciais",
  },
  {
    slug: "inventores-projetos",
    title: "Inventores da Natureza",
    description:
      "Percurso investigativo interdisciplinar com debates, prototipagem e protagonismo juvenil.",
    ageGroupSlug: "fundamental-anos-finais",
  },
  {
    slug: "narrativas-conectadas",
    title: "Narrativas Conectadas",
    description:
      "Trilha de autorias digitais e produção textual multimodal.",
    ageGroupSlug: "fundamental-anos-finais",
  },
  {
    slug: "trajetos-projeto-vida",
    title: "Projetos de Vida e Impacto",
    description:
      "Itinerário para Ensino Médio que integra cultura digital, projeto de vida e desafios socioambientais.",
    ageGroupSlug: "ensino-medio",
  },
] as const;

const loadJson = <T>(relativePath: string): T =>
  JSON.parse(readFileSync(path.join(projectRoot, relativePath), "utf-8")) as T;

const bnccDataset = loadJson<BnccDataset>("data/bncc/standards.json");
const curriculumStandardsData = bnccDataset.standards;

const contentDataset = loadJson<ContentModuleDataset>("data/content/modules.json");
const contentModulesDataset = contentDataset.modules;

const normalizeToArray = <T>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

const toJsonString = (value: unknown): string => JSON.stringify(value);

const usersData: UserSeed[] = [
  {
    email: "ana@aprender.dev",
    name: "Ana Silva",
    displayName: "Ana",
    ageGroupSlug: "educacao-infantil",
    learningPathSlugs: ["aventuras-letrinhas"],
    progress: [
      {
        contentModuleSlug: "historias-em-movimento",
        completion: 45,
        status: "IN_PROGRESS",
        totalAttempts: 3,
      },
    ],
    attempts: [
      {
        activitySlug: "teatro-das-emocoes",
        success: true,
        score: 80,
        metadata: { resposta: "Expressou alegria com gestos." },
      },
      {
        activitySlug: "danca-dos-sons",
        success: false,
        score: 50,
        metadata: { observacoes: "Precisou de apoio para seguir o ritmo." },
      },
    ],
    rewards: [
      {
        title: "Exploradora Corporal",
        description: "Participou de 3 atividades de movimento.",
        criteria: "Registrar 3 tentativas em atividades corporais.",
        icon: "medal-star",
      },
    ],
  },
  {
    email: "bruno@aprender.dev",
    name: "Bruno Lima",
    displayName: "Bruno",
    ageGroupSlug: "fundamental-anos-iniciais",
    learningPathSlugs: ["descobertas-palavras"],
    progress: [
      {
        contentModuleSlug: "clubinho-das-palavras",
        completion: 70,
        status: "IN_PROGRESS",
        totalAttempts: 4,
      },
    ],
    attempts: [
      {
        activitySlug: "detectives-das-palavras",
        success: true,
        score: 90,
        metadata: { palavrasEncontradas: 5 },
      },
      {
        activitySlug: "laboratorio-das-palavras",
        success: true,
        score: 85,
        metadata: { colaboracao: "Produziu frase coletiva." },
      },
    ],
    rewards: [
      {
        title: "Detetive das Letras",
        description: "Identificou sons iniciais em diferentes textos.",
        criteria: "Concluir com sucesso duas atividades de leitura.",
        icon: "badge-letter",
      },
    ],
  },
  {
    email: "carla@aprender.dev",
    name: "Carla Souza",
    displayName: "Carla",
    ageGroupSlug: "ensino-medio",
    learningPathSlugs: ["trajetos-projeto-vida"],
    progress: [
      {
        contentModuleSlug: "estudio-dados-solidarios",
        completion: 20,
        status: "IN_PROGRESS",
        totalAttempts: 1,
      },
    ],
    attempts: [
      {
        activitySlug: "investigacao-dados-bairro",
        success: true,
        score: 92,
        metadata: { analise: "Apresentou gráfico comparando bairros." },
      },
    ],
    rewards: [
      {
        title: "Mentora da Comunidade",
        description: "Compartilhou achados com a turma e propôs plano de ação.",
        criteria: "Concluir relatório colaborativo com impacto social.",
        icon: "medal-laranja",
      },
    ],
  },
];

const toJsonString = (value: unknown) => JSON.stringify(value);

async function main() {
  await prisma.$transaction([
    prisma.reward.deleteMany(),
    prisma.attempt.deleteMany(),
    prisma.progress.deleteMany(),
    prisma.learningPathEnrollment.deleteMany(),
    prisma.activity.deleteMany(),
    prisma.contentModule.deleteMany(),
    prisma.curriculumStandard.deleteMany(),
    prisma.learningPath.deleteMany(),
    prisma.user.deleteMany(),
    prisma.ageGroup.deleteMany(),
  ]);

  const ageGroups = await Promise.all(
    ageGroupsData.map((group) =>
      prisma.ageGroup.upsert({
        where: { slug: group.slug },
        update: {
          name: group.name,
          minAge: group.minAge,
          maxAge: group.maxAge,
          description: group.description,
        },
        create: {
          slug: group.slug,
          name: group.name,
          minAge: group.minAge,
          maxAge: group.maxAge,
          description: group.description,
        },
      })
    )
  );

  const ageGroupBySlug = Object.fromEntries(ageGroups.map((group) => [group.slug, group]));

  const learningPaths = await Promise.all(
    learningPathsData.map((path) =>
      prisma.learningPath.upsert({
        where: { slug: path.slug },
        update: {
          title: path.title,
          description: path.description,
          ageGroupId: ageGroupBySlug[path.ageGroupSlug]?.id,
        },
        create: {
          slug: path.slug,
          title: path.title,
          description: path.description,
          ageGroupId: ageGroupBySlug[path.ageGroupSlug]?.id as string,
        },
      })
    )
  );

  const learningPathBySlug = Object.fromEntries(learningPaths.map((path) => [path.slug, path]));

  const curriculumStandards = await Promise.all(
    curriculumStandardsData.map((standard) => {
      const ageGroup = ageGroupBySlug[standard.ageGroupSlug];
      if (!ageGroup) {
        throw new Error(
          `Configuração de faixa etária não encontrada para o código BNCC ${standard.bnccCode} (${standard.ageGroupSlug}).`
        );
      }

      const habilidadesJson = toJsonString(standard.habilidades);
      const objetoConhecimentoJson = toJsonString(normalizeToArray(standard.objetoConhecimento));
      const referenciasJson = standard.referencias ? toJsonString(standard.referencias) : null;

      return prisma.curriculumStandard.upsert({
        where: {
          bnccCode_ageGroupId: {
            bnccCode: standard.bnccCode,
            ageGroupId: ageGroup.id,
          },
        },
        update: {
          componenteCurricular: standard.componenteCurricular,
          unidadeTematica: standard.unidadeTematica,
          objetoConhecimento: objetoConhecimentoJson,
          competency: standard.competency,
          habilidades: habilidadesJson,
          description: standard.descricao ?? null,
          referencias: referenciasJson,
        },
        create: {
          bnccCode: standard.bnccCode,
          componenteCurricular: standard.componenteCurricular,
          unidadeTematica: standard.unidadeTematica,
          objetoConhecimento: objetoConhecimentoJson,
          competency: standard.competency,
          habilidades: habilidadesJson,
          description: standard.descricao ?? null,
          referencias: referenciasJson,
          ageGroupId: ageGroup.id,
        },
      });
    })
  );

  const curriculumStandardByCode = Object.fromEntries(
    curriculumStandards.map((standard) => [`${standard.ageGroupId}:${standard.bnccCode}`, standard])
  );

  const contentModuleBySlug: Record<string, Awaited<ReturnType<typeof prisma.contentModule.upsert>>> = {};
  const activityBySlug: Record<string, Awaited<ReturnType<typeof prisma.activity.upsert>>> = {};

  for (const moduleDefinition of contentModulesDataset) {
    const ageGroup = ageGroupBySlug[moduleDefinition.ageGroupSlug];
    if (!ageGroup) {
      throw new Error(
        `Módulo ${moduleDefinition.slug} faz referência a uma faixa etária desconhecida (${moduleDefinition.ageGroupSlug}).`
      );
    }

    const learningPath = moduleDefinition.learningPathSlug
      ? learningPathBySlug[moduleDefinition.learningPathSlug] ?? null
      : null;

    if (moduleDefinition.learningPathSlug && !learningPath) {
      console.warn(
        `Trilha '${moduleDefinition.learningPathSlug}' não encontrada para o módulo '${moduleDefinition.slug}'. O módulo será cadastrado sem trilha associada.`
      );
    }

    const primaryStandard =
      curriculumStandardByCode[`${ageGroup.id}:${moduleDefinition.primaryBnccCode}`];
    if (!primaryStandard) {
      throw new Error(
        `Não foi possível localizar o código BNCC ${moduleDefinition.primaryBnccCode} para a faixa ${moduleDefinition.ageGroupSlug} ao cadastrar o módulo ${moduleDefinition.slug}.`
      );
    }

    const learningOutcomesJson = moduleDefinition.learningOutcomes
      ? toJsonString(moduleDefinition.learningOutcomes)
      : null;

    const moduleRecord = await prisma.contentModule.upsert({
      where: { slug: moduleDefinition.slug },
      update: {
        title: moduleDefinition.title,
        subtitle: moduleDefinition.subtitle,
        description: moduleDefinition.description,
        theme: moduleDefinition.theme ?? moduleDefinition.discipline ?? null,
        learningOutcomes: learningOutcomesJson,
        ageGroupId: ageGroup.id,
        learningPathId: learningPath?.id ?? null,
        curriculumStandardId: primaryStandard.id,
      },
      create: {
        slug: moduleDefinition.slug,
        title: moduleDefinition.title,
        subtitle: moduleDefinition.subtitle,
        description: moduleDefinition.description,
        theme: moduleDefinition.theme ?? moduleDefinition.discipline ?? null,
        learningOutcomes: learningOutcomesJson,
        ageGroupId: ageGroup.id,
        learningPathId: learningPath?.id ?? null,
        curriculumStandardId: primaryStandard.id,
      },
    });

    contentModuleBySlug[moduleRecord.slug] = moduleRecord;

    for (const activityDefinition of moduleDefinition.activities) {
      const activityStandard =
        curriculumStandardByCode[`${ageGroup.id}:${activityDefinition.bnccCode}`];
      if (!activityStandard) {
        throw new Error(
          `Não foi possível localizar o código BNCC ${activityDefinition.bnccCode} (módulo ${moduleDefinition.slug}, atividade ${activityDefinition.slug}).`
        );
      }

      const metadataPayload = toJsonString({
        ...(activityDefinition.metadata ?? {}),
        learningObjectives: activityDefinition.learningObjectives,
        bnccCode: activityDefinition.bnccCode,
      });

      const activityRecord = await prisma.activity.upsert({
        where: { slug: activityDefinition.slug },
        update: {
          title: activityDefinition.title,
          prompt: activityDefinition.prompt,
          activityType: activityDefinition.activityType,
          difficulty: activityDefinition.difficulty,
          description: activityDefinition.description,
          contentModuleId: moduleRecord.id,
          curriculumStandardId: activityStandard.id,
          metadata: metadataPayload,
        },
        create: {
          slug: activityDefinition.slug,
          title: activityDefinition.title,
          prompt: activityDefinition.prompt,
          activityType: activityDefinition.activityType,
          difficulty: activityDefinition.difficulty,
          description: activityDefinition.description,
          contentModuleId: moduleRecord.id,
          curriculumStandardId: activityStandard.id,
          metadata: metadataPayload,
        },
      });

      activityBySlug[activityRecord.slug] = activityRecord;
    }
  }

  for (const userData of usersData) {
    const ageGroup = ageGroupBySlug[userData.ageGroupSlug];

    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        displayName: userData.displayName,
        ageGroupId: ageGroup?.id,
      },
      create: {
        email: userData.email,
        name: userData.name,
        displayName: userData.displayName,
        ageGroupId: ageGroup?.id,
      },
    });

    for (const learningPathSlug of userData.learningPathSlugs) {
      const learningPath = learningPathBySlug[learningPathSlug];
      if (!learningPath) continue;

      await prisma.learningPathEnrollment.upsert({
        where: {
          userId_learningPathId: {
            userId: user.id,
            learningPathId: learningPath.id,
          },
        },
        update: {
          status: "ACTIVE",
        },
        create: {
          userId: user.id,
          learningPathId: learningPath.id,
          status: "ACTIVE",
        },
      });
    }

    for (const progressData of userData.progress) {
      const contentModule = contentModuleBySlug[progressData.contentModuleSlug];
      if (!contentModule) continue;

      await prisma.progress.upsert({
        where: {
          userId_contentModuleId: {
            userId: user.id,
            contentModuleId: contentModule.id,
          },
        },
        update: {
          completion: progressData.completion,
          status: progressData.status,
          totalAttempts: progressData.totalAttempts,
          lastActivityAt: new Date(),
        },
        create: {
          userId: user.id,
          contentModuleId: contentModule.id,
          completion: progressData.completion,
          status: progressData.status,
          totalAttempts: progressData.totalAttempts,
          lastActivityAt: new Date(),
        },
      });
    }

    for (const attemptData of userData.attempts) {
      const activity = activityBySlug[attemptData.activitySlug];
      if (!activity) continue;

      await prisma.attempt.create({
        data: {
          userId: user.id,
          activityId: activity.id,
          success: attemptData.success,
          score: attemptData.score,
          metadata: attemptData.metadata ? toJsonString(attemptData.metadata) : null,
          submittedAt: new Date(),
          completedAt: new Date(),
        },
      });
    }

    for (const rewardData of userData.rewards) {
      await prisma.reward.upsert({
        where: {
          userId_title: {
            userId: user.id,
            title: rewardData.title,
          },
        },
        update: {
          description: rewardData.description,
          criteria: rewardData.criteria,
          icon: rewardData.icon,
          unlockedAt: new Date(),
        },
        create: {
          userId: user.id,
          title: rewardData.title,
          description: rewardData.description,
          criteria: rewardData.criteria,
          icon: rewardData.icon,
          unlockedAt: new Date(),
        },
      });
    }
  }
}

main()
  .then(() => {
    console.info("🌱 Database seeded with BNCC-aligned demo content.");
  })
  .catch((error) => {
    console.error("❌ Failed to seed database:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
