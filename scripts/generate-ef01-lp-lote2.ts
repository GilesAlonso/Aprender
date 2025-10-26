#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dump } from "js-yaml";

type DifficultyTier = "INICIAR" | "PRATICAR" | "DOMINAR";

type SupportEntryInput = {
  title?: string;
  description: string;
  steps?: string[];
};

type Prerequisite = {
  type?: "SKILL" | "ACTIVITY" | "MODULE" | "CONTEXT";
  reference: string;
  description?: string;
};

type BaseActivityInput = {
  slug: string;
  title: string;
  prompt: string;
  difficulty: DifficultyTier;
  bnccCode: string;
  habilidades: string[];
  category: string;
  duration: number;
  focus: string;
  assetSlug: string;
  learningObjectives?: string[];
  description?: string;
  prerequisites?: Prerequisite[];
  secondaryHabilidades?: string[];
  familyHook?: string;
  assetUsage?: string;
  accessibilityAlternatives?: SupportEntryInput[];
  accessibilityAudioCue?: SupportEntryInput;
  accessibilityMotorSupport?: SupportEntryInput[];
};

type QuizConfig = BaseActivityInput & {
  question: {
    prompt: string;
    hint: string;
    options: {
      text: string;
      isCorrect: boolean;
      feedback: string;
    }[];
  };
  trueFalse: {
    statement: string;
    prompt: string;
    hint: string;
    answer: boolean;
    trueFeedback: string;
    falseFeedback: string;
  };
  bnccDescription?: string;
};

type PuzzleConfig = BaseActivityInput & {
  successFeedback: string;
  errorFeedback: string;
  pairs: {
    prompt: string;
    match: string;
    hint: string;
    feedback: string;
  }[];
  bnccDescription?: string;
};

type GameLevelConfig = {
  challenge: string;
  answer: string | number;
  hint: string;
  success: string;
  failure: string;
};

type GameConfig = BaseActivityInput & {
  victoryMessage: string;
  gameOverMessage: string;
  levels: GameLevelConfig[];
  timeLimitSeconds?: number;
  lives?: number;
  audioPrompt?: string;
  bnccDescription?: string;
};

type ModuleInput = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  learningOutcomes: string[];
  tags: string[];
  primaryBnccCode: string;
  secondaryBnccCodes: string[];
  quizzes: QuizConfig[];
  puzzles: PuzzleConfig[];
  games: GameConfig[];
};

const bnccDescriptions: Record<string, string> = {
  EF01LP11:
    "Identificar e criar rimas, aliterações e jogos de palavras em textos orais curtos, explorando ritmo e musicalidade.",
  EF01LP12:
    "Participar de conversas, respeitando turnos de fala, escutando com atenção e respondendo com pertinência.",
  EF01LP13:
    "Relatar oralmente vivências e histórias conhecidas, organizando-as em sequência lógica simples.",
  EF01LP14: "Ampliar o vocabulário relacionando palavras a campos semânticos e contextos de uso.",
  EF01LP15:
    "Inferir o significado de palavras desconhecidas utilizando pistas do contexto e de palavras conhecidas.",
  EF01LP16:
    "Utilizar o ponto final para marcar o encerramento de frases, garantindo clareza na leitura.",
  EF01LP17:
    "Reconhecer e utilizar ponto de interrogação e ponto de exclamação para marcar perguntas e exclamações.",
  EF01LP18: "Planejar textos coletivos considerando finalidade, gênero, público leitor e suporte.",
  EF01LP19: "Selecionar e organizar informações relevantes para compor textos coletivos coerentes.",
  EF01LP20:
    "Sequenciar fatos e ideias em textos produzidos coletivamente, respeitando relações temporais simples.",
  EF01LP21:
    "Revisar textos coletivos ajustando vocabulário, ortografia e pontuação com apoio do grupo.",
  EF01LP22:
    "Utilizar elementos gráficos, imagens e recursos visuais que complementem textos coletivos.",
  EF01LP23: "Distribuir responsabilidades e colaborar na produção de textos coletivos.",
  EF01LP24:
    "Publicar e compartilhar textos coletivos avaliando os efeitos pretendidos no público leitor.",
};

const assetTitles: Record<string, string> = {
  "lp-letra-a": "Ilustração da letra A",
  "lp-letra-e": "Ilustração da letra E",
  "lp-material-caderno": "Caderno colorido para escrita",
  "lp-silaba-ba": "Cartão da sílaba BA",
  "lp-silaba-la": "Cartão da sílaba LA",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_DIR = path.join(
  __dirname,
  "..",
  "data",
  "content",
  "raw",
  "ef01",
  "lingua-portuguesa"
);

const capitalize = (value: string): string =>
  value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);

const defaultLearningObjectives = (focus: string): string[] => [
  `Explorar ${focus} em situações mediadas pelo educador.`,
  "Compartilhar estratégias pessoais com colegas durante a atividade.",
];

const defaultFamilyHook = (focus: string): string =>
  `Convide as famílias a observar ${focus} em histórias, cantigas ou jogos em casa.`;

const defaultAssetUsage = (title: string, focus: string): string =>
  `Utilize ${title} como apoio visual para destacar ${focus} ao longo da atividade.`;

const buildAlternatives = (input: BaseActivityInput): SupportEntryInput[] =>
  input.accessibilityAlternatives ?? [
    {
      title: "TEXTO EM CAIXA ALTA",
      description: `OFEREÇA CARTÕES COM ${input.focus.toUpperCase()} DESTACADO PARA QUE TODES ACOMPANHEM.`,
      steps: ["FORNEÇA LETRAS GRANDES E ESPAÇADAS.", "GRIFE RIMAS OU PALAVRAS-CHAVE EM COR VIVA."],
    },
  ];

const buildAudioCue = (input: BaseActivityInput): SupportEntryInput =>
  input.accessibilityAudioCue ?? {
    title: "SINAL SONORO",
    description: `Utilize um chocalho ou palmas para marcar o momento de focar em ${input.focus}.`,
    steps: [
      "Avise que o som indica a troca de etapa ou turno de fala.",
      "Repita o som e a instrução de forma pausada.",
    ],
  };

const buildMotorSupport = (input: BaseActivityInput): SupportEntryInput[] =>
  input.accessibilityMotorSupport ?? [
    {
      title: "APOIO MOTOR",
      description: "Disponibilize apoios físicos para navegação e registro das respostas.",
      steps: [
        "Ofereça ponteiras, clipes ampliados ou teclado virtual.",
        "Permita que duplas se alternem no controle do dispositivo.",
      ],
    },
  ];

const buildStudentHints = (
  focus: string,
  variant: "activity" | "interactive"
): SupportEntryInput[] =>
  variant === "interactive"
    ? [
        {
          description: `Passo 1: Leia ou escute cada instrução e identifique onde ${focus} aparece no interativo.`,
        },
        {
          description:
            "Passo 2: Use Tab ou toque na tela para revisar todas as opções antes de confirmar.",
        },
        {
          description:
            "Passo 3: Compartilhe com um colega por que escolheu a resposta apresentada.",
        },
      ]
    : [
        {
          description: `Passo 1: Observe o enunciado com atenção e sublinhe mentalmente ${focus}.`,
        },
        {
          description: "Passo 2: Compare cada opção, repetindo os sons em voz alta se ajudar.",
        },
        {
          description: "Passo 3: Respire fundo e confirme a alternativa escolhida com segurança.",
        },
      ];

const createAccessibilityBlock = (
  input: BaseActivityInput,
  variant: "activity" | "interactive"
) => ({
  hints: [
    ...buildStudentHints(input.focus, variant).map((hint) => ({
      audience: "ESTUDANTE" as const,
      text: hint.description,
    })),
    {
      audience: "EDUCADOR" as const,
      text: `Guie a turma passo a passo, reforçando ${input.focus} com gestos, pictogramas e pausas.`,
    },
    {
      audience: "FAMILIA" as const,
      text: `Envie sugestões de jogos ou músicas que reforcem ${input.focus} em casa.`,
    },
  ],
  feedback: {
    success: `Excelente! ${capitalize(input.focus)} ficou evidente nas suas escolhas.`,
    encouragement:
      "Caso erre, releia com calma e utilize marcadores sonoros ou visuais para apoiar a decisão.",
    retry: "Experimente revisar as pistas destacadas antes de tentar novamente.",
    accessibility:
      "Ofereça tempo extra, recursos táteis e apoio auditivo individual para quem precisar.",
  },
  assets: [
    {
      slug: input.assetSlug,
      type: "IMAGEM" as const,
      title: assetTitles[input.assetSlug] ?? capitalize(input.focus),
    },
  ],
  alternatives: buildAlternatives(input),
  audioCue: buildAudioCue(input),
  motorSupport: buildMotorSupport(input),
});

const createBaseActivity = (input: BaseActivityInput) => {
  const learningObjectives = input.learningObjectives ?? defaultLearningObjectives(input.focus);
  const description =
    input.description ??
    `${input.title} incentiva a turma a explorar ${input.focus} com apoios variados.`;
  const assetTitle = assetTitles[input.assetSlug] ?? capitalize(input.focus);
  const familyHook = input.familyHook ?? defaultFamilyHook(input.focus);
  const assetUsage = input.assetUsage ?? defaultAssetUsage(assetTitle, input.focus);
  const secondaryHabilidades =
    input.secondaryHabilidades ?? input.habilidades.filter((code) => code !== input.bnccCode);

  const activity: Record<string, unknown> = {
    partial: "../../_partials/acolhimento-base.yaml",
    slug: input.slug,
    title: input.title,
    prompt: input.prompt,
    type: "QUIZ",
    difficulty: input.difficulty,
    bncc: {
      code: input.bnccCode,
      habilidades: input.habilidades,
    },
    learningObjectives,
    description,
    metadata: {
      categoria: input.category,
      duracaoMinutos: input.duration,
      habilidades: input.habilidades,
      assetSlug: input.assetSlug,
      assetUsage,
      familiaEngajamento: familyHook,
      ...(secondaryHabilidades.length > 0 ? { habilidadesSecundarias: secondaryHabilidades } : {}),
    },
    accessibility: createAccessibilityBlock(input, "activity"),
  };

  if (input.prerequisites && input.prerequisites.length > 0) {
    activity.prerequisites = input.prerequisites.map((entry) => ({
      type: entry.type ?? "SKILL",
      reference: entry.reference,
      description: entry.description,
    }));
  }

  return activity;
};

const createQuizActivity = (input: QuizConfig) => {
  const base = createBaseActivity(input);
  base.type = "QUIZ";
  const interactiveSlug = `quiz-${input.slug}`;
  const metadata = base.metadata as Record<string, unknown>;
  metadata.interactiveSlug = interactiveSlug;
  const bnccDescription = input.bnccDescription ?? bnccDescriptions[input.bnccCode];

  return {
    ...base,
    interactive: {
      slug: interactiveSlug,
      title: `${input.title} — Quiz`,
      type: "QUIZ",
      bnccDescription,
      estimatedTimeMinutes: Math.max(6, Math.min(12, input.duration)),
      instructions: [
        "Leia ou escute cada questão antes de responder.",
        "Use as teclas numéricas ou toque nas alternativas para marcar sua escolha.",
        "Explique para a turma como identificou a resposta correta.",
      ],
      objectives: base.learningObjectives,
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
          id: `${input.slug}-q1`,
          type: "multiple-choice" as const,
          prompt: input.question.prompt,
          hint: input.question.hint,
          options: input.question.options.map((option, index) => ({
            id: `${input.slug}-q1-${index + 1}`,
            text: option.text,
            isCorrect: option.isCorrect,
            feedback: option.feedback,
          })),
        },
        {
          id: `${input.slug}-q2`,
          type: "true-false" as const,
          prompt: input.trueFalse.prompt,
          hint: input.trueFalse.hint,
          statement: input.trueFalse.statement,
          answer: input.trueFalse.answer,
          feedback: {
            true: input.trueFalse.trueFeedback,
            false: input.trueFalse.falseFeedback,
          },
        },
      ],
      accessibility: createAccessibilityBlock(input, "interactive"),
    },
  };
};

const createPuzzleActivity = (input: PuzzleConfig) => {
  const base = createBaseActivity(input);
  base.type = "PUZZLE";
  const interactiveSlug = `puzzle-${input.slug}`;
  const metadata = base.metadata as Record<string, unknown>;
  metadata.interactiveSlug = interactiveSlug;
  const bnccDescription = input.bnccDescription ?? bnccDescriptions[input.bnccCode];

  return {
    ...base,
    interactive: {
      slug: interactiveSlug,
      title: `${input.title} — Quebra-cabeça`,
      type: "PUZZLE",
      bnccDescription,
      estimatedTimeMinutes: Math.max(7, Math.min(12, input.duration)),
      instructions: [
        "Observe cada cartão e relacione arrastando ou usando Tab + Enter.",
        "Converse sobre o motivo da combinação antes de confirmar.",
        "Revise as duplas formadas e proponha novas associações.",
      ],
      objectives: base.learningObjectives,
      puzzle: {
        mode: "matching" as const,
        successFeedback: input.successFeedback,
        errorFeedback: input.errorFeedback,
        pairs: input.pairs.map((pair, index) => ({
          id: `${input.slug}-pair-${index + 1}`,
          prompt: pair.prompt,
          match: pair.match,
          hint: pair.hint,
          feedback: pair.feedback,
        })),
      },
      accessibility: createAccessibilityBlock(input, "interactive"),
    },
  };
};

const createGameActivity = (input: GameConfig) => {
  const base = createBaseActivity(input);
  base.type = "GAME";
  const interactiveSlug = `game-${input.slug}`;
  const metadata = base.metadata as Record<string, unknown>;
  metadata.interactiveSlug = interactiveSlug;
  if (input.audioPrompt) {
    metadata.audioPrompt = input.audioPrompt;
  }
  const bnccDescription = input.bnccDescription ?? bnccDescriptions[input.bnccCode];

  return {
    ...base,
    interactive: {
      slug: interactiveSlug,
      title: `${input.title} — Mini-jogo`,
      type: "GAME",
      bnccDescription,
      estimatedTimeMinutes: Math.max(8, Math.min(14, input.duration)),
      instructions: [
        "Leia ou escute o desafio de cada fase com atenção.",
        "Digite ou selecione a resposta utilizando teclado, toque ou mouse.",
        "Ao final, compartilhe qual pista sonora ou visual ajudou a resolver a fase.",
      ],
      objectives: base.learningObjectives,
      game: {
        mode: "math-challenge" as const,
        timeLimitSeconds: input.timeLimitSeconds ?? 120,
        lives: input.lives ?? 3,
        victoryMessage: input.victoryMessage,
        gameOverMessage: input.gameOverMessage,
        levels: input.levels.map((level, index) => ({
          id: `${input.slug}-level-${index + 1}`,
          challenge: level.challenge,
          answer: level.answer,
          hint: level.hint,
          successFeedback: level.success,
          failureFeedback: level.failure,
        })),
      },
      accessibility: createAccessibilityBlock(input, "interactive"),
    },
  };
};

const buildModuleFile = (module: ModuleInput) => {
  const moduleBlock = {
    slug: module.slug,
    title: module.title,
    subtitle: module.subtitle,
    description: module.description,
    theme: "Língua Portuguesa",
    discipline: "Língua Portuguesa",
    ageGroupSlug: "fundamental-anos-iniciais",
    learningPathSlug: "descobertas-palavras",
    primaryBnccCode: module.primaryBnccCode,
    secondaryBnccCodes: module.secondaryBnccCodes,
    learningOutcomes: module.learningOutcomes,
    tags: module.tags,
  };

  const activities = [
    ...module.quizzes.map((quiz) => createQuizActivity(quiz)),
    ...module.puzzles.map((puzzle) => createPuzzleActivity(puzzle)),
    ...module.games.map((game) => createGameActivity(game)),
  ];

  return { module: moduleBlock, activities };
};

const ensureOutputDir = () => {
  mkdirSync(OUTPUT_DIR, { recursive: true });
};

const writeModuleFile = (module: ModuleInput) => {
  const payload = buildModuleFile(module);
  const content = dump(payload, { lineWidth: 1000, noRefs: true });
  const filePath = path.join(OUTPUT_DIR, `${module.slug}.yaml`);
  writeFileSync(filePath, content, "utf-8");
  console.log(`Generated ${module.slug}.yaml`);
};

