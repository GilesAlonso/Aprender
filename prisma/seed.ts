import { PrismaClient } from "@prisma/client";

import { BNCC_STAGE_CONFIG } from "../src/lib/personalization/age-stages";

const prisma = new PrismaClient();

type CurriculumHabilidade = {
  codigo: string;
  habilidade: string;
};

type ActivityMetadata = Record<string, unknown>;

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
    slug: "inventores-projetos",
    title: "Inventores da Natureza",
    description:
      "Percurso investigativo interdisciplinar com debates, prototipagem e protagonismo juvenil.",
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

const curriculumStandardsData = [
  {
    bnccCode: "EI03ET04",
    competency:
      "Expressar-se por meio de gestos, sons, ritmos e movimentos nas interações do cotidiano.",
    habilidades: [
      {
        codigo: "EI03EF01",
        habilidade:
          "Participar de brincadeiras de dramatização, imitando, inventando personagens e enredos.",
      },
      {
        codigo: "EI03CG05",
        habilidade: "Explorar objetos, cenários e narrativas com curiosidade e imaginação.",
      },
    ] satisfies CurriculumHabilidade[],
    description: "Campos de experiência Corpo, gestos e movimentos / Traços, sons, cores e formas.",
    ageGroupSlug: "educacao-infantil",
  },
  {
    bnccCode: "EF01LP06",
    competency:
      "Ler e compreender textos curtos identificando assunto e informações principais.",
    habilidades: [
      {
        codigo: "EF01LP06",
        habilidade:
          "Ler e compreender textos curtos, identificando personagens, locais e ações principais.",
      },
      {
        codigo: "EF02MA05",
        habilidade: "Resolver problemas de adição e subtração envolvendo situações cotidianas.",
      },
    ] satisfies CurriculumHabilidade[],
    description: "Integração entre Língua Portuguesa e Matemática nos anos iniciais.",
    ageGroupSlug: "fundamental-anos-iniciais",
  },
  {
    bnccCode: "EF07CI02",
    competency:
      "Investigar fenômenos naturais e sociais, formulando hipóteses e registrando evidências.",
    habilidades: [
      {
        codigo: "EF07CI02",
        habilidade:
          "Planejar e realizar experimentos, analisando resultados para explicar fenômenos.",
      },
      {
        codigo: "EF69LP32",
        habilidade:
          "Produzir textos multimodais para comunicar conclusões de pesquisas colaborativas.",
      },
    ] satisfies CurriculumHabilidade[],
    description:
      "Ciências da Natureza e Linguagens articuladas com projetos investigativos nos anos finais.",
    ageGroupSlug: "fundamental-anos-finais",
  },
  {
    bnccCode: "EM13MAT305",
    competency:
      "Utilizar conceitos de estatística e probabilidade para fundamentar decisões e projetos.",
    habilidades: [
      {
        codigo: "EM13MAT305",
        habilidade: "Construir e analisar modelos estatísticos aplicados a problemas reais.",
      },
      {
        codigo: "EM13CHS602",
        habilidade: "Investigar impactos socioambientais propondo soluções coletivas e viáveis.",
      },
    ] satisfies CurriculumHabilidade[],
    description:
      "Itinerário formativo integrando Matemática, Ciências Humanas e Projeto de Vida no Ensino Médio.",
    ageGroupSlug: "ensino-medio",
  },
] as const;

const contentModulesData = [
  {
    slug: "historias-em-movimento",
    title: "Histórias em Movimento",
    subtitle: "Corpo e expressão",
    description: "Sequência de atividades corporais e musicais para contar histórias coletivas.",
    theme: "Linguagens",
    ageGroupSlug: "educacao-infantil",
    learningPathSlug: "aventuras-letrinhas",
    curriculumStandardCode: "EI03ET04",
  },
  {
    slug: "clubinho-das-palavras",
    title: "Clubinho das Palavras",
    subtitle: "Leituras compartilhadas",
    description: "Módulo para construir repertório de leitura e produção de bilhetes e convites.",
    theme: "Língua Portuguesa",
    ageGroupSlug: "fundamental-anos-iniciais",
    learningPathSlug: "descobertas-palavras",
    curriculumStandardCode: "EF01LP06",
  },
  {
    slug: "laboratorio-da-natureza",
    title: "Laboratório da Natureza",
    subtitle: "Investigação científica",
    description:
      "Experimentos guiados sobre recursos naturais, registro de evidências e comunicação multimodal.",
    theme: "Ciências",
    ageGroupSlug: "fundamental-anos-finais",
    learningPathSlug: "inventores-projetos",
    curriculumStandardCode: "EF07CI02",
  },
  {
    slug: "estudio-dados-solidarios",
    title: "Estúdio de Dados Solidários",
    subtitle: "Projeto de vida e impacto",
    description:
      "Projeto interdisciplinar para investigar dados da comunidade, gerar protótipos e comunicar soluções.",
    theme: "Projeto de Vida",
    ageGroupSlug: "ensino-medio",
    learningPathSlug: "trajetos-projeto-vida",
    curriculumStandardCode: "EM13MAT305",
  },
] as const;

