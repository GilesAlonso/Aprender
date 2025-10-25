import { PrismaClient } from "@prisma/client";

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

const ageGroupsData = [
  {
    slug: "educacao-infantil",
    name: "Educação Infantil (4-5 anos)",
    minAge: 4,
    maxAge: 5,
    description:
      "Primeiros contatos estruturados com linguagem oral, musicalidade e exploração corporal alinhados aos campos de experiência da BNCC.",
  },
  {
    slug: "fundamental-anos-iniciais",
    name: "Ensino Fundamental - Anos Iniciais (6-8 anos)",
    minAge: 6,
    maxAge: 8,
    description:
      "Primeiro ciclo alfabetizador com foco em leitura, produção de textos curtos e resolução de problemas cotidianos.",
  },
  {
    slug: "fundamental-anos-finais",
    name: "Ensino Fundamental - Anos Finais (9-11 anos)",
    minAge: 9,
    maxAge: 11,
    description:
      "Ampliação de repertório em linguagens, Ciências Humanas e Matemática com projetos integradores.",
  },
] as const;

const learningPathsData = [
  {
    slug: "aventuras-letrinhas",
    title: "Aventuras com Letrinhas",
    description:
      "Sequência lúdica para apoiar crianças na consciência fonológica e na expressão corporal.",
    ageGroupSlug: "educacao-infantil",
  },
  {
    slug: "descobertas-palavras",
    title: "Descobertas das Palavras",
    description:
      "Trilha para alfabetização inicial com foco em leitura e compreensão de pequenos textos.",
    ageGroupSlug: "fundamental-anos-iniciais",
  },
  {
    slug: "investigadores-natureza",
    title: "Investigadores da Natureza",
    description: "Percurso investigativo interdisciplinar sobre ciências e sustentabilidade.",
    ageGroupSlug: "fundamental-anos-finais",
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
        codigo: "EI03EF06",
        habilidade: "Explorar sons, ritmos e melodias com o corpo e materiais sonoros.",
      },
    ] satisfies CurriculumHabilidade[],
    description: "Campos de experiência Corpo, gestos e movimentos / Traços, sons, cores e formas.",
    ageGroupSlug: "educacao-infantil",
  },
  {
    bnccCode: "EF01LP06",
    competency:
      "Reconhecer a função social da leitura e construir estratégias de compreensão de textos curtos.",
    habilidades: [
      {
        codigo: "EF01LP06",
        habilidade:
          "Ler e compreender textos curtos, identificando assunto, personagens e ações principais.",
      },
      {
        codigo: "EF01LP07",
        habilidade:
          "Planejar e produzir bilhetes, convites e listas com apoio de repertórios conhecidos.",
      },
    ] satisfies CurriculumHabilidade[],
    description: "Língua Portuguesa - Práticas de Linguagem: Leitura e Produção de textos.",
    ageGroupSlug: "fundamental-anos-iniciais",
  },
  {
    bnccCode: "EF04CI02",
    competency:
      "Investigar fenômenos naturais e sociais, formulando hipóteses e registrando descobertas.",
    habilidades: [
      {
        codigo: "EF04CI02",
        habilidade:
          "Planejar e realizar experimentos simples, registrando procedimentos, resultados e conclusões.",
      },
      {
        codigo: "EF04CI06",
        habilidade: "Resolver problemas envolvendo uso consciente de recursos naturais.",
      },
    ] satisfies CurriculumHabilidade[],
    description: "Ciências - Vida e Evolução / Matéria e Energia.",
    ageGroupSlug: "fundamental-anos-finais",
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
    description: "Módulo para construir repertório de leitura com textos do cotidiano.",
    theme: "Língua Portuguesa",
    ageGroupSlug: "fundamental-anos-iniciais",
    learningPathSlug: "descobertas-palavras",
    curriculumStandardCode: "EF01LP06",
  },
  {
    slug: "laboratorio-da-natureza",
    title: "Laboratório da Natureza",
    subtitle: "Investigação científica",
    description: "Experimentos guiados sobre ciclos da água e sustentabilidade.",
    theme: "Ciências",
    ageGroupSlug: "fundamental-anos-finais",
    learningPathSlug: "investigadores-natureza",
    curriculumStandardCode: "EF04CI02",
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
    title: "Ciclo da Água em Casa",
    prompt: "Monte um mini-ciclo da água com potes, papel filme e observe o que acontece.",
    activityType: "PUZZLE",
    difficulty: "INTERMEDIATE",
    description: "Experimento guiado para observar evaporação e condensação.",
    contentModuleSlug: "laboratorio-da-natureza",
    curriculumStandardCode: "EF04CI02",
    metadata: {
      seguranca: "Adulto acompanhante",
      registro: "Tabela de observação",
    } satisfies ActivityMetadata,
  },
  {
    slug: "quiz-sustentabilidade",
    title: "Quiz da Sustentabilidade",
    prompt: "Responda desafios sobre uso consciente da água e da energia.",
    activityType: "QUIZ",
    difficulty: "ADVANCED",
    description: "Perguntas de múltipla escolha com feedback imediato.",
    contentModuleSlug: "laboratorio-da-natureza",
    curriculumStandardCode: "EF04CI02",
    metadata: {
      numeroQuestoes: 6,
      tipo: "Multipla escolha",
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