const module6: ModuleInput = {
  slug: "historias-rimadas",
  title: "Histórias Rimadas",
  subtitle: "Rimas e aliterações em ação",
  description:
    "Sequência que amplia repertório de parlendas, poemas e histórias rimadas, explorando ritmo, musicalidade e criação coletiva de versos.",
  learningOutcomes: [
    "Identificar rimas e aliterações em textos orais curtos.",
    "Experimentar manipulações sonoras com apoio de gestos, percussão corporal e recursos visuais.",
    "Criar pequenos versos coletivos mantendo ritmo e coesão sonora.",
  ],
  tags: ["rimas", "oralidade", "poesia"],
  primaryBnccCode: "EF01LP11",
  secondaryBnccCodes: ["EF01LP01", "EF01LP02"],
  quizzes: [
    {
      slug: "rima-no-final",
      title: "Rima no Final",
      prompt: "Complete o verso escolhendo a palavra que mantém a rima.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP01"],
      category: "Rimas finais",
      duration: 8,
      focus: "identificação de rimas",
      assetSlug: "lp-letra-a",
      learningObjectives: [
        "Perceber rimas ao final de versos curtos.",
        "Apoiar colegas destacando sons parecidos durante a leitura.",
      ],
      description:
        "Rima no Final incentiva a turma a completar versos simples usando rimas conhecidas.",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP11",
          description: "Recitar parlendas com rimas marcadas pelo educador.",
        },
      ],
      question: {
        prompt: "Complete o verso: 'A menina pulou corda com a ____.'",
        hint: "Pense em palavras que terminam com o mesmo som de 'corda'.",
        options: [
          {
            text: "borda",
            isCorrect: true,
            feedback: "Ótimo! 'Borda' repete o som final de 'corda' e mantém a rima.",
          },
          {
            text: "janela",
            isCorrect: false,
            feedback: "Observe o som final da palavra para manter a rima proposta.",
          },
          {
            text: "flauta",
            isCorrect: false,
            feedback: "Releia o verso e encontre uma palavra com final parecido.",
          },
        ],
      },
      trueFalse: {
        statement: "As palavras 'corda' e 'borda' rimam porque terminam com o mesmo som.",
        prompt: "As palavras 'corda' e 'borda' rimam?",
        hint: "Repita as palavras lentamente e compare os finais.",
        answer: true,
        trueFeedback: "Isso aí! O som final é igual e forma a rima.",
        falseFeedback: "Experimente repetir as palavras lentamente para perceber a rima.",
      },
    },
    {
      slug: "eco-das-rimas",
      title: "Eco das Rimas",
      prompt: "Escolha a palavra que mantém a rima com o termo destacado na parlenda.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP02"],
      category: "Comparação de rimas",
      duration: 9,
      focus: "comparação de rimas",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Comparar palavras para identificar rimas em parlendas conhecidas.",
        "Utilizar gestos ou batidas para marcar o ritmo rimado.",
      ],
      description:
        "Eco das Rimas convida a turma a reconhecer rimas em versos conhecidos, reforçando o ritmo coletivo.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "rima-no-final",
          description: "Relembrar como as rimas aparecem ao final dos versos.",
        },
      ],
      question: {
        prompt: "Na parlenda 'Peixe vivo, peixe vivo', qual palavra mantém a rima com 'peixe'?",
        hint: "Observe o som final e procure uma palavra com final semelhante.",
        options: [
          {
            text: "feixe",
            isCorrect: true,
            feedback: "Perfeito! 'Peixe' e 'feixe' terminam com o mesmo som.",
          },
          {
            text: "faca",
            isCorrect: false,
            feedback: "Tente novamente, buscando sons que combinem com 'peixe'.",
          },
          {
            text: "janela",
            isCorrect: false,
            feedback: "A palavra escolhida precisa repetir o final sonoro de 'peixe'.",
          },
        ],
      },
      trueFalse: {
        statement: "A palavra 'peixe' rima com 'feixe'.",
        prompt: "As palavras 'peixe' e 'feixe' rimam?",
        hint: "Compare os sons finais e perceba se são iguais.",
        answer: true,
        trueFeedback: "Muito bem! As duas palavras repetem o mesmo final sonoro.",
        falseFeedback: "Leia em voz alta novamente e veja como o som final se repete.",
      },
    },
    {
      slug: "ritmo-na-historia",
      title: "Ritmo na História",
      prompt: "Analise qual verso mantém o ritmo e a rima da história rimada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP03"],
      category: "Ritmo rimado",
      duration: 9,
      focus: "manutenção do ritmo rimado",
      assetSlug: "lp-material-caderno",
      learningObjectives: [
        "Perceber repetições sonoras que mantêm ritmo em histórias rimadas.",
        "Explicar oralmente por que determinado verso combina com o anterior.",
      ],
      description:
        "Ritmo na História desafia a turma a manter o compasso rimado de pequenos versos narrativos.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "eco-das-rimas",
          description: "Retomar rimas para sustentar o ritmo das parlendas.",
        },
      ],
      question: {
        prompt:
          "História rimada: 'O gato saiu cedo, levou sua ____'. Qual opção mantém o ritmo e a rima?",
        hint: "Procure uma palavra que combine com 'cedo' na leitura rimada.",
        options: [
          {
            text: "credo",
            isCorrect: true,
            feedback: "Isso! 'Cedo' e 'credo' repetem o final sonoro e mantêm o ritmo.",
          },
          {
            text: "bola",
            isCorrect: false,
            feedback: "Observe o final da palavra: precisa combinar com 'cedo'.",
          },
          {
            text: "sapato",
            isCorrect: false,
            feedback: "Releia os versos e escolha a palavra que rima com 'cedo'.",
          },
        ],
      },
      trueFalse: {
        statement: "Manter a rima ajuda a história a continuar com o mesmo ritmo.",
        prompt: "Rimas ajudam a história a manter o ritmo?",
        hint: "Pense como as rimas marcam a batida na leitura.",
        answer: true,
        trueFeedback: "Exato! A rima mantém o ritmo e facilita a memorização.",
        falseFeedback: "Experimente ler os versos rimados e perceber como o ritmo se mantém.",
      },
    },
    {
      slug: "aliteracao-na-trilha",
      title: "Aliteração na Trilha",
      prompt: "Escolha a frase que apresenta aliteração com o som indicado.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP02"],
      category: "Aliterações",
      duration: 10,
      focus: "exploração de aliterações",
      assetSlug: "lp-silaba-ba",
      learningObjectives: [
        "Identificar repetições de sons iniciais em frases curtas.",
        "Criar gestos ou batidas que acompanhem aliterações.",
      ],
      description:
        "Aliteração na Trilha estimula a turma a localizar sons iniciais repetidos em frases divertidas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ritmo-na-historia",
          description: "Retomar rimas antes de observar sons iniciais repetidos.",
        },
      ],
      question: {
        prompt: "Qual frase apresenta aliteração com o som /m/?",
        hint: "Procure palavras que começam com o mesmo som.",
        options: [
          {
            text: "Marta mistura mel no mingau.",
            isCorrect: true,
            feedback: "Perfeito! O som /m/ se repete em várias palavras.",
          },
          {
            text: "Sofia pula pedra na praça.",
            isCorrect: false,
            feedback: "Repare nos sons iniciais: eles são diferentes.",
          },
          {
            text: "Lia canta uma canção suave.",
            isCorrect: false,
            feedback: "Atenção ao som inicial repetido: procure o som /m/.",
          },
        ],
      },
      trueFalse: {
        statement: "Repetir o mesmo som inicial em várias palavras cria aliteração.",
        prompt: "Repetir o som inicial forma aliteração?",
        hint: "Pense nas batidas que fazemos quando os sons iniciais são iguais.",
        answer: true,
        trueFeedback: "Isso! A aliteração acontece quando repetimos sons iniciais.",
        falseFeedback: "Relembre exemplos com sons repetidos para identificar a aliteração.",
      },
    },
    {
      slug: "verso-surpresa",
      title: "Verso Surpresa",
      prompt: "Escolha a continuação que mantém a rima e o sentido do verso final.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP01", "EF01LP02"],
      category: "Criação de versos",
      duration: 10,
      focus: "criação de versos rimados",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Criar versos curtos mantendo a rima apresentada.",
        "Justificar oralmente a escolha de palavras rimadas.",
      ],
      description:
        "Verso Surpresa desafia a turma a completar versos finais com criatividade e ritmo.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "aliteracao-na-trilha",
          description: "Relembrar como sons repetidos sustentam a musicalidade.",
        },
      ],
      question: {
        prompt: "Verso: 'No jardim da escola nasceu uma flor ____'. Qual final mantém a rima?",
        hint: "Observe o som final da palavra 'flor'.",
        options: [
          {
            text: "cheia de cor",
            isCorrect: true,
            feedback: "Muito bem! 'Flor' e 'cor' rimam e mantêm o sentido.",
          },
          {
            text: "brilhante e feliz",
            isCorrect: false,
            feedback: "Tente novamente com uma palavra que rime com 'flor'.",
          },
          {
            text: "cheia de perfume",
            isCorrect: false,
            feedback: "Procure um final que repita o som final de 'flor'.",
          },
        ],
      },
      trueFalse: {
        statement: "Escolher palavras que rimam ajuda a manter a musicalidade do verso.",
        prompt: "Rimas mantêm a musicalidade do verso?",
        hint: "Relembre como a rima finaliza o verso com ritmo.",
        answer: true,
        trueFeedback: "Excelente! A rima fortalece o ritmo e a sonoridade do texto.",
        falseFeedback: "Perceba como versos rimados ficam mais musicais ao serem lidos.",
      },
    },
    {
      slug: "desafio-aliterativo",
      title: "Desafio Aliterativo",
      prompt: "Analise a sequência e escolha a frase que mantém a aliteração proposta.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP02"],
      category: "Sequência sonora",
      duration: 11,
      focus: "sequência de aliterações",
      assetSlug: "lp-silaba-la",
      learningObjectives: [
        "Sequenciar frases mantendo aliterações planejadas.",
        "Criar novas frases com apoio de aliterações discutidas em grupo.",
      ],
      description:
        "Desafio Aliterativo estimula a turma a escolher frases que preservam padrões sonoros constantes.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "verso-surpresa",
          description: "Retomar rimas antes de manter aliterações em várias frases.",
        },
      ],
      question: {
        prompt: "Para continuar a sequência com som /p/, qual frase se encaixa melhor?",
        hint: "Note se a frase repete o som /p/ em várias palavras.",
        options: [
          {
            text: "Pedro pinta pipas coloridas.",
            isCorrect: true,
            feedback: "Isso! A frase repete o som /p/ e mantém a sequência proposta.",
          },
          {
            text: "Carla organiza livros na estante.",
            isCorrect: false,
            feedback: "Observe os sons iniciais: eles não repetem o som /p/.",
          },
          {
            text: "Lia prepara um suco gelado.",
            isCorrect: false,
            feedback: "Procure uma opção em que o som /p/ se repita várias vezes.",
          },
        ],
      },
      trueFalse: {
        statement: "Frases com o mesmo som inicial reforçam a aliteração de uma sequência.",
        prompt: "Frases com o mesmo som inicial reforçam a aliteração?",
        hint: "Pense nas batidas repetidas quando pronunciamos as palavras.",
        answer: true,
        trueFeedback: "Correto! Repetir o som inicial mantém a aliteração na sequência.",
        falseFeedback: "Relembre exemplos de frases com o mesmo som inicial para confirmar.",
      },
    },
  ],
  puzzles: [
    {
      slug: "pares-de-rima",
      title: "Pares de Rima",
      prompt: "Relacione cada palavra ao par que rima com ela.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP01"],
      category: "Correspondência rimada",
      duration: 9,
      focus: "associação de rimas",
      assetSlug: "lp-letra-a",
      successFeedback: "As combinações rimaram com perfeição!",
      errorFeedback: "Revise os sons finais e tente novamente devagar.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "rima-no-final",
          description: "Recordar as rimas identificadas no quiz anterior.",
        },
      ],
      pairs: [
        {
          prompt: "Rima com 'pato'",
          match: "sapato",
          hint: "Observe os sons finais.",
          feedback: "As duas palavras terminam com 'ato'.",
        },
        {
          prompt: "Rima com 'casa'",
          match: "asa",
          hint: "Pense no som final semelhante.",
          feedback: "Os sons finais combinam perfeitamente.",
        },
        {
          prompt: "Rima com 'sino'",
          match: "menino",
          hint: "Procure palavras com final semelhante.",
          feedback: "O final 'ino' aparece nas duas palavras.",
        },
      ],
    },
    {
      slug: "ordem-da-parlenda",
      title: "Ordem da Parlenda",
      prompt: "Associe cada parte da parlenda à posição correta.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP02"],
      category: "Sequência rimada",
      duration: 10,
      focus: "sequência de versos rimados",
      assetSlug: "lp-material-caderno",
      successFeedback: "Sequência completa! A parlenda ganhou ritmo.",
      errorFeedback: "Verifique a ordem dos versos e tente novamente.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "pares-de-rima",
          description: "Retomar rimas para organizar a sequência rimada.",
        },
      ],
      pairs: [
        {
          prompt: "Início da parlenda",
          match: "Hoje é domingo",
          hint: "Lembre como a parlenda começa.",
          feedback: "Esse verso abre a parlenda tradicional.",
        },
        {
          prompt: "Meio da parlenda",
          match: "Pé de cachimbo",
          hint: "Procure a parte que continua a rima.",
          feedback: "A sequência mantém o ritmo com o verso central.",
        },
        {
          prompt: "Final da parlenda",
          match: "O galo cantou",
          hint: "Qual verso encerra com rima?",
          feedback: "Esse verso finaliza a parlenda mantendo a rima.",
        },
      ],
    },
    {
      slug: "eco-de-sonoridades",
      title: "Eco de Sonoridades",
      prompt: "Relacione o som inicial à frase que apresenta a mesma aliteração.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP02"],
      category: "Aliterações",
      duration: 10,
      focus: "identificação de sons iniciais",
      assetSlug: "lp-letra-e",
      successFeedback: "As aliterações ecoaram certinho!",
      errorFeedback: "Ouça novamente os sons iniciais e reorganize as cartas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "aliteracao-na-trilha",
          description: "Relembrar exemplos de aliteração apresentados na trilha.",
        },
      ],
      pairs: [
        {
          prompt: "Som /b/",
          match: "Bia brinca com bolhas brilhantes.",
          hint: "Perceba o som inicial repetido.",
          feedback: "O som /b/ aparece em várias palavras da frase.",
        },
        {
          prompt: "Som /r/",
          match: "Rico rato roda rápido.",
          hint: "Ouça o som forte que se repete.",
          feedback: "O som /r/ se repete marcando a aliteração.",
        },
        {
          prompt: "Som /l/",
          match: "Lia leva lápis lilás.",
          hint: "Procure o som suave repetido.",
          feedback: "O som /l/ aparece no início de cada palavra.",
        },
      ],
    },
    {
      slug: "rima-e-cena",
      title: "Rima e Cena",
      prompt: "Combine cada verso rimado com a cena que o representa.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP01"],
      category: "Interpretação rimada",
      duration: 11,
      focus: "interpretação de versos rimados",
      assetSlug: "lp-silaba-ba",
      successFeedback: "Versos e cenas combinados! A história ficou completa.",
      errorFeedback: "Releia as rimas e observe as cenas antes de tentar novamente.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "eco-de-sonoridades",
          description: "Utilizar os sons destacados para interpretar cenas rimadas.",
        },
      ],
      pairs: [
        {
          prompt: "Verso: 'A lua clara dança no telhado dourado.'",
          match: "Cena noturna com luz amarelada sobre as casas.",
          hint: "Visualize a imagem sugerida pela rima.",
          feedback: "A cena destaca a lua brilhando sobre o telhado.",
        },
        {
          prompt: "Verso: 'O vento leve leva folhas pelo chão.'",
          match: "Folhas voando em volta de uma criança sorrindo.",
          hint: "Perceba o movimento descrito no verso.",
          feedback: "O verso descreve folhas em movimento com o vento.",
        },
        {
          prompt: "Verso: 'No lago alegre pula um sapo cantor.'",
          match: "Sapo cantando sobre uma pedra no lago.",
          hint: "Identifique o personagem principal.",
          feedback: "A cena corresponde ao sapo que canta no lago.",
        },
      ],
    },
  ],
  games: [
    {
      slug: "jogo-ritmo-rimado",
      title: "Jogo Ritmo Rimado",
      prompt: "Escolha palavras que mantêm a rima de cada verso.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP01"],
      category: "Rimas em jogo",
      duration: 12,
      focus: "seleção de rimas em jogo",
      assetSlug: "lp-material-caderno",
      victoryMessage: "Rimas certeiras! Você manteve o ritmo do poema.",
      gameOverMessage: "Releia os versos e tente novamente buscando finais parecidos.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ordem-da-parlenda",
          description: "Revisar a sequência rimada antes de jogar.",
        },
      ],
      levels: [
        {
          challenge: "Qual palavra rima com 'pato'? (sapato, cabelo, janela)",
          answer: "sapato",
          hint: "Observe o final das palavras.",
          success: "Sapato combina com 'pato' e mantém a rima!",
          failure: "Leia as opções em voz alta e perceba os sons finais.",
        },
        {
          challenge: "Qual palavra rima com 'caminho'? (ninho, cadeira, janela)",
          answer: "ninho",
          hint: "Repita as palavras e compare os sons finais.",
          success: "Muito bem! 'Caminho' e 'ninho' rimam.",
          failure: "Observe novamente o final das palavras para encontrar a rima.",
        },
        {
          challenge: "Qual palavra rima com 'estrela'? (vela, sapato, livro)",
          answer: "vela",
          hint: "Busque palavras que terminem com o mesmo som.",
          success: "Você manteve a rima com 'estrela' ao escolher 'vela'.",
          failure: "Retome a leitura rimada e tente de novo com atenção.",
        },
      ],
    },
    {
      slug: "trilha-aliterativa",
      title: "Trilha Aliterativa",
      prompt: "Selecione palavras que mantêm a mesma aliteração.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP02"],
      category: "Aliterações em jogo",
      duration: 12,
      focus: "identificação de aliterações",
      assetSlug: "lp-letra-a",
      victoryMessage: "A trilha ficou cheia de sons repetidos!",
      gameOverMessage: "Revise os sons iniciais de cada palavra e tente novamente.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "aliteracao-na-trilha",
          description: "Retomar exemplos de aliteração antes do jogo.",
        },
      ],
      levels: [
        {
          challenge: "Escolha a palavra que mantém o som /m/: (mala, gato, sol)",
          answer: "mala",
          hint: "Observe o som inicial das palavras.",
          success: "Excelente! 'Mala' mantém o som /m/ repetido.",
          failure: "Repita os sons iniciais para encontrar a aliteração.",
        },
        {
          challenge: "Qual palavra continua a aliteração de 'Bia brinca'? (bola, janela, sapo)",
          answer: "bola",
          hint: "Perceba o som inicial que se repete.",
          success: "'Bola' mantém a sequência com o som /b/.",
          failure: "Ouça novamente os sons para manter a aliteração.",
        },
        {
          challenge: "Complete: 'Lia leva ____ leve.' (livros, garrafa, panela)",
          answer: "livros",
          hint: "Procure uma palavra que repita o som /l/.",
          success: "Muito bem! 'Livros' mantém a aliteração com o som /l/.",
          failure: "Releia a frase e destaque o som que se repete.",
        },
      ],
    },
    {
      slug: "ritmo-da-parlenda",
      title: "Ritmo da Parlenda",
      prompt: "Selecione o verso que mantém o ritmo da parlenda apresentada.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP01"],
      category: "Sequência rimada",
      duration: 13,
      focus: "marcação rítmica de parlendas",
      assetSlug: "lp-silaba-la",
      victoryMessage: "A batida rimada ficou perfeita!",
      gameOverMessage: "Retome a leitura com palmas e tente novamente organizando os versos.",
      audioPrompt:
        "Convide a turma a bater palmas ao ouvir o áudio de referência para sentir o ritmo da parlenda.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ordem-da-parlenda",
          description: "Retomar a sequência da parlenda para reconhecer o ritmo.",
        },
      ],
      levels: [
        {
          challenge:
            "Qual verso vem após 'Hoje é domingo'? (pé de cachimbo, a tarde chegou, vamos brincar)",
          answer: "pé de cachimbo",
          hint: "Relembre a parlenda completa.",
          success: "Muito bem! Você manteve o ritmo tradicional da parlenda.",
          failure: "Repita a parlenda em voz alta e tente novamente.",
        },
        {
          challenge: "Escolha o verso que fecha 'Atirei o pau no ____.': (gato, pato, rato)",
          answer: "gato",
          hint: "Lembre da versão mais conhecida da parlenda.",
          success: "Você escolheu o verso que mantém a rima e o ritmo.",
          failure: "Relembre a parlenda completa para encontrar o verso correto.",
        },
        {
          challenge: "Complete 'Quem quer pão, que procure o ____': (padeiro, fogão, João)",
          answer: "João",
          hint: "Pense na rima que fecha a cantiga.",
          success: "Ótimo! O verso mantém a rima com 'pão'.",
          failure: "Releia o verso e compare os sons finais.",
        },
      ],
    },
    {
      slug: "cria-rima-rapida",
      title: "Cria Rima Rápida",
      prompt: "Digite palavras que completam versos rimados.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP11",
      habilidades: ["EF01LP11", "EF01LP01", "EF01LP02"],
      category: "Criação rimada",
      duration: 13,
      focus: "produção de rimas",
      assetSlug: "lp-letra-e",
      victoryMessage: "Versos criados! Suas rimas deram ritmo à história.",
      gameOverMessage: "Revise os sons finais e tente novamente construindo novas rimas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "verso-surpresa",
          description: "Retomar a criação de versos antes do desafio digitado.",
        },
      ],
      levels: [
        {
          challenge: "Digite uma palavra que rima com 'sol'.",
          answer: "farol",
          hint: "Pense em palavras que terminam com o som 'ol'.",
          success: "Muito bem! 'Farol' mantém a rima com 'sol'.",
          failure: "Experimente repetir 'sol' e buscar palavras com o mesmo final.",
        },
        {
          challenge: "Digite uma palavra que rima com 'chão'.",
          answer: "balão",
          hint: "Procure finais que soem como 'ão'.",
          success: "Excelente! 'Balão' mantém a rima com 'chão'.",
          failure: "Leia em voz alta e procure palavras com final 'ão'.",
        },
        {
          challenge: "Digite uma palavra que rima com 'luz'.",
          answer: "cruz",
          hint: "Busque palavras pequenas com final 'uz'.",
          success: "Perfeito! 'Cruz' rima com 'luz'.",
          failure: "Repita 'luz' e procure palavras com o mesmo final.",
        },
      ],
    },
  ],
};