const activitiesData = [
  {
    slug: "teatro-das-emocoes",
    title: "Teatro das Emoções",
    prompt: "Imite com o corpo um personagem da história e convide colegas para adivinhar!",
    activityType: "GAME",
    difficulty: "BEGINNER",
    description: "Brincadeira coletiva de dramatização para reconhecer emoções e movimentos.",
    contentModuleSlug: "historias-em-movimento",
    curriculumStandardCode: "EI03ET04",
    metadata: {
      duracaoMinutos: 10,
      materiais: ["Fitas coloridas", "Instrumentos sonoros"],
    } satisfies ActivityMetadata,
  },
  {
    slug: "danca-dos-sons",
    title: "Dança dos Sons",
    prompt: "Crie passos para uma música usando objetos da sala como instrumentos.",
    activityType: "PUZZLE",
    difficulty: "BEGINNER",
    description: "Atividade musical com exploração de ritmos e sequências.",
    contentModuleSlug: "historias-em-movimento",
    curriculumStandardCode: "EI03ET04",
    metadata: {
      duracaoMinutos: 8,
      foco: "Ritmo e coordenação",
    } satisfies ActivityMetadata,
  },
  {
    slug: "detectives-das-palavras",
    title: "Detetives das Palavras",
    prompt: "Encontre em pequenos textos palavras com o som da letra inicial do seu nome.",
    activityType: "QUIZ",
    difficulty: "BEGINNER",
    description: "Leitura compartilhada para identificar palavras e sons iniciais.",
    contentModuleSlug: "clubinho-das-palavras",
    curriculumStandardCode: "EF01LP06",
    metadata: {
      generoTextual: "Bilhete",
      estrategia: "Leitura guiada",
    } satisfies ActivityMetadata,
  },
  {
    slug: "laboratorio-das-palavras",
    title: "Laboratório das Palavras",
    prompt: "Monte um convite para a turma usando as palavras investigadas na atividade anterior.",
    activityType: "GAME",
    difficulty: "INTERMEDIATE",
    description: "Produção de texto coletivo com apoio de repertórios e modelos.",
    contentModuleSlug: "clubinho-das-palavras",
    curriculumStandardCode: "EF01LP06",
    metadata: {
      suporte: "Cartolina",
      colaborativo: true,
    } satisfies ActivityMetadata,
  },
  {
    slug: "experimento-da-agua",
    title: "Laboratório dos Recursos Naturais",
    prompt: "Analise diferentes amostras de água e registre evidências sobre consumo consciente.",
    activityType: "PUZZLE",
    difficulty: "INTERMEDIATE",
    description:
      "Experimento investigativo para observar transformações e discutir impacto ambiental.",
    contentModuleSlug: "laboratorio-da-natureza",
    curriculumStandardCode: "EF07CI02",
    metadata: {
      seguranca: "Orientação docente",
      registro: "Relato multimodal",
    } satisfies ActivityMetadata,
  },
  {
    slug: "quiz-sustentabilidade",
    title: "Quiz da Sustentabilidade",
    prompt: "Responda desafios sobre uso consciente da água, energia e consumo.",
    activityType: "QUIZ",
    difficulty: "ADVANCED",
    description: "Perguntas de múltipla escolha com feedback imediato e links para pesquisa.",
    contentModuleSlug: "laboratorio-da-natureza",
    curriculumStandardCode: "EF07CI02",
    metadata: {
      numeroQuestoes: 6,
      tipo: "Multipla escolha",
    } satisfies ActivityMetadata,
  },
  {
    slug: "investigacao-dados-bairro",
    title: "Diagnóstico do Bairro",
    prompt: "Investigue dados públicos da sua cidade e proponha indicadores para acompanhar mudanças.",
    activityType: "GAME",
    difficulty: "ADVANCED",
    description:
      "Desafio investigativo para analisar dados, formular hipóteses e comunicar resultados com infográficos.",
    contentModuleSlug: "estudio-dados-solidarios",
    curriculumStandardCode: "EM13MAT305",
    metadata: {
      ferramentas: ["Planilha colaborativa", "Mapa digital"],
      entregavel: "Relatório visual",
    } satisfies ActivityMetadata,
  },
  {
    slug: "podcast-projeto-vida",
    title: "Podcast Projeto de Vida",
    prompt: "Crie um roteiro de podcast entrevistando pessoas sobre sonhos e desafios da comunidade.",
    activityType: "QUIZ",
    difficulty: "INTERMEDIATE",
    description:
      "Atividade multimídia para exercitar comunicação, empatia e planejamento de ações coletivas.",
    contentModuleSlug: "estudio-dados-solidarios",
    curriculumStandardCode: "EM13MAT305",
    metadata: {
      formato: "Podcast colaborativo",
      duracaoMinutos: 15,
    } satisfies ActivityMetadata,
  },
] as const;

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
    curriculumStandardsData.map((standard) =>
      prisma.curriculumStandard.upsert({
        where: {
          bnccCode_ageGroupId: {
            bnccCode: standard.bnccCode,
            ageGroupId: ageGroupBySlug[standard.ageGroupSlug]?.id as string,
          },
        },
        update: {
          competency: standard.competency,
          habilidades: toJsonString(standard.habilidades),
          description: standard.description,
        },
        create: {
          bnccCode: standard.bnccCode,
          competency: standard.competency,
          habilidades: toJsonString(standard.habilidades),
          description: standard.description,
          ageGroupId: ageGroupBySlug[standard.ageGroupSlug]?.id as string,
        },
      })
    )
  );

  const curriculumStandardByCode = Object.fromEntries(
    curriculumStandards.map((standard) => [`${standard.ageGroupId}:${standard.bnccCode}`, standard])
  );

  const contentModules = await Promise.all(
    contentModulesData.map((contentModuleData) => {
      const ageGroup = ageGroupBySlug[contentModuleData.ageGroupSlug];
      const learningPath = learningPathBySlug[contentModuleData.learningPathSlug];
      const standard =
        curriculumStandardByCode[`${ageGroup.id}:${contentModuleData.curriculumStandardCode}`];

      return prisma.contentModule.upsert({
        where: { slug: contentModuleData.slug },
        update: {
          title: contentModuleData.title,
          subtitle: contentModuleData.subtitle,
          description: contentModuleData.description,
          theme: contentModuleData.theme,
          ageGroupId: ageGroup.id,
          learningPathId: learningPath?.id,
          curriculumStandardId: standard?.id,
        },
        create: {
          slug: contentModuleData.slug,
          title: contentModuleData.title,
          subtitle: contentModuleData.subtitle,
          description: contentModuleData.description,
          theme: contentModuleData.theme,
          ageGroupId: ageGroup.id,
          learningPathId: learningPath?.id,
          curriculumStandardId: standard?.id,
        },
      });
    })
  );

  const contentModuleBySlug = Object.fromEntries(
    contentModules.map((contentModule) => [contentModule.slug, contentModule])
  );

  const activities = await Promise.all(
    activitiesData.map((activity) => {
      const contentModule = contentModuleBySlug[activity.contentModuleSlug];
      const standard =
        curriculumStandardByCode[`${contentModule.ageGroupId}:${activity.curriculumStandardCode}`];

      return prisma.activity.upsert({
        where: { slug: activity.slug },
        update: {
          title: activity.title,
          prompt: activity.prompt,
          activityType: activity.activityType,
          difficulty: activity.difficulty,
          description: activity.description,
          contentModuleId: contentModule.id,
          curriculumStandardId: standard?.id as string,
          metadata: activity.metadata ? toJsonString(activity.metadata) : null,
        },
        create: {
          slug: activity.slug,
          title: activity.title,
          prompt: activity.prompt,
          activityType: activity.activityType,
          difficulty: activity.difficulty,
          description: activity.description,
          contentModuleId: contentModule.id,
          curriculumStandardId: standard?.id as string,
          metadata: activity.metadata ? toJsonString(activity.metadata) : null,
        },
      });
    })
  );

  const activityBySlug = Object.fromEntries(
    activities.map((activity) => [activity.slug, activity])
  );

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
