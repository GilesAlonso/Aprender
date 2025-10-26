#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dump } from "js-yaml";

const assetTitles = {
  "cn-animal-boto": "Boto cor-de-rosa investigativo",
  "cn-animal-tucano": "Tucano atento na mata",
  "cn-higiene-escovar-dentes": "Escovação saudável dos dentes",
  "cn-higiene-lavar-maos": "Lavagem cuidadosa das mãos",
  "cn-material-lupa": "Lupa azul para observação",
  "cn-natureza-floresta": "Floresta ensolarada",
  "cn-natureza-rio": "Rio sinuoso e calmo",
} as const;

type DifficultyTier = "INICIAR" | "PRATICAR" | "DOMINAR";
type ActivityType = "QUIZ" | "PUZZLE" | "GAME";

type PrerequisiteDefinition = {
  reference: string;
  description: string;
  type?: "SKILL" | "ACTIVITY" | "MODULE" | "CONTEXT";
};

type QuizOptionDefinition = {
  text: string;
  isCorrect: boolean;
  feedback: string;
};

type QuizQuestionDefinition = {
  prompt: string;
  hint: string;
  options: QuizOptionDefinition[];
};

type QuizTrueFalseDefinition = {
  prompt: string;
  hint: string;
  statement: string;
  answer: boolean;
  trueFeedback: string;
  falseFeedback: string;
};

type QuizDefinition = {
  question: QuizQuestionDefinition;
  trueFalse: QuizTrueFalseDefinition;
  bnccDescription?: string;
};

type PuzzlePairDefinition = {
  prompt: string;
  match: string;
  hint: string;
  feedback: string;
};

type PuzzleDefinition = {
  pairs: PuzzlePairDefinition[];
  successFeedback: string;
  errorFeedback: string;
  bnccDescription?: string;
};

type GameLevelDefinition = {
  challenge: string;
  answer: string | number;
  hint: string;
  success: string;
  failure: string;
};

type GameDefinition = {
  levels: GameLevelDefinition[];
  victoryMessage: string;
  gameOverMessage: string;
  timeLimitSeconds?: number;
  lives?: number;
  bnccDescription?: string;
};

type BaseActivityDefinition = {
  slug: string;
  title: string;
  prompt: string;
  summary?: string;
  type: ActivityType;
  difficulty: DifficultyTier;
  bnccCode: "EF01CI01" | "EF01CI02" | "EF01CI03" | "EF01CI04";
  habilidades: string[];
  secondaryHabilidades?: string[];
  focus: string;
  category: string;
  duration: number;
  assetSlug: keyof typeof assetTitles;
  assetUsage: string;
  familyTip: string;
  learningObjectives: string[];
  description: string;
  cooperative?: boolean;
  crossCurricular?: string[];
  metadataExtra?: Record<string, unknown>;
  prerequisites?: PrerequisiteDefinition[];
};

type ActivityDefinition =
  | (BaseActivityDefinition & { quiz: QuizDefinition })
  | (BaseActivityDefinition & { puzzle: PuzzleDefinition })
  | (BaseActivityDefinition & { game: GameDefinition });

type ModuleDefinition = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  theme: string;
  discipline: string;
  ageGroupSlug: "fundamental-anos-iniciais";
  learningPathSlug?: string;
  primaryBnccCode: "EF01CI01" | "EF01CI02" | "EF01CI03" | "EF01CI04";
  secondaryBnccCodes?: string[];
  learningOutcomes: string[];
  tags: string[];
  estimatedDurationMinutes: number;
  summary: string;
  notes?: string[];
  activities: ActivityDefinition[];
};

type GeneratedActivity = Record<string, unknown>;

type GeneratedModuleFile = {
  module: Record<string, unknown>;
  activities: GeneratedActivity[];
};

const bnccDescriptions: Record<BaseActivityDefinition["bnccCode"], string> = {
  EF01CI01:
    "Identificar e explorar os órgãos dos sentidos, reconhecendo suas funções no corpo humano.",
  EF01CI02: "Reconhecer práticas de higiene e autocuidado, relacionando-as à manutenção da saúde.",
  EF01CI03:
    "Observar características de animais e plantas, relacionando-as aos ambientes em que vivem.",
  EF01CI04:
    "Comparar diferentes ambientes, modos de convivência e cuidados com a natureza na comunidade escolar.",
};