const module7: ModuleInput = {
  slug: "hora-do-dialogo",
  title: "Hora do Diálogo",
  subtitle: "Oralidade e escuta em foco",
  description:
    "Sequência que fortalece a escuta atenta, os turnos de fala e a organização de relatos orais em rodas, entrevistas e dramatizações curtas.",
  learningOutcomes: [
    "Respeitar turnos de fala, utilizando sinais corporais e verbais para entrar e sair do diálogo.",
    "Planejar relatos orais com início, meio e fim, apoiando-se em memórias recentes.",
    "Empregar estratégias de escuta ativa, como paráfrases, perguntas e feedback gestual.",
  ],
  tags: ["oralidade", "escuta", "dialogo"],
  primaryBnccCode: "EF01LP12",
  secondaryBnccCodes: ["EF01LP13"],
  quizzes: [
    {
      slug: "turno-de-fala",
      title: "Turno de Fala",
      prompt: "Identifique a melhor atitude para entrar no diálogo sem interromper colegas.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12", "EF01LP13"],
      category: "Turnos e respeito",
      duration: 8,
      focus: "organização de turnos de fala",
      assetSlug: "lp-material-caderno",
      learningObjectives: [
        "Reconhecer sinais corporais e verbais que indicam a vez de falar.",
        "Praticar a espera ativa antes de responder a colegas.",
      ],
      description:
        "Turno de Fala apresenta situações simples para que a turma escolha o momento adequado de participar do diálogo.",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP12",
          description: "Participar de rodas de conversa mediadas pelo educador.",
        },
      ],
      question: {
        prompt:
          "Durante a roda, Ana terminou de falar. Qual atitude mostra que você quer falar sem interromper?",
        hint: "Lembre como sinalizar a vez com respeito.",
        options: [
          {
            text: "Levantar a mão e esperar o olhar do grupo.",
            isCorrect: true,
            feedback: "Perfeito! O gesto mostra que você espera sua vez de falar.",
          },
          {
            text: "Começar a falar mais alto.",
            isCorrect: false,
            feedback: "Experimente usar um sinal combinado antes de falar.",
          },
          {
            text: "Cutucar o colega ao lado.",
            isCorrect: false,
            feedback: "Evite interromper: sinalize com a mão e aguarde.",
          },
        ],
      },
      trueFalse: {
        statement: "Levantar a mão antes de falar ajuda a organizar os turnos de fala.",
        prompt: "Levantar a mão ajuda a organizar o diálogo?",
        hint: "Pense em como a turma combina quem fala depois.",
        answer: true,
        trueFeedback: "Isso mesmo! O sinal mostra que você está pronto para falar.",
        falseFeedback: "Repare como levantar a mão evita interrupções.",
      },
    },
    {
      slug: "escuta-atenta",
      title: "Escuta Atenta",
      prompt: "Escolha a atitude que demonstra escuta ativa durante a conversa.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12"],
      category: "Escuta ativa",
      duration: 9,
      focus: "escuta ativa",
      assetSlug: "lp-letra-a",
      learningObjectives: [
        "Identificar atitudes que demonstram atenção à fala do colega.",
        "Responder com gentileza após ouvir o interlocutor.",
      ],
      description:
        "Escuta Atenta reforça gestos e expressões que indicam curiosidade, respeito e compreensão durante o diálogo.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "turno-de-fala",
          description: "Retomar combinações de turnos antes de observar atitudes de escuta.",
        },
      ],
      question: {
        prompt: "Qual atitude mostra escuta ativa enquanto um colega fala?",
        hint: "Pense em gestos que demonstram atenção.",
        options: [
          {
            text: "Olhar para quem fala e balançar a cabeça concordando.",
            isCorrect: true,
            feedback: "Ótimo! O gesto mostra interesse e respeito.",
          },
          {
            text: "Mexer no caderno e falar com outro colega.",
            isCorrect: false,
            feedback: "Tente manter o foco dando atenção a quem fala.",
          },
          {
            text: "Virar de costas para ouvir melhor.",
            isCorrect: false,
            feedback: "Olhar para quem fala ajuda a manter a escuta ativa.",
          },
        ],
      },
      trueFalse: {
        statement: "Olhar para quem fala demonstra escuta atenta.",
        prompt: "Olhar para quem fala demonstra escuta?",
        hint: "Relembre como mostramos interesse sem falar nada.",
        answer: true,
        trueFeedback: "Isso mesmo! O olhar atento mostra que você está ouvindo.",
        falseFeedback: "Perceba como manter o olhar ajuda a compreender melhor.",
      },
    },
    {
      slug: "resposta-educada",
      title: "Resposta Educada",
      prompt: "Escolha a resposta que mantém o diálogo respeitoso.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12", "EF01LP13"],
      category: "Respostas no diálogo",
      duration: 9,
      focus: "respostas adequadas",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Responder com gentileza após ouvir uma pergunta.",
        "Retomar informações ditas pelo colega antes de dar opinião.",
      ],
      description:
        "Resposta Educada propõe pequenas situações para que a turma experimente respostas respeitosas e colaborativas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "escuta-atenta",
          description: "Relembrar atitudes de escuta antes de responder.",
        },
      ],
      question: {
        prompt:
          "Colega: 'Você pode me explicar a brincadeira?' Qual resposta mantém o diálogo gentil?",
        hint: "Lembre de agradecer e explicar com clareza.",
        options: [
          {
            text: "Claro! Primeiro formamos uma roda e depois cantamos juntos.",
            isCorrect: true,
            feedback: "Excelente! Você respondeu com clareza e gentileza.",
          },
          {
            text: "Não sei, pergunta para outra pessoa.",
            isCorrect: false,
            feedback: "Experimente acolher a pergunta com respeito.",
          },
          {
            text: "Já falei isso ontem, presta atenção!",
            isCorrect: false,
            feedback: "Tente responder sem julgar o colega.",
          },
        ],
      },
      trueFalse: {
        statement: "Responder retomando a pergunta mostra cuidado com a conversa.",
        prompt: "Retomar a pergunta mostra cuidado com o diálogo?",
        hint: "Pense em como manter a conversa amigável.",
        answer: true,
        trueFeedback: "Muito bem! Retomar a questão ajuda a manter o diálogo claro.",
        falseFeedback: "Perceba como repetir a ideia do colega torna a conversa gentil.",
      },
    },
    {
      slug: "relato-bem-ordenado",
      title: "Relato Bem Ordenado",
      prompt: "Escolha a frase que mantém a sequência do relato.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP13",
      habilidades: ["EF01LP13"],
      category: "Sequência narrativa",
      duration: 10,
      focus: "organização de relatos",
      assetSlug: "lp-silaba-ba",
      learningObjectives: [
        "Organizar relatos curtos com começo, meio e fim.",
        "Apresentar detalhes relevantes ao narrar uma experiência.",
      ],
      description:
        "Relato Bem Ordenado auxilia as crianças a perceber a sequência lógica ao narrar acontecimentos do cotidiano.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "resposta-educada",
          description: "Lembrar de respostas completas antes de organizar um relato.",
        },
      ],
      question: {
        prompt:
          "Relato: 'Na excursão vimos o museu e depois almoçamos'. Qual frase completa o final do relato?",
        hint: "Pense no que aconteceu após o almoço.",
        options: [
          {
            text: "Voltamos para a escola cantando no ônibus.",
            isCorrect: true,
            feedback: "Ótimo! A frase conclui o relato cronologicamente.",
          },
          {
            text: "Quero ir ao parque amanhã.",
            isCorrect: false,
            feedback: "Procure uma frase que finalize a mesma experiência.",
          },
          {
            text: "O museu era distante da escola.",
            isCorrect: false,
            feedback: "Essa informação já apareceu antes no relato?",
          },
        ],
      },
      trueFalse: {
        statement: "Relatos ficam mais claros quando seguem uma sequência temporal.",
        prompt: "Sequência temporal deixa o relato mais claro?",
        hint: "Pense em relatos com começo, meio e fim.",
        answer: true,
        trueFeedback: "Isso mesmo! Sequenciar ajuda todos a entenderem o que ocorreu.",
        falseFeedback: "Imagine contar uma história fora de ordem. Complica, não é?",
      },
    },
    {
      slug: "dialogo-em-equipe",
      title: "Diálogo em Equipe",
      prompt: "Selecione a fala que ajuda o grupo a continuar a conversa.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12", "EF01LP13"],
      category: "Colaboração oral",
      duration: 10,
      focus: "colaboração no diálogo",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Construir falas que conectam ideias de diferentes colegas.",
        "Fazer perguntas complementares para manter o diálogo em andamento.",
      ],
      description:
        "Diálogo em Equipe desafia a turma a conectar falas anteriores, ampliando o assunto com respeito e curiosidade.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "relato-bem-ordenado",
          description: "Relembrar a sequência do relato antes de colaborar no diálogo.",
        },
      ],
      question: {
        prompt:
          "Colega: 'Gostei de visitar a horta da escola.' Qual fala mantém o diálogo em equipe?",
        hint: "Pense em perguntar ou complementar a ideia.",
        options: [
          {
            text: "Eu também! Qual planta você achou mais diferente?",
            isCorrect: true,
            feedback: "Excelente! Você retomou a fala e fez uma pergunta.",
          },
          {
            text: "Vamos falar de outra coisa.",
            isCorrect: false,
            feedback: "Tente manter o assunto por mais um turno.",
          },
          {
            text: "Não gostei da visita.",
            isCorrect: false,
            feedback: "Compartilhe opinião, mas conecte com a fala do colega.",
          },
        ],
      },
      trueFalse: {
        statement: "Fazer perguntas relacionadas mantém a conversa viva.",
        prompt: "Perguntas relacionadas mantêm a conversa viva?",
        hint: "Lembre como manter o assunto girando.",
        answer: true,
        trueFeedback: "Muito bem! Perguntar amplia o diálogo e inclui quem fala.",
        falseFeedback: "Veja como perguntas relacionadas ajudam a aprofundar o tema.",
      },
    },
    {
      slug: "memorias-na-rodinha",
      title: "Memórias na Rodinha",
      prompt: "Escolha a frase que completa o relato do colega com detalhes relevantes.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP13",
      habilidades: ["EF01LP13", "EF01LP12"],
      category: "Relatos detalhados",
      duration: 11,
      focus: "relatos orais detalhados",
      assetSlug: "lp-silaba-la",
      learningObjectives: [
        "Adicionar detalhes relevantes ao relatar vivências.",
        "Usar marcadores temporais simples para organizar o relato.",
      ],
      description:
        "Memórias na Rodinha estimula a turma a complementar relatos com detalhes importantes sobre tempo, lugar e personagens.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "dialogo-em-equipe",
          description: "Retomar estratégias de conexão antes de aprofundar relatos.",
        },
      ],
      question: {
        prompt:
          "Relato: 'Ontem visitei minha avó e ajudamos a fazer bolo'. Qual frase encerra o relato com detalhe?",
        hint: "Pense no que aconteceu depois de preparar o bolo.",
        options: [
          {
            text: "Depois comemos juntos na varanda contando piadas.",
            isCorrect: true,
            feedback: "Ótimo! A frase fecha o relato com mais detalhes.",
          },
          {
            text: "Eu gosto de esportes ao ar livre.",
            isCorrect: false,
            feedback: "Tente finalizar a mesma experiência contada.",
          },
          {
            text: "A varanda é muito bonita.",
            isCorrect: false,
            feedback: "Falta explicar o que ocorreu no final da visita.",
          },
        ],
      },
      trueFalse: {
        statement: "Adicionar onde e com quem aconteceu deixa o relato mais interessante.",
        prompt: "Detalhes de onde e com quem enriquecem o relato?",
        hint: "Pense nos relatos que você gosta de ouvir.",
        answer: true,
        trueFeedback: "Isso! Detalhes aproximam quem escuta da história vivida.",
        falseFeedback: "Compare relatos com e sem detalhes para perceber a diferença.",
      },
    },
  ],
  puzzles: [
    {
      slug: "puzzle-turnos",
      title: "Sinais de Turno",
      prompt: "Associe cada sinal à ação correspondente durante o diálogo.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12"],
      category: "Sinais de diálogo",
      duration: 9,
      focus: "sinais de turnos",
      assetSlug: "lp-letra-a",
      successFeedback: "Turnos organizados! A conversa ficou fluida.",
      errorFeedback: "Revise os sinais combinados e reorganize as cartas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "turno-de-fala",
          description: "Retomar sinais combinados antes de jogar.",
        },
      ],
      pairs: [
        {
          prompt: "Levantar a mão",
          match: "Pedir a vez para falar",
          hint: "Lembre do sinal combinado na roda.",
          feedback: "O gesto mostra que você aguarda sua vez.",
        },
        {
          prompt: "Olhar para quem fala",
          match: "Mostrar que está escutando",
          hint: "Observe onde está a atenção.",
          feedback: "O olhar atento indica escuta ativa.",
        },
        {
          prompt: "Aplaudir suavemente",
          match: "Agradecer a fala do colega",
          hint: "Qual sinal encerra uma participação?",
          feedback: "O gesto avisa que a fala terminou e o grupo agradece.",
        },
      ],
    },
    {
      slug: "puzzle-sinais-de-escuta",
      title: "Sinais de Escuta",
      prompt: "Combine atitudes de escuta com o efeito produzido no diálogo.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12", "EF01LP13"],
      category: "Escuta ativa",
      duration: 10,
      focus: "efeitos da escuta",
      assetSlug: "lp-material-caderno",
      successFeedback: "Escuta ativa confirmada! O diálogo ficou acolhedor.",
      errorFeedback: "Relembre as atitudes de escuta e refaça as combinações.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "escuta-atenta",
          description: "Relembrar atitudes de escuta antes de combinar os cartões.",
        },
      ],
      pairs: [
        {
          prompt: "Balançar a cabeça concordando",
          match: "Mostra que compreendeu a ideia",
          hint: "Pense nos sinais silenciosos.",
          feedback: "O gesto confirma que você acompanhou a fala.",
        },
        {
          prompt: "Perguntar 'Entendi, você pode repetir o tempo?'",
          match: "Verifica se compreendeu corretamente",
          hint: "Perguntas mantêm a conversa.",
          feedback: "A pergunta ajuda a revisar informações importantes.",
        },
        {
          prompt: "Dizer 'Obrigado por compartilhar'",
          match: "Valoriza a fala do colega",
          hint: "Qual atitude agradece a participação?",
          feedback: "Agradecer incentiva novas participações.",
        },
      ],
    },
    {
      slug: "puzzle-relato-sequencia",
      title: "Sequência do Relato",
      prompt: "Relacione partes do relato com marcadores temporais.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP13",
      habilidades: ["EF01LP13"],
      category: "Organização temporal",
      duration: 10,
      focus: "marcadores temporais",
      assetSlug: "lp-letra-e",
      successFeedback: "Relatos organizados! Ficou fácil acompanhar.",
      errorFeedback: "Revise a ordem cronológica e refaça as correspondências.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "relato-bem-ordenado",
          description: "Retomar marcadores antes de montar a sequência.",
        },
      ],
      pairs: [
        {
          prompt: "No começo",
          match: "Saímos da sala e fomos ao pátio",
          hint: "Qual parte inicia o relato?",
          feedback: "Esse trecho mostra o que aconteceu primeiro.",
        },
        {
          prompt: "Depois",
          match: "Jogamos bola em duplas",
          hint: "Pense no meio da história.",
          feedback: "O trecho apresenta a ação intermediária.",
        },
        {
          prompt: "Por fim",
          match: "Voltamos felizes contando o que aprendemos",
          hint: "Qual trecho encerra o relato?",
          feedback: "Esse trecho finaliza o relato com um resumo.",
        },
      ],
    },
    {
      slug: "puzzle-apoios-dialogo",
      title: "Apoios do Diálogo",
      prompt: "Associe cada recurso a como ele ajuda o diálogo coletivo.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12", "EF01LP13"],
      category: "Estratégias orais",
      duration: 11,
      focus: "estratégias de diálogo",
      assetSlug: "lp-silaba-la",
      successFeedback: "Estratégias conectadas! O diálogo ficou rico.",
      errorFeedback: "Revise como cada recurso apoia a conversa.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "dialogo-em-equipe",
          description: "Retomar estratégias colaborativas antes de relacionar os apoios.",
        },
      ],
      pairs: [
        {
          prompt: "Cartões com perguntas",
          match: "Ajudam a continuar a conversa",
          hint: "Pense em como manter o assunto.",
          feedback: "Perguntas prontas reforçam a continuidade do diálogo.",
        },
        {
          prompt: "Gravação de áudio",
          match: "Permite revisar o que já foi dito",
          hint: "Como lembrar das falas anteriores?",
          feedback: "Rever a gravação ajuda a organizar novas falas.",
        },
        {
          prompt: "Painel de combinados",
          match: "Lembra as regras de respeito",
          hint: "Qual recurso mostra os combinados?",
          feedback: "O painel reforça comportamentos acordados pelo grupo.",
        },
      ],
    },
  ],
  games: [
    {
      slug: "jogo-turno-luz",
      title: "Sinal do Turno",
      prompt: "Escolha quem deve falar em cada situação, respeitando os turnos.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12"],
      category: "Turnos em jogo",
      duration: 12,
      focus: "respeito aos turnos",
      assetSlug: "lp-material-caderno",
      victoryMessage: "Turnos organizados! O diálogo ficou harmonioso.",
      gameOverMessage: "Revise os combinados de sinalização e tente novamente com calma.",
      audioPrompt:
        "Reproduza o som do chocalho sempre que o turno muda para simular uma gravação coletiva.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-turnos",
          description: "Relembrar sinais de turno antes do jogo.",
        },
      ],
      levels: [
        {
          challenge:
            "Quem deve falar quando a professora pergunta: 'Quem lembra da regra?' (Quem levantou a mão, Quem está conversando, Quem está distraído)",
          answer: "Quem levantou a mão",
          hint: "Observe quem sinalizou primeiro.",
          success: "Muito bem! O turno passou para quem sinalizou.",
          failure: "Veja quem seguiu o combinado antes de responder.",
        },
        {
          challenge:
            "Se dois colegas levantam a mão, quem fala primeiro? (Quem a professora olhar primeiro, Quem falar mais alto, Quem se levantar)",
          answer: "Quem a professora olhar primeiro",
          hint: "Lembre do combinado com o olhar do mediador.",
          success: "Excelente! Respeitar o olhar do mediador organiza a vez.",
          failure: "Perceba como o olhar indica de quem é a vez.",
        },
        {
          challenge:
            "Durante uma entrevista, quem fala depois da pergunta? (A pessoa entrevistada, O entrevistador novamente, Um aluno qualquer)",
          answer: "A pessoa entrevistada",
          hint: "Pense na ordem da entrevista.",
          success: "Isso! O entrevistado responde após a pergunta.",
          failure: "Relembre como funciona uma entrevista: pergunta e resposta.",
        },
      ],
    },
    {
      slug: "jogo-escuta-ativa",
      title: "Escuta em Ação",
      prompt: "Selecione a resposta que mostra escuta atenta ao colega.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12", "EF01LP13"],
      category: "Escuta ativa",
      duration: 12,
      focus: "respostas de escuta",
      assetSlug: "lp-letra-a",
      victoryMessage: "Escuta afinada! Suas respostas fortaleceram o diálogo.",
      gameOverMessage: "Revise os sinais de escuta e tente novamente com atenção.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-sinais-de-escuta",
          description: "Recordar atitudes de escuta antes de jogar.",
        },
      ],
      levels: [
        {
          challenge:
            "Colega: 'Estou nervoso para apresentar.' Qual resposta mostra escuta? (Entendo, quer ensaiar comigo?, Isso não é importante, Não fala isso)",
          answer: "Entendo, quer ensaiar comigo?",
          hint: "Retome a fala e ofereça apoio.",
          success: "Ótimo! Você acolheu e ofereceu ajuda.",
          failure: "Tente retomar a fala do colega antes de responder.",
        },
        {
          challenge:
            "Colega: 'Esqueci a ordem das etapas.' Qual fala mantém o diálogo? (Vamos revisar juntos?, Não presta atenção?, Eu também esqueci)",
          answer: "Vamos revisar juntos?",
          hint: "Procure apoiar a necessidade do colega.",
          success: "Excelente! Você sugeriu revisar em conjunto.",
          failure: "Recorde que respostas solidárias mantêm o diálogo respeitoso.",
        },
        {
          challenge:
            "Colega: 'Fiquei feliz com o trabalho.' Qual resposta amplia a conversa? (Que bom! O que você mais gostou?, Tá bom, próximo!, Não gostei)",
          answer: "Que bom! O que você mais gostou?",
          hint: "Faça uma pergunta para saber mais.",
          success: "Muito bem! Perguntar mantém a conversa acontecendo.",
          failure: "Lembre de perguntar algo relacionado à fala do colega.",
        },
      ],
    },
    {
      slug: "jogo-relato-rapido",
      title: "Relato Relâmpago",
      prompt: "Digite a palavra que falta para completar o relato.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP13",
      habilidades: ["EF01LP13"],
      category: "Relato oral",
      duration: 13,
      focus: "detalhamento do relato",
      assetSlug: "lp-silaba-ba",
      victoryMessage: "Relato completo! Você organizou todas as etapas.",
      gameOverMessage: "Relembre a sequência do relato e tente novamente preenchendo com calma.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-relato-sequencia",
          description: "Retomar marcadores temporais antes do jogo digitado.",
        },
      ],
      levels: [
        {
          challenge: "'Primeiro chegamos à quadra, depois fizemos alongamento e por fim ____.'",
          answer: "jogamos",
          hint: "Pense no que aconteceu depois do alongamento.",
          success: "Ótimo! A ação final completou o relato.",
          failure: "Relembre a sequência da aula de educação física.",
        },
        {
          challenge: "'No passeio vimos um lago, ouvimos as aves e então ____ fotos.'",
          answer: "tiramos",
          hint: "Qual verbo indica o registro da lembrança?",
          success: "Muito bem! 'Tiramos' completa o relato.",
          failure: "Observe os verbos que relatam ações em sequência.",
        },
        {
          challenge: "'Comecei a tarefa copiando o título, depois colori e finalizei ____.'",
          answer: "recortando",
          hint: "Pense na última ação manual realizada.",
          success: "Perfeito! Você encerrou o relato com a ação correta.",
          failure: "Releia o relato e imagine a ordem das ações.",
        },
      ],
    },
    {
      slug: "jogo-planeja-dialogo",
      title: "Planeja o Diálogo",
      prompt: "Escolha o próximo passo para manter o diálogo coletivo.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP12",
      habilidades: ["EF01LP12", "EF01LP13"],
      category: "Planejamento oral",
      duration: 13,
      focus: "planejamento de fala",
      assetSlug: "lp-letra-e",
      victoryMessage: "Diálogo planejado! O grupo manteve a conversa viva.",
      gameOverMessage: "Revise os passos planejados e tente novamente com atenção.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-apoios-dialogo",
          description: "Relembrar apoios antes de planejar o diálogo.",
        },
      ],
      levels: [
        {
          challenge:
            "Depois de ouvir a opinião de um colega, qual passo mantém a conversa? (Fazer uma pergunta, Mudar de assunto, Ficar em silêncio)",
          answer: "Fazer uma pergunta",
          hint: "Pense em como aprofundar o tema.",
          success: "Perfeito! Uma pergunta mantém o diálogo ativo.",
          failure: "Tente manter o assunto com uma pergunta relacionada.",
        },
        {
          challenge:
            "Se ninguém respondeu ainda, qual passo vem primeiro? (Reforçar o combinado, Contar outra história, Levantar e sair)",
          answer: "Reforçar o combinado",
          hint: "Lembre das regras combinadas.",
          success: "Muito bem! Relembrar os combinados organiza o diálogo.",
          failure: "Lembre que reforçar as regras ajuda o grupo a retomar.",
        },
        {
          challenge:
            "Após ouvir todas as falas, qual ação encerra o diálogo? (Agradecer e resumir, Iniciar novo tema sem aviso, Fazer silêncio longo)",
          answer: "Agradecer e resumir",
          hint: "Pense em como finalizar coletivamente.",
          success: "Excelente! Encerrar agradecendo fortalece a participação.",
          failure: "Tente retomar as ideias principais antes de encerrar.",
        },
      ],
    },
  ],
};