const prerequisiteBlurbs: Record<BaseActivityDefinition["bnccCode"], string> = {
  EF01CI01: "Conversar sobre como usamos os sentidos para perceber o mundo ao redor.",
  EF01CI02: "Retomar combinações de hábitos de higiene que cuidam do corpo.",
  EF01CI03: "Compartilhar observações já feitas sobre animais e plantas próximos da escola.",
  EF01CI04: "Relembrar passeios pela escola destacando cuidados com os ambientes compartilhados.",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(__dirname, "..", "data", "content", "raw", "ef01", "ciencias");

mkdirSync(OUTPUT_DIR, { recursive: true });

const createMetadata = (activity: BaseActivityDefinition, interactiveSlug: string) => {
  const metadata: Record<string, unknown> = {
    categoria: activity.category,
    duracaoMinutos: activity.duration,
    tempoEstimadoMinutos: activity.duration,
    habilidades: activity.habilidades,
    assetSlug: activity.assetSlug,
    assetUsage: activity.assetUsage,
    familiaEngajamento: activity.familyTip,
    focoInvestigativo: activity.focus,
    modoCooperativo: Boolean(activity.cooperative),
    tagsInterdisciplinares: activity.crossCurricular,
    interactiveSlug,
  };

  if (activity.secondaryHabilidades && activity.secondaryHabilidades.length > 0) {
    metadata.habilidadesSecundarias = activity.secondaryHabilidades;
  }

  if (activity.metadataExtra) {
    Object.assign(metadata, activity.metadataExtra);
  }

  return metadata;
};

const createAccessibilityBlock = (activity: BaseActivityDefinition) => {
  const familyHint = activity.familyTip;

  return {
    hints: [
      {
        audience: "ESTUDANTE",
        text: `Passo 1: Observe o desafio com calma e use a leitura em voz alta para investigar ${activity.focus}.`,
      },
      {
        audience: "ESTUDANTE",
        text: `Passo 2: Faça pequenas pausas para perceber os detalhes e compartilhe o que notou sobre ${activity.focus}.`,
      },
      {
        audience: "EDUCADOR",
        text: `Ofereça materiais táteis, áudio descrição e tempo extra para apoiar a exploração de ${activity.focus}.`,
      },
      {
        audience: "FAMILIA",
        text: familyHint,
      },
    ],
    feedback: {
      success: `Excelente investigação! Você analisou ${activity.focus} com olhar científico.`,
      encouragement:
        "Tudo bem errar no caminho. Use recursos visuais, gestos e sons para revisar as pistas antes de tentar novamente.",
      retry: `Faça uma pausa, respire fundo e retome observando novos detalhes sobre ${activity.focus}.`,
      accessibility:
        "Garanta apoios multimodais: contraste de cores, narração em voz alta, audiodescrição e tempo estendido para quem precisar.",
    },
    assets: [
      {
        slug: activity.assetSlug,
        type: "IMAGEM",
        title: assetTitles[activity.assetSlug],
        description: activity.assetUsage,
      },
    ],
    alternatives: [
      {
        title: "MATERIAIS CONCRETOS",
        description: `Monte estações com objetos reais para reforçar ${activity.focus}.`,
        steps: [
          "Disponibilize cartões com pictogramas e legendas em caixa alta.",
          "Use texturas, aromas ou sons reais como apoio sensorial.",
        ],
      },
    ],
    audioCue: {
      title: "SINAL DE PAUSA",
      description:
        "Utilize um sino suave ou chocalho para avisar a troca de etapa ou necessidade de pausa.",
      steps: [
        "Combine com a turma o significado do sinal antes de iniciar.",
        "Ofereça tempo suficiente após o sinal para reorganização corporal.",
      ],
    },
    motorSupport: [
      {
        title: "APOIO MOTOR",
        description:
          "Disponibilize apoios para toque, ponteiras, suportes de tablet e mesas acessíveis durante a interação.",
        steps: [
          "Permita que duplas se alternem no controle do dispositivo.",
          "Ofereça apoio postural e ajustes de altura quando necessário.",
        ],
      },
    ],
  };
};

const createInteractiveAccessibility = (activity: BaseActivityDefinition) => ({
  hints: [
    {
      audience: "ESTUDANTE",
      text: `Use TAB, setas ou toques para navegar pelas ações digitais ligadas a ${activity.focus}.`,
    },
    {
      audience: "EDUCADOR",
      text: "Ative a leitura em voz alta e mantenha instruções visuais em contraste elevado.",
    },
  ],
  feedback: {
    success: `Ótimo trabalho! As escolhas mostram entendimento sobre ${activity.focus}.`,
    encouragement:
      "Caso se confunda, revise com a equipe, utilize o botão de repetir instruções e retome com calma.",
    accessibility:
      "Disponibilize controle adaptado, tempo flexível e apoio auditivo individual sempre que necessário.",
  },
  assets: [
    {
      slug: activity.assetSlug,
      type: "IMAGEM",
      title: assetTitles[activity.assetSlug],
    },
  ],
});

const buildQuizActivity = (activity: BaseActivityDefinition & { quiz: QuizDefinition }) => {
  const interactiveSlug = `quiz-${activity.slug}`;

  return {
    partial: "../../_partials/acolhimento-base.yaml",
    slug: activity.slug,
    title: activity.title,
    prompt: activity.prompt,
    summary: activity.summary,
    type: "QUIZ",
    difficulty: activity.difficulty,
    bncc: {
      code: activity.bnccCode,
      habilidades: activity.habilidades,
    },
    learningObjectives: activity.learningObjectives,
    description: activity.description,
    metadata: createMetadata(activity, interactiveSlug),
    accessibility: createAccessibilityBlock(activity),
    prerequisites: (
      activity.prerequisites ?? [
        {
          type: "SKILL",
          reference: activity.bnccCode,
          description: prerequisiteBlurbs[activity.bnccCode],
        },
      ]
    ).map((item) => ({
      type: item.type ?? "SKILL",
      reference: item.reference,
      description: item.description,
    })),
    interactive: {
      slug: interactiveSlug,
      title: `${activity.title} — Quiz`,
      type: "QUIZ",
      bnccDescription: activity.quiz.bnccDescription ?? bnccDescriptions[activity.bnccCode],
      estimatedTimeMinutes: Math.min(12, Math.max(5, activity.duration)),
      instructions: [
        "Leia ou escute cada pergunta com atenção.",
        "Use as setas ou toque nas alternativas antes de confirmar.",
        "Compartilhe como chegou à resposta com a turma.",
      ],
      objectives: activity.learningObjectives,
      scoring: {
        correct: 10,
        incorrect: 0,
      },
      adaptive: {
        increaseAfter: 2,
        decreaseAfter: 1,
      },
      questions: [
        {
          id: `${activity.slug}-q1`,
          type: "multiple-choice",
          prompt: activity.quiz.question.prompt,
          hint: activity.quiz.question.hint,
          options: activity.quiz.question.options.map((option, index) => ({
            id: `${activity.slug}-q1-${index + 1}`,
            text: option.text,
            isCorrect: option.isCorrect,
            feedback: option.feedback,
          })),
        },
        {
          id: `${activity.slug}-q2`,
          type: "true-false",
          prompt: activity.quiz.trueFalse.prompt,
          hint: activity.quiz.trueFalse.hint,
          statement: activity.quiz.trueFalse.statement,
          answer: activity.quiz.trueFalse.answer,
          feedback: {
            true: activity.quiz.trueFalse.trueFeedback,
            false: activity.quiz.trueFalse.falseFeedback,
          },
        },
      ],
      accessibility: createInteractiveAccessibility(activity),
    },
  } satisfies GeneratedActivity;
};

const buildPuzzleActivity = (activity: BaseActivityDefinition & { puzzle: PuzzleDefinition }) => {
  const interactiveSlug = `puzzle-${activity.slug}`;

  return {
    partial: "../../_partials/acolhimento-base.yaml",
    slug: activity.slug,
    title: activity.title,
    prompt: activity.prompt,
    summary: activity.summary,
    type: "PUZZLE",
    difficulty: activity.difficulty,
    bncc: {
      code: activity.bnccCode,
      habilidades: activity.habilidades,
    },
    learningObjectives: activity.learningObjectives,
    description: activity.description,
    metadata: createMetadata(activity, interactiveSlug),
    accessibility: createAccessibilityBlock(activity),
    prerequisites: (
      activity.prerequisites ?? [
        {
          type: "SKILL",
          reference: activity.bnccCode,
          description: prerequisiteBlurbs[activity.bnccCode],
        },
      ]
    ).map((item) => ({
      type: item.type ?? "SKILL",
      reference: item.reference,
      description: item.description,
    })),
    interactive: {
      slug: interactiveSlug,
      title: `${activity.title} — Quebra-cabeça`,
      type: "PUZZLE",
      bnccDescription: activity.puzzle.bnccDescription ?? bnccDescriptions[activity.bnccCode],
      estimatedTimeMinutes: Math.min(12, Math.max(6, activity.duration)),
      instructions: [
        "Observe cada cartão do quebra-cabeça.",
        "Arraste ou selecione a combinação que faça sentido.",
        "Explique para o grupo qual pista levou à associação.",
      ],
      objectives: activity.learningObjectives,
      puzzle: {
        mode: "matching",
        successFeedback: activity.puzzle.successFeedback,
        errorFeedback: activity.puzzle.errorFeedback,
        pairs: activity.puzzle.pairs.map((pair, index) => ({
          id: `${activity.slug}-pair-${index + 1}`,
          prompt: pair.prompt,
          match: pair.match,
          hint: pair.hint,
          feedback: pair.feedback,
        })),
      },
      accessibility: createInteractiveAccessibility(activity),
    },
  } satisfies GeneratedActivity;
};

const buildGameActivity = (activity: BaseActivityDefinition & { game: GameDefinition }) => {
  const interactiveSlug = `game-${activity.slug}`;

  return {
    partial: "../../_partials/acolhimento-base.yaml",
    slug: activity.slug,
    title: activity.title,
    prompt: activity.prompt,
    summary: activity.summary,
    type: "GAME",
    difficulty: activity.difficulty,
    bncc: {
      code: activity.bnccCode,
      habilidades: activity.habilidades,
    },
    learningObjectives: activity.learningObjectives,
    description: activity.description,
    metadata: createMetadata(activity, interactiveSlug),
    accessibility: createAccessibilityBlock(activity),
    prerequisites: (
      activity.prerequisites ?? [
        {
          type: "SKILL",
          reference: activity.bnccCode,
          description: prerequisiteBlurbs[activity.bnccCode],
        },
      ]
    ).map((item) => ({
      type: item.type ?? "SKILL",
      reference: item.reference,
      description: item.description,
    })),
    interactive: {
      slug: interactiveSlug,
      title: `${activity.title} — Mini-jogo`,
      type: "GAME",
      bnccDescription: activity.game.bnccDescription ?? bnccDescriptions[activity.bnccCode],
      estimatedTimeMinutes: Math.min(15, Math.max(8, activity.duration)),
      instructions: [
        "Leia ou escute a missão de cada fase.",
        "Use as setas, toques ou cliques para registrar a resposta.",
        "Converse com o grupo sobre outras estratégias possíveis.",
      ],
      objectives: activity.learningObjectives,
      game: {
        mode: "math-challenge",
        timeLimitSeconds: activity.game.timeLimitSeconds ?? 90,
        lives: activity.game.lives ?? 3,
        victoryMessage: activity.game.victoryMessage,
        gameOverMessage: activity.game.gameOverMessage,
        levels: activity.game.levels.map((level, index) => ({
          id: `${activity.slug}-level-${index + 1}`,
          challenge: level.challenge,
          answer: level.answer,
          hint: level.hint,
          successFeedback: level.success,
          failureFeedback: level.failure,
        })),
      },
      accessibility: createInteractiveAccessibility(activity),
    },
  } satisfies GeneratedActivity;
};

const buildActivity = (activity: ActivityDefinition): GeneratedActivity => {
  if ((activity as { quiz?: QuizDefinition }).quiz) {
    return buildQuizActivity(activity as BaseActivityDefinition & { quiz: QuizDefinition });
  }

  if ((activity as { puzzle?: PuzzleDefinition }).puzzle) {
    return buildPuzzleActivity(activity as BaseActivityDefinition & { puzzle: PuzzleDefinition });
  }

  return buildGameActivity(activity as BaseActivityDefinition & { game: GameDefinition });
};

const generateModuleFile = (moduleDefinition: ModuleDefinition): GeneratedModuleFile => {
  const { activities, ...moduleMetadata } = moduleDefinition;
  const moduleBlock: Record<string, unknown> = {
    stage: "ef01",
    subjectSlug: "ciencias",
    subject: "Ciências",
    ...moduleMetadata,
  };

  return {
    module: moduleBlock,
    activities: activities.map(buildActivity),
  };
};

const writeModuleFile = (moduleDefinition: ModuleDefinition) => {
  const output = generateModuleFile(moduleDefinition);
  const filePath = path.join(OUTPUT_DIR, `${moduleDefinition.slug}.yaml`);
  const yamlContent = dump(output, { lineWidth: 100, noRefs: true });
  writeFileSync(filePath, yamlContent);
  console.log(`✅ Gerado: ${moduleDefinition.slug}.yaml`);
};

const sentidosCuriososActivities: ActivityDefinition[] = [
  {
    slug: "ouvido-atento",
    title: "Ouvido Atento",
    prompt: "Identifique o som reproduzido e escolha quem pode tê-lo produzido na escola.",
    summary: "Quiz auditivo com imagens de apoio e pausas combinadas.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "percepção auditiva no cotidiano",
    category: "Audição em cena",
    duration: 8,
    assetSlug: "cn-natureza-rio",
    assetUsage: "Projete a paisagem do rio para comentar sons suaves e ritmo constante da água.",
    familyTip:
      "Convide as famílias a criar um diário de sons de casa, registrando com desenhos ou gravações curtas.",
    learningObjectives: [
      "Relacionar sons cotidianos a suas possíveis fontes no ambiente escolar.",
      "Descrever sensações auditivas usando vocabulário científico infantil.",
    ],
    description:
      "Ouvido Atento aproxima escuta cuidadosa e inferências visuais para identificar fontes sonoras.",
    cooperative: false,
    crossCurricular: ["Arte", "Música"],
    metadataExtra: {
      indicacaoSensorial: "Use fones compartilhados com controle de volume.",
    },
    quiz: {
      question: {
        prompt: "Qual objeto pode produzir um som de água correndo parecido com o que ouvimos?",
        hint: "Pense em lugares da escola onde ouvimos água em movimento.",
        options: [
          {
            text: "Uma torneira aberta da pia",
            isCorrect: true,
            feedback: "Muito bem! A torneira aberta produz o som suave de água em movimento.",
          },
          {
            text: "Uma bola quicando na quadra",
            isCorrect: false,
            feedback:
              "Observe novamente: a bola produz batidas secas, diferentes da água corrente.",
          },
          {
            text: "Uma porta rangendo",
            isCorrect: false,
            feedback: "O ranger da porta tem som áspero, bem diferente do som contínuo da água.",
          },
        ],
      },
      trueFalse: {
        prompt: "O som da campainha é igual ao som de passos leves no corredor?",
        hint: "Compare a duração e a intensidade desses sons.",
        statement: "Campainha e passos leves produzem sons iguais.",
        answer: false,
        trueFeedback: "Reflita: a campainha é alta e prolongada, diferente dos passos leves.",
        falseFeedback:
          "Excelente percepção! Cada som tem características próprias que nos ajudam a identificá-los.",
      },
    },
  },
  {
    slug: "cheiro-surpresa",
    title: "Cheiro Surpresa",
    prompt: "Observe as pistas e descubra qual aroma está sendo descrito.",
    summary: "Desafio olfativo com descrições poéticas.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "identificação de aromas familiares",
    category: "Olfato em ação",
    duration: 9,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "Mostre a ilustração da floresta para inspirar memórias de aromas naturais.",
    familyTip:
      "Peça às famílias que montem sachês de ervas ou especiarias e conversem sobre os aromas preferidos.",
    learningObjectives: [
      "Reconhecer aromas comuns relacionando-os a objetos conhecidos.",
      "Compartilhar memórias afetivas ligadas aos cheiros percebidos.",
    ],
    description:
      "Cheiro Surpresa usa descrições sensoriais para associar aromas a experiências cotidianas.",
    cooperative: false,
    crossCurricular: ["Artes Visuais", "Língua Portuguesa"],
    metadataExtra: {
      materiaisComplementares: ["Potes perfumados", "Cartões com emojis de sensações"],
    },
    quiz: {
      question: {
        prompt: "Qual objeto combina com o aroma doce que lembra festa de aniversário?",
        hint: "Pense em algo servido na hora do parabéns.",
        options: [
          {
            text: "Bolo recém-saído do forno",
            isCorrect: true,
            feedback: "Isso mesmo! O bolo espalha cheiro doce típico de aniversários.",
          },
          {
            text: "Tênis novo",
            isCorrect: false,
            feedback: "Tênis novo tem cheiro de material, não lembra festa doce.",
          },
          {
            text: "Giz de cera",
            isCorrect: false,
            feedback: "O cheiro do giz é diferente do aroma adocicado das festas.",
          },
        ],
      },
      trueFalse: {
        prompt: "Cheiro de chuva no jardim pode lembrar folhas molhadas?",
        hint: "Relembre como fica o ambiente quando chove na escola.",
        statement: "O cheiro de chuva no jardim lembra folhas molhadas e terra úmida.",
        answer: true,
        trueFeedback: "Perfeito! A chuva desperta aromas de folhas e terra.",
        falseFeedback:
          "Experimente lembrar do cheiro depois da chuva: ele traz memória das folhas molhadas.",
      },
    },
  },
  {
    slug: "visao-detalhista",
    title: "Visão Detalhista",
    prompt: "Observe com atenção a cena e responda sobre o que percebeu.",
    summary: "Quiz visual com destaque para detalhes e cores.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "observação visual de detalhes",
    category: "Visão investigativa",
    duration: 10,
    assetSlug: "cn-material-lupa",
    assetUsage: "Utilize a lupa para falar sobre ampliação de detalhes nas investigações.",
    familyTip:
      "Sugira que as famílias façam caça aos detalhes em casa, observando objetos com lupa artesanal.",
    learningObjectives: [
      "Identificar detalhes visuais relevantes em imagens do cotidiano escolar.",
      "Relacionar observações visuais a cuidados com ambientes compartilhados.",
    ],
    description:
      "Visão Detalhista incentiva a leitura de imagens e a descrição precisa dos elementos observados.",
    cooperative: true,
    crossCurricular: ["Arte", "Tecnologia"],
    metadataExtra: {
      sugestaoRegistro: "Fotos ou desenhos com legendas curtas.",
    },
    quiz: {
      question: {
        prompt:
          "Ao olhar a horta da escola, qual detalhe indica que as plantas estão bem cuidadas?",
        hint: "Repare nas cores e na presença de água.",
        options: [
          {
            text: "Folhas verdes e terra úmida",
            isCorrect: true,
            feedback: "Muito bem! Folhas verdes e terra úmida mostram cuidado e rega recente.",
          },
          {
            text: "Plantas com folhas caídas e secas",
            isCorrect: false,
            feedback: "Folhas caídas indicam que a planta precisa de atenção.",
          },
          {
            text: "Vasos virados de lado",
            isCorrect: false,
            feedback: "Vasos caídos sinalizam falta de cuidado e não combinam com horta saudável.",
          },
        ],
      },
      trueFalse: {
        prompt: "Se a sala está bem iluminada, conseguimos ler cartazes com mais facilidade?",
        hint: "Pense na importância da luz para enxergar letras e imagens.",
        statement: "Boa iluminação ajuda a enxergar cartazes e detalhes.",
        answer: true,
        trueFeedback: "Isso mesmo! A luz adequada facilita a leitura e a observação.",
        falseFeedback: "Reflita: sem luz suficiente, os cartazes ficam difíceis de ler.",
      },
    },
  },
  {
    slug: "toque-investigador",
    title: "Toque Investigador",
    prompt: "Analise as pistas táteis e escolha a opção que corresponde às sensações descritas.",
    summary: "Quiz tátil com ênfase em texturas e temperaturas.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "percepção tátil e cuidado com as mãos",
    category: "Tato curioso",
    duration: 9,
    assetSlug: "cn-higiene-lavar-maos",
    assetUsage:
      "Mostre a lavagem das mãos para lembrar da importância do tato e da higiene antes das investigações.",
    familyTip:
      "Oriente as famílias a montar uma caixa de texturas com grãos, tecidos e brinquedos macios.",
    learningObjectives: [
      "Diferenciar texturas e temperaturas em objetos do cotidiano.",
      "Relacionar higienização das mãos ao cuidado com o sentido do tato.",
    ],
    description:
      "Toque Investigador amplia o vocabulário sobre texturas enquanto reforça hábitos de higiene.",
    cooperative: true,
    crossCurricular: ["Arte", "Educação Física"],
    metadataExtra: {
      materiaisSugeridos: ["Panos macios", "Esponjas", "Blocos plásticos"],
    },
    quiz: {
      question: {
        prompt: "Qual objeto corresponde a uma superfície macia e quentinha?",
        hint: "Pense em algo confortável ao toque.",
        options: [
          {
            text: "Cobertor de pelúcia ao sol",
            isCorrect: true,
            feedback: "Excelente! O cobertor é macio e pode ficar quentinho ao sol.",
          },
          {
            text: "Copo de vidro com água gelada",
            isCorrect: false,
            feedback: "O vidro com água gelada é liso e frio, não macio e quente.",
          },
          {
            text: "Tampa metálica da lixeira",
            isCorrect: false,
            feedback: "A tampa metálica é dura e fria, diferente da descrição.",
          },
        ],
      },
      trueFalse: {
        prompt: "Ao lavar as mãos com água e sabão, protegemos o sentido do tato?",
        hint: "Reflita sobre como a higiene evita machucados e irritações.",
        statement: "Lavar as mãos mantém a pele saudável e protege o sentido do tato.",
        answer: true,
        trueFeedback: "Muito bem! Higiene mantém a pele macia e sem irritações.",
        falseFeedback: "Pense: mãos limpas evitam machucados e cuidam do tato.",
      },
    },
  },
  {
    slug: "combina-sentidos",
    title: "Combina Sentidos",
    prompt: "Relacione cada pista com o sentido correspondente.",
    summary: "Quebra-cabeça de associação entre pistas e sentidos.",
    type: "PUZZLE",
    difficulty: "INICIAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "associação entre pistas sensoriais e sentidos",
    category: "Pares sensoriais",
    duration: 10,
    assetSlug: "cn-material-lupa",
    assetUsage: "Use a lupa para destacar ícones visuais que representam cada sentido.",
    familyTip: "Proponha que as famílias criem cartões com pistas e sentidos para brincar em casa.",
    learningObjectives: [
      "Relacionar pistas do cotidiano aos sentidos e órgãos correspondentes.",
      "Justificar escolhas sensoriais durante o trabalho em dupla.",
    ],
    description:
      "Combina Sentidos organiza pistas textuais e visuais para consolidar o reconhecimento dos sentidos.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      formato: "Duplas rotativas com mediação do educador.",
    },
    puzzle: {
      successFeedback: "Sensacional! Cada pista foi conectada ao sentido certo.",
      errorFeedback: "Sem pressa: revisem as pistas e conversem sobre o que cada sentido percebe.",
      pairs: [
        {
          prompt: "Sino tocando no horário da saída",
          match: "Audição",
          hint: "Qual parte do corpo percebe os sons?",
          feedback: "Audição identifica o sino com facilidade.",
        },
        {
          prompt: "Folhas coloridas na horta da escola",
          match: "Visão",
          hint: "Pense no sentido que percebe cores.",
          feedback: "Visão ajuda a notar cores e formatos das folhas.",
        },
        {
          prompt: "Textura áspera da casca da árvore",
          match: "Tato",
          hint: "Qual sentido sente superfícies ao tocar?",
          feedback: "Tato reconhece a textura áspera com as mãos.",
        },
        {
          prompt: "Aroma de bolo vindo da cantina",
          match: "Olfato",
          hint: "Qual sentido percebe cheiros?",
          feedback: "Olfato identifica o cheiro gostoso do bolo.",
        },
      ],
    },
  },
  {
    slug: "mapa-dos-sons",
    title: "Mapa dos Sons",
    prompt: "Combine cada lugar da escola ao som que podemos ouvir ali.",
    summary: "Quebra-cabeça sobre ambientes e paisagens sonoras.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "escuta atenta em diferentes ambientes",
    category: "Cartografia sonora",
    duration: 11,
    assetSlug: "cn-natureza-rio",
    assetUsage: "Comente como o som da água inspira atenção aos ambientes externos.",
    familyTip: "Incentive as famílias a mapear sons do bairro criando um desenho coletivo.",
    learningObjectives: [
      "Identificar sons característicos de diferentes espaços escolares.",
      "Comparar ambientes a partir das paisagens sonoras percebidas.",
    ],
    description:
      "Mapa dos Sons explora como cada espaço possui sons próprios e incentiva registros colaborativos.",
    cooperative: true,
    crossCurricular: ["Geografia", "Arte"],
    metadataExtra: {
      recursoDigital: "Mapa interativo com ícones sonoros.",
    },
    puzzle: {
      successFeedback: "Ótimo! Vocês reconheceram as paisagens sonoras da escola.",
      errorFeedback: "Voltem às pistas e lembrem o que escutam em cada lugar.",
      pairs: [
        {
          prompt: "Biblioteca silenciosa",
          match: "Virar de páginas e cochichos",
          hint: "Qual som costuma ser ouvido na leitura?",
          feedback: "Virar páginas e cochichos combinam com a biblioteca.",
        },
        {
          prompt: "Quadra de esportes",
          match: "Bola quicando e risos altos",
          hint: "Quais sons aparecem durante as brincadeiras?",
          feedback: "Bola e risadas fazem parte da quadra animada.",
        },
        {
          prompt: "Cantina da escola",
          match: "Panelas e conversas animadas",
          hint: "Relembre o que se ouve perto do lanche.",
          feedback: "Panelas e conversas combinam com a cantina.",
        },
        {
          prompt: "Jardim externo",
          match: "Canto de pássaros e vento nas folhas",
          hint: "Quais sons a natureza traz?",
          feedback: "Pássaros e vento são típicos do jardim.",
        },
      ],
    },
  },
  {
    slug: "texturas-em-jogo",
    title: "Texturas em Jogo",
    prompt: "Associe cada objeto à sensação tátil descrita.",
    summary: "Quebra-cabeça tátil com linguagem descritiva.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "descrição de texturas e temperaturas",
    category: "Estação do tato",
    duration: 10,
    assetSlug: "cn-higiene-lavar-maos",
    assetUsage:
      "Utilize a ilustração da lavagem de mãos para lembrar do cuidado antes e depois das experiências táteis.",
    familyTip:
      "Convide as famílias a brincar de adivinhar objetos apenas pelo toque, com olhos vendados quando for seguro.",
    learningObjectives: [
      "Descrever texturas e temperaturas com vocabulário variado.",
      "Relacionar higiene das mãos ao conforto durante experiências táteis.",
    ],
    description:
      "Texturas em Jogo amplia repertórios descritivos e reforça a importância da higiene ao tocar objetos.",
    cooperative: true,
    crossCurricular: ["Arte", "Educação Física"],
    metadataExtra: {
      medidasDeSeguranca: "Garantir que objetos sejam seguros e limpos.",
    },
    puzzle: {
      successFeedback: "Muito bem! Vocês usaram o tato para diferenciar cada objeto.",
      errorFeedback: "Tentem novamente tocando com delicadeza e conversando sobre as pistas.",
      pairs: [
        {
          prompt: "Cubo de gelo",
          match: "Gelado e liso",
          hint: "Como sentimos a água quando congela?",
          feedback: "Gelado e liso descrevem o cubo de gelo.",
        },
        {
          prompt: "Lã do casaco",
          match: "Quentinha e macia",
          hint: "Qual objeto nos aquece com toque suave?",
          feedback: "Lã do casaco é macia e quentinha.",
        },
        {
          prompt: "Casca de árvore",
          match: "Áspera e firme",
          hint: "Pense na textura ao abraçar uma árvore.",
          feedback: "Casca de árvore é áspera e firme.",
        },
        {
          prompt: "Areia da caixa de brincar",
          match: "Granulada e fria",
          hint: "Como sentimos a areia com as mãos?",
          feedback: "A areia é granulada e pode estar fria.",
        },
      ],
    },
  },
  {
    slug: "sentidos-em-acao",
    title: "Sentidos em Ação",
    prompt: "Relacione cada situação à atitude que protege o sentido correspondente.",
    summary: "Quebra-cabeça sobre autocuidado e sentidos.",
    type: "PUZZLE",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01", "EF01CI02"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "autocuidado dos sentidos",
    category: "Proteção sensorial",
    duration: 12,
    assetSlug: "cn-higiene-escovar-dentes",
    assetUsage: "Destaque a ilustração da escovação para falar sobre cuidado com boca e paladar.",
    familyTip:
      "Combine com as famílias um quadro de cuidados diários envolvendo todos os sentidos.",
    learningObjectives: [
      "Relacionar hábitos de autocuidado à proteção de cada sentido.",
      "Elaborar orientações coletivas sobre segurança e higiene sensorial.",
    ],
    description:
      "Sentidos em Ação articula hábitos saudáveis e funções dos sentidos para expandir o repertório de cuidados.",
    cooperative: true,
    crossCurricular: ["Educação Física", "Língua Portuguesa"],
    metadataExtra: {
      producaoFinal: "Cartaz coletivo com dicas de cuidados.",
    },
    puzzle: {
      successFeedback: "Excelente! Os sentidos ficaram protegidos com suas escolhas.",
      errorFeedback:
        "Releiam as situações e conversem sobre qual cuidado combina com cada sentido.",
      pairs: [
        {
          prompt: "Ouvidos expostos a sons muito altos",
          match: "Usar protetor auricular ou diminuir o volume",
          hint: "Qual atitude preserva a audição?",
          feedback: "Proteger os ouvidos evita desconfortos com sons altos.",
        },
        {
          prompt: "Olhos cansados após longa leitura",
          match: "Fazer pausas e piscar com frequência",
          hint: "Qual cuidado descansa os olhos?",
          feedback: "Pausas e piscadas hidratam e descansam a visão.",
        },
        {
          prompt: "Mãos sujas depois de brincar na areia",
          match: "Lavar com água e sabão",
          hint: "Como cuidar da pele para sentir bem?",
          feedback: "Lavar as mãos protege o tato e a saúde.",
        },
        {
          prompt: "Experimentar alimento novo na cantina",
          match: "Cheirar e provar por pequenas porções",
          hint: "Como explorar sabores com cuidado?",
          feedback: "Cheirar e provar aos poucos cuida do paladar.",
        },
      ],
    },
  },
  {
    slug: "rota-dos-sentidos",
    title: "Rota dos Sentidos",
    prompt: "Complete a rota escolhendo qual sentido usamos em cada situação.",
    summary: "Mini-jogo cooperativo sobre escolhas sensoriais.",
    type: "GAME",
    difficulty: "INICIAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "seleção de sentidos conforme situações",
    category: "Caminhos sensoriais",
    duration: 12,
    assetSlug: "cn-animal-boto",
    assetUsage: "Use o boto para ilustrar a ideia de investigação em ambientes aquáticos.",
    familyTip:
      "Proponha que as famílias façam uma rota sensorial em casa, anotando quais sentidos usam em cada cômodo.",
    learningObjectives: [
      "Selecionar os sentidos adequados para resolver desafios cotidianos.",
      "Coordenar decisões em equipe registrando justificativas sensoriais.",
    ],
    description:
      "Rota dos Sentidos reúne desafios rápidos que exigem identificar o sentido mais adequado a cada cena.",
    cooperative: true,
    crossCurricular: ["Matemática", "Tecnologia"],
    metadataExtra: {
      cooperativoDigital: true,
    },
    game: {
      victoryMessage: "A trilha foi concluída! Cada sentido cumpriu sua missão.",
      gameOverMessage: "Vamos reorganizar a equipe e tentar novamente a rota dos sentidos?",
      timeLimitSeconds: 80,
      lives: 3,
      levels: [
        {
          challenge: "Você precisa saber se o recreio já começou. Qual sentido usar primeiro?",
          answer: "Audição",
          hint: "Pense no barulho do sinal ou das crianças.",
          success: "Boa! A audição percebe o sinal do recreio.",
          failure: "Lembre-se: ouvir o sinal ajuda a descobrir o recreio.",
        },
        {
          challenge: "Há um cartaz novo na entrada. Qual sentido mostra a mensagem rapidamente?",
          answer: "Visão",
          hint: "Observe com os olhos as letras e desenhos.",
          success: "Perfeito! A visão permite ler o cartaz.",
          failure: "Olhar com atenção ajuda a interpretar o cartaz.",
        },
        {
          challenge:
            "Na aula de culinária, qual sentido usamos para provar se a receita está doce o suficiente?",
          answer: "Paladar",
          hint: "Qual sentido percebe sabores?",
          success: "Isso! O paladar confirma se está doce.",
          failure: "Pense no sentido que percebe sabores para conferir a receita.",
        },
      ],
    },
  },
  {
    slug: "detectives-sensoriais",
    title: "Detetives Sensoriais",
    prompt: "Investigue as pistas e escolha o sentido que revela cada mistério.",
    summary: "Mini-jogo narrativo com pistas multimodais.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01", "EF01CI02"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "análise de pistas sensoriais combinadas",
    category: "Investigação cooperativa",
    duration: 13,
    assetSlug: "cn-animal-tucano",
    assetUsage: "Apresente o tucano como investigador das pistas da natureza.",
    familyTip:
      "Convide as famílias a brincar de detetives sensoriais em casa, registrando pistas em um caderno.",
    learningObjectives: [
      "Relacionar pistas sensoriais a hipóteses sobre objetos e situações.",
      "Registrar justificativas orais ou desenhadas para cada escolha realizada.",
    ],
    description:
      "Detetives Sensoriais traz missões narrativas que convidam a equipe a interpretar pistas multimodais.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      narrativa: "Missão guiada por personagem detetive.",
    },
    game: {
      victoryMessage: "Caso solucionado! As pistas sensoriais foram decifradas.",
      gameOverMessage: "Reúnam novas pistas e tentem resolver o caso novamente.",
      timeLimitSeconds: 90,
      lives: 3,
      levels: [
        {
          challenge:
            "No laboratório, há um frasco sem etiqueta. Ele espalha cheiro forte de hortelã. Qual sentido ajudou a identificar?",
          answer: "Olfato",
          hint: "Qual sentido percebe aromas?",
          success: "Excelente! O olfato reconheceu o cheiro de hortelã.",
          failure: "Lembre do sentido responsável por sentir cheiros.",
        },
        {
          challenge:
            "Um colega descreve que a superfície do objeto misterioso é lisa e fria. Qual sentido foi usado?",
          answer: "Tato",
          hint: "Qual sentido percebemos ao tocar?",
          success: "Perfeito! O tato sente textura e temperatura.",
          failure: "Considere o sentido que usamos com as mãos para sentir superfícies.",
        },
        {
          challenge:
            "Ao longe, ouvimos batidas ritmadas vindas da sala de música. Qual sentido indica onde ir?",
          answer: "Audição",
          hint: "Qual sentido capta sons?",
          success: "Boa descoberta! A audição mostra de onde vem o som.",
          failure: "Pense em qual sentido identifica sons a distância.",
        },
      ],
    },
  },
  {
    slug: "memoria-de-sabores",
    title: "Memória de Sabores",
    prompt: "Monte pares escolhendo o sentido e o alimento que combinam.",
    summary: "Mini-jogo de memória voltado ao paladar consciente.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01", "EF01CI02"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "exploração do paladar e hábitos saudáveis",
    category: "Sabores em jogo",
    duration: 12,
    assetSlug: "cn-higiene-escovar-dentes",
    assetUsage: "Reforce a importância de higienizar a boca após degustar alimentos.",
    familyTip:
      "Sugira que as famílias experimentem alimentos novos em pequenas porções, conversando sobre os sabores.",
    learningObjectives: [
      "Identificar sabores básicos relacionando-os a alimentos.",
      "Selecionar hábitos de higiene bucal após a degustação.",
    ],
    description:
      "Memória de Sabores combina degustação orientada e lembrança de cuidados após as refeições.",
    cooperative: true,
    crossCurricular: ["Educação Física", "Matemática"],
    metadataExtra: {
      formatoJogo: "Memória digital ou tabuleiro físico.",
    },
    game: {
      victoryMessage: "Parabéns! Sabores combinados e cuidados lembrados.",
      gameOverMessage: "Vamos revisar sabores e tentar montar os pares outra vez?",
      timeLimitSeconds: 85,
      lives: 3,
      levels: [
        {
          challenge: "Qual sentido identifica se a fruta está doce?",
          answer: "Paladar",
          hint: "Qual sentido usamos para sentir sabores?",
          success: "Isso mesmo! O paladar percebe o sabor doce.",
          failure: "Lembre-se do sentido responsável por saborear alimentos.",
        },
        {
          challenge: "Depois de comer uma maçã, qual hábito protege o paladar?",
          answer: "Escovar os dentes com calma",
          hint: "Pense em um cuidado de higiene bucal.",
          success: "Ótimo! Escovar os dentes mantém a boca saudável.",
          failure: "Considere um cuidado que envolve higiene dos dentes.",
        },
        {
          challenge: "Se o suco está muito ácido, o que podemos fazer para equilibrar o sabor?",
          answer: "Adicionar água ou outra fruta doce",
          hint: "Pense em uma solução segura e saudável.",
          success: "Perfeito! Ajustar com água ou fruta doce equilibra o sabor.",
          failure: "Reflita sobre como suavizar sabores fortes de forma saudável.",
        },
      ],
    },
  },
  {
    slug: "orquestra-dos-sentidos",
    title: "Orquestra dos Sentidos",
    prompt: "Coordene a equipe escolhendo rapidamente o sentido que ajuda em cada comando musical.",
    summary: "Mini-jogo rítmico que envolve múltiplos sentidos.",
    type: "GAME",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI01",
    habilidades: ["EF01CI01", "EF01CI02", "EF01CI04"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "coordenação entre sentidos e trabalho em equipe",
    category: "Performance sensorial",
    duration: 14,
    assetSlug: "cn-animal-tucano",
    assetUsage: "A ilustração do tucano inspira atenção aos sons e às cores durante a orquestra.",
    familyTip:
      "Incentive as famílias a conduzir brincadeiras musicais que usem gestos combinados com os sentidos.",
    learningObjectives: [
      "Coordenar respostas rápidas relacionando sentidos a estímulos diversos.",
      "Organizar estratégias coletivas com pausas e combinados de cooperação.",
    ],
    description:
      "Orquestra dos Sentidos integra ritmo, coordenação e estratégias de pausa para valorizar cada sentido.",
    cooperative: true,
    crossCurricular: ["Música", "Educação Física"],
    metadataExtra: {
      ritmoReferencia: "Utilizar palmas e instrumentos simples.",
    },
    game: {
      victoryMessage: "A orquestra brilhou! Todos os sentidos tocaram juntos.",
      gameOverMessage: "Respirem fundo, reorganizem a orquestra e tentem novamente.",
      timeLimitSeconds: 95,
      lives: 4,
      levels: [
        {
          challenge:
            "O maestro levanta um cartão vermelho com uma estrela brilhante. Qual sentido reage primeiro?",
          answer: "Visão",
          hint: "Pense no sentido que percebe cores e luzes.",
          success: "Muito bom! A visão identifica o cartão vermelho rapidamente.",
          failure: "Lembre-se: enxergar cores é tarefa da visão.",
        },
        {
          challenge:
            "Um chocalho toca no ritmo da música. Que sentido orienta o próximo movimento?",
          answer: "Audição",
          hint: "Qual sentido percebe sons e ritmos?",
          success: "Perfeito! A audição acompanha o chocalho.",
          failure: "Reflita: ouvir o ritmo ajuda a guiar os movimentos.",
        },
        {
          challenge:
            "O educador pede uma pausa para beber água fresca. Qual sentido percebe a temperatura?",
          answer: "Tato",
          hint: "Qual sentido sentimos ao tocar a garrafa?",
          success: "Excelente! O tato nota a temperatura da água.",
          failure: "Pense no sentido que usamos nas mãos para sentir frio ou calor.",
        },
      ],
    },
  },
];

const sentidosCuriosos: ModuleDefinition = {
  slug: "sentidos-curiosos",
  title: "Sentidos Curiosos",
  subtitle: "Exploração dos sentidos no cotidiano escolar",
  description:
    "Sequência investigativa que estimula a turma a reconhecer e relacionar os sentidos do corpo a diferentes situações da escola, com registros multimodais e cooperação.",
  theme: "Ciências",
  discipline: "Ciências",
  ageGroupSlug: "fundamental-anos-iniciais",
  learningPathSlug: "exploradores-da-natureza",
  primaryBnccCode: "EF01CI01",
  secondaryBnccCodes: ["EF01CI02"],
  learningOutcomes: [
    "Nomear os cinco sentidos relacionando-os às partes do corpo correspondentes.",
    "Observar situações do cotidiano identificando quais sentidos são mobilizados.",
    "Registrar descobertas sensoriais com desenhos, escrita inicial e relatos orais.",
  ],
  tags: ["sentidos", "corpo-humano", "investigacao", "sensorial"],
  estimatedDurationMinutes: 180,
  summary:
    "Trilha com 12 atividades que percorrem audição, olfato, tato, visão e paladar, articulando observação, cooperação e autocuidado.",
  activities: sentidosCuriososActivities,
};

const cuidadosDoCorpoActivities: ActivityDefinition[] = [
  {
    slug: "rotina-higiene",
    title: "Rotina de Higiene",
    prompt: "Escolha a atitude que mantém o corpo limpo logo ao acordar.",
    summary: "Quiz sobre hábitos matinais de autocuidado.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "organização da higiene pessoal diária",
    category: "Hábitos matinais",
    duration: 8,
    assetSlug: "cn-higiene-lavar-maos",
    assetUsage: "Utilize a ilustração da lavagem das mãos para conversar sobre o início da rotina.",
    familyTip:
      "Estimule as famílias a montar um checklist visual com as etapas de higiene da manhã.",
    learningObjectives: [
      "Identificar hábitos de higiene que iniciam o dia com bem-estar.",
      "Planejar a sequência de ações de autocuidado logo ao acordar.",
    ],
    description:
      "Rotina de Higiene apoia a turma a revisar hábitos matinais e a justificar suas escolhas saudáveis.",
    cooperative: false,
    crossCurricular: ["Língua Portuguesa", "Matemática"],
    metadataExtra: {
      rotina: "Quadro visual de passos ilustrados.",
    },
    quiz: {
      question: {
        prompt: "Qual atitude é recomendada logo depois de acordar?",
        hint: "Pense em como preparar o corpo antes do café da manhã.",
        options: [
          {
            text: "Lavar o rosto e escovar os dentes",
            isCorrect: true,
            feedback:
              "Ótima escolha! Lavar o rosto e escovar os dentes desperta o corpo com higiene.",
          },
          {
            text: "Deitar novamente e pular o café",
            isCorrect: false,
            feedback: "Essa atitude não ajuda a começar o dia com energia e saúde.",
          },
          {
            text: "Guardar o material escolar e voltar a dormir",
            isCorrect: false,
            feedback: "Organizar materiais é importante, mas primeiro cuidamos da higiene.",
          },
        ],
      },
      trueFalse: {
        prompt: "Tomar água ao acordar é um cuidado com o corpo?",
        hint: "Reflita sobre como a hidratação faz parte da saúde.",
        statement: "Beber água ao acordar ajuda o corpo a despertar com saúde.",
        answer: true,
        trueFeedback: "Perfeito! A água hidrata e prepara o corpo para o dia.",
        falseFeedback: "Lembre-se: hidratar-se é parte importante da rotina saudável.",
      },
    },
  },
  {
    slug: "escova-superpoder",
    title: "Escova Superpoder",
    prompt: "Descubra como deixar a escovação dos dentes ainda mais cuidadosa.",
    summary: "Quiz sobre técnicas simples de escovação.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "higiene bucal consciente",
    category: "Cuidados com o sorriso",
    duration: 9,
    assetSlug: "cn-higiene-escovar-dentes",
    assetUsage:
      "Use a imagem da escovação para demonstrar movimentos circulares e tempo necessário.",
    familyTip:
      "Combine com as famílias o desafio de escovar por dois minutos com música tranquila.",
    learningObjectives: [
      "Reconhecer ações necessárias para uma escovação eficiente.",
      "Relacionar higiene bucal à prevenção de desconfortos e doenças.",
    ],
    description:
      "Escova Superpoder reforça a importância da escovação completa e da observação de cada etapa.",
    cooperative: true,
    crossCurricular: ["Matemática", "Arte"],
    metadataExtra: {
      tempoMusical: "Use um cronômetro com trilha sonora de 2 minutos.",
    },
    quiz: {
      question: {
        prompt: "O que ajuda a escovar bem os dentes após o lanche?",
        hint: "Pense no movimento da escova.",
        options: [
          {
            text: "Mover a escova em círculos por todos os dentes",
            isCorrect: true,
            feedback: "Muito bem! Movimentos circulares alcançam todos os lados dos dentes.",
          },
          {
            text: "Escovar apenas os dentes da frente rapidamente",
            isCorrect: false,
            feedback: "É importante limpar todos os dentes com calma.",
          },
          {
            text: "Usar apenas água sem pasta",
            isCorrect: false,
            feedback: "A pasta ajuda a remover resíduos e proteger os dentes.",
          },
        ],
      },
      trueFalse: {
        prompt: "Trocar a escova quando as cerdas abrem é um cuidado importante?",
        hint: "Observe como a escova fica após muitos usos.",
        statement: "Substituir a escova quando as cerdas desgastam mantém a higiene eficiente.",
        answer: true,
        trueFeedback: "Exato! Escova em bom estado limpa melhor.",
        falseFeedback: "Lembre-se: cerdas abertas não alcançam todas as partes dos dentes.",
      },
    },
  },
  {
    slug: "maos-protegidas",
    title: "Mãos Protegidas",
    prompt: "Escolha quando é essencial lavar as mãos durante a rotina escolar.",
    summary: "Quiz sobre momentos-chave de higiene das mãos.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "lavagem das mãos e prevenção de doenças",
    category: "Cuidados com as mãos",
    duration: 9,
    assetSlug: "cn-higiene-lavar-maos",
    assetUsage: "Explique os passos da lavagem enquanto observa a ilustração.",
    familyTip: "Peça às famílias para praticarem a lavagem de mãos cantando uma música curta.",
    learningObjectives: [
      "Reconhecer situações em que é necessário lavar as mãos.",
      "Explicar por que a água e o sabão protegem a saúde coletiva.",
    ],
    description:
      "Mãos Protegidas traz exemplos práticos para que a turma relembre quando lavar as mãos.",
    cooperative: false,
    crossCurricular: ["Ciências", "Língua Portuguesa"],
    metadataExtra: {
      sinalizacao: "Cartazes perto das pias indicando os passos.",
    },
    quiz: {
      question: {
        prompt: "Quando devemos lavar as mãos na escola?",
        hint: "Pense em momentos de contato com alimentos e brincadeiras.",
        options: [
          {
            text: "Antes das refeições e após usar o banheiro",
            isCorrect: true,
            feedback: "Correto! São momentos essenciais para lavar as mãos.",
          },
          {
            text: "Apenas quando estiverem visivelmente sujas",
            isCorrect: false,
            feedback: "Mesmo sem sujeira aparente, precisamos lavar em vários momentos.",
          },
          {
            text: "Somente ao chegar em casa",
            isCorrect: false,
            feedback: "Também precisamos lavar as mãos durante a rotina escolar.",
          },
        ],
      },
      trueFalse: {
        prompt: "Espalhar bem o sabão faz parte da lavagem correta?",
        hint: "Lembre-se dos passos completos.",
        statement:
          "Ensaboar todas as partes da mão por 20 segundos é indispensável para eliminar micróbios.",
        answer: true,
        trueFeedback: "Muito bem! Ensaboar é fundamental para proteger a saúde.",
        falseFeedback: "Reflita: o sabão precisa atingir toda a mão para funcionar bem.",
      },
    },
  },
  {
    slug: "descanso-saudavel",
    title: "Descanso Saudável",
    prompt: "Descubra quais hábitos ajudam o corpo a recuperar energia.",
    summary: "Quiz sobre sono, respiração e relaxamento.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "equilíbrio entre descanso, hidratação e respiração",
    category: "Bem-estar integral",
    duration: 10,
    assetSlug: "cn-natureza-rio",
    assetUsage: "Use a cena do rio para inspirar respirações profundas e pausas.",
    familyTip:
      "Incentive as famílias a criar momentos de alongamento e respiração antes de dormir.",
    learningObjectives: [
      "Reconhecer que descanso, respiração e hidratação fazem parte da saúde.",
      "Planejar pausas ao longo do dia para recarregar as energias.",
    ],
    description:
      "Descanso Saudável mostra como pequenas pausas e boas noites de sono fortalecem o corpo.",
    cooperative: true,
    crossCurricular: ["Educação Física", "Arte"],
    metadataExtra: {
      trilhaRelax: "Playlist com sons da natureza para apoiar respirações.",
    },
    quiz: {
      question: {
        prompt: "Qual atitude ajuda o corpo a descansar melhor à noite?",
        hint: "Pense em algo que acalma antes de dormir.",
        options: [
          {
            text: "Desligar telas e ouvir uma história calma",
            isCorrect: true,
            feedback: "Excelente! Histórias calmas e menos luz ajudam o sono.",
          },
          {
            text: "Pular e correr até o último minuto",
            isCorrect: false,
            feedback: "O corpo precisa diminuir o ritmo para relaxar.",
          },
          {
            text: "Beber muito refrigerante antes de deitar",
            isCorrect: false,
            feedback: "Bebidas açucaradas atrapalham o descanso.",
          },
        ],
      },
      trueFalse: {
        prompt: "Respirar fundo e devagar pode relaxar o corpo?",
        hint: "Perceba como você se sente ao respirar lentamente.",
        statement: "Respirar lentamente ajuda a relaxar músculos e mente.",
        answer: true,
        trueFeedback: "Isso mesmo! Respirar com calma prepara o corpo para descansar.",
        falseFeedback: "Experimente: respirar devagar acalma o corpo.",
      },
    },
  },
  {
    slug: "kit-cuidados",
    title: "Kit de Cuidados",
    prompt: "Associe cada item do kit ao uso adequado na rotina de higiene.",
    summary: "Quebra-cabeça sobre materiais de higiene.",
    type: "PUZZLE",
    difficulty: "INICIAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "seleção de materiais de higiene pessoal",
    category: "Organização do nécessaire",
    duration: 10,
    assetSlug: "cn-higiene-escovar-dentes",
    assetUsage: "Mostre a escova para iniciar conversa sobre kits de higiene.",
    familyTip: "Sugira às famílias montar um kit portátil com itens básicos para viagens curtas.",
    learningObjectives: [
      "Identificar materiais de higiene e suas finalidades.",
      "Planejar o uso adequado dos itens em situações do cotidiano.",
    ],
    description:
      "Kit de Cuidados convida a turma a pensar nas funções de cada objeto de higiene pessoal.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Matemática"],
    metadataExtra: {
      inventario: "Tabela de checagem dos itens do kit.",
    },
    puzzle: {
      successFeedback: "Perfeito! Cada item foi associado ao uso correto.",
      errorFeedback: "Observem novamente as pistas e conversem sobre quando cada item é utilizado.",
      pairs: [
        {
          prompt: "Pente ou escova de cabelo",
          match: "Desembaraçar e organizar os fios",
          hint: "Pense em algo usado após o banho.",
          feedback: "O pente ajuda a cuidar dos cabelos limpos.",
        },
        {
          prompt: "Toalhinha individual",
          match: "Secar mãos e rosto após a lavagem",
          hint: "Qual item absorve água?",
          feedback: "Toalha é ideal para secar com higiene.",
        },
        {
          prompt: "Sabonete líquido",
          match: "Lavar mãos e corpo removendo impurezas",
          hint: "Serve para limpar com espuma.",
          feedback: "Sabonete remove a sujeira com água.",
        },
        {
          prompt: "Pasta e escova de dentes",
          match: "Limpar dentes após as refeições",
          hint: "Qual item protege o sorriso?",
          feedback: "Escova e pasta cuidam do sorriso saudável.",
        },
      ],
    },
  },
  {
    slug: "sequencia-banho",
    title: "Sequência do Banho",
    prompt: "Relacione cada etapa do banho a sua descrição.",
    summary: "Quebra-cabeça sobre ordem de ações na higiene corporal.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "sequenciamento da higiene do corpo",
    category: "Passo a passo do banho",
    duration: 11,
    assetSlug: "cn-natureza-rio",
    assetUsage: "Use a temática da água para falar sobre economia e cuidado.",
    familyTip: "Combine com as famílias um roteiro de banho com músicas para marcar o tempo.",
    learningObjectives: [
      "Organizar a sequência de etapas do banho contando com ajuda de imagens.",
      "Identificar atitudes de segurança e economia durante o banho.",
    ],
    description: "Sequência do Banho trabalha organização temporal e cuidados com a água.",
    cooperative: true,
    crossCurricular: ["Matemática", "Geografia"],
    metadataExtra: {
      economiaAgua: "Sugerir desligar o chuveiro enquanto ensaboa.",
    },
    puzzle: {
      successFeedback: "Banho completo! Vocês lembraram de cada etapa com cuidado.",
      errorFeedback: "Relembrem a ordem e observem as dicas para organizar o banho.",
      pairs: [
        {
          prompt: "Molhar o corpo com água morna",
          match: "Primeiro passo para preparar a pele",
          hint: "O que fazemos antes do sabonete?",
          feedback: "Molhar com água morna abre caminho para a limpeza.",
        },
        {
          prompt: "Ensaboar do pescoço aos pés",
          match: "Esfregar com atenção cada parte do corpo",
          hint: "Qual etapa remove a sujeira?",
          feedback: "Ensaboar com calma limpa toda a pele.",
        },
        {
          prompt: "Enxaguar bem o sabonete",
          match: "Retirar toda espuma antes de sair do banho",
          hint: "Evite deixar resíduos na pele.",
          feedback: "Enxaguar bem evita irritações.",
        },
        {
          prompt: "Secar-se com toalha limpa",
          match: "Cuidar para não ficar em ambientes frios",
          hint: "Último passo antes de trocar de roupa.",
          feedback: "Secar-se evita resfriados e cuida da pele.",
        },
      ],
    },
  },
  {
    slug: "alimentacao-colorida",
    title: "Alimentação Colorida",
    prompt: "Combine o alimento ao benefício que ele oferece ao corpo.",
    summary: "Quebra-cabeça sobre escolhas alimentares saudáveis.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "variedade alimentar e energia para o corpo",
    category: "Prato colorido",
    duration: 10,
    assetSlug: "cn-animal-tucano",
    assetUsage: "Use as cores do tucano para inspirar pratos variados.",
    familyTip: "Convide as famílias a montar um prato colorido fotografando as combinações.",
    learningObjectives: [
      "Relacionar cores dos alimentos a benefícios para o corpo.",
      "Planejar refeições equilibradas com participação da família.",
    ],
    description:
      "Alimentação Colorida destaca a importância de combinar alimentos variados e nutritivos.",
    cooperative: true,
    crossCurricular: ["Matemática", "Arte"],
    metadataExtra: {
      cardapio: "Tabela de cores para montar o prato do dia.",
    },
    puzzle: {
      successFeedback: "Muito bem! O prato ficou colorido e nutritivo.",
      errorFeedback: "Revejam o que cada alimento traz para o corpo e tentem novamente.",
      pairs: [
        {
          prompt: "Cenoura laranja",
          match: "Ajuda a manter a visão saudável",
          hint: "Qual alimento favorece os olhos?",
          feedback: "Cenoura tem vitaminas que cuidam da visão.",
        },
        {
          prompt: "Feijão com arroz",
          match: "Garante energia para brincar e estudar",
          hint: "Qual combinação dá força no dia a dia?",
          feedback: "Feijão com arroz fornece energia equilibrada.",
        },
        {
          prompt: "Frutas vermelhas",
          match: "Fortalecem a defesa do corpo",
          hint: "Pense em alimentos ricos em vitaminas.",
          feedback: "Frutas coloridas fortalecem a imunidade.",
        },
        {
          prompt: "Água fresca",
          match: "Mantém o corpo hidratado e disposto",
          hint: "Qual item não é sólido mas é essencial?",
          feedback: "Água hidrata e ajuda todas as funções do corpo.",
        },
      ],
    },
  },
  {
    slug: "cuidado-ferimentos",
    title: "Cuidado com Ferimentos",
    prompt: "Associe cada situação a um cuidado seguro que devemos ter.",
    summary: "Quebra-cabeça sobre primeiros cuidados simples.",
    type: "PUZZLE",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "proteção do corpo e primeiros cuidados",
    category: "Pronto atendimento escolar",
    duration: 12,
    assetSlug: "cn-material-lupa",
    assetUsage: "Use a lupa para observar sinais que indicam cuidados necessários.",
    familyTip:
      "Sugira às famílias manterem um kit de primeiros socorros simples e revisarem quando procurar ajuda adulta.",
    learningObjectives: [
      "Reconhecer situações que exigem ajuda de um adulto.",
      "Selecionar cuidados iniciais que mantêm o corpo protegido.",
    ],
    description:
      "Cuidado com Ferimentos orienta sobre atitudes seguras diante de pequenos machucados.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Educação Física"],
    metadataExtra: {
      protocolo: "Cartaz com contatos e orientações de emergência.",
    },
    puzzle: {
      successFeedback: "Excelente! Vocês escolheram cuidados seguros.",
      errorFeedback: "Releiam cada situação e discutam qual atitude garante proteção.",
      pairs: [
        {
          prompt: "Joelho ralado após brincar na quadra",
          match: "Lavar com água e avisar um adulto",
          hint: "Qual cuidado evita infecções?",
          feedback: "Lavar e avisar garante segurança.",
        },
        {
          prompt: "Picada de mosquito",
          match: "Lavar o local e evitar coçar",
          hint: "Qual atitude alivia sem machucar?",
          feedback: "Lavar e não coçar protege a pele.",
        },
        {
          prompt: "Palma da mão suja de tinta",
          match: "Lavar com sabão antes de lanchar",
          hint: "É importante limpar antes de comer.",
          feedback: "Lavar as mãos impede que a tinta vá para a boca.",
        },
        {
          prompt: "Corte superficial no dedo",
          match: "Cobrir com curativo limpo e pedir ajuda",
          hint: "Como impedir sujeira no machucado?",
          feedback: "Curativo e ajuda adulta protegem o corte.",
        },
      ],
    },
  },
  {
    slug: "desafio-habitos",
    title: "Desafio dos Hábitos",
    prompt: "Em cada fase, escolha o hábito que mantém o corpo saudável.",
    summary: "Mini-jogo sobre escolhas conscientes ao longo do dia.",
    type: "GAME",
    difficulty: "INICIAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "decisão sobre hábitos saudáveis",
    category: "Escolhas do dia",
    duration: 12,
    assetSlug: "cn-animal-boto",
    assetUsage: "Apresente o boto como mascote que incentiva boas escolhas.",
    familyTip: "Convide as famílias a jogar em casa registrando os hábitos escolhidos.",
    learningObjectives: [
      "Selecionar hábitos saudáveis em diferentes momentos da rotina.",
      "Justificar escolhas para colegas com base em argumentos simples.",
    ],
    description:
      "Desafio dos Hábitos apresenta situações rápidas para reforçar decisões saudáveis.",
    cooperative: true,
    crossCurricular: ["Matemática", "Tecnologia"],
    metadataExtra: {
      painelDigital: "Pontuação coletiva para motivar o grupo.",
    },
    game: {
      victoryMessage: "Parabéns! A turma escolheu hábitos que protegem o corpo.",
      gameOverMessage: "Vamos revisar os hábitos e tentar novamente com novas estratégias?",
      timeLimitSeconds: 80,
      lives: 3,
      levels: [
        {
          challenge: "Na hora do recreio, qual ação mostra cuidado com o corpo?",
          answer: "Beber água antes de brincar",
          hint: "Hidratação é essencial durante as brincadeiras.",
          success: "Boa escolha! Água hidrata e dá energia para brincar.",
          failure: "Reflita: nosso corpo precisa de água antes do esforço.",
        },
        {
          challenge: "Após pintar com tinta guache, o que fazer antes do lanche?",
          answer: "Lavar as mãos com água e sabão",
          hint: "Pense em higiene antes de comer.",
          success: "Ótimo! Mãos limpas mantêm o corpo protegido.",
          failure: "Lembre-se de remover tinta e sujeira antes de comer.",
        },
        {
          challenge: "Depois de correr bastante, qual pausa ajuda o corpo?",
          answer: "Respirar fundo e alongar",
          hint: "Pense em algo que acalma os músculos.",
          success: "Excelente! Alongar e respirar recupera a energia.",
          failure: "Considere pausar e cuidar da respiração.",
        },
      ],
    },
  },
  {
    slug: "cronometro-escovacao",
    title: "Cronômetro da Escovação",
    prompt: "Controle o tempo e escolha ações para uma escovação completa.",
    summary: "Mini-jogo cronometrado sobre higiene bucal.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "planejamento do tempo de escovação",
    category: "Missão sorriso limpo",
    duration: 13,
    assetSlug: "cn-higiene-escovar-dentes",
    assetUsage: "Reforce o tempo de dois minutos usando a ilustração da escovação.",
    familyTip: "Sugira que as famílias usem ampulhetas ou músicas curtas para marcar a escovação.",
    learningObjectives: [
      "Organizar a escovação dentro do tempo recomendado.",
      "Monitorar etapas necessárias para cuidar dos dentes.",
    ],
    description:
      "Cronômetro da Escovação desafia a turma a cumprir todas as etapas em tempo adequado.",
    cooperative: true,
    crossCurricular: ["Matemática", "Música"],
    metadataExtra: {
      marcadorTempo: "Indique quando metade do tempo já passou.",
    },
    game: {
      victoryMessage: "Sorrisos brilhantes! A escovação foi completa.",
      gameOverMessage: "Vamos ajustar o tempo e tentar novamente com atenção aos passos?",
      timeLimitSeconds: 120,
      lives: 3,
      levels: [
        {
          challenge: "Primeiro passo da escovação completa:",
          answer: "Aplicar pasta do tamanho de um grão de ervilha",
          hint: "Comece preparando a escova.",
          success: "Isso! Quantidade certa de pasta evita desperdícios.",
          failure: "Lembre-se de colocar a pasta na medida correta.",
        },
        {
          challenge: "Durante a escovação, o que fazer após limpar a parte da frente?",
          answer: "Escovar a parte de trás dos dentes",
          hint: "Não esqueça das áreas escondidas.",
          success: "Muito bem! Toda a boca precisa de cuidado.",
          failure: "Preste atenção: todas as faces dos dentes devem ser limpas.",
        },
        {
          challenge: "Finalizando a escovação, qual ação é importante?",
          answer: "Enxaguar a boca e escovar a língua",
          hint: "Pense no passo que deixa o hálito fresco.",
          success: "Perfeito! Língua limpa e enxágue completam a higiene.",
          failure: "Revise: enxaguar e limpar a língua encerram a escovação.",
        },
      ],
    },
  },
  {
    slug: "guardioes-saude",
    title: "Guardiões da Saúde",
    prompt: "Forme duplas e escolha ações para proteger a turma em diferentes situações.",
    summary: "Mini-jogo cooperativo com missões de proteção à saúde.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02", "EF01CI04"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "cooperação para manter ambientes saudáveis",
    category: "Missões cooperativas",
    duration: 12,
    assetSlug: "cn-animal-tucano",
    assetUsage: "Use o tucano como mensageiro dos alertas de saúde.",
    familyTip:
      "Proponha que as famílias criem tarefas compartilhadas para manter os ambientes limpos.",
    learningObjectives: [
      "Planejar ações coletivas que preservam a saúde da turma.",
      "Comunicar orientações de higiene de forma acolhedora.",
    ],
    description: "Guardiões da Saúde envolve cooperação para cuidar dos espaços e das pessoas.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      papeisEquipe: ["Mensageiro", "Organizador", "Cuidador do tempo"],
    },
    game: {
      victoryMessage: "Missão cumprida! A turma manteve todos protegidos.",
      gameOverMessage: "Replanejem as estratégias e experimentem novamente a missão.",
      timeLimitSeconds: 90,
      lives: 4,
      levels: [
        {
          challenge: "Colega espirrou na sala. Qual atitude de cuidado coletivo escolher?",
          answer: "Oferecer lenço e lembrar de cobrir o nariz com o braço",
          hint: "Pense em algo que evita espalhar germes.",
          success: "Muito bem! O lenço e a etiqueta de higiene protegem a turma.",
          failure: "Que tal lembrar de cobrir o espirro e usar lenço?",
        },
        {
          challenge: "O bebedouro ficou com fila. Como organizar o uso?",
          answer: "Formar fila e usar garrafinha individual",
          hint: "Lembre-se da importância de utensílios individuais.",
          success: "Excelente! Assim todos se hidratam com calma e higiene.",
          failure: "Reflita: garrafinhas individuais evitam compartilhamento de germes.",
        },
        {
          challenge: "Depois da aula de arte, o chão ficou com resíduos. O que a equipe faz?",
          answer: "Recolher materiais com luvas ou pá e lavar as mãos em seguida",
          hint: "Pense em limpeza e proteção após recolher resíduos.",
          success: "Ótimo! Limpeza com cuidado mantém o espaço saudável.",
          failure: "Considere recolher resíduos e higienizar as mãos.",
        },
      ],
    },
  },
  {
    slug: "rotina-equilibrada",
    title: "Rotina Equilibrada",
    prompt: "Monte a agenda do dia equilibrando escola, brincadeiras e descanso.",
    summary: "Mini-jogo de planejamento de rotina saudável.",
    type: "GAME",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI02",
    habilidades: ["EF01CI02", "EF01CI04"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "organização do tempo com foco na saúde",
    category: "Planejamento diário",
    duration: 14,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta lembra momentos ao ar livre e contato com a natureza na rotina.",
    familyTip:
      "Sugira que as famílias planejem juntos momentos de estudo, brincar, refeições e descanso.",
    learningObjectives: [
      "Planejar uma rotina que inclua alimentação, estudo, descanso e lazer.",
      "Refletir sobre o equilíbrio entre tempo digital e atividades corporais.",
    ],
    description: "Rotina Equilibrada integra organização do tempo e autocuidado para toda a turma.",
    cooperative: true,
    crossCurricular: ["Matemática", "Tecnologia"],
    metadataExtra: {
      quadroHorarios: "Cartaz coletivo com horários combinados.",
    },
    game: {
      victoryMessage: "Agenda completa! O corpo agradece a rotina equilibrada.",
      gameOverMessage: "Reorganizem os horários e tentem novamente buscando equilíbrio.",
      timeLimitSeconds: 95,
      lives: 4,
      levels: [
        {
          challenge: "No início da manhã, qual combinação equilibra corpo e mente?",
          answer: "Café da manhã saudável e alongamento rápido",
          hint: "Inclua alimentação e movimento.",
          success: "Ótimo! Alimentar-se e alongar desperta o corpo.",
          failure: "Reflita: precisamos comer e mexer o corpo ao começar o dia.",
        },
        {
          challenge: "No período da tarde, qual ajuste mantém o bem-estar?",
          answer: "Alternar tarefas escolares com pequenas pausas",
          hint: "Evite longos períodos sem descanso.",
          success: "Muito bem! Pausas ajudam a manter a concentração.",
          failure: "Considere intercalar estudo com pausas curtas.",
        },
        {
          challenge: "À noite, o que fazer antes de dormir?",
          answer: "Desligar telas, tomar banho e ler algo tranquilo",
          hint: "Escolha ações que acalmam antes do sono.",
          success: "Perfeito! Essas atitudes preparam o corpo para descansar.",
          failure: "Pense em hábitos que relaxam e não estimulam demais.",
        },
      ],
    },
  },
];