const module8: ModuleInput = {
  slug: "palavras-compostas",
  title: "Palavras Compostas",
  subtitle: "Ampliação de vocabulário em contexto",
  description:
    "Sequência que apresenta palavras compostas, amplia campos semânticos e estimula a dedução de significados a partir de pistas visuais e textuais.",
  learningOutcomes: [
    "Reconhecer palavras compostas formadas por duas ou mais palavras simples.",
    "Relacionar palavras a campos semânticos do cotidiano, ampliando repertório.",
    "Inferir significados de palavras desconhecidas a partir de contexto e morfologia.",
  ],
  tags: ["vocabulário", "palavras-compostas", "contexto"],
  primaryBnccCode: "EF01LP14",
  secondaryBnccCodes: ["EF01LP15"],
  quizzes: [
    {
      slug: "palavra-composta-basica",
      title: "Palavra Composta Básica",
      prompt: "Escolha a palavra composta formada pelas duas palavras apresentadas.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14"],
      category: "Formação de palavras",
      duration: 8,
      focus: "formação de palavras compostas",
      assetSlug: "lp-material-caderno",
      learningObjectives: [
        "Identificar palavras compostas a partir da junção de palavras simples.",
        "Relacionar palavra composta ao objeto representado.",
      ],
      description:
        "Palavra Composta Básica apresenta combinações simples que originam palavras compostas frequentes.",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP14",
          description: "Reconhecer palavras simples relacionadas ao cotidiano.",
        },
      ],
      question: {
        prompt: "Qual palavra surge de 'guarda' + 'chuva'?",
        hint: "Junte as duas palavras e veja se formam um objeto conhecido.",
        options: [
          {
            text: "guarda-chuva",
            isCorrect: true,
            feedback: "Muito bem! 'Guarda-chuva' é a palavra composta.",
          },
          {
            text: "guarda roupa",
            isCorrect: false,
            feedback: "Observe o objeto formado pelas duas palavras.",
          },
          {
            text: "chuva forte",
            isCorrect: false,
            feedback: "Procure a palavra que junta as duas palavras simples.",
          },
        ],
      },
      trueFalse: {
        statement: "Palavras compostas podem ser formadas por duas palavras simples.",
        prompt: "Palavras compostas são formadas por duas palavras simples?",
        hint: "Relembre exemplos que você já conhece.",
        answer: true,
        trueFeedback: "Isso mesmo! Ao juntar palavras simples criamos novas palavras.",
        falseFeedback: "Veja como 'guarda' + 'chuva' formam uma palavra composta.",
      },
    },
    {
      slug: "campos-de-palavras",
      title: "Campos de Palavras",
      prompt: "Escolha a palavra que pertence ao mesmo campo semântico apresentado.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14", "EF01LP15"],
      category: "Campos semânticos",
      duration: 9,
      focus: "campos semânticos",
      assetSlug: "lp-letra-a",
      learningObjectives: [
        "Relacionar palavras a um mesmo tema ou campo semântico.",
        "Ampliar repertório lexical por meio de agrupamentos temáticos.",
      ],
      description:
        "Campos de Palavras estimula as crianças a perceber agrupamentos de palavras que pertencem ao mesmo assunto.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "palavra-composta-basica",
          description: "Retomar exemplos de palavras antes de agrupá-las.",
        },
      ],
      question: {
        prompt: "Qual palavra pertence ao campo das 'brincadeiras ao ar livre'?",
        hint: "Pense em brincadeiras que acontecem fora da sala.",
        options: [
          {
            text: "amarelinha",
            isCorrect: true,
            feedback: "Ótimo! Amarelinha é brincadeira ao ar livre.",
          },
          {
            text: "lição",
            isCorrect: false,
            feedback: "Reflita se a palavra combina com o campo proposto.",
          },
          {
            text: "caderno",
            isCorrect: false,
            feedback: "Procure algo relacionado à brincadeira fora da sala.",
          },
        ],
      },
      trueFalse: {
        statement: "Palavras do mesmo campo semântico ajudam a organizar ideias.",
        prompt: "Campos semânticos ajudam a organizar ideias?",
        hint: "Pense em listas de palavras semelhantes.",
        answer: true,
        trueFeedback: "Isso mesmo! Agrupar palavras facilita a compreensão de temas.",
        falseFeedback: "Observe como brincar, jogar, correr pertencem ao campo 'brincadeiras'.",
      },
    },
    {
      slug: "contexto-indica",
      title: "Contexto Indica",
      prompt: "Identifique o significado da palavra destacada usando o contexto.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP15",
      habilidades: ["EF01LP15"],
      category: "Contexto e significado",
      duration: 9,
      focus: "inferência de significado",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Inferir significado de palavras novas a partir de pistas contextuais.",
        "Explicar oralmente qual pista ajudou a deduzir o significado.",
      ],
      description:
        "Contexto Indica propõe frases curtas para que os estudantes infiram significados com apoio das pistas ao redor da palavra.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "campos-de-palavras",
          description: "Relembrar agrupamentos semânticos antes de deduzir significados.",
        },
      ],
      question: {
        prompt: "Na frase 'Pedro vestiu o guarda-pó para pintar', o que significa 'guarda-pó'?",
        hint: "Observe a palavra 'pintar' e pense no objeto usado.",
        options: [
          {
            text: "Um avental que protege a roupa",
            isCorrect: true,
            feedback: "Perfeito! O contexto da pintura revela o significado.",
          },
          {
            text: "Um pó colorido",
            isCorrect: false,
            feedback: "Releia a frase percebendo o que Pedro vestiu.",
          },
          {
            text: "Um brinquedo novo",
            isCorrect: false,
            feedback: "Analise as pistas da frase para encontrar o sentido.",
          },
        ],
      },
      trueFalse: {
        statement: "O contexto da frase ajuda a entender palavras desconhecidas.",
        prompt: "O contexto ajuda a entender palavras novas?",
        hint: "Pense nas pistas oferecidas pela frase.",
        answer: true,
        trueFeedback: "Sim! As pistas da frase revelam o significado.",
        falseFeedback: "Releia a frase e perceba como as pistas ajudam na compreensão.",
      },
    },
    {
      slug: "dupla-significado",
      title: "Dupla de Significados",
      prompt: "Escolha a palavra composta que traz o significado indicado pelo contexto.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14", "EF01LP15"],
      category: "Vocabulário contextual",
      duration: 10,
      focus: "interpretação de palavras compostas",
      assetSlug: "lp-silaba-ba",
      learningObjectives: [
        "Relacionar palavras compostas ao contexto de uso.",
        "Explicar como cada parte da palavra contribui para o significado.",
      ],
      description:
        "Dupla de Significados desafia a turminha a selecionar a palavra composta mais adequada ao contexto apresentado.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "contexto-indica",
          description: "Praticar inferência antes de escolher palavras compostas em contexto.",
        },
      ],
      question: {
        prompt:
          "Frase: 'Durante a noite, o ____ iluminou a sala'. Qual palavra composta completa o sentido?",
        hint: "Pense no objeto usado para iluminar.",
        options: [
          {
            text: "abajur",
            isCorrect: false,
            feedback: "Observe se a palavra é composta.",
          },
          {
            text: "lampião",
            isCorrect: false,
            feedback: "Procure uma palavra composta por duas palavras.",
          },
          {
            text: "luz-de-vela",
            isCorrect: true,
            feedback: "Excelente! 'Luz-de-vela' é composta e ilumina a sala.",
          },
        ],
      },
      trueFalse: {
        statement: "Partes de uma palavra composta ajudam a entender o significado.",
        prompt: "As partes da palavra composta ajudam no significado?",
        hint: "Repare no que cada parte significa.",
        answer: true,
        trueFeedback: "Correto! Cada parte adiciona uma pista sobre o objeto.",
        falseFeedback: "Veja como 'luz' e 'vela' explicam a palavra completa.",
      },
    },
    {
      slug: "palavra-surpresa",
      title: "Palavra Surpresa",
      prompt: "Interprete a palavra composta destacada e escolha sua melhor definição.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14", "EF01LP15"],
      category: "Análise morfológica",
      duration: 11,
      focus: "significado de compostas",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Analisar partes de palavras compostas para deduzir significados.",
        "Justificar oralmente a escolha do significado mais adequado.",
      ],
      description:
        "Palavra Surpresa apresenta palavras compostas menos habituais para que a turma explore pistas semânticas e morfológicas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "dupla-significado",
          description:
            "Retomar o uso de pistas contextuais antes de analisar palavras menos comuns.",
        },
      ],
      question: {
        prompt: "O que significa 'ponta-cabeça' na frase 'João ficou de ponta-cabeça no parque'?",
        hint: "Imagine o corpo de João nessa posição.",
        options: [
          {
            text: "Ficar com os pés para o alto e a cabeça para baixo",
            isCorrect: true,
            feedback: "Muito bem! A palavra composta indica a posição do corpo.",
          },
          {
            text: "Ficar muito pensativo",
            isCorrect: false,
            feedback: "Observe como cada parte da palavra descreve o movimento.",
          },
          {
            text: "Ficar parado observando",
            isCorrect: false,
            feedback: "Releia a palavra percebendo 'ponta' e 'cabeça'.",
          },
        ],
      },
      trueFalse: {
        statement: "Conhecer as partes da palavra composta ajuda a entender figuras de linguagem.",
        prompt: "As partes da palavra ajudam a entender expressões?",
        hint: "Pense em palavras compostas que descrevem ações.",
        answer: true,
        trueFeedback: "Ótimo! As partes da palavra orientam o sentido figurado.",
        falseFeedback: "Veja como 'ponta' e 'cabeça' descrevem a posição corporal.",
      },
    },
    {
      slug: "deduza-o-significado",
      title: "Deduza o Significado",
      prompt: "Analise a frase e escolha o significado aproximado da palavra em destaque.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP15",
      habilidades: ["EF01LP15", "EF01LP14"],
      category: "Inferência lexical",
      duration: 11,
      focus: "inferência lexical avançada",
      assetSlug: "lp-silaba-la",
      learningObjectives: [
        "Inferir significados usando pistas contextuais e conhecimento prévio.",
        "Debater com colegas as hipóteses construídas a partir do texto.",
      ],
      description:
        "Deduza o Significado desafia a turma a interpretar palavras desconhecidas utilizando várias pistas do enunciado.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "palavra-surpresa",
          description: "Retomar análise de palavras compostas antes de ampliar inferências.",
        },
      ],
      question: {
        prompt:
          "'O vendedor usou um megafone para chamar atenção'. Qual o significado de 'megafone'?",
        hint: "Observe que recurso ajuda a chamar atenção.",
        options: [
          {
            text: "Aparelho que amplia a voz",
            isCorrect: true,
            feedback: "Perfeito! 'Mega' sugere grande e 'fone' relaciona-se a som.",
          },
          {
            text: "Cartaz colorido",
            isCorrect: false,
            feedback: "Verifique se 'fone' se relaciona a som ou imagem.",
          },
          {
            text: "Sapato brilhoso",
            isCorrect: false,
            feedback: "Procure pistas na frase que indiquem o significado.",
          },
        ],
      },
      trueFalse: {
        statement: "O prefixo 'mega' indica algo grande ou intenso.",
        prompt: "'Mega' indica algo grande?",
        hint: "Lembre de palavras com 'mega'.",
        answer: true,
        trueFeedback: "Correto! 'Mega' reforça a ideia de grande intensidade.",
        falseFeedback: "Reveja palavras como 'megastore' para associar o sentido.",
      },
    },
  ],
  puzzles: [
    {
      slug: "puzzle-monta-composta",
      title: "Monta Composta",
      prompt: "Associe combinações de palavras aos objetos formados.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14"],
      category: "Formação de compostas",
      duration: 9,
      focus: "montagem de palavras compostas",
      assetSlug: "lp-letra-a",
      successFeedback: "Palavras montadas! O vocabulário cresceu.",
      errorFeedback: "Relembre as combinações e tente novamente.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "palavra-composta-basica",
          description: "Retomar exemplos antes de montar novas palavras.",
        },
      ],
      pairs: [
        {
          prompt: "guarda + roupa",
          match: "guarda-roupa",
          hint: "Procure um móvel usado para organizar roupas.",
          feedback: "A combinação forma o móvel conhecido no quarto.",
        },
        {
          prompt: "para + raios",
          match: "pára-raios",
          hint: "Imagine algo que protege prédios durante tempestades.",
          feedback: "A palavra composta indica o equipamento de proteção.",
        },
        {
          prompt: "meia + noite",
          match: "meia-noite",
          hint: "Pense em um horário especial do dia.",
          feedback: "A junção cria a palavra composta 'meia-noite'.",
        },
      ],
    },
    {
      slug: "puzzle-campo-semantico",
      title: "Campo Semântico",
      prompt: "Relacione cada palavra ao campo temático correspondente.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14", "EF01LP15"],
      category: "Agrupamentos lexicais",
      duration: 10,
      focus: "agrupamento semântico",
      assetSlug: "lp-material-caderno",
      successFeedback: "Campos organizados! O vocabulário ficou variado.",
      errorFeedback: "Revise os temas e reorganize os cartões.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "campos-de-palavras",
          description: "Retomar exemplos de campos semânticos antes de associar.",
        },
      ],
      pairs: [
        {
          prompt: "Cozinha",
          match: "panela",
          hint: "Qual objeto pertence à cozinha?",
          feedback: "A panela integra o campo da cozinha.",
        },
        {
          prompt: "Transporte",
          match: "bicicleta",
          hint: "Pense em meios de deslocamento.",
          feedback: "A bicicleta pertence ao campo transporte.",
        },
        {
          prompt: "Comunicação",
          match: "telefone",
          hint: "Qual objeto serve para conversar?",
          feedback: "Telefone integra o campo comunicação.",
        },
      ],
    },
    {
      slug: "puzzle-contexto-pista",
      title: "Pistas do Contexto",
      prompt: "Associe a frase à pista que ajuda a entender a palavra destacada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP15",
      habilidades: ["EF01LP15"],
      category: "Inferência contextual",
      duration: 10,
      focus: "pistas de significado",
      assetSlug: "lp-letra-e",
      successFeedback: "Pistas identificadas! As palavras ficaram claras.",
      errorFeedback: "Analise novamente as frases para identificar as pistas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "contexto-indica",
          description: "Retomar exemplos de inferência antes de associar pistas.",
        },
      ],
      pairs: [
        {
          prompt: "A toalha estava encharcada depois da chuva. (palavra: encharcada)",
          match: "Indica que está muito molhada",
          hint: "Observe o que aconteceu com a toalha.",
          feedback: "O contexto 'chuva' indica que a toalha ficou muito molhada.",
        },
        {
          prompt: "O menino sussurrou segredos no ouvido. (palavra: sussurrou)",
          match: "Fala em voz bem baixa",
          hint: "Veja onde ele falou.",
          feedback: "Falar no ouvido sugere voz baixa, ou sussurro.",
        },
        {
          prompt: "A praça estava lotada de famílias. (palavra: lotada)",
          match: "Estava muito cheia",
          hint: "Olhe o número de pessoas.",
          feedback: "'Lotada' indica local cheio de pessoas.",
        },
      ],
    },
    {
      slug: "puzzle-expressoes-compostas",
      title: "Expressões Compostas",
      prompt: "Associe a expressão composta ao significado figurado.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14", "EF01LP15"],
      category: "Expressões idiomáticas",
      duration: 11,
      focus: "interpretação figurada",
      assetSlug: "lp-silaba-la",
      successFeedback: "Expressões compreendidas! Vocabulário ampliado.",
      errorFeedback: "Releia as expressões e verifique o sentido figurado.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "palavra-surpresa",
          description: "Relembrar palavras compostas antes de interpretar expressões.",
        },
      ],
      pairs: [
        {
          prompt: "pé-de-moleque",
          match: "Doce feito com amendoim e rapadura",
          hint: "Pense em um alimento brasileiro.",
          feedback: "A expressão nomeia um doce tradicional.",
        },
        {
          prompt: "mão-na-roda",
          match: "Ajuda importante em uma situação",
          hint: "Lembre de expressões que indicam apoio.",
          feedback: "'Mão-na-roda' significa ajuda que facilita a tarefa.",
        },
        {
          prompt: "boca-a-boca",
          match: "Divulgação feita pelas pessoas",
          hint: "Observe o contexto de conversa entre pessoas.",
          feedback: "A expressão indica notícia espalhada pelas pessoas.",
        },
      ],
    },
  ],
  games: [
    {
      slug: "jogo-forma-palavra",
      title: "Forma Palavra",
      prompt: "Escolha a palavra composta que corresponde às imagens.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14"],
      category: "Formação em jogo",
      duration: 12,
      focus: "identificação de palavras compostas",
      assetSlug: "lp-material-caderno",
      victoryMessage: "Palavras montadas! Você ampliou o vocabulário.",
      gameOverMessage: "Observe novamente as imagens e tente de novo com atenção.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-monta-composta",
          description: "Montar palavras antes de identificá-las em jogo.",
        },
      ],
      levels: [
        {
          challenge:
            "Imagem de uma bola + imagem de algemas. Qual palavra composta? (bola-de-neve, bola-de-ferro, bola-de-futebol)",
          answer: "bola-de-ferro",
          hint: "Perceba como as imagens se combinam.",
          success: "Ótimo! Você identificou a palavra composta correta.",
          failure: "Reveja o que cada parte da palavra representa.",
        },
        {
          challenge:
            "Imagem de um telefone + imagem de um livro. (telefone sem fio, livro-caixa, telefone-livro)",
          answer: "telefone sem fio",
          hint: "Observe qual combinação forma uma palavra conhecida.",
          success: "Muito bem! A expressão 'telefone sem fio' é composta.",
          failure: "Busque a palavra composta que você já ouviu em brincadeiras.",
        },
        {
          challenge: "Imagem de sol + imagem de óculos. (óculos escuros, guarda-sol, sol-e-mar)",
          answer: "óculos escuros",
          hint: "Perceba qual palavra liga sol a proteção dos olhos.",
          success: "Excelente! Óculos escuros relaciona-se à luz do sol.",
          failure: "Veja que 'óculos escuros' é composto e protege do sol.",
        },
      ],
    },
    {
      slug: "jogo-encaixa-sentido",
      title: "Encaixa Sentido",
      prompt: "Selecione o significado que melhor se encaixa na palavra destacada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP15",
      habilidades: ["EF01LP15", "EF01LP14"],
      category: "Significados em jogo",
      duration: 12,
      focus: "inferência contextual",
      assetSlug: "lp-letra-a",
      victoryMessage: "Significados encaixados! Você entendeu o contexto.",
      gameOverMessage: "Releia as frases com calma e tente novamente identificando as pistas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-contexto-pista",
          description: "Relembrar pistas contextuais antes do jogo.",
        },
      ],
      levels: [
        {
          challenge:
            "'O trem-bala passou rápido pelos trilhos'. Aqui 'trem-bala' significa... (trem muito veloz, trem cheio de balas, brinquedo de parque)",
          answer: "trem muito veloz",
          hint: "Observe o adjetivo 'rápido'.",
          success: "Isso! A palavra composta indica velocidade.",
          failure: "Repare em pistas contextuais que indicam velocidade.",
        },
        {
          challenge:
            "'Marina usou um guarda-sol na praia'. O guarda-sol serve para... (guardar objetos, proteger do sol, carregar água)",
          answer: "proteger do sol",
          hint: "Considere onde Marina está.",
          success: "Perfeito! O objeto protege do sol na praia.",
          failure: "Veja como o contexto da praia aponta o significado.",
        },
        {
          challenge:
            "'Pedro escreveu um bilhete usando papel-carbono'. O papel-carbono ajuda a... (fazer cópia, pintar, dobrar)",
          answer: "fazer cópia",
          hint: "Pense na função do papel-carbono.",
          success: "Muito bem! A palavra composta revela a função.",
          failure: "Relembre o que acontece quando usamos papel-carbono.",
        },
      ],
    },
    {
      slug: "jogo-explora-hibridos",
      title: "Explora Híbridos",
      prompt: "Digite a parte que falta para formar a palavra composta indicada pelo contexto.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP14",
      habilidades: ["EF01LP14", "EF01LP15"],
      category: "Completar compostas",
      duration: 13,
      focus: "completar palavras compostas",
      assetSlug: "lp-silaba-ba",
      victoryMessage: "Palavra completa! Você explorou o significado oculto.",
      gameOverMessage: "Relembre as partes da palavra e tente novamente digitando com calma.",
      audioPrompt:
        "Convide a turma a repetir a palavra em voz alta após completar, simulando gravação coletiva do vocabulário.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-monta-composta",
          description: "Retomar combinações antes de completar palavras digitando.",
        },
      ],
      levels: [
        {
          challenge: "Complete: 'passa-____' (dica: usado para consertar roupa)",
          answer: "fio",
          hint: "Pense no objeto utilizado para costurar.",
          success: "Muito bem! 'Passa-fio' indica o instrumento de costura.",
          failure: "Relembre o objeto usado para passar linha na agulha.",
        },
        {
          challenge: "Complete: 'beija-____' (dica: ave que se alimenta de néctar)",
          answer: "flor",
          hint: "Lembre do pássaro pequeno colorido.",
          success: "Perfeito! 'Beija-flor' forma a palavra composta.",
          failure: "Pense no movimento da ave ao se alimentar.",
        },
        {
          challenge: "Complete: 'pára-____' (dica: usado em dias de chuva)",
          answer: "raios",
          hint: "Recorde o objeto que protege prédios.",
          success: "Excelente! 'Pára-raios' protege em dias de tempestade.",
          failure: "Relembre a palavra composta estudada nas atividades.",
        },
      ],
    },
    {
      slug: "jogo-detective-palavras",
      title: "Detetive de Palavras",
      prompt: "Analise as pistas e escolha a definição correta da palavra composta.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP15",
      habilidades: ["EF01LP15", "EF01LP14"],
      category: "Detetive lexical",
      duration: 13,
      focus: "dedução lexical",
      assetSlug: "lp-letra-e",
      victoryMessage: "Caso resolvido! Você interpretou todas as pistas.",
      gameOverMessage: "Releia as pistas calmamente e tente novamente deduzindo o sentido.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-expressoes-compostas",
          description: "Relembrar expressões compostas antes de atuar como detetive.",
        },
      ],
      levels: [
        {
          challenge:
            "Pistas: usado em emergências, faz muito barulho, chama a atenção na rua. Qual palavra composta? (gira-sol, carro-bomba, carro de som)",
          answer: "carro de som",
          hint: "Pense no veículo que anuncia mensagens.",
          success: "Muito bem! Você associou as pistas corretamente.",
          failure: "Observe quais pistas falam sobre som alto e rua.",
        },
        {
          challenge:
            "Pistas: fica na cabeça, protege do sol forte, usado na praia. (chapéu de chuva, guarda-sol, chapéu-de-sol)",
          answer: "chapéu-de-sol",
          hint: "Lembre da palavra que indica proteção na cabeça.",
          success: "Excelente! O 'chapéu-de-sol' protege na praia.",
          failure: "Veja qual palavra realmente fica na cabeça.",
        },
        {
          challenge:
            "Pistas: ajuda a guardar memória, registra fotos e palavras, usado pelos estudantes. (caderno inteligente, livro-caixa, diário de bordo)",
          answer: "diário de bordo",
          hint: "Pense em um caderno que registra acontecimentos.",
          success: "Caso resolvido! Você relacionou todas as pistas.",
          failure: "Procure a palavra composta que indica registro diário.",
        },
      ],
    },
  ],
};