const cuidadosDoCorpo: ModuleDefinition = {
  slug: "cuidados-do-corpo",
  title: "Cuidados do Corpo",
  subtitle: "Higiene e bem-estar para o dia a dia",
  description:
    "Sequência que fortalece hábitos de higiene, alimentação equilibrada, descanso e cooperação, articulando autocuidado e cuidado coletivo na escola.",
  theme: "Ciências",
  discipline: "Ciências",
  ageGroupSlug: "fundamental-anos-iniciais",
  learningPathSlug: "exploradores-da-natureza",
  primaryBnccCode: "EF01CI02",
  secondaryBnccCodes: ["EF01CI01"],
  learningOutcomes: [
    "Planejar rotinas de higiene pessoal com base em sequências visuais e sonoras.",
    "Explicar a importância de alimentação colorida, hidratação e descanso para a saúde.",
    "Cooperar na criação de combinados de cuidado coletivo nos espaços comuns da escola.",
  ],
  tags: ["higiene", "saude", "autocuidado", "rotina"],
  estimatedDurationMinutes: 180,
  summary:
    "Trilha com 12 atividades que combinam quizzes, puzzles e mini-jogos sobre higiene, alimentação, descanso e cooperação.",
  activities: cuidadosDoCorpoActivities,
};

const animaisDaVizinhancaActivities: ActivityDefinition[] = [
  {
    slug: "som-da-mata",
    title: "Som da Mata",
    prompt: "Escute as pistas e identifique qual animal está se comunicando.",
    summary: "Quiz auditivo sobre animais da vizinhança e seus sons.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "reconhecimento de sons de animais locais",
    category: "Audição animal",
    duration: 8,
    assetSlug: "cn-animal-tucano",
    assetUsage: "Mostre o tucano para conversar sobre aves que usam cantos marcantes na floresta.",
    familyTip:
      "Sugira que as famílias reproduzam sons de animais em casa e criem adivinhas sonoras com as crianças.",
    learningObjectives: [
      "Associar sons característicos a animais comuns da vizinhança.",
      "Descrever pistas sonoras que ajudam a identificar diferentes espécies.",
    ],
    description:
      "Som da Mata estimula a turma a perceber sons de animais e relacioná-los a imagens e comportamentos.",
    cooperative: false,
    crossCurricular: ["Música", "Língua Portuguesa"],
    metadataExtra: {
      recursoAudio: "Biblioteca de sons curtos com volume ajustável.",
    },
    quiz: {
      question: {
        prompt:
          "Qual animal realiza um canto agudo, colorido e costuma ficar nas copas das árvores?",
        hint: "Pense em aves com bicos chamativos da floresta.",
        options: [
          {
            text: "Tucano",
            isCorrect: true,
            feedback: "Isso mesmo! O tucano usa seu canto vibrante entre as árvores altas.",
          },
          {
            text: "Boto cor-de-rosa",
            isCorrect: false,
            feedback: "O boto vive na água e não canta nas copas das árvores.",
          },
          {
            text: "Jabuti",
            isCorrect: false,
            feedback: "O jabuti faz sons discretos e vive no chão, não nas copas.",
          },
        ],
      },
      trueFalse: {
        prompt: "Grilos e cigarras costumam cantar no entardecer?",
        hint: "Relembre os sons ouvidos ao final do dia no jardim da escola.",
        statement: "Grilos e cigarras cantam no entardecer, marcando os sons da vizinhança.",
        answer: true,
        trueFeedback: "Perfeito! Esses insetos aquecem suas asas e cantam ao entardecer.",
        falseFeedback:
          "Tente ouvir novamente: grilos e cigarras cantam bastante quando o sol se despede.",
      },
    },
  },
  {
    slug: "casa-preferida",
    title: "Casa Preferida",
    prompt: "Escolha o habitat que combina com cada animal apresentado.",
    summary: "Quiz sobre ambientes e necessidades dos animais.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "reconhecimento de habitats e necessidades dos animais",
    category: "Ambientes naturais",
    duration: 9,
    assetSlug: "cn-natureza-floresta",
    assetUsage:
      "Utilize a ilustração da floresta para explorar diferentes alturas, luzes e esconderijos.",
    familyTip:
      "Proponha que as famílias pesquisem fotos de habitats brasileiros e compartilhem curiosidades com a turma.",
    learningObjectives: [
      "Relacionar características de animais ao ambiente em que vivem.",
      "Justificar escolhas de habitat usando pistas de alimentação e proteção.",
    ],
    description:
      "Casa Preferida aproxima animais da vizinhança dos ambientes que oferecem abrigo e alimento.",
    cooperative: true,
    crossCurricular: ["Geografia", "Arte"],
    metadataExtra: {
      mapaColaborativo: "Painel com fotos de ambientes da comunidade.",
    },
    quiz: {
      question: {
        prompt: "Qual ambiente oferece água doce e tranquila para o boto cor-de-rosa viver?",
        hint: "Pense em rios calmos do Norte do Brasil.",
        options: [
          {
            text: "Rios de água doce com vegetação",
            isCorrect: true,
            feedback: "Correto! O boto vive em rios de água doce e gosta de margens com vegetação.",
          },
          {
            text: "Topo de montanhas geladas",
            isCorrect: false,
            feedback: "Montanhas geladas não oferecem água para o boto nadar.",
          },
          {
            text: "Deserto com areia muito quente",
            isCorrect: false,
            feedback: "O boto precisa de muita água, diferente do deserto.",
          },
        ],
      },
      trueFalse: {
        prompt: "Tucanos gostam de viver em árvores altas da floresta?",
        hint: "Observe o formato do bico e o corpo leve desse animal.",
        statement: "Tucanos vivem em árvores altas da floresta, onde encontram frutos e abrigo.",
        answer: true,
        trueFeedback: "Muito bem! Tucanos usam as copas para se alimentar e se esconder.",
        falseFeedback: "Relembre: os tucanos usam o bico para alcançar frutos nas árvores altas.",
      },
    },
  },
  {
    slug: "movimento-animado",
    title: "Movimento Animado",
    prompt: "Observe como cada animal se move e escolha a melhor descrição.",
    summary: "Quiz sobre deslocamento e adaptações corporais.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "movimentos característicos de animais",
    category: "Deslocamentos na natureza",
    duration: 10,
    assetSlug: "cn-animal-boto",
    assetUsage: "Mostre o boto para comentar as nadadeiras e a respiração na superfície.",
    familyTip:
      "Peça às famílias que imitem movimentos de animais em jogos corporais, observando diferenças entre nadar, voar e caminhar.",
    learningObjectives: [
      "Identificar diferentes formas de deslocamento dos animais.",
      "Relacionar partes do corpo dos animais ao tipo de movimento realizado.",
    ],
    description:
      "Movimento Animado evidencia como nadadeiras, asas e patas ajudam os animais a se deslocarem.",
    cooperative: true,
    crossCurricular: ["Educação Física", "Arte"],
    metadataExtra: {
      sugestaoBrincadeira: "Circuito motor imitando animais.",
    },
    quiz: {
      question: {
        prompt: "Como o boto cor-de-rosa respira enquanto nada?",
        hint: "Observe que ele precisa vir à superfície.",
        options: [
          {
            text: "Sobe para fora d'água e usa o furo no topo da cabeça",
            isCorrect: true,
            feedback: "Exato! O boto sobe para respirar pelo espiráculo.",
          },
          {
            text: "Respira debaixo d'água pelas nadadeiras",
            isCorrect: false,
            feedback: "As nadadeiras ajudam a nadar, não a respirar.",
          },
          {
            text: "Respira pela cauda quando mergulha fundo",
            isCorrect: false,
            feedback: "A cauda serve para impulsionar, não para respirar.",
          },
        ],
      },
      trueFalse: {
        prompt: "Tatus se protegem enrolando o corpo e caminhando devagar?",
        hint: "Lembre-se da carapaça rígida dos tatus.",
        statement: "Tatus enrolam o corpo e se movem devagar para se proteger.",
        answer: true,
        trueFeedback: "Isso mesmo! O corpo rígido ajuda a deixar o tatu protegido.",
        falseFeedback: "Reflita: o tatu usa a carapaça e movimentos lentos para se proteger.",
      },
    },
  },
  {
    slug: "cardapio-animal",
    title: "Cardápio Animal",
    prompt: "Descubra o que cada animal come no ambiente onde vive.",
    summary: "Quiz sobre alimentação e cadeia alimentar simples.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "hábitos alimentares dos animais",
    category: "Cadeias alimentares",
    duration: 9,
    assetSlug: "cn-natureza-rio",
    assetUsage: "Use a paisagem do rio para destacar a variedade de alimentos aquáticos.",
    familyTip:
      "Convide as famílias a pesquisar o que os animais locais comem e elaborar um mural de curiosidades.",
    learningObjectives: [
      "Relacionar alimentos às preferências de animais conhecidos.",
      "Refletir sobre como os ambientes fornecem comida para os animais.",
    ],
    description:
      "Cardápio Animal relaciona animais da vizinhança aos alimentos disponíveis em seus habitats.",
    cooperative: false,
    crossCurricular: ["Matemática", "Língua Portuguesa"],
    metadataExtra: {
      tabelaSabores: "Quadro com alimentos e animais correspondentes.",
    },
    quiz: {
      question: {
        prompt: "Qual alimento combina com o boto cor-de-rosa durante suas caçadas?",
        hint: "Observe que ele vive em rios de água doce.",
        options: [
          {
            text: "Peixes pequenos e crustáceos",
            isCorrect: true,
            feedback: "Correto! O boto caça peixes e pequenos crustáceos.",
          },
          {
            text: "Folhas de árvores altas",
            isCorrect: false,
            feedback: "Folhas são mais consumidas por animais herbívoros terrestres.",
          },
          {
            text: "Frutas secas do deserto",
            isCorrect: false,
            feedback: "O boto não vive no deserto e precisa de alimentos da água.",
          },
        ],
      },
      trueFalse: {
        prompt: "Tucanos ajudam a espalhar sementes ao comer frutas?",
        hint: "Repare no bico grande e na dieta colorida.",
        statement: "Tucanos comem frutas e espalham sementes pela floresta.",
        answer: true,
        trueFeedback: "Ótimo! Depois de comer frutas, eles espalham sementes ao voar.",
        falseFeedback: "Lembre-se de que os tucanos dispersam sementes ao se alimentar.",
      },
    },
  },
  {
    slug: "rota-dos-habitats",
    title: "Rota dos Habitats",
    prompt: "Associe cada animal ao habitat que oferece abrigo e alimento.",
    summary: "Quebra-cabeça de correspondência entre animais e ambientes.",
    type: "PUZZLE",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "associação de habitats e recursos naturais",
    category: "Mapa da vizinhança",
    duration: 10,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta ajuda a visualizar árvores, frutos e ninhos para as combinações.",
    familyTip:
      "Sugira que as famílias construam um diorama simples mostrando o habitat de um animal escolhido.",
    learningObjectives: [
      "Relacionar recursos naturais às necessidades dos animais.",
      "Explicar em duplas por que cada animal vive em determinado habitat.",
    ],
    description:
      "Rota dos Habitats organiza pistas de alimentação, temperatura e abrigo para comparar ambientes.",
    cooperative: true,
    crossCurricular: ["Geografia", "Arte"],
    metadataExtra: {
      recursoMapa: "Mapa gigante da escola com adesivos de habitats.",
    },
    puzzle: {
      successFeedback: "Excelente! Cada animal encontrou o habitat ideal.",
      errorFeedback: "Releiam as pistas e conversem sobre o que cada ambiente oferece.",
      pairs: [
        {
          prompt: "Boto cor-de-rosa",
          match: "Rios e igarapés de água doce",
          hint: "Procure locais com muita água.",
          feedback: "Os rios calmos são a casa do boto.",
        },
        {
          prompt: "Tucano",
          match: "Copas de árvores com muitos frutos",
          hint: "Analise onde há frutas e galhos altos.",
          feedback: "Tucanos preferem árvores com frutos variados.",
        },
        {
          prompt: "Gato-do-mato",
          match: "Mata fechada com tocas e folhas secas",
          hint: "Lembre-se de animais que precisam se esconder.",
          feedback: "O gato-do-mato usa tocas entre folhas e galhos caídos.",
        },
        {
          prompt: "Tartaruga-da-amazônia",
          match: "Praias de rio com bancos de areia",
          hint: "Busque locais para tomar sol e botar ovos.",
          feedback: "Tartarugas usam as praias de rio para descansar.",
        },
      ],
    },
  },
  {
    slug: "rede-alimentar",
    title: "Rede Alimentar da Vizinhança",
    prompt: "Relacione cada alimento às espécies que dele dependem.",
    summary: "Quebra-cabeça sobre interdependência alimentar.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "cadeias alimentares simples",
    category: "Circuito de energia",
    duration: 11,
    assetSlug: "cn-natureza-rio",
    assetUsage:
      "Use a paisagem do rio para representar fluxos de energia entre produtores e consumidores.",
    familyTip:
      "Peça que as famílias montem esquemas simples mostrando quem se alimenta de quê na vizinhança.",
    learningObjectives: [
      "Reconhecer relações alimentares básicas entre plantas e animais.",
      "Explicar como mudanças em um elemento da cadeia afetam os demais.",
    ],
    description:
      "Rede Alimentar propõe associações que destacam a dependência entre plantas, insetos e animais maiores.",
    cooperative: true,
    crossCurricular: ["Matemática", "Língua Portuguesa"],
    metadataExtra: {
      materialDeApoio: "Cartões coloridos com setas autocolantes.",
    },
    puzzle: {
      successFeedback: "Muito bom! A cadeia alimentar ficou completa.",
      errorFeedback: "Revejam cada pista e conversem sobre quem depende de quem.",
      pairs: [
        {
          prompt: "Flores do jardim",
          match: "Abelhas e borboletas que coletam néctar",
          hint: "Quem visita flores para se alimentar?",
          feedback: "Abelhas e borboletas dependem das flores para produzir energia.",
        },
        {
          prompt: "Peixinhos do rio",
          match: "Boto cor-de-rosa durante a caça",
          hint: "Quem caça no rio para comer?",
          feedback: "O boto busca peixes pequenos e médios no rio.",
        },
        {
          prompt: "Frutas maduras",
          match: "Tucanos e macacos que espalham sementes",
          hint: "Que animais usam o bico ou as mãos para comer frutas?",
          feedback: "Frutas alimentam aves e mamíferos que dispersam sementes.",
        },
        {
          prompt: "Folhas baixas",
          match: "Capivaras que pastam perto da água",
          hint: "Qual animal herbívoro vive perto da água?",
          feedback: "Capivaras mastigam folhas e capim às margens dos rios.",
        },
      ],
    },
  },
  {
    slug: "pegadas-misteriosas",
    title: "Pegadas Misteriosas",
    prompt: "Combine cada pegada à espécie que costuma deixá-la na vizinhança.",
    summary: "Quebra-cabeça de observação de marcas no solo.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "identificação de pegadas e pistas físicas",
    category: "Investigação de campo",
    duration: 10,
    assetSlug: "cn-material-lupa",
    assetUsage: "Use a lupa para incentivar a análise detalhada das pegadas.",
    familyTip:
      "Convide as famílias a procurar pegadas em parques ou praças e fotografar para compartilhar com a turma.",
    learningObjectives: [
      "Observar detalhes de pegadas e relacioná-las a animais respectivos.",
      "Registrar evidências físicas que indicam a presença de animais.",
    ],
    description:
      "Pegadas Misteriosas incentiva a turma a deduzir qual animal passou pelo local usando pistas no solo.",
    cooperative: true,
    crossCurricular: ["Arte", "Matemática"],
    metadataExtra: {
      moldePegada: "Use argila ou massa para criar moldes das pegadas.",
    },
    puzzle: {
      successFeedback: "Investigação concluída! Todas as pegadas foram identificadas.",
      errorFeedback: "Analise novamente o número de dedos e o formato das pegadas.",
      pairs: [
        {
          prompt: "Pegada com dedos longos e marca de garras leves",
          match: "Tucano caminhando pelo chão úmido",
          hint: "Observe aves que também andam no solo.",
          feedback: "Tucanos deixam marcas finas com garras delicadas.",
        },
        {
          prompt: "Marca redonda com listras e garras fortes",
          match: "Onça ou gato-do-mato explorando a trilha",
          hint: "Qual felino vive na mata e tem garras fortes?",
          feedback: "Felinos deixam almofadas arredondadas e garras marcadas.",
        },
        {
          prompt: "Marcas largas em forma de casco",
          match: "Capivara passando perto da água",
          hint: "Qual mamífero tem cascos semi-arredondados?",
          feedback: "Capivaras deixam marcas largas e sem dedos aparentes.",
        },
        {
          prompt: "Trilho serpenteando sem patas",
          match: "Serpente que desliza pela areia",
          hint: "Qual animal não tem patas e deixa rastro contínuo?",
          feedback: "Serpentes deixam rastros em onda no solo.",
        },
      ],
    },
  },
  {
    slug: "defesas-criativas",
    title: "Defesas Criativas",
    prompt: "Associe cada animal à maneira como ele se protege na natureza.",
    summary: "Quebra-cabeça sobre estratégias de defesa e sobrevivência.",
    type: "PUZZLE",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "adaptações e estratégias de sobrevivência",
    category: "Proteção animal",
    duration: 12,
    assetSlug: "cn-animal-boto",
    assetUsage: "Fale sobre como o boto usa cores e movimentos para se proteger.",
    familyTip:
      "Peça às famílias que criem histórias em quadrinhos mostrando uma adaptação de defesa de um animal.",
    learningObjectives: [
      "Relacionar características do corpo dos animais às estratégias de proteção.",
      "Argumentar sobre como cada adaptação ajuda na sobrevivência.",
    ],
    description:
      "Defesas Criativas evidencia diferentes formas de proteção usadas pelos animais da região.",
    cooperative: true,
    crossCurricular: ["Arte", "Língua Portuguesa"],
    metadataExtra: {
      produtoFinal: "Cartaz com adaptações ilustradas pelos estudantes.",
    },
    puzzle: {
      successFeedback: "Muito bom! Vocês descobriram como cada animal se protege.",
      errorFeedback:
        "Releiam as descrições e conversem sobre qual comportamento combina com o animal.",
      pairs: [
        {
          prompt: "Boto cor-de-rosa",
          match: "Nada em grupos e usa sons para se orientar no rio",
          hint: "Repare em animais que vivem juntos e usam sons.",
          feedback: "Botos se protegem nadando juntos e emitindo sons.",
        },
        {
          prompt: "Tatu-bola",
          match: "Enrola o corpo formando uma bola rígida",
          hint: "Qual animal usa a carapaça como escudo?",
          feedback: "O tatu-bola se enrola para se proteger.",
        },
        {
          prompt: "Sapo colorido",
          match: "Usa cores vivas para avisar que é venenoso",
          hint: "Qual animal usa cores como aviso?",
          feedback: "Cores vivas alertam predadores sobre veneno.",
        },
        {
          prompt: "Garça",
          match: "Fica imóvel e camufla entre os galhos próximos à água",
          hint: "Pense em aves que caçam paradas.",
          feedback: "Garças camuflam e permanecem imóveis para se proteger.",
        },
      ],
    },
  },
  {
    slug: "trilha-dos-sons",
    title: "Trilha dos Sons",
    prompt: "Siga a trilha sonora e indique quais animais aparecem em cada ponto.",
    summary: "Mini-jogo sensorial com foco em audição e observação.",
    type: "GAME",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "identificação auditiva e espacial de animais",
    category: "Caça sonora",
    duration: 12,
    assetSlug: "cn-natureza-rio",
    assetUsage: "Use a paisagem do rio para ambientar a trilha de sons naturais.",
    familyTip: "Convide as famílias a criar jogos de localização de sons no quintal ou na varanda.",
    learningObjectives: [
      "Reconhecer sons de animais e relacioná-los aos ambientes onde vivem.",
      "Cooperar para registrar observações sonoras em mapas simples.",
    ],
    description:
      "Trilha dos Sons apresenta pontos do mapa com pistas auditivas que indicam a presença de animais.",
    cooperative: true,
    crossCurricular: ["Música", "Geografia"],
    metadataExtra: {
      mapaSonoro: "Mapa digital com ícones que emitem sons.",
    },
    game: {
      victoryMessage: "Trilha concluída! Todas as vozes da natureza foram identificadas.",
      gameOverMessage: "Voltem à trilha sonora, ajustem as pistas e tentem novamente.",
      timeLimitSeconds: 85,
      lives: 3,
      levels: [
        {
          challenge: "Você escuta asas batendo e um canto agudo nas árvores altas.",
          answer: "Tucano",
          hint: "Pense em aves coloridas que vivem nas copas.",
          success: "Ótimo! Tucanos cantam nas copas das árvores.",
          failure: "Tente lembrar quais aves vivem nas árvores altas.",
        },
        {
          challenge: "Ao lado do rio, há respingos e um apito longo debaixo d'água.",
          answer: "Boto cor-de-rosa",
          hint: "Que animal usa sons na água doce?",
          success: "Certo! O boto emite sons e respira na superfície.",
          failure: "Considere animais que vivem em rios e fazem sons debaixo d'água.",
        },
        {
          challenge: "No chão molhado, você percebe coaxos contínuos perto das folhas.",
          answer: "Sapo da mata",
          hint: "Quem canta perto de folhas úmidas?",
          success: "Perfeito! Sapos cantam perto das folhas molhadas.",
          failure: "Lembre-se dos anfíbios que moram na mata úmida.",
        },
      ],
    },
  },
  {
    slug: "patrulha-biodiversidade",
    title: "Patrulha da Biodiversidade",
    prompt: "Escolha atitudes que ajudam a proteger os animais da vizinhança.",
    summary: "Mini-jogo de tomada de decisões ambientais.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03", "EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "cuidado com animais e ambientes naturais",
    category: "Missões ecológicas",
    duration: 13,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "Projete a floresta para falar sobre equilíbrio entre pessoas e natureza.",
    familyTip:
      "Solicite que as famílias identifiquem áreas verdes do bairro e pensem em formas de preservá-las.",
    learningObjectives: [
      "Selecionar atitudes que preservam animais e seus habitats.",
      "Argumentar sobre consequências de práticas que ameaçam a biodiversidade.",
    ],
    description:
      "Patrulha da Biodiversidade apresenta missões rápidas em que a turma escolhe ações de proteção.",
    cooperative: true,
    crossCurricular: ["Geografia", "Língua Portuguesa"],
    metadataExtra: {
      registroMissao: "Planilha coletiva para anotar compromissos de cuidado.",
    },
    game: {
      victoryMessage: "Vocês protegeram a vizinhança! Os animais continuam seguros.",
      gameOverMessage: "Revejam as atitudes e tentem novamente planejando novas estratégias.",
      timeLimitSeconds: 90,
      lives: 3,
      levels: [
        {
          challenge: "Um colega quer alimentar os peixes do rio com restos de salgadinho.",
          answer: "Explicar que restos humanos podem prejudicar os animais",
          hint: "Escolha o cuidado mais seguro para os peixes.",
          success: "Perfeito! Alimentos inadequados prejudicam os peixes.",
          failure: "Reflita: restos humanos não fazem parte da dieta dos peixes.",
        },
        {
          challenge: "Há lixo perto das árvores onde os tucanos descansam.",
          answer: "Organizar mutirão para recolher e separar o lixo",
          hint: "Pense em ações coletivas para limpar o ambiente.",
          success: "Ótima decisão! Limpeza coletiva protege os animais.",
          failure: "Considere uma ação cooperativa de limpeza.",
        },
        {
          challenge: "Um grupo pretende capturar sapos para brincar.",
          answer: "Conversar com adulto e explicar que os sapos controlam insetos",
          hint: "Escolha uma atitude responsável com os animais.",
          success: "Excelente! Avisar e explicar protege os sapos da vizinhança.",
          failure: "Lembre-se de envolver adultos e explicar por que o animal é importante.",
        },
      ],
    },
  },
  {
    slug: "rota-do-boto",
    title: "Rota do Boto",
    prompt: "Ajude o boto a seguir pelo rio escolhendo caminhos seguros.",
    summary: "Mini-jogo sobre navegação em rios e cuidados ambientais.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03", "EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "orientação espacial e segurança em ambientes aquáticos",
    category: "Exploração fluvial",
    duration: 12,
    assetSlug: "cn-animal-boto",
    assetUsage: "A imagem do boto reforça a importância de rios limpos e profundos.",
    familyTip:
      "Sugira que as famílias procurem notícias sobre rios da região e conversem sobre cuidados necessários.",
    learningObjectives: [
      "Identificar riscos e proteções em ambientes aquáticos naturais.",
      "Planejar rotas seguras considerando preservação e convivência.",
    ],
    description:
      "Rota do Boto apresenta escolhas de percurso que destacam cuidados com rios e animais aquáticos.",
    cooperative: true,
    crossCurricular: ["Matemática", "Geografia"],
    metadataExtra: {
      cenarios: ["Margem com barcos", "Trecho poluído", "Área de vegetação densa"],
    },
    game: {
      victoryMessage: "O boto chegou com segurança! O rio continua protegido.",
      gameOverMessage: "Replanejem a rota observando os sinais do rio para tentar novamente.",
      timeLimitSeconds: 88,
      lives: 3,
      levels: [
        {
          challenge: "Há um trecho com redes de pesca próximas à superfície.",
          answer: "Desviar para uma área sem redes e avisar pescadores responsáveis",
          hint: "Pense em manter o boto longe de objetos que prendem.",
          success: "Muito bem! Evitar redes mantém o boto seguro.",
          failure: "Reflita: redes podem prender o boto, é melhor desviar.",
        },
        {
          challenge: "O rio fica raso próximo a bancos de areia.",
          answer: "Buscar um canal mais profundo com corrente suave",
          hint: "Considere a profundidade necessária para o boto nadar.",
          success: "Ótima escolha! O canal profundo permite nadar com segurança.",
          failure: "Pense: o boto precisa de água funda para nadar.",
        },
        {
          challenge: "A margem está com lixo plástico boiando.",
          answer: "Registrar o local e combinar mutirão de limpeza com a comunidade",
          hint: "Escolha atitude que protege o ambiente e os animais.",
          success: "Excelente! Limpar o rio ajuda todos os animais.",
          failure: "Lembre-se de propor soluções coletivas para o lixo.",
        },
      ],
    },
  },
  {
    slug: "festival-das-aves",
    title: "Festival das Aves",
    prompt: "Coordene a equipe para observar aves sem perturbar seus comportamentos.",
    summary: "Mini-jogo cooperativo sobre observação responsável.",
    type: "GAME",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03", "EF01CI04"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "observação cuidadosa e registro de aves",
    category: "Expedição cooperativa",
    duration: 14,
    assetSlug: "cn-animal-tucano",
    assetUsage: "A imagem do tucano inspira cuidados durante a observação de aves coloridas.",
    familyTip:
      "Combine com as famílias um passeio para observar aves em praças, registrando sons e cores.",
    learningObjectives: [
      "Planejar observações de aves respeitando seu espaço.",
      "Registrar cores, sons e comportamentos de forma colaborativa.",
    ],
    description:
      "Festival das Aves integra cooperação, registro e ética na observação de animais da vizinhança.",
    cooperative: true,
    crossCurricular: ["Arte", "Língua Portuguesa"],
    metadataExtra: {
      instrumentos: ["Binóculos artesanais", "Caderno de campo coletivo"],
    },
    game: {
      victoryMessage: "Expedição bem-sucedida! As aves foram observadas com respeito.",
      gameOverMessage: "Reorganizem os turnos de observação e tentem novamente com mais calma.",
      timeLimitSeconds: 95,
      lives: 4,
      levels: [
        {
          challenge: "Uma ave colorida pousa num galho baixo. Como registrar sem assustá-la?",
          answer: "Observar em silêncio e anotar cores à distância",
          hint: "Evite movimentos bruscos e aproximação.",
          success: "Excelente! Observação silenciosa protege a ave.",
          failure: "Reflita: chegar perto demais pode assustar a ave.",
        },
        {
          challenge: "A equipe quer tocar flauta para chamar os pássaros.",
          answer: "Usar sons suaves apenas após combinar com o educador",
          hint: "Pense no impacto do som nos animais.",
          success: "Boa escolha! Sons suaves planejados evitam estresse.",
          failure: "Considere que sons fortes podem afastar as aves.",
        },
        {
          challenge: "Choveu e o caminho ficou escorregadio perto dos ninhos.",
          answer: "Redesenhar a rota e manter distância segura das árvores",
          hint: "Proteja o grupo e os ninhos.",
          success: "Muito bem! Distância segura garante proteção aos ninhos.",
          failure: "Reflita sobre segurança ao redor dos ninhos durante a chuva.",
        },
      ],
    },
  },
];

const animaisDaVizinhanca: ModuleDefinition = {
  slug: "animais-da-vizinhanca",
  title: "Animais da Vizinhança",
  subtitle: "Características e habitats próximos da comunidade",
  description:
    "Sequência investigativa que explora animais presentes na vizinhança da escola, relacionando sons, movimentos, alimentação e proteção dos habitats.",
  theme: "Ciências",
  discipline: "Ciências",
  ageGroupSlug: "fundamental-anos-iniciais",
  learningPathSlug: "exploradores-da-natureza",
  primaryBnccCode: "EF01CI03",
  secondaryBnccCodes: ["EF01CI04"],
  learningOutcomes: [
    "Identificar características físicas e comportamentos de animais presentes no cotidiano da turma.",
    "Relacionar animais aos habitats e recursos que garantem alimentação e proteção.",
    "Planejar atitudes coletivas que respeitam e preservam a biodiversidade local.",
  ],
  tags: ["animais", "biodiversidade", "habitats", "investigacao"],
  estimatedDurationMinutes: 185,
  summary:
    "Com 12 atividades, a turma observa, investiga e protege animais da vizinhança por meio de quizzes, puzzles e mini-jogos cooperativos.",
  activities: animaisDaVizinhancaActivities,
};

const plantasQueCuidamosActivities: ActivityDefinition[] = [
  {
    slug: "partes-da-planta",
    title: "Partes da Planta",
    prompt: "Observe a ilustração e escolha a parte correta da planta descrita.",
    summary: "Quiz introdutório sobre raízes, caules, folhas e flores.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "identificação de partes das plantas",
    category: "Anatomia vegetal",
    duration: 8,
    assetSlug: "cn-material-lupa",
    assetUsage: "Use a lupa para destacar detalhes das folhas, flores e raízes em plantas reais.",
    familyTip:
      "Convide as famílias a observar plantas domésticas identificando raiz, caule, folhas e flores com etiquetas coloridas.",
    learningObjectives: [
      "Reconhecer as principais partes das plantas e suas funções básicas.",
      "Registrar observações simples em linguagem oral e visual.",
    ],
    description:
      "Partes da Planta apresenta imagens ampliadas que ajudam a diferenciar estruturas vegetais e suas funções.",
    cooperative: false,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      recursoVisual: "Cartaz com partes da planta destacadas.",
    },
    quiz: {
      question: {
        prompt: "Qual parte da planta transporta água e nutrientes para as folhas?",
        hint: "Observe o que liga as raízes às folhas.",
        options: [
          {
            text: "Caule",
            isCorrect: true,
            feedback: "Muito bem! O caule leva água e nutrientes até as folhas.",
          },
          {
            text: "Flor",
            isCorrect: false,
            feedback: "A flor ajuda na reprodução, não transporta nutrientes.",
          },
          {
            text: "Fruto",
            isCorrect: false,
            feedback: "O fruto protege a semente, não faz transporte.",
          },
        ],
      },
      trueFalse: {
        prompt: "As raízes ajudam a fixar a planta no solo e a absorver água?",
        hint: "Lembre-se de onde a planta fica presa.",
        statement: "Raízes fixam a planta e absorvem água do solo.",
        answer: true,
        trueFeedback: "Perfeito! As raízes garantem firmeza e absorvem água.",
        falseFeedback: "Reflita: raízes são responsáveis por garantir água e sustentação.",
      },
    },
  },
  {
    slug: "ciclo-da-plantinha",
    title: "Ciclo da Plantinha",
    prompt: "Acompanhe a sequência e escolha o que acontece em cada etapa do crescimento.",
    summary: "Quiz narrativo sobre germinação, crescimento e florescimento.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "sequência de desenvolvimento das plantas",
    category: "Ciclo de vida",
    duration: 9,
    assetSlug: "cn-natureza-rio",
    assetUsage:
      "Mostre a paisagem do rio para falar sobre ambientes que favorecem o crescimento das plantas.",
    familyTip:
      "Peça às famílias que fotografem uma planta ao longo da semana registrando mudanças.",
    learningObjectives: [
      "Ordenar etapas do ciclo de vida de uma planta de forma simples.",
      "Descrever fatores que ajudam a planta a crescer saudável.",
    ],
    description:
      "Ciclo da Plantinha reforça a observação das fases de crescimento e os cuidados necessários em cada uma.",
    cooperative: true,
    crossCurricular: ["Matemática", "Arte"],
    metadataExtra: {
      linhaDoTempo: "Linha do tempo com cartões de germinação.",
    },
    quiz: {
      question: {
        prompt: "Depois que a semente rompe a casca, o que costuma aparecer primeiro?",
        hint: "Observe o que surge para procurar água no solo.",
        options: [
          {
            text: "Uma raiz fininha em direção ao solo",
            isCorrect: true,
            feedback: "Isso mesmo! A raiz cresce primeiro para buscar água e nutrientes.",
          },
          {
            text: "Flores coloridas",
            isCorrect: false,
            feedback: "As flores aparecem apenas em etapas avançadas.",
          },
          {
            text: "Frutos maduros",
            isCorrect: false,
            feedback: "Os frutos nascem somente depois das flores.",
          },
        ],
      },
      trueFalse: {
        prompt: "As folhas surgem para produzir alimento com ajuda do sol e da água?",
        hint: "Lembre-se da fotossíntese.",
        statement: "Folhas produzem alimento usando sol, água e ar.",
        answer: true,
        trueFeedback: "Correto! As folhas fazem fotossíntese para alimentar a planta.",
        falseFeedback: "Reflita: folhas transformam luz em alimento para a planta.",
      },
    },
  },
  {
    slug: "agua-e-luz",
    title: "Água e Luz",
    prompt: "Analise os cenários e escolha o melhor cuidado para cada planta.",
    summary: "Quiz sobre necessidades de água, luz e solo.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03", "EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "condições para o cuidado das plantas",
    category: "Cuidados essenciais",
    duration: 10,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "Utilize a floresta para comparar áreas de sol, sombra e umidade.",
    familyTip:
      "Convide as famílias a observar horários de sol nas janelas e ajustar a posição das plantas em casa.",
    learningObjectives: [
      "Identificar necessidades de água e luz para diferentes tipos de plantas.",
      "Justificar escolhas de cuidado a partir de observações do ambiente.",
    ],
    description:
      "Água e Luz apresenta situações reais para decidir como cuidar das plantas da escola.",
    cooperative: true,
    crossCurricular: ["Matemática", "Língua Portuguesa"],
    metadataExtra: {
      registroCuidados: "Planilha com frequência de rega e exposição ao sol.",
    },
    quiz: {
      question: {
        prompt: "A horta da escola recebeu muito sol e o solo está seco. O que devemos fazer?",
        hint: "Observe que a planta precisa repor água.",
        options: [
          {
            text: "Regar no final da tarde com água suficiente",
            isCorrect: true,
            feedback: "Excelente! Regar ao final do dia evita choque térmico e hidrata o solo.",
          },
          {
            text: "Cobrir as folhas com plástico",
            isCorrect: false,
            feedback: "Cobrir as folhas impede a respiração da planta.",
          },
          {
            text: "Adicionar sal para reter água",
            isCorrect: false,
            feedback: "Sal pode prejudicar as raízes e secar o solo.",
          },
        ],
      },
      trueFalse: {
        prompt: "Algumas plantas gostam de sombra e precisam ficar longe do sol direto?",
        hint: "Pense em samambaias e plantas de folhas delicadas.",
        statement: "Existem plantas que preferem ambientes sombreados para crescer bem.",
        answer: true,
        trueFeedback: "Isso mesmo! Plantas de sombra precisam de luz indireta.",
        falseFeedback:
          "Reflita: nem todas as plantas suportam sol direto; algumas preferem sombra.",
      },
    },
  },
  {
    slug: "amizades-ecologicas",
    title: "Amizades Ecológicas",
    prompt: "Descubra como plantas e outros seres vivos colaboram na natureza.",
    summary: "Quiz sobre relações entre plantas, animais e pessoas.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04", "EF01CI03"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "relações de convivência em ambientes compartilhados",
    category: "Cooperação na natureza",
    duration: 10,
    assetSlug: "cn-animal-tucano",
    assetUsage: "O tucano ajuda a ilustrar a dispersão de sementes e a convivência com plantas.",
    familyTip:
      "Sugira às famílias conversar sobre como pássaros, insetos e pessoas ajudam a cuidar das plantas.",
    learningObjectives: [
      "Identificar parcerias entre plantas, animais e humanos no ambiente escolar.",
      "Explicar como essas relações favorecem a convivência e a preservação.",
    ],
    description:
      "Amizades Ecológicas destaca como diferentes seres vivos dependem uns dos outros para viver bem.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Geografia"],
    metadataExtra: {
      muralColaborativo: "Mural com fotos de plantas e parceiros da escola.",
    },
    quiz: {
      question: {
        prompt: "Quando o tucano come frutas e deixa as sementes cair, o que acontece?",
        hint: "Pense em como as sementes chegam a novos lugares.",
        options: [
          {
            text: "As sementes podem germinar em outro local",
            isCorrect: true,
            feedback: "Correto! O tucano espalha sementes, ajudando novas plantas a nascer.",
          },
          {
            text: "As sementes desaparecem para sempre",
            isCorrect: false,
            feedback: "As sementes continuam vivas e podem germinar.",
          },
          {
            text: "As sementes viram pedras",
            isCorrect: false,
            feedback: "Sementes não se transformam em pedras; elas germinam.",
          },
        ],
      },
      trueFalse: {
        prompt: "Quando regamos as plantas da escola, ajudamos a comunidade a ficar mais fresca?",
        hint: "Observe como plantas oferecem sombra e umidade.",
        statement: "Cuidar das plantas refresca o ambiente e melhora a convivência.",
        answer: true,
        trueFeedback: "Isso mesmo! Plantas bem cuidadas deixam o espaço mais fresco e agradável.",
        falseFeedback: "Reflita: plantas hidratadas e saudáveis ajudam a refrescar o ambiente.",
      },
    },
  },
  {
    slug: "sequencia-do-plantio",
    title: "Sequência do Plantio",
    prompt: "Organize os cuidados na ordem correta para plantar sementes.",
    summary: "Quebra-cabeça sobre etapas de plantio e preparo do solo.",
    type: "PUZZLE",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "sequenciamento de ações de plantio",
    category: "Planejamento do plantio",
    duration: 11,
    assetSlug: "cn-higiene-lavar-maos",
    assetUsage:
      "Mostre a lavagem das mãos para lembrar da higiene antes e depois de manusear o solo.",
    familyTip:
      "Convide as famílias a plantar sementes em copos recicláveis registrando cada etapa.",
    learningObjectives: [
      "Ordenar etapas de plantio considerando preparo do solo, semeadura e rega.",
      "Explicar por que cada passo é importante para o crescimento.",
    ],
    description:
      "Sequência do Plantio reforça a importância de seguir passos para que sementes germinem com sucesso.",
    cooperative: true,
    crossCurricular: ["Matemática", "Língua Portuguesa"],
    metadataExtra: {
      guiaImpresso: "Guia com ilustrações das etapas do plantio.",
    },
    puzzle: {
      successFeedback: "Muito bem! As sementes foram plantadas na ordem correta.",
      errorFeedback: "Voltem às pistas e reorganizem a ordem das ações.",
      pairs: [
        {
          prompt: "Preparar o vaso com solo fofo",
          match: "Primeiro passo antes de colocar a semente",
          hint: "Pense no que vem antes da semeadura.",
          feedback: "O solo pronto recebe melhor a semente.",
        },
        {
          prompt: "Colocar a semente na profundidade certa",
          match: "Etapa após preparar o solo",
          hint: "O que fazemos logo após o vaso estar pronto?",
          feedback: "Semear na profundidade correta favorece a germinação.",
        },
        {
          prompt: "Cobrir levemente com terra",
          match: "Protege a semente e mantém umidade",
          hint: "Pense no cuidado logo depois de semear.",
          feedback: "Cobrir a semente ajuda a reter umidade.",
        },
        {
          prompt: "Regar com delicadeza",
          match: "Finaliza o plantio e ativa a germinação",
          hint: "Qual passo finaliza o plantio?",
          feedback: "Regar suavemente acorda a semente.",
        },
      ],
    },
  },
  {
    slug: "mapa-das-raizes",
    title: "Mapa das Raízes",
    prompt: "Associe cada tipo de raiz ao ambiente onde se desenvolve melhor.",
    summary: "Quebra-cabeça sobre diferentes tipos de raiz e suas funções.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "adaptação das raízes aos ambientes",
    category: "Exploração do solo",
    duration: 10,
    assetSlug: "cn-natureza-rio",
    assetUsage: "Use a imagem do rio para falar sobre solos úmidos e margens.",
    familyTip:
      "Peça às famílias que pesquisem raízes de plantas alimentícias e compartilhem exemplos.",
    learningObjectives: [
      "Comparar diferentes formatos de raízes e suas funções.",
      "Relacionar ambientes a tipos de raiz que se adaptam melhor.",
    ],
    description:
      "Mapa das Raízes apresenta exemplos de raízes superficiais, profundas e aéreas para ampliar o repertório da turma.",
    cooperative: true,
    crossCurricular: ["Geografia", "Arte"],
    metadataExtra: {
      maqueteSolo: "Camadas do solo representadas com materiais recicláveis.",
    },
    puzzle: {
      successFeedback: "Ótimo! Vocês ligaram as raízes aos ambientes corretos.",
      errorFeedback: "Reobservem cada pista e pensem onde cada raiz se fixa melhor.",
      pairs: [
        {
          prompt: "Raiz superficial de gramínea",
          match: "Jardins e gramados com solo raso",
          hint: "Onde a raiz fica pertinho da superfície?",
          feedback: "Gramíneas espalham raízes rasas pelo solo.",
        },
        {
          prompt: "Raiz profunda de árvore alta",
          match: "Áreas com solo firme e profundo",
          hint: "Qual ambiente precisa de raízes fortes para sustentar?",
          feedback: "Árvores grandes usam raízes profundas para se firmar.",
        },
        {
          prompt: "Raiz aérea de planta trepadeira",
          match: "Muros e troncos úmidos",
          hint: "Pense em raízes que se prendem no ar.",
          feedback: "Raízes aéreas aderem a muros e troncos úmidos.",
        },
        {
          prompt: "Raiz em forma de tubérculo",
          match: "Horta com solo rico em nutrientes",
          hint: "Qual raiz armazena energia para a planta?",
          feedback: "Tubérculos acumulam nutrientes em solos férteis.",
        },
      ],
    },
  },
  {
    slug: "usos-das-plantas",
    title: "Usos das Plantas",
    prompt: "Relacione cada planta ao uso cotidiano correspondente.",
    summary: "Quebra-cabeça sobre plantas alimentares, medicinais e ornamentais.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03"],
    secondaryHabilidades: ["EF01CI04"],
    focus: "utilidades das plantas na comunidade",
    category: "Plantas e cotidiano",
    duration: 10,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta ilustra a diversidade de plantas úteis.",
    familyTip: "Peça às famílias que listem plantas usadas em casa para alimentação ou cuidados.",
    learningObjectives: [
      "Reconhecer diferentes usos das plantas no dia a dia.",
      "Valorizar a diversidade vegetal presente na comunidade.",
    ],
    description:
      "Usos das Plantas evidencia como diferentes espécies contribuem para alimentação, saúde e embelezamento.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      feiraEscolar: "Organizar uma feira com produtos de origem vegetal.",
    },
    puzzle: {
      successFeedback: "Muito bom! Vocês conectaram as plantas aos seus usos.",
      errorFeedback: "Releiam os usos e pensem qual planta os oferece.",
      pairs: [
        {
          prompt: "Babosa",
          match: "Alivia pequenas queimaduras na pele",
          hint: "Qual planta tem gel refrescante?",
          feedback: "A babosa tem gel calmante para a pele.",
        },
        {
          prompt: "Manjericão",
          match: "Tempero fresco para refeições",
          hint: "Qual planta perfuma o molho?",
          feedback: "Manjericão deixa os pratos mais saborosos.",
        },
        {
          prompt: "Girassol",
          match: "Enfeita jardins e acompanha a luz do sol",
          hint: "Qual planta é conhecida por seguir o sol?",
          feedback: "Girassóis deixam o ambiente colorido e acompanham o sol.",
        },
        {
          prompt: "Mandioca",
          match: "Fornece tubérculos para farinhas e pães",
          hint: "Qual planta vira farinha quando cozida?",
          feedback: "A mandioca dá origem a diferentes alimentos.",
        },
      ],
    },
  },
  {
    slug: "alertas-do-jardim",
    title: "Alertas do Jardim",
    prompt: "Associe o sinal observado ao cuidado que precisa ser realizado.",
    summary: "Quebra-cabeça sobre sinais de plantas saudáveis ou com problemas.",
    type: "PUZZLE",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04", "EF01CI03"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "monitoramento e manutenção das plantas",
    category: "Diagnóstico do jardim",
    duration: 12,
    assetSlug: "cn-material-lupa",
    assetUsage: "Use a lupa para observar manchas e texturas das folhas.",
    familyTip:
      "Oriente as famílias a observar plantas de casa em busca de manchas, pragas ou falta de água e registrar como resolveram.",
    learningObjectives: [
      "Identificar sinais que indicam necessidade de cuidado nas plantas.",
      "Planejar ações de manutenção para manter o jardim saudável.",
    ],
    description:
      "Alertas do Jardim desenvolve a capacidade de interpretar sinais e propor soluções coletivas.",
    cooperative: true,
    crossCurricular: ["Matemática", "Língua Portuguesa"],
    metadataExtra: {
      agendaDeCuidado: "Agenda semanal com responsáveis pelos cuidados.",
    },
    puzzle: {
      successFeedback: "Excelente! As plantas receberam os cuidados necessários.",
      errorFeedback: "Releiam cada alerta e discutam qual ação resolve o problema.",
      pairs: [
        {
          prompt: "Folhas amareladas e solo encharcado",
          match: "Diminuir a rega e garantir drenagem",
          hint: "Talvez tenha água demais.",
          feedback: "Menos água e solo drenado evitam raízes sufocadas.",
        },
        {
          prompt: "Planta murchando com solo seco",
          match: "Regar lentamente até umedecer todo o vaso",
          hint: "Pode faltar água.",
          feedback: "Rega cuidadosamente restaura a energia da planta.",
        },
        {
          prompt: "Folhas com furos pequenos",
          match: "Verificar presença de insetos e remover manualmente",
          hint: "Observe possíveis visitantes mastigando folhas.",
          feedback: "Investigar insetos evita que se espalhem.",
        },
        {
          prompt: "Planta com pouca luz e caule fino",
          match: "Mover para local com mais claridade",
          hint: "Talvez precise de mais sol.",
          feedback: "Mais luz fortalece o crescimento da planta.",
        },
      ],
    },
  },
  {
    slug: "laboratorio-do-plantio",
    title: "Laboratório do Plantio",
    prompt: "Escolha os materiais e as ações corretas para montar um experimento de germinação.",
    summary: "Mini-jogo sobre planejamento de experimentos simples com plantas.",
    type: "GAME",
    difficulty: "INICIAR",
    bnccCode: "EF01CI03",
    habilidades: ["EF01CI03", "EF01CI04"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "planejamento e execução de experimento de germinação",
    category: "Experimentação guiada",
    duration: 12,
    assetSlug: "cn-material-lupa",
    assetUsage: "A lupa inspira registro detalhado das mudanças durante a germinação.",
    familyTip:
      "Peça às famílias que acompanhem o crescimento de uma semente em algodão anotando mudanças.",
    learningObjectives: [
      "Selecionar materiais e passos necessários para germinar sementes.",
      "Registrar observações diárias em formato colaborativo.",
    ],
    description:
      "Laboratório do Plantio apoia a turma na organização de experimentos acessíveis com sementes e luz natural.",
    cooperative: true,
    crossCurricular: ["Matemática", "Língua Portuguesa"],
    metadataExtra: {
      cadernoExperimento: "Tabela para anotar dia, hora e mudanças observadas.",
    },
    game: {
      victoryMessage: "Experimento concluído! As sementes começaram a germinar.",
      gameOverMessage: "Ajustem materiais e horários para repetir o experimento com sucesso.",
      timeLimitSeconds: 80,
      lives: 3,
      levels: [
        {
          challenge: "Qual material precisamos usar para manter a semente úmida sem encharcar?",
          answer: "Algodão ou papel toalha úmido",
          hint: "Pense em algo que absorve água sem exagero.",
          success: "Certo! Algodão mantém a umidade ideal.",
          failure: "Reflita sobre materiais que seguram água sem afogar a semente.",
        },
        {
          challenge: "Onde posicionar o pote para a semente receber luz suficiente?",
          answer: "Perto de uma janela com luz indireta",
          hint: "Lembre-se de controlar a intensidade da luz.",
          success: "Muito bem! Luz indireta aquece sem queimar a semente.",
          failure: "Considere um local com claridade suave.",
        },
        {
          challenge: "Qual registro devemos fazer durante o experimento?",
          answer: "Anotar diariamente a data e as mudanças observadas",
          hint: "Pense no que ajuda a comparar resultados.",
          success: "Excelente! Registros diários mostram como a semente evolui.",
          failure: "Reflita: registrar diariamente facilita comparar mudanças.",
        },
      ],
    },
  },
  {
    slug: "guardioes-do-jardim",
    title: "Guardiões do Jardim",
    prompt: "Trabalhe em equipe para decidir ações que mantêm o jardim saudável.",
    summary: "Mini-jogo cooperativo com missões de manutenção do jardim escolar.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04", "EF01CI03"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "cuidado coletivo com o jardim da escola",
    category: "Missões colaborativas",
    duration: 13,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta lembra que jardins saudáveis acolhem biodiversidade.",
    familyTip:
      "Pergunte às famílias como colaboram com hortas ou vasos em casa e compartilhem boas práticas.",
    learningObjectives: [
      "Planejar e distribuir tarefas de cuidado do jardim entre os colegas.",
      "Avaliar impactos das ações realizadas nos ambientes da escola.",
    ],
    description: "Guardiões do Jardim propõe desafios reais para manter o jardim vivo e acolhedor.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Matemática"],
    metadataExtra: {
      quadroDeTurnos: "Escala semanal de cuidados compartilhados.",
    },
    game: {
      victoryMessage: "Jardim protegido! Cada planta recebeu os cuidados necessários.",
      gameOverMessage: "Reorganizem a escala de tarefas e voltem a cuidar do jardim.",
      timeLimitSeconds: 90,
      lives: 3,
      levels: [
        {
          challenge: "Após um final de semana sem cuidados, algumas plantas estão secas.",
          answer: "Organizar mutirão para regar e aparar folhas secas",
          hint: "Pense em atitudes coletivas de recuperação.",
          success: "Ótima decisão! Mutirão revitaliza as plantas rapidamente.",
          failure: "Reflita: trabalhar em equipe acelera a recuperação.",
        },
        {
          challenge: "Alunos jogaram papel perto da horta por descuido.",
          answer: "Recolher o lixo e reforçar combinados de cuidado",
          hint: "Escolha ação que limpa e educa.",
          success: "Muito bem! Limpeza e diálogo preservam o espaço.",
          failure: "Considere limpar e conversar sobre os combinados.",
        },
        {
          challenge: "Uma semana chuvosa deixou o solo encharcado.",
          answer: "Verificar drenagem e deixar vasos em local protegido",
          hint: "Evite excesso de água nas raízes.",
          success: "Excelente! Cuidar da drenagem protege as plantas.",
          failure: "Reflita sobre como evitar que a raiz fique afogada.",
        },
      ],
    },
  },
  {
    slug: "rota-das-sementes",
    title: "Rota das Sementes",
    prompt: "Planeje o caminho das sementes até encontrarem um lugar seguro para brotar.",
    summary: "Mini-jogo estratégico sobre dispersão e plantio em novos espaços.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04", "EF01CI03"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "dispersão de sementes e ocupação dos espaços",
    category: "Exploração territorial",
    duration: 12,
    assetSlug: "cn-natureza-rio",
    assetUsage: "A paisagem do rio mostra como a água pode levar sementes a outros lugares.",
    familyTip:
      "Sugira que as famílias fabriquem cataventos ou aviõezinhos para simular sementes ao vento.",
    learningObjectives: [
      "Identificar diferentes formas de dispersão das sementes.",
      "Planejar percursos que respeitem o equilíbrio entre plantas e pessoas.",
    ],
    description:
      "Rota das Sementes convida a turma a distribuir sementes por caminhos seguros, considerando vento, água e animais.",
    cooperative: true,
    crossCurricular: ["Matemática", "Geografia"],
    metadataExtra: {
      mapaInterativo: "Mapa da escola com áreas reservadas para novos canteiros.",
    },
    game: {
      victoryMessage: "Sementes distribuídas! Novos canteiros estão prontos para nascer.",
      gameOverMessage: "Revejam os caminhos e tentem novamente levando em conta vento e água.",
      timeLimitSeconds: 85,
      lives: 3,
      levels: [
        {
          challenge: "Como levar sementes leves para um canteiro distante?",
          answer: "Usar o vento controlado com aeradores ou cataventos",
          hint: "Pense em dispersão pelo ar.",
          success: "Certo! O vento leva sementes leves com cuidado.",
          failure: "Considere usar o vento a favor para sementes leves.",
        },
        {
          challenge: "Sementes pesadas precisam chegar a uma área próxima ao rio.",
          answer: "Transportar com apoio de recipientes e plantar perto das margens",
          hint: "Pense em transporte manual e seguro.",
          success: "Ótimo! Levar manualmente evita que a corrente leve as sementes.",
          failure: "Reflita: sementes pesadas precisam de transporte direto.",
        },
        {
          challenge: "Queremos atrair pássaros para ajudar na dispersão.",
          answer: "Criar pontos com frutos e água para os pássaros visitarem",
          hint: "Pense em oferecer alimento para visitantes.",
          success: "Excelente! Pássaros levam sementes ao se alimentarem.",
          failure: "Considere oferecer recursos para atrair pássaros.",
        },
      ],
    },
  },
  {
    slug: "festival-das-plantas",
    title: "Festival das Plantas",
    prompt: "Organize uma exposição cooperativa mostrando como cuidar das plantas da escola.",
    summary: "Mini-jogo de planejamento de evento educativo sobre plantas.",
    type: "GAME",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04", "EF01CI03"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "planejamento coletivo e comunicação sobre cuidados com plantas",
    category: "Produção colaborativa",
    duration: 14,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta inspira a diversidade que pode ser apresentada no festival.",
    familyTip:
      "Convide as famílias para visitar o festival trazendo receitas, histórias ou mudas para troca.",
    learningObjectives: [
      "Organizar coletivamente ações de cuidado e divulgação sobre plantas.",
      "Comunicar descobertas para a comunidade escolar com diferentes linguagens.",
    ],
    description:
      "Festival das Plantas integra planejamento, comunicação e cuidado coletivo para celebrar a natureza na escola.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      produtosFinais: ["Painel de cuidados", "Exposição de mudas", "Oficina de compostagem"],
    },
    game: {
      victoryMessage:
        "Festival realizado! A comunidade aprendeu novas formas de cuidar das plantas.",
      gameOverMessage: "Reorganizem tarefas e recursos para tentar novamente com mais calma.",
      timeLimitSeconds: 95,
      lives: 4,
      levels: [
        {
          challenge: "Precisamos explicar como cada turma cuidou da horta.",
          answer: "Preparar cartazes com fotos e relatos curtos",
          hint: "Escolha um formato acessível para o público.",
          success: "Ótimo! Cartazes contam a história dos cuidados.",
          failure: "Considere usar imagens e textos curtos para explicar.",
        },
        {
          challenge: "Queremos incluir a família no festival.",
          answer: "Organizar uma roda de conversa com partilhas de cuidados",
          hint: "Pense em atividades participativas.",
          success: "Excelente! Roda de conversa aproxima a comunidade.",
          failure: "Reflita sobre abrir espaço para relatos das famílias.",
        },
        {
          challenge: "Faltam mudas para presentear os visitantes.",
          answer: "Produzir novos vasos reutilizando materiais da escola",
          hint: "Busque solução sustentável.",
          success: "Muito bem! Reutilizar materiais gera mais mudas para compartilhar.",
          failure: "Considere reutilizar materiais para multiplicar as mudas.",
        },
      ],
    },
  },
];