const module9: ModuleInput = {
  slug: "pontuacao-animada",
  title: "Pontuação Animada",
  subtitle: "Ponto final, interrogação e exclamação",
  description:
    "Sequência lúdica para reconhecer, usar e revisar sinais de pontuação básicos em frases curtas, diálogos e pequenos textos coletivos.",
  learningOutcomes: [
    "Identificar usos de ponto final, ponto de interrogação e ponto de exclamação em frases do cotidiano.",
    "Ajustar pontuação de frases simples para garantir clareza e entonação adequada.",
    "Experimentar leituras orais marcando entonação conforme cada sinal.",
  ],
  tags: ["pontuacao", "leitura", "escrita"],
  primaryBnccCode: "EF01LP16",
  secondaryBnccCodes: ["EF01LP17"],
  quizzes: [
    {
      slug: "ponto-final-basico",
      title: "Ponto Final Básico",
      prompt: "Escolha a frase que termina corretamente com ponto final.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16"],
      category: "Finalização de frases",
      duration: 8,
      focus: "uso do ponto final",
      assetSlug: "lp-material-caderno",
      learningObjectives: [
        "Reconhecer quando utilizar ponto final em frases declarativas.",
        "Diferenciar frases completas de frases que precisam de continuação.",
      ],
      description:
        "Ponto Final Básico apresenta frases curtas para que a turma identifique o encerramento mais adequado.",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP16",
          description: "Ler frases curtas produzidas coletivamente.",
        },
      ],
      question: {
        prompt: "Qual frase está corretamente finalizada com ponto final?",
        hint: "Observe se a frase transmite uma ideia completa.",
        options: [
          {
            text: "A turma organizou a biblioteca.",
            isCorrect: true,
            feedback: "Muito bem! A frase encerra uma ideia completa.",
          },
          {
            text: "Gostaria de brincar",
            isCorrect: false,
            feedback: "Falta indicar se é pergunta ou frase incompleta.",
          },
          {
            text: "Onde está o livro.",
            isCorrect: false,
            feedback: "A frase é uma pergunta e precisa de outro sinal.",
          },
        ],
      },
      trueFalse: {
        statement: "Usamos ponto final para encerrar frases que informam algo.",
        prompt: "Ponto final encerra frases que informam?",
        hint: "Pense em frases que apenas comunicam uma ideia.",
        answer: true,
        trueFeedback: "Correto! O ponto final marca o término da afirmação.",
        falseFeedback: "Releia exemplos de frases informativas com ponto final.",
      },
    },
    {
      slug: "pergunta-ou-prossegue",
      title: "Pergunta ou Prossegue",
      prompt: "Identifique se a frase deve terminar com ponto de interrogação.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP17",
      habilidades: ["EF01LP17", "EF01LP16"],
      category: "Identificação de perguntas",
      duration: 9,
      focus: "uso do ponto de interrogação",
      assetSlug: "lp-letra-a",
      learningObjectives: [
        "Diferenciar perguntas de afirmações em frases curtas.",
        "Utilizar ponto de interrogação ao final de perguntas simples.",
      ],
      description:
        "Pergunta ou Prossegue apresenta frases para que a turma identifique entonação interrogativa e selecione o sinal adequado.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ponto-final-basico",
          description: "Relembrar frases declarativas antes de observar perguntas.",
        },
      ],
      question: {
        prompt: "A frase 'Você vai ao recreio agora' pede ponto de interrogação?",
        hint: "Observe se a frase faz uma pergunta.",
        options: [
          {
            text: "Sim, porque é uma pergunta direta.",
            isCorrect: true,
            feedback: "Ótimo! A frase solicita resposta e precisa de interrogação.",
          },
          {
            text: "Não, porque é uma afirmação.",
            isCorrect: false,
            feedback: "Perceba que há entonação de pergunta na frase.",
          },
          {
            text: "Talvez, depende do humor.",
            isCorrect: false,
            feedback: "Analise se a frase pede informação do interlocutor.",
          },
        ],
      },
      trueFalse: {
        statement: "Perguntas diretas terminam com ponto de interrogação.",
        prompt: "Perguntas diretas usam ponto de interrogação?",
        hint: "Pense em como perguntamos algo a alguém.",
        answer: true,
        trueFeedback: "Correto! Perguntas pedem o sinal de interrogação.",
        falseFeedback: "Relembre exemplos de perguntas do cotidiano.",
      },
    },
    {
      slug: "emocao-na-frase",
      title: "Emoção na Frase",
      prompt: "Selecione a frase que precisa de ponto de exclamação.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP17",
      habilidades: ["EF01LP17"],
      category: "Expressão de emoção",
      duration: 9,
      focus: "uso do ponto de exclamação",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Identificar frases que expressam surpresa, alegria ou emoção.",
        "Utilizar ponto de exclamação para reforçar entonação emotiva.",
      ],
      description:
        "Emoção na Frase apresenta diferentes intenções comunicativas para que a turma escolha quando usar exclamação.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "pergunta-ou-prossegue",
          description: "Relembrar perguntas antes de observar frases exclamativas.",
        },
      ],
      question: {
        prompt: "Qual frase precisa de ponto de exclamação no final?",
        hint: "Observe a emoção transmitida.",
        options: [
          {
            text: "Que alegria rever vocês",
            isCorrect: true,
            feedback: "Isso! A frase expressa emoção e pede exclamação.",
          },
          {
            text: "Vamos à biblioteca",
            isCorrect: false,
            feedback: "Tente perceber se há intensidade na frase.",
          },
          {
            text: "A tarefa é para amanhã",
            isCorrect: false,
            feedback: "A frase apenas informa algo.",
          },
        ],
      },
      trueFalse: {
        statement: "Frases que expressam surpresa podem terminar com ponto de exclamação.",
        prompt: "Surpresa pode usar exclamação?",
        hint: "Lembre de expressões de alegria ou medo.",
        answer: true,
        trueFeedback: "Perfeito! O ponto de exclamação destaca a emoção.",
        falseFeedback: "Relembre frases que mostram espanto e recebem exclamação.",
      },
    },
    {
      slug: "escuta-da-pontuacao",
      title: "Escuta da Pontuação",
      prompt: "Analise a situação e identifique qual sinal mantém a clareza da frase.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16", "EF01LP17"],
      category: "Escolha de sinais",
      duration: 10,
      focus: "seleção de sinais básicos",
      assetSlug: "lp-silaba-ba",
      learningObjectives: [
        "Comparar diferentes sinais para manter a clareza da frase.",
        "Discutir em grupo a melhor escolha de pontuação.",
      ],
      description:
        "Escuta da Pontuação convida a turma a selecionar sinais que melhor representam a intenção comunicativa.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "emocao-na-frase",
          description: "Relembre emoções antes de escolher o sinal adequado.",
        },
      ],
      question: {
        prompt: "Frase: 'Você terminou a atividade'. Qual sinal mantém a intenção de pergunta?",
        hint: "Pense na entonação pretendida.",
        options: [
          {
            text: "Ponto de interrogação",
            isCorrect: true,
            feedback: "Ótimo! A frase passa a ser uma pergunta.",
          },
          {
            text: "Ponto final",
            isCorrect: false,
            feedback: "Assim a frase vira afirmação.",
          },
          {
            text: "Ponto de exclamação",
            isCorrect: false,
            feedback: "Observe se há emoção intensa na frase.",
          },
        ],
      },
      trueFalse: {
        statement: "O mesmo enunciado pode ganhar sentidos diferentes com sinais distintos.",
        prompt: "Pontuação diferente muda o sentido?",
        hint: "Compare frases com ? e !",
        answer: true,
        trueFeedback: "Correto! A escolha do sinal altera a intenção.",
        falseFeedback: "Experimente ler a frase com sinais variados para perceber a diferença.",
      },
    },
    {
      slug: "corrige-a-pontuacao",
      title: "Corrige a Pontuação",
      prompt: "Selecione a versão pontuada corretamente da frase apresentada.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16", "EF01LP17"],
      category: "Revisão de pontuação",
      duration: 10,
      focus: "revisão de frases",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Revisar frases curtas, ajustando pontuação quando necessário.",
        "Justificar oralmente a escolha do sinal correto.",
      ],
      description:
        "Corrige a Pontuação desafia a turma a comparar opções e selecionar a frase revisada corretamente.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "escuta-da-pontuacao",
          description: "Usar a discussão sobre sinais antes de revisar frases.",
        },
      ],
      question: {
        prompt: "Qual versão está pontuada corretamente?",
        hint: "Observe a intenção e escolha o sinal adequado.",
        options: [
          {
            text: "Você vem brincar comigo?",
            isCorrect: true,
            feedback: "Excelente! A frase pergunta algo e usa interrogação.",
          },
          {
            text: "Você vem brincar comigo!",
            isCorrect: false,
            feedback: "Esse sinal indica emoção, não uma pergunta.",
          },
          {
            text: "Você vem brincar comigo.",
            isCorrect: false,
            feedback: "Cuidado: assim vira afirmação.",
          },
        ],
      },
      trueFalse: {
        statement: "Revisar a pontuação ajuda a tornar o texto mais claro.",
        prompt: "Revisar pontuação deixa o texto mais claro?",
        hint: "Pense em frases pontuadas de forma errada.",
        answer: true,
        trueFeedback: "Isso! Revisar garante que a mensagem seja compreendida.",
        falseFeedback: "Compare a frase antes e depois da revisão para notar a diferença.",
      },
    },
    {
      slug: "escolha-o-sinal",
      title: "Escolha o Sinal",
      prompt: "Determine qual sinal melhor completa a frase de acordo com a intenção.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP17",
      habilidades: ["EF01LP17", "EF01LP16"],
      category: "Uso flexível de sinais",
      duration: 11,
      focus: "flexibilidade no uso de sinais",
      assetSlug: "lp-silaba-la",
      learningObjectives: [
        "Selecionar sinais de pontuação considerando entonação e intenção.",
        "Argumentar sobre escolhas de pontuação em pequenos grupos.",
      ],
      description:
        "Escolha o Sinal convida os estudantes a analisar intenções e selecionar o sinal mais coerente para cada frase.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "corrige-a-pontuacao",
          description: "Retomar revisão antes de tomar decisões flexíveis.",
        },
      ],
      question: {
        prompt:
          "Frase: 'Que surpresa encontrar você aqui' Qual sinal representa melhor a intenção?",
        hint: "Pense na emoção transmitida pelo falante.",
        options: [
          {
            text: "Ponto de exclamação",
            isCorrect: true,
            feedback: "Perfeito! A frase demonstra surpresa.",
          },
          {
            text: "Ponto final",
            isCorrect: false,
            feedback: "Esse sinal não reforça a surpresa.",
          },
          {
            text: "Ponto de interrogação",
            isCorrect: false,
            feedback: "A frase não pede resposta.",
          },
        ],
      },
      trueFalse: {
        statement: "Entender a intenção da fala ajuda a escolher a pontuação.",
        prompt: "Intenção ajuda a escolher o sinal?",
        hint: "Pense na diferença entre contar algo e comemorar.",
        answer: true,
        trueFeedback: "Correto! A intenção orienta o uso dos sinais.",
        falseFeedback: "Compare frases com diferentes intenções para confirmar.",
      },
    },
  ],
  puzzles: [
    {
      slug: "puzzle-sinais",
      title: "Sinais e Frases",
      prompt: "Associe a frase ao sinal de pontuação correspondente.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16", "EF01LP17"],
      category: "Associação básica",
      duration: 9,
      focus: "reconhecimento de sinais",
      assetSlug: "lp-letra-a",
      successFeedback: "Associações perfeitas! Os sinais ganharam vida.",
      errorFeedback: "Releia as frases e identifique a intenção antes de tentar de novo.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ponto-final-basico",
          description: "Relembrar frases declarativas antes da associação.",
        },
      ],
      pairs: [
        {
          prompt: "Vamos ao parque hoje",
          match: "?",
          hint: "É pergunta ou afirmação?",
          feedback: "A frase solicita resposta, por isso combina com '?'.",
        },
        {
          prompt: "Que alegria ver vocês",
          match: "!",
          hint: "Identifique a emoção na frase.",
          feedback: "O entusiasmo pede ponto de exclamação.",
        },
        {
          prompt: "O recreio começa às dez horas",
          match: ".",
          hint: "A frase apenas informa algo.",
          feedback: "Perfeito! O ponto final encerra a informação.",
        },
      ],
    },
    {
      slug: "puzzle-intencoes",
      title: "Intenções e Sinais",
      prompt: "Relacione cada intenção comunicativa ao sinal correspondente.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP17",
      habilidades: ["EF01LP17", "EF01LP16"],
      category: "Intenção comunicativa",
      duration: 10,
      focus: "intenção e pontuação",
      assetSlug: "lp-material-caderno",
      successFeedback: "Intenções alinhadas! A leitura ganhou expressão.",
      errorFeedback: "Reveja o que cada sinal comunica antes de reorganizar.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "pergunta-ou-prossegue",
          description: "Recordar perguntas antes de associar intenções.",
        },
      ],
      pairs: [
        {
          prompt: "Surpresa",
          match: "!",
          hint: "Pense em reações emocionadas.",
          feedback: "Surpresa se expressa com exclamação.",
        },
        {
          prompt: "Curiosidade",
          match: "?",
          hint: "Observe qual sinal pede resposta.",
          feedback: "Curiosidade é marcada por perguntas.",
        },
        {
          prompt: "Informação",
          match: ".",
          hint: "Qual sinal apenas encerra a frase?",
          feedback: "Informações terminam com ponto final.",
        },
      ],
    },
    {
      slug: "puzzle-dialogo",
      title: "Pontuação do Diálogo",
      prompt: "Associe cada fala ao sinal que deve aparecer ao final na fala do personagem.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16", "EF01LP17"],
      category: "Pontuação de falas",
      duration: 10,
      focus: "pontuação de diálogos",
      assetSlug: "lp-letra-e",
      successFeedback: "Diálogo pontuado! Cada fala ficou clara.",
      errorFeedback: "Analise a voz do personagem antes de refazer.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "escuta-da-pontuacao",
          description: "Relembrar análise de intenção antes de pontuar diálogos.",
        },
      ],
      pairs: [
        {
          prompt: "Maria perguntou se o jogo já começou",
          match: "?",
          hint: "A fala pede resposta?",
          feedback: "Sim! A fala termina com ponto de interrogação.",
        },
        {
          prompt: "João gritou que adorou a apresentação",
          match: "!",
          hint: "Observe a emoção da fala.",
          feedback: "O entusiasmo pede exclamação.",
        },
        {
          prompt: "A professora avisou que amanhã haverá prova",
          match: ".",
          hint: "É um aviso informativo.",
          feedback: "A frase encerra com ponto final.",
        },
      ],
    },
    {
      slug: "puzzle-remix",
      title: "Remix da Pontuação",
      prompt: "Combine frases reorganizadas aos sinais que corrigem sua entonação.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16", "EF01LP17"],
      category: "Revisão avançada",
      duration: 11,
      focus: "revisão de pontuação",
      assetSlug: "lp-silaba-ba",
      successFeedback: "Revisão concluída! Cada frase ganhou o sinal certo.",
      errorFeedback: "Leia as frases em voz alta antes de tentar novamente.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "corrige-a-pontuacao",
          description: "Retomar revisão antes do remix de sinais.",
        },
      ],
      pairs: [
        {
          prompt: "Cuidado ao atravessar a rua",
          match: "!",
          hint: "A frase alerta ou informa?",
          feedback: "É um alerta e precisa de exclamação.",
        },
        {
          prompt: "Você participou da festa",
          match: "?",
          hint: "Pense se a frase pede resposta.",
          feedback: "Com o sinal de interrogação, vira uma pergunta.",
        },
        {
          prompt: "A reunião terminou",
          match: ".",
          hint: "Apenas comunica algo?",
          feedback: "Sim! É uma afirmação que termina com ponto final.",
        },
      ],
    },
  ],
  games: [
    {
      slug: "jogo-busca-ponto",
      title: "Busca Pontuada",
      prompt: "Escolha o sinal correto para completar cada frase.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16", "EF01LP17"],
      category: "Seleção de sinais",
      duration: 12,
      focus: "seleção rápida de pontuação",
      assetSlug: "lp-material-caderno",
      victoryMessage: "Pontuação alinhada! Você finalizou todas as frases.",
      gameOverMessage: "Releia as frases e tente novamente escolhendo com calma o sinal.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-sinais",
          description: "Associar frases e sinais antes do jogo.",
        },
      ],
      levels: [
        {
          challenge: "Complete: 'Vamos brincar depois do lanche' (., ?, !)",
          answer: ".",
          hint: "A frase apenas informa algo.",
          success: "Muito bem! O ponto final encerra a afirmação.",
          failure: "Veja se a frase faz pergunta ou expressa emoção.",
        },
        {
          challenge: "Complete: 'Que lugar bonito' (., ?, !)",
          answer: "!",
          hint: "Perceba a emoção envolvida.",
          success: "Ótimo! O sinal de exclamação demonstra entusiasmo.",
          failure: "Avalie se há emoção forte na frase.",
        },
        {
          challenge: "Complete: 'Você trouxe o caderno' (., ?, !)",
          answer: "?",
          hint: "A frase pede resposta?",
          success: "Perfeito! A frase vira pergunta com interrogação.",
          failure: "Repare na entonação interrogativa.",
        },
      ],
    },
    {
      slug: "jogo-pergunta-surpresa",
      title: "Pergunta Surpresa",
      prompt: "Ouça a situação e selecione o sinal que representa a entonação apresentada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP17",
      habilidades: ["EF01LP17", "EF01LP16"],
      category: "Entonação interrogativa",
      duration: 12,
      focus: "interpretação auditiva",
      assetSlug: "lp-letra-a",
      victoryMessage: "Você marcou cada pergunta corretamente!",
      gameOverMessage: "Repita as pistas sonoras e tente novamente com atenção.",
      audioPrompt:
        "Use a gravação de voz proposta no enunciado para simular uma entrevista com perguntas e respostas.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-intencoes",
          description: "Relembrar intenções comunicativas antes de ouvir as perguntas.",
        },
      ],
      levels: [
        {
          challenge:
            "Situação: a professora fala com voz curiosa. Qual sinal representa? (., ?, !)",
          answer: "?",
          hint: "Perceba se a voz pede resposta.",
          success: "Muito bem! A entonação curiosa indica pergunta.",
          failure: "Ouça novamente a gravação destacando a entonação.",
        },
        {
          challenge: "Situação: um colega comemora uma conquista. (., ?, !)",
          answer: "!",
          hint: "Há entusiasmo na voz?",
          success: "Perfeito! O grito de alegria pede exclamação.",
          failure: "Identifique a emoção transmitida pela voz.",
        },
        {
          challenge: "Situação: a diretora informa o horário do evento. (., ?, !)",
          answer: ".",
          hint: "A voz apenas informa um fato.",
          success: "Excelente! O ponto final encerra a informação.",
          failure: "Diferença entre informar e perguntar é fundamental.",
        },
      ],
    },
    {
      slug: "jogo-exclamacao-energia",
      title: "Exclamação Energia",
      prompt: "Escolha a frase que deve receber ponto de exclamação para reforçar a emoção.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP17",
      habilidades: ["EF01LP17", "EF01LP16"],
      category: "Exclamações em jogo",
      duration: 13,
      focus: "ênfase emocional",
      assetSlug: "lp-silaba-ba",
      victoryMessage: "Energia pontuada! Você destacou cada emoção.",
      gameOverMessage: "Releia as frases pensando na emoção e tente novamente.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "emocao-na-frase",
          description: "Relembrar frases emocionadas antes do jogo.",
        },
      ],
      levels: [
        {
          challenge:
            "Qual frase merece ponto de exclamação? (Ganhei o prêmio, O recreio acabou, Vamos estudar)",
          answer: "Ganhei o prêmio",
          hint: "Qual frase expressa alegria intensa?",
          success: "Muito bem! A frase demonstra grande emoção.",
          failure: "Observe o sentimento envolvido em cada frase.",
        },
        {
          challenge:
            "Qual frase precisa de exclamação? (Que frio está hoje, Onde fica a sala, A turma chegou cedo)",
          answer: "Que frio está hoje",
          hint: "Veja qual frase expressa espanto.",
          success: "Excelente! O espanto pede exclamação.",
          failure: "Leia as frases com diferentes entonações para descobrir.",
        },
        {
          challenge:
            "Qual frase fica melhor com exclamação? (Socorro alguém me ajuda, Você escreveu o texto, A aula começou)",
          answer: "Socorro alguém me ajuda",
          hint: "Qual frase demonstra urgência?",
          success: "Ótimo! O pedido de socorro precisa de exclamação.",
          failure: "Identifique quando a frase pede atenção imediata.",
        },
      ],
    },
    {
      slug: "jogo-pontua-texto",
      title: "Pontua Texto",
      prompt: "Digite o sinal de pontuação que falta no final da frase.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP16",
      habilidades: ["EF01LP16", "EF01LP17"],
      category: "Produção pontuada",
      duration: 13,
      focus: "produção de frases pontuadas",
      assetSlug: "lp-letra-e",
      victoryMessage: "Texto pontuado! Sua revisão ficou excelente.",
      gameOverMessage: "Revise o contexto da frase e tente novamente digitando o sinal correto.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-remix",
          description: "Revisar frases antes de pontuá-las digitando.",
        },
      ],
      levels: [
        {
          challenge: "Digite o sinal que falta: 'Você quer brincar comigo'",
          answer: "?",
          hint: "A frase faz uma pergunta?",
          success: "Perfeito! A frase virou pergunta com interrogação.",
          failure: "Releia a frase pensando se pede resposta.",
        },
        {
          challenge: "Digite o sinal que falta: 'Que bom que você veio'",
          answer: "!",
          hint: "Perceba a emoção da frase.",
          success: "Excelente! A exclamação mostra alegria.",
          failure: "Identifique a emoção antes de digitar.",
        },
        {
          challenge: "Digite o sinal que falta: 'Hoje temos aula de arte'",
          answer: ".",
          hint: "A frase informa algo?",
          success: "Muito bem! O ponto final encerra a informação.",
          failure: "Releia e veja se a frase informa ou pergunta algo.",
        },
      ],
    },
  ],
};