const plantasQueCuidamos: ModuleDefinition = {
  slug: "plantas-que-cuidamos",
  title: "Plantas que Cuidamos",
  subtitle: "Cultivar, observar e preservar o verde da escola",
  description:
    "Sequência que aproxima a turma dos cuidados com plantas, explorando ciclos de vida, necessidades ambientais e ações coletivas de preservação.",
  theme: "Ciências",
  discipline: "Ciências",
  ageGroupSlug: "fundamental-anos-iniciais",
  learningPathSlug: "exploradores-da-natureza",
  primaryBnccCode: "EF01CI03",
  secondaryBnccCodes: ["EF01CI04"],
  learningOutcomes: [
    "Investigar ciclos de vida das plantas relacionando etapas a cuidados concretos.",
    "Planejar experiências simples de plantio e registrar observações colaborativas.",
    "Articular ações coletivas que preservam canteiros e jardins da comunidade escolar.",
  ],
  tags: ["plantas", "horta", "sustentabilidade", "cuidado-coletivo"],
  estimatedDurationMinutes: 185,
  summary:
    "Doze atividades que combinam plantio, monitoramento e celebração das plantas com jogos cooperativos e puzzles investigativos.",
  activities: plantasQueCuidamosActivities,
};

const ambientesDaEscolaActivities: ActivityDefinition[] = [
  {
    slug: "mapa-da-escola",
    title: "Mapa da Escola",
    prompt: "Observe o mapa ilustrado e identifique o espaço que o enunciado descreve.",
    summary: "Quiz que reconhece espaços escolares e suas funções.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "reconhecimento de espaços da escola",
    category: "Cartografia escolar",
    duration: 8,
    assetSlug: "cn-material-lupa",
    assetUsage: "Use a lupa para localizar detalhes como portas, jardins e quadras no mapa.",
    familyTip:
      "Peça às famílias que façam um mapa simples de casa com os espaços preferidos das crianças.",
    learningObjectives: [
      "Identificar espaços da escola e suas finalidades.",
      "Relacionar cuidados específicos a cada ambiente escolar.",
    ],
    description:
      "Mapa da Escola apresenta plantas baixas simples para localizar ambientes e discutir combinações de uso.",
    cooperative: false,
    crossCurricular: ["Geografia", "Matemática"],
    metadataExtra: {
      recursoMapa: "Mapa ampliado da escola com legendas.",
    },
    quiz: {
      question: {
        prompt: "Qual espaço da escola é indicado para leitura silenciosa e organização de livros?",
        hint: "Procure um local com estantes e mesas confortáveis.",
        options: [
          {
            text: "Biblioteca",
            isCorrect: true,
            feedback: "Correto! A biblioteca é dedicada à leitura e empréstimo de livros.",
          },
          {
            text: "Quadra",
            isCorrect: false,
            feedback: "A quadra é usada para jogos e educação física.",
          },
          {
            text: "Refeitório",
            isCorrect: false,
            feedback: "O refeitório é destinado às refeições.",
          },
        ],
      },
      trueFalse: {
        prompt: "A quadra precisa de calçados adequados e combinados para evitar acidentes?",
        hint: "Lembre-se das orientações antes das aulas de educação física.",
        statement: "Usar calçados adequados na quadra evita escorregões e machucados.",
        answer: true,
        trueFeedback: "Muito bem! Cuidado com o calçado mantém a quadra segura.",
        falseFeedback: "Reflita: calçados adequados protegem durante as atividades esportivas.",
      },
    },
  },
  {
    slug: "circuito-da-limpeza",
    title: "Circuito da Limpeza",
    prompt: "Leia as situações e escolha o cuidado adequado para manter os espaços limpos.",
    summary: "Quiz sobre hábitos de limpeza e organização nos ambientes escolares.",
    type: "QUIZ",
    difficulty: "INICIAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "hábitos de higiene em diferentes espaços",
    category: "Cuidado ambiental",
    duration: 9,
    assetSlug: "cn-higiene-lavar-maos",
    assetUsage: "A ilustração lembra a importância de higienizar as mãos após cuidar dos espaços.",
    familyTip:
      "Combine com as famílias uma tabela de cuidados com o quarto ou área de estudos da criança.",
    learningObjectives: [
      "Identificar atitudes de higiene adequadas para cada ambiente escolar.",
      "Planejar rotinas simples de organização compartilhada.",
    ],
    description:
      "Circuito da Limpeza apresenta exemplos práticos que reforçam a responsabilidade coletiva.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Matemática"],
    metadataExtra: {
      checkList: "Checklist semanal de tarefas coletivas.",
    },
    quiz: {
      question: {
        prompt: "O que fazer ao terminar o lanche no refeitório?",
        hint: "Pense em manter o espaço limpo para outras turmas.",
        options: [
          {
            text: "Guardar restos no lixo correto e limpar a mesa com pano úmido",
            isCorrect: true,
            feedback: "Excelente! Assim o espaço fica limpo para os próximos colegas.",
          },
          {
            text: "Deixar restos sobre a mesa para os funcionários recolherem",
            isCorrect: false,
            feedback: "É importante colaborar e descartar corretamente.",
          },
          {
            text: "Levar a bandeja para a quadra",
            isCorrect: false,
            feedback: "Materiais do refeitório devem ser guardados no próprio refeitório.",
          },
        ],
      },
      trueFalse: {
        prompt: "Manter as pias limpas e jogar papel no lixo ajuda a evitar entupimentos?",
        hint: "Observe as orientações da equipe de limpeza.",
        statement: "Descartar papéis no lixo preserva canos e evita mau cheiro.",
        answer: true,
        trueFeedback: "Correto! Essa atitude protege o espaço e facilita o trabalho de todos.",
        falseFeedback: "Reflita: papéis no lixo evitam entupimentos e cheiros ruins.",
      },
    },
  },
  {
    slug: "clima-da-sala",
    title: "Clima da Sala",
    prompt: "Escolha atitudes que deixam a sala acolhedora e organizada para todos.",
    summary: "Quiz sobre convivência e organização na sala de aula.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "convivência e organização na sala",
    category: "Cultura de sala",
    duration: 10,
    assetSlug: "cn-natureza-floresta",
    assetUsage:
      "A floresta ilustra diversidade e equilíbrio, inspirando combinados de convivência.",
    familyTip:
      "Converse com as famílias sobre combinados de convivência e organização no espaço de estudos.",
    learningObjectives: [
      "Identificar comportamentos que favorecem o convívio respeitoso na sala.",
      "Planejar combinados para manter materiais organizados e acessíveis.",
    ],
    description:
      "Clima da Sala fortalece a criação de combinados que valorizam respeito e organização compartilhada.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      muralCombinados: "Mural de combinados construído pela turma.",
    },
    quiz: {
      question: {
        prompt: "Como cuidar dos materiais coletivos após uma atividade artística?",
        hint: "Pense em como facilitar o uso para a próxima turma.",
        options: [
          {
            text: "Limpar pincéis, guardar tintas e organizar mesas",
            isCorrect: true,
            feedback: "Ótimo! Materiais limpos e guardados ficam prontos para os colegas.",
          },
          {
            text: "Deixar os pincéis na água até o dia seguinte",
            isCorrect: false,
            feedback: "A água suja estraga os pincéis; eles precisam ser lavados.",
          },
          {
            text: "Guardar tudo sem limpar",
            isCorrect: false,
            feedback: "É importante limpar antes de guardar para evitar sujeira.",
          },
        ],
      },
      trueFalse: {
        prompt: "Combinar turnos de fala ajuda a turma a se escutar melhor?",
        hint: "Relembre as rodas de conversa.",
        statement: "Turnos de fala organizados favorecem o respeito e a escuta ativa.",
        answer: true,
        trueFeedback: "Perfeito! Respeitar turnos garante que todas as vozes sejam ouvidas.",
        falseFeedback: "Reflita: quando respeitamos turnos, todos conseguem participar.",
      },
    },
  },
  {
    slug: "rota-da-seguranca",
    title: "Rota da Segurança",
    prompt: "Leia os avisos e escolha o procedimento correto para manter todos seguros.",
    summary: "Quiz sobre regras de segurança e circulação pelos ambientes.",
    type: "QUIZ",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "segurança e circulação responsável na escola",
    category: "Proteção coletiva",
    duration: 10,
    assetSlug: "cn-animal-boto",
    assetUsage: "O boto lembra a importância de atenção e orientação em deslocamentos coletivos.",
    familyTip:
      "Peça às famílias que discutam rotas seguras para chegar à escola e regras de travessia.",
    learningObjectives: [
      "Reconhecer sinais e orientações de segurança nos ambientes escolares.",
      "Aplicar combinados que garantem circulação segura pelos espaços.",
    ],
    description:
      "Rota da Segurança reforça o cuidado com escadas, corredores e entradas utilizadas diariamente.",
    cooperative: false,
    crossCurricular: ["Matemática", "Geografia"],
    metadataExtra: {
      mapaSeguranca: "Mapa com rotas de saída e pontos de encontro.",
    },
    quiz: {
      question: {
        prompt: "Ao descer a escada com a turma, qual atitude é a mais segura?",
        hint: "Pense no que evita quedas e empurrões.",
        options: [
          {
            text: "Formar fila, segurar no corrimão e descer com calma",
            isCorrect: true,
            feedback: "Excelente! Assim evitamos acidentes e mantemos o ritmo.",
          },
          {
            text: "Descer correndo para chegar primeiro",
            isCorrect: false,
            feedback: "Correr aumenta o risco de quedas.",
          },
          {
            text: "Descer pulando dois degraus por vez",
            isCorrect: false,
            feedback: "Pular degraus pode causar acidentes.",
          },
        ],
      },
      trueFalse: {
        prompt: "Em situações de evacuação, devemos seguir o caminho combinado sem levar mochilas?",
        hint: "Lembre-se dos exercícios de evacuação.",
        statement: "Seguir a rota combinada sem carregar mochilas ajuda a sair com segurança.",
        answer: true,
        trueFeedback: "Correto! Assim a saída fica rápida e organizada.",
        falseFeedback: "Reflita: mochilas podem atrapalhar na hora de sair com segurança.",
      },
    },
  },
  {
    slug: "uso-dos-espacos",
    title: "Uso dos Espaços",
    prompt: "Relacione cada ambiente da escola às atividades que acontecem nele.",
    summary: "Quebra-cabeça sobre funções dos espaços escolares.",
    type: "PUZZLE",
    difficulty: "INICIAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "funções e normas em ambientes escolares",
    category: "Organização espacial",
    duration: 11,
    assetSlug: "cn-material-lupa",
    assetUsage: "A lupa ajuda a observar detalhes das placas e mobiliários em cada ambiente.",
    familyTip:
      "Incentive as famílias a discutir como organizam diferentes espaços de casa para cada atividade.",
    learningObjectives: [
      "Relacionar ambientes escolares às atividades apropriadas.",
      "Discutir cuidados específicos para manter cada espaço em bom estado.",
    ],
    description:
      "Uso dos Espaços reforça a compreensão das funções de cada ambiente e como preservá-los.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      legendas: "Cartões ilustrados com as atividades de cada espaço.",
    },
    puzzle: {
      successFeedback: "Perfeito! Cada ambiente recebeu a atividade correspondente.",
      errorFeedback: "Analise novamente e pense em qual espaço melhor acolhe cada atividade.",
      pairs: [
        {
          prompt: "Laboratório de ciências",
          match: "Experimentar e observar com equipamentos",
          hint: "Qual espaço é ideal para experimentos?",
          feedback: "O laboratório tem materiais específicos para observação.",
        },
        {
          prompt: "Biblioteca",
          match: "Ler, estudar em silêncio e emprestar livros",
          hint: "Pense em um ambiente silencioso.",
          feedback: "A biblioteca acolhe leituras e pesquisas silenciosas.",
        },
        {
          prompt: "Quadra",
          match: "Praticar esportes e jogos corporais",
          hint: "Onde acontecem as aulas de educação física?",
          feedback: "A quadra recebe atividades corporais e jogos.",
        },
        {
          prompt: "Sala multimídia",
          match: "Assistir vídeos educativos e usar tecnologia",
          hint: "Qual espaço possui projetores e computadores?",
          feedback: "A sala multimídia integra tecnologia às aulas.",
        },
      ],
    },
  },
  {
    slug: "rotinas-compartilhadas",
    title: "Rotinas Compartilhadas",
    prompt: "Associe cada momento da rotina escolar ao combinado correspondente.",
    summary: "Quebra-cabeça sobre regras e combinados ao longo do dia.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "organização do tempo e combinados coletivos",
    category: "Gestão da rotina",
    duration: 10,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta inspira equilíbrio e colaboração entre diferentes partes do dia.",
    familyTip:
      "Peça às famílias que construam um painel com a rotina diária em casa destacando responsabilidades.",
    learningObjectives: [
      "Reconhecer combinados que organizam a rotina escolar.",
      "Explicar por que cada combinado favorece a convivência.",
    ],
    description:
      "Rotinas Compartilhadas revela a importância de acordos coletivos para cada momento do dia.",
    cooperative: true,
    crossCurricular: ["Matemática", "Língua Portuguesa"],
    metadataExtra: {
      agendaVisual: "Agenda visual compartilhada com ícones.",
    },
    puzzle: {
      successFeedback: "Ótimo! A rotina ficou organizada com os combinados corretos.",
      errorFeedback: "Voltem aos horários e combinem novamente as ações.",
      pairs: [
        {
          prompt: "Entrada da manhã",
          match: "Cumprimentar colegas e guardar mochilas no local combinado",
          hint: "O que fazemos antes da aula começar?",
          feedback: "Guardar mochilas e cumprimentar organiza o início do dia.",
        },
        {
          prompt: "Hora do lanche",
          match: "Lavar as mãos e sentar-se com calma no refeitório",
          hint: "Quais cuidados antecedem a refeição?",
          feedback: "Higiene e calma garantem lanche saudável.",
        },
        {
          prompt: "Transição para o parque",
          match: "Formar fila e ouvir a orientação do educador",
          hint: "Como garantimos segurança ao sair?",
          feedback: "Fila organizada facilita deslocamentos seguros.",
        },
        {
          prompt: "Final da aula",
          match: "Revisar o material e deixar a sala arrumada",
          hint: "O que precisamos fazer antes de ir embora?",
          feedback: "Sala organizada garante um recomeço tranquilo no dia seguinte.",
        },
      ],
    },
  },
  {
    slug: "eco-gestos",
    title: "Eco Gestos",
    prompt: "Relacione cada situação ambiental ao gesto responsável correspondente.",
    summary: "Quebra-cabeça sobre sustentabilidade nos ambientes da escola.",
    type: "PUZZLE",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "sustentabilidade e uso consciente dos espaços",
    category: "Cuidado ambiental",
    duration: 10,
    assetSlug: "cn-natureza-rio",
    assetUsage: "O rio reforça a importância de preservar recursos naturais.",
    familyTip:
      "Incentive as famílias a separar resíduos em casa e compartilhar práticas sustentáveis.",
    learningObjectives: [
      "Selecionar atitudes sustentáveis nos ambientes escolares.",
      "Discussão sobre consequências positivas dessas atitudes.",
    ],
    description:
      "Eco Gestos reúne situações que estimulam o uso consciente da água, energia e materiais.",
    cooperative: true,
    crossCurricular: ["Ciências", "Matemática"],
    metadataExtra: {
      campanha: "Campanha de economia de recursos na escola.",
    },
    puzzle: {
      successFeedback: "Excelente! Os gestos sustentáveis foram escolhidos corretamente.",
      errorFeedback: "Releiam as situações e avaliem qual gesto faz mais sentido.",
      pairs: [
        {
          prompt: "Luzes acesas em sala vazia",
          match: "Apagar as lâmpadas ao sair",
          hint: "Pense em economizar energia.",
          feedback: "Apagar as luzes evita desperdício de energia.",
        },
        {
          prompt: "Sobrou papel usado apenas de um lado",
          match: "Reutilizar como rascunho ou dobradura",
          hint: "Como aproveitar o papel restante?",
          feedback: "Reutilizar otimiza o uso do papel.",
        },
        {
          prompt: "Garrafas plásticas após o lanche",
          match: "Descartar na lixeira de recicláveis",
          hint: "Qual destino correto para reciclagem?",
          feedback: "Reciclar garrafas reduz resíduos.",
        },
        {
          prompt: "Torneira pingando após lavar as mãos",
          match: "Fechar bem a torneira e avisar a equipe se necessário",
          hint: "Como evitar desperdício de água?",
          feedback: "Fechar e avisar previne desperdícios.",
        },
      ],
    },
  },
  {
    slug: "sinais-da-escola",
    title: "Sinais da Escola",
    prompt: "Associe cada sinal ou pictograma à orientação que ele comunica.",
    summary: "Quebra-cabeça sobre leitura de sinais e pictogramas escolares.",
    type: "PUZZLE",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "interpretação de sinais visuais nos ambientes",
    category: "Comunicação visual",
    duration: 12,
    assetSlug: "cn-material-lupa",
    assetUsage: "A lupa apoia a leitura dos símbolos e detalhes dos pictogramas.",
    familyTip:
      "Peça às famílias que observem sinais na vizinhança e conversem sobre seus significados.",
    learningObjectives: [
      "Interpretar sinais visuais presentes nos ambientes escolares.",
      "Explicar por que seguir orientações visuais garante segurança e respeito.",
    ],
    description:
      "Sinais da Escola desenvolve a leitura de pictogramas que orientam a circulação e os cuidados coletivos.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      galeriaSinais: "Coleção de sinais produzidos pelos estudantes.",
    },
    puzzle: {
      successFeedback: "Muito bom! Os sinais foram interpretados corretamente.",
      errorFeedback: "Repare nos detalhes e releiam o que cada símbolo comunica.",
      pairs: [
        {
          prompt: "Símbolo de mãos com espuma",
          match: "Lave as mãos neste local",
          hint: "Veja se há água ou sabão no símbolo.",
          feedback: "Esse sinal indica ponto de higienização.",
        },
        {
          prompt: "Ícone de fone de ouvido com X",
          match: "Utilizar voz baixa ou silêncio",
          hint: "Onde precisamos de silêncio?",
          feedback: "Esse sinal lembra de falar baixo ou manter silêncio.",
        },
        {
          prompt: "Desenho de lixeira colorida",
          match: "Separe resíduos conforme a cor indicada",
          hint: "Observe as cores da reciclagem.",
          feedback: "Cores ajudam a identificar o tipo de resíduo.",
        },
        {
          prompt: "Figura de pessoa subindo escada com seta",
          match: "Circular pelo lado direito ao subir",
          hint: "Pense na direção segura na escada.",
          feedback: "A seta indica a direção de circulação segura.",
        },
      ],
    },
  },
  {
    slug: "tour-colaborativo",
    title: "Tour Colaborativo",
    prompt: "Planeje um tour para apresentar os espaços da escola aos novos colegas.",
    summary: "Mini-jogo de planejamento de roteiro pelos ambientes escolares.",
    type: "GAME",
    difficulty: "INICIAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI01"],
    focus: "orientação espacial e acolhimento",
    category: "Exploração guiada",
    duration: 12,
    assetSlug: "cn-material-lupa",
    assetUsage: "A lupa incentiva observar detalhes de cada espaço durante o tour.",
    familyTip:
      "Convide as famílias a fazer um tour pela escola durante reuniões, orientando as crianças a explicar cada espaço.",
    learningObjectives: [
      "Organizar um roteiro que apresente os principais espaços da escola.",
      "Explicar regras e combinados de convivência enquanto percorre os ambientes.",
    ],
    description:
      "Tour Colaborativo incentiva a turma a planejar percursos acolhedores e informativos.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Geografia"],
    metadataExtra: {
      roteiro: "Checklist de espaços para visitar durante o tour.",
    },
    game: {
      victoryMessage: "Tour concluído! Novos colegas conheceram a escola com acolhimento.",
      gameOverMessage: "Reorganize o roteiro e tente novamente destacando novos espaços.",
      timeLimitSeconds: 80,
      lives: 3,
      levels: [
        {
          challenge: "Qual espaço apresentar primeiro para guardar materiais?",
          answer: "A sala da turma com armários identificados",
          hint: "Comece pelo local onde ficarão diariamente.",
          success: "Ótimo! A sala da turma é o ponto principal.",
          failure: "Reflita: onde os colegas ficarão boa parte do tempo?",
        },
        {
          challenge: "Durante o tour, como explicar o uso do refeitório?",
          answer: "Mostrar o local das filas e lembrar da higiene antes das refeições",
          hint: "Inclua combinados de higiene.",
          success: "Muito bem! Higiene e organização guiam o refeitório.",
          failure: "Considere mencionar higiene e organização.",
        },
        {
          challenge: "Encerrando o tour, qual ambiente destaca convivência e leitura?",
          answer: "Biblioteca, com orientações de empréstimo de livros",
          hint: "Finalize em um espaço acolhedor.",
          success: "Perfeito! Biblioteca acolhe e incentiva leitura.",
          failure: "Reflita: a biblioteca é um espaço especial para todos.",
        },
      ],
    },
  },
  {
    slug: "guardioes-dos-espacos",
    title: "Guardiões dos Espaços",
    prompt: "Escolha em equipe as ações necessárias quando cada espaço precisa de atenção.",
    summary: "Mini-jogo cooperativo para solucionar desafios nos ambientes escolares.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02"],
    focus: "resolução de problemas nos ambientes compartilhados",
    category: "Missões cooperativas",
    duration: 13,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta simboliza o equilíbrio necessário entre pessoas e espaços.",
    familyTip:
      "Peça às famílias que dividam responsabilidades em casa, destacando como cada pessoa cuida de um espaço.",
    learningObjectives: [
      "Tomar decisões coletivas para manter os ambientes em boas condições.",
      "Comunicar combinações e delegar tarefas de forma respeitosa.",
    ],
    description:
      "Guardiões dos Espaços apresenta situações reais que exigem cooperação para solucionar problemas.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Matemática"],
    metadataExtra: {
      quadroResponsaveis: "Quadro com responsáveis pelos ambientes.",
    },
    game: {
      victoryMessage: "Ambientes cuidados! A escola segue acolhedora para todos.",
      gameOverMessage: "Revejam as decisões e tentem novamente distribuindo as tarefas.",
      timeLimitSeconds: 90,
      lives: 3,
      levels: [
        {
          challenge: "O parque está com brinquedos fora do lugar após o recreio.",
          answer: "Organizar mutirão para recolher brinquedos e revisar regras de uso",
          hint: "Combine organização e diálogo.",
          success: "Ótimo! Organização e diálogo mantêm o parque seguro.",
          failure: "Reflita: além de arrumar, é preciso lembrar combinados.",
        },
        {
          challenge: "A sala multimídia está com fios no chão.",
          answer: "Desligar equipamentos, enrolar cabos e avisar a equipe de tecnologia",
          hint: "Pense em segurança elétrica.",
          success: "Excelente! Assim evitamos quedas e danos aos aparelhos.",
          failure: "Considere desligar e organizar antes de avisar.",
        },
        {
          challenge: "No corredor, surgiram marcas de tinta após atividade artística.",
          answer: "Isolar a área e avisar a equipe de limpeza, oferecendo ajuda com panos úmidos",
          hint: "Combine segurança e colaboração.",
          success: "Muito bem! Ajudar e avisar preserva o corredor.",
          failure: "Reflita: segurança e avisos são fundamentais.",
        },
      ],
    },
  },
  {
    slug: "desafio-da-reciclagem",
    title: "Desafio da Reciclagem",
    prompt: "Classifique rapidamente os resíduos e escolha o destino correto.",
    summary: "Mini-jogo dinâmico sobre separação de resíduos na escola.",
    type: "GAME",
    difficulty: "PRATICAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI03"],
    focus: "gestão de resíduos nos ambientes escolares",
    category: "Sustentabilidade ativa",
    duration: 12,
    assetSlug: "cn-natureza-rio",
    assetUsage: "O rio lembra que resíduos descartados corretamente protegem a água.",
    familyTip:
      "Convide as famílias a criar uma estação de reciclagem em casa com etiquetas coloridas.",
    learningObjectives: [
      "Diferenciar resíduos orgânicos, recicláveis e rejeitos.",
      "Agir rapidamente para manter os espaços limpos e sustentáveis.",
    ],
    description:
      "Desafio da Reciclagem incentiva decisões rápidas para separar resíduos durante a rotina escolar.",
    cooperative: true,
    crossCurricular: ["Matemática", "Ciências"],
    metadataExtra: {
      lixeirasCodigo: "Cores padronizadas das lixeiras da escola.",
    },
    game: {
      victoryMessage: "Parabéns! Os resíduos foram separados corretamente.",
      gameOverMessage: "Revejam as categorias e tentem novamente acelerando a decisão.",
      timeLimitSeconds: 70,
      lives: 3,
      levels: [
        {
          challenge: "Restos de frutas e cascas no refeitório",
          answer: "Descartar na lixeira de resíduos orgânicos para compostagem",
          hint: "São resíduos orgânicos.",
          success: "Ótimo! Orgânicos podem virar adubo.",
          failure: "Lembre-se: restos de comida vão para a composteira.",
        },
        {
          challenge: "Folhas impressas usadas só de um lado",
          answer: "Guardar na caixa de rascunhos para reutilizar",
          hint: "Podem ser reaproveitadas.",
          success: "Muito bem! Reutilizar evita desperdício.",
          failure: "Reflita: o papel ainda pode ser utilizado.",
        },
        {
          challenge: "Caneta sem carga",
          answer: "Descartar no ponto de coleta de resíduos não recicláveis",
          hint: "Não é reciclável comum.",
          success: "Correto! Canetas devem ser descartadas em locais específicos.",
          failure: "Considere o ponto para resíduos não recicláveis.",
        },
      ],
    },
  },
  {
    slug: "assembleia-da-turma",
    title: "Assembleia da Turma",
    prompt: "Conduza uma assembleia simulada definindo melhorias para os ambientes escolares.",
    summary: "Mini-jogo de tomada de decisão coletiva sobre convivência e espaços.",
    type: "GAME",
    difficulty: "DOMINAR",
    bnccCode: "EF01CI04",
    habilidades: ["EF01CI04"],
    secondaryHabilidades: ["EF01CI02", "EF01CI03"],
    focus: "participação coletiva na melhoria dos ambientes",
    category: "Governança estudantil",
    duration: 14,
    assetSlug: "cn-natureza-floresta",
    assetUsage: "A floresta simboliza o equilíbrio entre todas as vozes da comunidade.",
    familyTip:
      "Sugira que as famílias realizem pequenas assembleias domésticas para discutir cuidados com a casa.",
    learningObjectives: [
      "Escutar propostas dos colegas e registrar decisões coletivas.",
      "Definir ações de melhoria para os ambientes considerando recursos disponíveis.",
    ],
    description:
      "Assembleia da Turma promove protagonismo para decidir melhorias nos espaços e definir responsabilidades.",
    cooperative: true,
    crossCurricular: ["Língua Portuguesa", "Arte"],
    metadataExtra: {
      ataAssembleia: "Ata ilustrada com as decisões da turma.",
    },
    game: {
      victoryMessage: "Assembleia concluída! As melhorias foram definidas coletivamente.",
      gameOverMessage: "Revejam as propostas e tentem novamente ouvindo todas as vozes.",
      timeLimitSeconds: 95,
      lives: 4,
      levels: [
        {
          challenge: "Três colegas sugerem plantas novas para o pátio.",
          answer: "Registrar a proposta e votar em conjunto as espécies a escolher",
          hint: "Garanta participação de todos.",
          success: "Ótimo! Registrar e votar garante decisão coletiva.",
          failure: "Reflita: todos precisam opinar antes de decidir.",
        },
        {
          challenge: "O som na hora do estudo está alto mesmo após combinados.",
          answer: "Criar novas estratégias, como semáforo do silêncio e apoio de monitores",
          hint: "Pense em soluções criativas.",
          success: "Excelente! Estratégias criativas ajudam na convivência.",
          failure: "Considere novas ideias para reforçar o combinado.",
        },
        {
          challenge: "Faltam materiais para decorar o mural dos ambientes.",
          answer: "Solicitar doações e reutilizar materiais disponíveis",
          hint: "Busque solução sustentável.",
          success: "Muito bem! Reutilizar materiais gera mais mudas para compartilhar.",
          failure: "Considere reutilizar materiais para multiplicar as mudas.",
        },
      ],
    },
  },
];