const module10: ModuleInput = {
  slug: "jornal-da-turma",
  title: "Jornal da Turma",
  subtitle: "Planejamento textual coletivo",
  description:
    "Sequência colaborativa para planejar, escrever, revisar e publicar textos coletivos, experimentando diferentes papéis no jornal da turma.",
  learningOutcomes: [
    "Planejar textos coletivos definindo objetivo, público e formato.",
    "Selecionar e organizar informações relevantes em roteiros e notícias curtas.",
    "Revisar, diagramar e compartilhar produções coletivas com apoio de recursos visuais.",
  ],
  tags: ["producao-coletiva", "jornal", "escrita"],
  primaryBnccCode: "EF01LP18",
  secondaryBnccCodes: ["EF01LP19", "EF01LP20", "EF01LP21", "EF01LP22", "EF01LP23", "EF01LP24"],
  quizzes: [
    {
      slug: "planeja-reportagem",
      title: "Planeja Reportagem",
      prompt: "Escolha o elemento que não pode faltar no planejamento da notícia coletiva.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP18",
      habilidades: ["EF01LP18", "EF01LP23"],
      category: "Planejamento",
      duration: 8,
      focus: "planejamento coletivo",
      assetSlug: "lp-material-caderno",
      learningObjectives: [
        "Definir objetivo e público-alvo do texto coletivo.",
        "Selecionar tema relevante para a comunidade escolar.",
      ],
      description:
        "Planeja Reportagem apresenta escolhas iniciais para organizar a produção coletiva do jornal.",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP18",
          description: "Conversar sobre temas que interessam à turma.",
        },
      ],
      question: {
        prompt: "Qual item é essencial ao planejar a reportagem coletiva?",
        hint: "Pense no que orienta a escrita.",
        options: [
          {
            text: "Definir o público que vai ler",
            isCorrect: true,
            feedback: "Perfeito! Saber quem lê orienta o planejamento.",
          },
          {
            text: "Escolher quem vai ilustrar depois",
            isCorrect: false,
            feedback: "Importante, mas pode ser decidido após o planejamento.",
          },
          {
            text: "Guardar o jornal para a semana seguinte",
            isCorrect: false,
            feedback: "O planejamento precisa acontecer antes da publicação.",
          },
        ],
      },
      trueFalse: {
        statement: "Planejar um texto coletivo envolve decidir o objetivo do texto.",
        prompt: "Planejar exige definir objetivo?",
        hint: "Lembre do motivo de produzir a notícia.",
        answer: true,
        trueFeedback: "Correto! O objetivo orienta todo o planejamento.",
        falseFeedback: "Observe como o objetivo guia as decisões da equipe.",
      },
    },
    {
      slug: "defina-o-publico",
      title: "Defina o Público",
      prompt: "Selecione a melhor justificativa para escolher o público-alvo do jornal da turma.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP23",
      habilidades: ["EF01LP23", "EF01LP18"],
      category: "Organização da equipe",
      duration: 9,
      focus: "definição de público",
      assetSlug: "lp-letra-a",
      learningObjectives: [
        "Distribuir responsabilidades na equipe de produção.",
        "Justificar escolhas coletivas considerando o público leitor.",
      ],
      description:
        "Defina o Público incentiva a turma a justificar quem vai receber o jornal e como adaptar o conteúdo.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "planeja-reportagem",
          description: "Retomar as decisões do planejamento antes de definir o público.",
        },
      ],
      question: {
        prompt: "Por que escolher o público-alvo ajuda a equipe?",
        hint: "Pense em quem vai ler o jornal.",
        options: [
          {
            text: "Porque ajuda a escolher linguagem e assuntos",
            isCorrect: true,
            feedback: "Muito bem! Assim o texto fica adequado aos leitores.",
          },
          {
            text: "Porque evita que os colegas opinem",
            isCorrect: false,
            feedback: "A produção coletiva precisa de escuta e colaboração.",
          },
          {
            text: "Porque agiliza a entrega sem planejamento",
            isCorrect: false,
            feedback: "Planejar sem pensar no público pode gerar confusão.",
          },
        ],
      },
      trueFalse: {
        statement: "Conhecer o público define o tom e o vocabulário do jornal.",
        prompt: "Público influencia o vocabulário?",
        hint: "Pense em como falamos com crianças menores ou adultos.",
        answer: true,
        trueFeedback: "Corretíssimo! Cada público pede um tom específico.",
        falseFeedback: "Compare textos escritos para crianças e adultos para perceber a diferença.",
      },
    },
    {
      slug: "seleciona-informacao",
      title: "Seleciona Informação",
      prompt: "Identifique a informação mais relevante para a notícia coletiva.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP19",
      habilidades: ["EF01LP19"],
      category: "Seleção de conteúdo",
      duration: 9,
      focus: "seleção de informações",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Selecionar dados relevantes para compor a notícia coletiva.",
        "Explicar por que determinada informação deve aparecer no texto.",
      ],
      description:
        "Seleciona Informação apresenta possíveis conteúdos para que a turma escolha o mais relevante ao título do jornal.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "defina-o-publico",
          description: "Retomar decisões sobre público antes de selecionar informações.",
        },
      ],
      question: {
        prompt: "Tema: 'Feira de Ciências da escola'. Qual informação precisa entrar na notícia?",
        hint: "Pense no que o leitor precisa saber.",
        options: [
          {
            text: "Data e horário da feira",
            isCorrect: true,
            feedback: "Perfeito! Informar quando acontece é essencial.",
          },
          {
            text: "História completa da ciência",
            isCorrect: false,
            feedback: "Concentre-se em dados do evento.",
          },
          {
            text: "Receita de bolo preferida da turma",
            isCorrect: false,
            feedback: "Não se relaciona ao tema da notícia.",
          },
        ],
      },
      trueFalse: {
        statement: "Nem todas as ideias coletadas entram no texto final.",
        prompt: "Selecionar é escolher o que fica de fora?",
        hint: "Pense na pauta cheia de ideias.",
        answer: true,
        trueFeedback: "Exato! Selecionar é priorizar as informações mais importantes.",
        falseFeedback: "Observe como notícias trazem apenas dados essenciais.",
      },
    },
    {
      slug: "ordena-fatos",
      title: "Ordena Fatos",
      prompt: "Organize os acontecimentos na sequência correta.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP20",
      habilidades: ["EF01LP20"],
      category: "Sequência narrativa",
      duration: 10,
      focus: "sequência de fatos",
      assetSlug: "lp-silaba-ba",
      learningObjectives: [
        "Sequenciar fatos principais em textos coletivos.",
        "Usar conectivos simples para organizar a narrativa.",
      ],
      description:
        "Ordena Fatos desafia os estudantes a reorganizar fatos para fazer sentido na notícia.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "seleciona-informacao",
          description: "Selecionar informações antes de organizar a sequência.",
        },
      ],
      question: {
        prompt: "Quais passos organizam melhor a notícia sobre a visita ao parque científico?",
        hint: "Pense em início, meio e fim.",
        options: [
          {
            text: "Saída da escola → visita ao laboratório → roda de conversa",
            isCorrect: true,
            feedback: "Ótimo! A sequência respeita a ordem do evento.",
          },
          {
            text: "Roda de conversa → saída da escola → visita ao laboratório",
            isCorrect: false,
            feedback: "Reveja a ordem que realmente aconteceu.",
          },
          {
            text: "Visita ao laboratório → conclusão do texto → saída da escola",
            isCorrect: false,
            feedback: "O texto precisa começar com a saída da escola.",
          },
        ],
      },
      trueFalse: {
        statement: "Organizar fatos em sequência ajuda o leitor a entender a história.",
        prompt: "Sequência facilita a compreensão?",
        hint: "Pense em relatos fora de ordem.",
        answer: true,
        trueFeedback: "Certo! A sequência orienta o leitor do começo ao fim.",
        falseFeedback: "Experimente contar um evento fora de ordem para notar a diferença.",
      },
    },
    {
      slug: "revise-o-paragrafo",
      title: "Revise o Parágrafo",
      prompt: "Selecione a versão revisada corretamente para o parágrafo do jornal.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP21",
      habilidades: ["EF01LP21", "EF01LP16"],
      category: "Revisão coletiva",
      duration: 10,
      focus: "revisão de texto",
      assetSlug: "lp-letra-e",
      learningObjectives: [
        "Revisar ortografia, pontuação e clareza em textos coletivos.",
        "Sugerir ajustes respeitando as ideias do grupo.",
      ],
      description:
        "Revise o Parágrafo apresenta opções de revisão para que o grupo escolha a versão mais clara e correta.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ordena-fatos",
          description: "Organizar fatos antes de revisar o texto.",
        },
      ],
      question: {
        prompt: "Qual versão revisada mantém pontuação e clareza?",
        hint: "Observe pontuação e repetição de palavras.",
        options: [
          {
            text: "Na feira, os alunos mostraram inventos. A comunidade adorou.",
            isCorrect: true,
            feedback: "Excelente! A versão está clara e pontuada corretamente.",
          },
          {
            text: "Na feira os alunos mostro inventos a comunidade adorou",
            isCorrect: false,
            feedback: "Verifique ortografia e pontuação.",
          },
          {
            text: "Na feira, alunos mostraram inventos porque adorou.",
            isCorrect: false,
            feedback: "A frase final precisa de sujeito claro.",
          },
        ],
      },
      trueFalse: {
        statement: "Revisar coletivamente melhora a qualidade do jornal.",
        prompt: "Revisar em grupo melhora o texto?",
        hint: "Pense nas contribuições dos colegas.",
        answer: true,
        trueFeedback: "Sim! Cada colega percebe algo diferente na revisão.",
        falseFeedback: "Compare textos revisados sozinho e em grupo para notar a melhoria.",
      },
    },
    {
      slug: "lancamento-do-jornal",
      title: "Lançamento do Jornal",
      prompt: "Escolha a melhor estratégia para compartilhar o jornal com a comunidade.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP24",
      habilidades: ["EF01LP24", "EF01LP22"],
      category: "Divulgação",
      duration: 11,
      focus: "publicação e compartilhamento",
      assetSlug: "lp-silaba-la",
      learningObjectives: [
        "Planejar formas de divulgar o jornal coletivo.",
        "Avaliar o impacto do texto no público leitor.",
      ],
      description:
        "Lançamento do Jornal apoia a turma a decidir como publicar e apresentar o jornal para a comunidade escolar.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "revise-o-paragrafo",
          description: "Finalizar a revisão antes de planejar o lançamento.",
        },
      ],
      question: {
        prompt: "Qual estratégia ajuda a alcançar toda a comunidade?",
        hint: "Pense em acessibilidade e alcance.",
        options: [
          {
            text: "Apresentar o jornal na reunião de pais com versão digital e impressa",
            isCorrect: true,
            feedback: "Ótimo! Combinar formatos amplia o alcance.",
          },
          {
            text: "Guardar o jornal só para a turma",
            isCorrect: false,
            feedback: "Compartilhar amplia o impacto da produção.",
          },
          {
            text: "Entregar apenas para um colega",
            isCorrect: false,
            feedback: "O jornal coletivo deve chegar a mais leitores.",
          },
        ],
      },
      trueFalse: {
        statement: "Publicar o jornal permite que a comunidade conheça o trabalho da turma.",
        prompt: "Publicar aproxima a comunidade?",
        hint: "Considere o objetivo de compartilhar a produção.",
        answer: true,
        trueFeedback: "Perfeito! Publicar conta a história da turma para todos.",
        falseFeedback: "Sem divulgação, ninguém descobre o trabalho realizado.",
      },
    },
  ],
  puzzles: [
    {
      slug: "puzzle-funcoes-jornal",
      title: "Funções do Jornal",
      prompt: "Relacione cada papel da equipe às tarefas correspondentes.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP23",
      habilidades: ["EF01LP23", "EF01LP18"],
      category: "Distribuição de papéis",
      duration: 9,
      focus: "responsabilidades na equipe",
      assetSlug: "lp-letra-a",
      successFeedback: "Equipe alinhada! Cada função encontrou sua tarefa.",
      errorFeedback: "Reveja os papéis antes de reorganizar.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "defina-o-publico",
          description: "Discutir funções antes do jogo de associação.",
        },
      ],
      pairs: [
        {
          prompt: "Repórter",
          match: "Coleta informações e entrevista",
          hint: "Pense em quem conversa com as fontes.",
          feedback: "O repórter realiza entrevistas e levanta dados.",
        },
        {
          prompt: "Editor",
          match: "Organiza o texto e revê a linguagem",
          hint: "Quem cuida da revisão final?",
          feedback: "O editor garante coerência e clareza.",
        },
        {
          prompt: "Designer",
          match: "Organiza imagens e títulos",
          hint: "Quem cuida da aparência do jornal?",
          feedback: "O designer monta a diagramação e escolhe recursos visuais.",
        },
      ],
    },
    {
      slug: "puzzle-quadro-apoio",
      title: "Quadros de Apoio",
      prompt: "Associe cada recurso visual à função no jornal.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP22",
      habilidades: ["EF01LP22", "EF01LP24"],
      category: "Recursos visuais",
      duration: 10,
      focus: "uso de recursos visuais",
      assetSlug: "lp-material-caderno",
      successFeedback: "Recursos organizados! O jornal ficou informativo.",
      errorFeedback: "Relembre a função de cada recurso antes de reorganizar.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "revise-o-paragrafo",
          description: "Pensar na clareza do texto antes de inserir recursos.",
        },
      ],
      pairs: [
        {
          prompt: "Legenda",
          match: "Explica resumidamente a imagem",
          hint: "Quem contextualiza a foto?",
          feedback: "A legenda orienta a leitura da imagem.",
        },
        {
          prompt: "Gráfico",
          match: "Apresenta dados de forma visual",
          hint: "Quando precisamos comparar números?",
          feedback: "O gráfico facilita a leitura de dados.",
        },
        {
          prompt: "Caixa de destaque",
          match: "Resume informações importantes",
          hint: "Pense em quadros coloridos no jornal.",
          feedback: "A caixa de destaque atrai o olhar e sintetiza o essencial.",
        },
      ],
    },
    {
      slug: "puzzle-roteiro",
      title: "Roteiro do Texto",
      prompt: "Relacione cada etapa do texto coletivo ao seu objetivo.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP20",
      habilidades: ["EF01LP20", "EF01LP18"],
      category: "Estrutura textual",
      duration: 10,
      focus: "estrutura de reportagem",
      assetSlug: "lp-letra-e",
      successFeedback: "Roteiro completo! A notícia ficou organizada.",
      errorFeedback: "Analise novamente o objetivo de cada etapa.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ordena-fatos",
          description: "Retomar a ordem dos fatos antes de associar etapas.",
        },
      ],
      pairs: [
        {
          prompt: "Título",
          match: "Chama atenção para o tema",
          hint: "Pense no que aparece primeiro.",
          feedback: "O título apresenta o assunto principal.",
        },
        {
          prompt: "Lead",
          match: "Resume as informações principais",
          hint: "Quem responde às perguntas o quê, quem, onde.",
          feedback: "O lead sintetiza o essencial para o leitor.",
        },
        {
          prompt: "Corpo do texto",
          match: "Detalha os fatos em ordem",
          hint: "Após o resumo, o que vem?",
          feedback: "O corpo expande a história com detalhes.",
        },
      ],
    },
    {
      slug: "puzzle-revisao-final",
      title: "Revisão Final",
      prompt: "Associe cada tipo de revisão ao ajuste correspondente.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP21",
      habilidades: ["EF01LP21", "EF01LP22"],
      category: "Revisão e diagramação",
      duration: 11,
      focus: "checklist de revisão",
      assetSlug: "lp-silaba-la",
      successFeedback: "Checklist completo! O texto está pronto para publicar.",
      errorFeedback: "Revise cada ajuste antes de reorganizar.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "revise-o-paragrafo",
          description: "Aplicar revisão textual antes da checklist final.",
        },
      ],
      pairs: [
        {
          prompt: "Revisão ortográfica",
          match: "Confere letras e acentos",
          hint: "Relaciona-se à escrita correta das palavras.",
          feedback: "Ortografia correta deixa o texto profissional.",
        },
        {
          prompt: "Revisão de pontuação",
          match: "Garante sinalização adequada",
          hint: "Observe os sinais no final das frases.",
          feedback: "Pontuação adequada facilita a leitura.",
        },
        {
          prompt: "Revisão de design",
          match: "Alinha imagens e títulos",
          hint: "Depois do texto, o que precisa ficar bonito?",
          feedback: "O design final garante leitura confortável.",
        },
      ],
    },
  ],
  games: [
    {
      slug: "jogo-planejamento-coletivo",
      title: "Planejamento Coletivo",
      prompt: "Escolha os passos iniciais para planejar o jornal em equipe.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP18",
      habilidades: ["EF01LP18", "EF01LP23"],
      category: "Planejamento",
      duration: 12,
      focus: "passos do planejamento",
      assetSlug: "lp-material-caderno",
      victoryMessage: "Planejamento pronto! A equipe sabe por onde começar.",
      gameOverMessage: "Relembre os passos combinados e tente novamente com calma.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-funcoes-jornal",
          description: "Relembrar papéis antes de planejar as etapas.",
        },
      ],
      levels: [
        {
          challenge: "Qual passo vem primeiro? (Escolher tema, Diagramar páginas, Imprimir jornal)",
          answer: "Escolher tema",
          hint: "Pense no início do processo.",
          success: "Perfeito! Tudo começa com o tema.",
          failure: "Revise a ordem do planejamento coletivo.",
        },
        {
          challenge:
            "Depois de escolher o tema, o que fazemos? (Definir público, Distribuir jornal, Guardar materiais)",
          answer: "Definir público",
          hint: "Lembre de quem vai ler.",
          success: "Muito bem! O público orienta o texto.",
          failure: "Observe a sequência lógica do planejamento.",
        },
        {
          challenge:
            "Qual passo vem antes de começar a escrever? (Coletar informações, Fazer cartazes, Escolher música)",
          answer: "Coletar informações",
          hint: "Precisamos de dados antes de redigir.",
          success: "Excelente! Informações coletadas orientam o texto.",
          failure: "Não dá para escrever sem dados relevantes.",
        },
      ],
    },
    {
      slug: "jogo-coleta-fatos",
      title: "Coleta Fatos",
      prompt: "Selecione as informações que entram no roteiro da notícia coletiva.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP19",
      habilidades: ["EF01LP19", "EF01LP20"],
      category: "Coleta de dados",
      duration: 12,
      focus: "seleção de dados",
      assetSlug: "lp-letra-a",
      victoryMessage: "Roteiro montado! Informações prontas para o texto.",
      gameOverMessage: "Revise as pistas do tema e tente novamente selecionando dados relevantes.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-roteiro",
          description: "Rever etapas do texto antes da coleta de fatos.",
        },
      ],
      levels: [
        {
          challenge:
            "Tema: visita ao museu. Qual informação é essencial? (Número de visitantes, Receita de bolo, Música preferida)",
          answer: "Número de visitantes",
          hint: "Procure dado ligado ao evento.",
          success: "Ótimo! O número mostra a importância da visita.",
          failure: "Mantenha foco no tema do texto.",
        },
        {
          challenge:
            "Tema: campeonato interno. Qual informação entra? (Times participantes, Clima da semana, Filme favorito)",
          answer: "Times participantes",
          hint: "Quem participou precisa aparecer.",
          success: "Muito bem! Isso interessa ao leitor.",
          failure: "Selecione dados relacionados ao campeonato.",
        },
        {
          challenge:
            "Tema: hortas na escola. Qual dado usar? (O que foi plantado, Preço da feira, Programa de TV)",
          answer: "O que foi plantado",
          hint: "Pense no interesse do leitor.",
          success: "Excelente! Essa informação complementa o texto.",
          failure: "Escolha dados que respondam às curiosidades sobre a horta.",
        },
      ],
    },
    {
      slug: "jogo-design-jornal",
      title: "Design do Jornal",
      prompt: "Escolha o recurso visual que deixa a página mais informativa.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP22",
      habilidades: ["EF01LP22", "EF01LP24"],
      category: "Diagramação",
      duration: 13,
      focus: "uso de recursos gráficos",
      assetSlug: "lp-silaba-ba",
      victoryMessage: "Design alinhado! A página está clara e atrativa.",
      gameOverMessage:
        "Observe as necessidades de leitura e tente novamente selecionando recursos.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-quadro-apoio",
          description: "Relembrar funções dos recursos antes de diagramar.",
        },
      ],
      levels: [
        {
          challenge:
            "Página com muitos números. Qual recurso ajuda? (Gráfico colorido, Poema ilustrado, Álbum de figurinhas)",
          answer: "Gráfico colorido",
          hint: "Qual recurso organiza números?",
          success: "Perfeito! O gráfico facilita a leitura dos dados.",
          failure: "Observe a necessidade de visualizar os números.",
        },
        {
          challenge:
            "Foto de um experimento. Qual recurso complementa? (Legenda explicativa, Lista de compras, Piada da semana)",
          answer: "Legenda explicativa",
          hint: "Qual recurso descreve uma imagem?",
          success: "Ótimo! A legenda explica a cena da foto.",
          failure: "Escolha o recurso ligado diretamente à imagem.",
        },
        {
          challenge:
            "Resumo da reunião. Como destacar? (Caixa de destaque colorida, Figura geométrica, Título sem cor)",
          answer: "Caixa de destaque colorida",
          hint: "Qual recurso chama atenção para texto curto?",
          success: "Excelente! A caixa destaca o resumo.",
          failure: "Relembre os recursos que destacam informações.",
        },
      ],
    },
    {
      slug: "jogo-publica-e-divulga",
      title: "Publica e Divulga",
      prompt: "Escolha ações para divulgar o jornal e registrar feedback dos leitores.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP24",
      habilidades: ["EF01LP24", "EF01LP23"],
      category: "Compartilhamento",
      duration: 13,
      focus: "divulgação e retorno",
      assetSlug: "lp-letra-e",
      victoryMessage: "Divulgação concluída! O jornal alcançou o público.",
      gameOverMessage: "Reveja as ações de divulgação e tente novamente planejando o retorno.",
      audioPrompt:
        "Grave uma mensagem coletiva convidando a comunidade a ler o jornal, simulando boletim de rádio.",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "lancamento-do-jornal",
          description: "Planejar o lançamento antes de escolher ações práticas.",
        },
      ],
      levels: [
        {
          challenge:
            "Qual ação ajuda a divulgar? (Criar cartaz no mural, Guardar jornais na gaveta, Deixar apenas na sala)",
          answer: "Criar cartaz no mural",
          hint: "Pense em visibilidade.",
          success: "Ótimo! O cartaz apresenta o jornal aos visitantes.",
          failure: "Reflita sobre onde as pessoas verão o convite.",
        },
        {
          challenge:
            "Como registrar a reação dos leitores? (Criar caixa de comentários, Jogar revistas fora, Desligar a luz)",
          answer: "Criar caixa de comentários",
          hint: "Pense em receber feedback.",
          success: "Excelente! Assim a comunidade deixa sugestões.",
          failure: "Considere formas de ouvir o público.",
        },
        {
          challenge:
            "Qual ação amplia o alcance digital? (Enviar versão em PDF no grupo da escola, Guardar pen drive na gaveta, Imprimir sem entregar)",
          answer: "Enviar versão em PDF no grupo da escola",
          hint: "Como disponibilizar o jornal online?",
          success: "Muito bem! A versão digital amplia o alcance.",
          failure: "Pense em compartilhar com quem não recebeu impresso.",
        },
      ],
    },
  ],
};

const modules: ModuleInput[] = [module6, module7, module8, module9, module10];

ensureOutputDir();
modules.forEach(writeModuleFile);