const ambientesDaEscola: ModuleDefinition = {
  slug: "ambientes-da-escola",
  title: "Ambientes da Escola",
  subtitle: "Explorar, cuidar e conviver nos espaços escolares",
  description:
    "Sequência que promove reconhecimento dos ambientes escolares, combinados de convivência e ações sustentáveis para manter a escola acolhedora.",
  theme: "Ciências",
  discipline: "Ciências",
  ageGroupSlug: "fundamental-anos-iniciais",
  learningPathSlug: "exploradores-da-natureza",
  primaryBnccCode: "EF01CI04",
  secondaryBnccCodes: ["EF01CI03"],
  learningOutcomes: [
    "Reconhecer características e funções dos diferentes ambientes escolares.",
    "Planejar cuidados e rotinas compartilhadas que preservem os espaços.",
    "Participar de decisões coletivas que tornam a escola segura, limpa e acolhedora.",
  ],
  tags: ["ambientes", "convivencia", "sustentabilidade", "cidadania"],
  estimatedDurationMinutes: 185,
  summary:
    "Doze atividades que combinam mapas, missões e assembleias colaborativas para cuidar dos espaços escolares.",
  activities: ambientesDaEscolaActivities,
};

const modules: ModuleDefinition[] = [
  sentidosCuriosos,
  cuidadosDoCorpo,
  animaisDaVizinhanca,
  plantasQueCuidamos,
  ambientesDaEscola,
];

for (const moduleDefinition of modules) {
  writeModuleFile(moduleDefinition);
}
