#!/usr/bin/env tsx
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { dump } from "js-yaml";

type DifficultyTier = "INICIAR" | "PRATICAR" | "DOMINAR";

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
};

type QuizOptionInput = {
  text: string;
  isCorrect: boolean;
  feedback: string;
};

type QuizQuestionInput = {
  prompt: string;
  hint: string;
  options: QuizOptionInput[];
};

type QuizTrueFalseInput = {
  prompt: string;
  hint: string;
  statement: string;
  answer: boolean;
  trueFeedback: string;
  falseFeedback: string;
};

type QuizActivityInput = BaseActivityInput & {
  question: QuizQuestionInput;
  trueFalse: QuizTrueFalseInput;
  bnccDescription?: string;
};

type PuzzlePairInput = {
  prompt: string;
  match: string;
  hint: string;
  feedback: string;
};

type PuzzleActivityInput = BaseActivityInput & {
  pairs: PuzzlePairInput[];
  successFeedback: string;
  errorFeedback: string;
  bnccDescription?: string;
};

type GameLevelInput = {
  challenge: string;
  answer: string | number;
  hint: string;
  success: string;
  failure: string;
};

type GameActivityInput = BaseActivityInput & {
  levels: GameLevelInput[];
  victoryMessage: string;
  gameOverMessage: string;
  timeLimitSeconds?: number;
  lives?: number;
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
  quizzes: QuizActivityInput[];
  puzzles: PuzzleActivityInput[];
  games: GameActivityInput[];
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

const bnccDescriptions: Record<string, string> = {
  EF01LP01: "Perceber rimas, aliterações e sons iniciais em textos orais e jogos de linguagem.",
  EF01LP02:
    "Segmentar e manipular sílabas em palavras orais com apoio de gestos e recursos sonoros.",
  EF01LP03: "Reconhecer letras do alfabeto em diferentes suportes e formatos.",
  EF01LP04: "Relacionar letras e sons, avaliando variações na posição dentro das palavras.",
  EF01LP05: "Ler palavras e expressões familiares apoiando-se em pistas gráficas e contextuais.",
  EF01LP06: "Ler e comparar palavras de uso cotidiano articulando decodificação e compreensão.",
  EF01LP07: "Compreender frases curtas identificando informações explícitas.",
  EF01LP08: "Inferir sentidos e intenções em frases e textos curtos do cotidiano escolar.",
  EF01LP09: "Planejar e produzir bilhetes, recados e legendas para situações reais da turma.",
  EF01LP10: "Revisar textos curtos considerando destinatários, suportes e convenções do gênero.",
};

const assetTitles: Record<string, string> = {
  "lp-letra-a": "Ilustração da letra A",
  "lp-letra-e": "Ilustração da letra E",
  "lp-material-caderno": "Caderno colorido para escrita",
  "lp-silaba-ba": "Cartão da sílaba BA",
  "lp-silaba-la": "Cartão da sílaba LA",
};

const capitalize = (value: string): string =>
  value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);

const createBaseActivity = (input: BaseActivityInput) => {
  const assetTitle = assetTitles[input.assetSlug] ?? capitalize(input.focus);
  const learningObjectives = input.learningObjectives ?? [
    `Explorar ${input.focus} em situações guiadas pelo educador.`,
    "Compartilhar estratégias pessoais com colegas durante a atividade.",
  ];

  const description =
    input.description ??
    `${input.title} convida a turma a investigar ${input.focus} com apoio de recursos multimodais.`;

  const metadata = {
    categoria: input.category,
    duracaoMinutos: input.duration,
    habilidades: input.habilidades,
    assetSlug: input.assetSlug,
  };

  const accessibility = {
    hints: [
      {
        audience: "ESTUDANTE",
        text: `Use as setas do teclado ou toque na tela para navegar enquanto destaca ${input.focus} com gestos ou palmas.`,
      },
      {
        audience: "EDUCADOR",
        text: `Projete imagens de apoio, ofereça repetição de áudio e verbalize os passos para favorecer a percepção de ${input.focus}.`,
      },
      {
        audience: "FAMILIA",
        text: "Envie sugestões de objetos ou cantigas que reforcem os sons trabalhados para continuidade em casa.",
      },
    ],
    feedback: {
      success: `Ótimo trabalho! ${capitalize(input.focus)} ficou mais claro com sua atenção aos detalhes.`,
      retry: "Retome com calma, respirando fundo e usando as pistas visuais oferecidas.",
      encouragement: "Valorize cada tentativa e compare sons ou letras com apoio dos colegas.",
      accessibility:
        "Disponibilize fones acolchoados, letras ampliadas e manipuláveis táteis para quem precisar.",
    },
    assets: [
      {
        slug: input.assetSlug,
        type: "IMAGEM",
        title: assetTitle,
      },
    ],
  };

  const prerequisites = input.prerequisites?.map((entry) => ({
    type: entry.type ?? "SKILL",
    reference: entry.reference,
    description: entry.description,
  }));

  const base = {
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
    metadata,
    accessibility,
  } as Record<string, unknown>;

  if (prerequisites && prerequisites.length > 0) {
    base.prerequisites = prerequisites;
  }

  base.metadata = {
    ...metadata,
    interactiveSlug: "",
  };

  return base;
};

const createQuizActivity = (input: QuizActivityInput) => {
  const base = createBaseActivity(input);
  base.type = "QUIZ";
  const interactiveSlug = `quiz-${input.slug}`;
  base.metadata = {
    ...(base.metadata as Record<string, unknown>),
    interactiveSlug,
  };

  const bnccDescription = input.bnccDescription ?? bnccDescriptions[input.bnccCode];

  const activity = {
    ...base,
    interactive: {
      slug: interactiveSlug,
      title: `${input.title} — Quiz`,
      type: "QUIZ",
      bnccDescription,
      estimatedTimeMinutes: Math.max(5, Math.min(12, input.duration)),
      instructions: [
        "Leia ou escute o desafio com atenção antes de registrar a resposta.",
        "Use as teclas numéricas ou clique nas alternativas para responder.",
        "Compartilhe com a turma novas palavras relacionadas após concluir o desafio.",
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
          type: "multiple-choice",
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
          type: "true-false",
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
      accessibility: {
        hints: [
          {
            audience: "ESTUDANTE",
            text: "Use TAB e ENTER para navegar e confirmar sua escolha.",
          },
          {
            audience: "EDUCADOR",
            text: "Projete legendas e permita repetição do áudio para quem precisar.",
          },
        ],
        feedback: {
          success: `Excelente! ${capitalize(input.focus)} ficou evidente nas suas respostas.`,
          encouragement: "Caso erre, leia novamente com voz pausada e utilize marcadores visuais.",
          accessibility: "Ofereça apoio auditivo individual e contraste elevado nos botões.",
        },
        assets: [
          {
            slug: input.assetSlug,
            type: "IMAGEM",
            title: assetTitles[input.assetSlug] ?? capitalize(input.focus),
          },
        ],
      },
    },
  } as Record<string, unknown>;

  return activity;
};

const createPuzzleActivity = (input: PuzzleActivityInput) => {
  const base = createBaseActivity(input);
  base.type = "PUZZLE";
  const interactiveSlug = `puzzle-${input.slug}`;
  base.metadata = {
    ...(base.metadata as Record<string, unknown>),
    interactiveSlug,
  };

  const bnccDescription = input.bnccDescription ?? bnccDescriptions[input.bnccCode];

  const activity = {
    ...base,
    interactive: {
      slug: interactiveSlug,
      title: `${input.title} — Quebra-cabeça`,
      type: "PUZZLE",
      bnccDescription,
      estimatedTimeMinutes: Math.max(6, Math.min(12, input.duration)),
      instructions: [
        "Observe cada cartão e combine arrastando ou usando TAB + ENTER.",
        "Converse sobre o motivo da combinação antes de confirmar.",
        "Revise as duplas formadas e proponha novas associações.",
      ],
      objectives: base.learningObjectives,
      puzzle: {
        mode: "matching",
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
      accessibility: {
        hints: [
          {
            audience: "ESTUDANTE",
            text: "Use as setas para navegar entre os cartões e Enter para selecionar.",
          },
          {
            audience: "EDUCADOR",
            text: "Disponibilize cartões físicos para manipulação simultânea.",
          },
        ],
        feedback: {
          success: input.successFeedback,
          encouragement:
            "Compare sons lentamente e utilize gestos amplos para apoiar a associação.",
          accessibility: "Ofereça cartões com textura ou relevo para ampliar as pistas sensoriais.",
        },
        assets: [
          {
            slug: input.assetSlug,
            type: "IMAGEM",
            title: assetTitles[input.assetSlug] ?? capitalize(input.focus),
          },
        ],
      },
    },
  } as Record<string, unknown>;

  return activity;
};

const createGameActivity = (input: GameActivityInput) => {
  const base = createBaseActivity(input);
  base.type = "GAME";
  const interactiveSlug = `game-${input.slug}`;
  base.metadata = {
    ...(base.metadata as Record<string, unknown>),
    interactiveSlug,
  };

  const bnccDescription = input.bnccDescription ?? bnccDescriptions[input.bnccCode];

  const activity = {
    ...base,
    interactive: {
      slug: interactiveSlug,
      title: `${input.title} — Mini-jogo`,
      type: "GAME",
      bnccDescription,
      estimatedTimeMinutes: Math.max(7, Math.min(15, input.duration)),
      instructions: [
        "Leia o desafio de cada fase e verbalize suas hipóteses em voz alta.",
        "Digite a resposta usando o teclado ou selecione com o mouse.",
        "No final, explique qual pista ajudou a encontrar a solução.",
      ],
      objectives: base.learningObjectives,
      game: {
        mode: "math-challenge",
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
      accessibility: {
        hints: [
          {
            audience: "ESTUDANTE",
            text: "Use a tecla TAB para navegar pelos botões e Enter para confirmar.",
          },
          {
            audience: "EDUCADOR",
            text: "Ofereça marcadores visuais ou tapetes de som para cada fase.",
          },
        ],
        feedback: {
          success: input.victoryMessage,
          encouragement: "Revise as pistas sonoras e tente novamente sem pressa.",
          accessibility:
            "Disponibilize apoios auditivos individuais e sinalize o tempo visualmente.",
        },
        assets: [
          {
            slug: input.assetSlug,
            type: "IMAGEM",
            title: assetTitles[input.assetSlug] ?? capitalize(input.focus),
          },
        ],
      },
    },
  } as Record<string, unknown>;

  return activity;
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

type QuizConfig = Omit<QuizActivityInput, "question" | "trueFalse" | "bnccDescription"> & {
  questionPrompt: string;
  questionHint: string;
  correctOption: string;
  incorrectOptions: string[];
  trueFalsePrompt: string;
  trueFalseHint: string;
  trueFalseStatement: string;
  trueFalseAnswer: boolean;
};

type PuzzleConfig = Omit<
  PuzzleActivityInput,
  "pairs" | "successFeedback" | "errorFeedback" | "bnccDescription"
> & {
  pairs: Array<{
    prompt: string;
    match: string;
    hint?: string;
    feedback?: string;
  }>;
  successFeedback?: string;
  errorFeedback?: string;
};

type GameConfig = Omit<
  GameActivityInput,
  "levels" | "victoryMessage" | "gameOverMessage" | "bnccDescription"
> & {
  levels: Array<{
    challenge: string;
    answer: string | number;
    hint?: string;
    success?: string;
    failure?: string;
  }>;
  victoryMessage?: string;
  gameOverMessage?: string;
};

const makeQuiz = (config: QuizConfig): QuizActivityInput => {
  const questionOptions: QuizOptionInput[] = [
    {
      text: config.correctOption,
      isCorrect: true,
      feedback: `Excelente! '${config.correctOption}' evidencia ${config.focus}.`,
    },
    ...config.incorrectOptions.map((option) => ({
      text: option,
      isCorrect: false,
      feedback: `Ainda não. '${option}' não representa ${config.focus}.`,
    })),
  ];

  const trueFeedback = config.trueFalseAnswer
    ? `Muito bem! A afirmação confirma ${config.focus}.`
    : `Repare: ${config.focus} não acontece como descrito.`;
  const falseFeedback = config.trueFalseAnswer
    ? `Revise: ${config.focus} está presente na afirmação.`
    : `Correto! ${config.focus} não aparece dessa forma.`;

  return {
    slug: config.slug,
    title: config.title,
    prompt: config.prompt,
    difficulty: config.difficulty,
    bnccCode: config.bnccCode,
    habilidades: config.habilidades,
    category: config.category,
    duration: config.duration,
    focus: config.focus,
    assetSlug: config.assetSlug,
    prerequisites: config.prerequisites,
    question: {
      prompt: config.questionPrompt,
      hint: config.questionHint,
      options: questionOptions,
    },
    trueFalse: {
      prompt: config.trueFalsePrompt,
      hint: config.trueFalseHint,
      statement: config.trueFalseStatement,
      answer: config.trueFalseAnswer,
      trueFeedback,
      falseFeedback,
    },
  };
};

const makePuzzle = (config: PuzzleConfig): PuzzleActivityInput => {
  const successFeedback =
    config.successFeedback ??
    `Tudo combinado! ${capitalize(config.focus)} ficou evidente nas associações.`;
  const errorFeedback =
    config.errorFeedback ?? "Observe novamente os sons, conte devagar e tente outra combinação.";

  return {
    slug: config.slug,
    title: config.title,
    prompt: config.prompt,
    difficulty: config.difficulty,
    bnccCode: config.bnccCode,
    habilidades: config.habilidades,
    category: config.category,
    duration: config.duration,
    focus: config.focus,
    assetSlug: config.assetSlug,
    prerequisites: config.prerequisites,
    pairs: config.pairs.map((pair) => ({
      prompt: pair.prompt,
      match: pair.match,
      hint: pair.hint ?? `Observe ${config.focus} presente em '${pair.prompt}'.`,
      feedback:
        pair.feedback ??
        `Perfeito! '${pair.match}' combina com '${pair.prompt}' porque evidencia ${config.focus}.`,
    })),
    successFeedback,
    errorFeedback,
  };
};

const makeGame = (config: GameConfig): GameActivityInput => {
  const victoryMessage =
    config.victoryMessage ?? `Uhu! ${capitalize(config.focus)} foi explorado em todas as fases.`;
  const gameOverMessage =
    config.gameOverMessage ?? `Sem problemas. Revise ${config.focus} e tente jogar novamente.`;

  return {
    slug: config.slug,
    title: config.title,
    prompt: config.prompt,
    difficulty: config.difficulty,
    bnccCode: config.bnccCode,
    habilidades: config.habilidades,
    category: config.category,
    duration: config.duration,
    focus: config.focus,
    assetSlug: config.assetSlug,
    prerequisites: config.prerequisites,
    levels: config.levels.map((level) => ({
      challenge: level.challenge,
      answer: level.answer,
      hint: level.hint ?? `Use ${config.focus} para encontrar a resposta.`,
      success: level.success ?? `Muito bem! ${capitalize(config.focus)} ajudou a resolver a fase.`,
      failure: level.failure ?? `Retome ${config.focus} e ajuste sua estratégia.`,
    })),
    victoryMessage,
    gameOverMessage,
    timeLimitSeconds: config.timeLimitSeconds,
    lives: config.lives,
  };
};

const module1: ModuleInput = {
  slug: "brincando-com-sons",
  title: "Brincando com Sons",
  subtitle: "Consciência Fonológica em Movimento",
  description:
    "Sequência lúdica para investigar sons iniciais, rimas e sílabas com apoio de gestos, cantigas e jogos sonoros.",
  learningOutcomes: [
    "Reconhecer sons iniciais e finais em palavras do cotidiano.",
    "Identificar rimas e padrões sonoros em cantigas e parlendas.",
    "Segmentar palavras em sílabas utilizando marcadores rítmicos e visuais.",
  ],
  tags: ["consciencia-fonologica", "rimas", "silabas"],
  primaryBnccCode: "EF01LP01",
  secondaryBnccCodes: ["EF01LP02"],
  quizzes: [
    makeQuiz({
      slug: "som-inicial-surpresa",
      title: "Som Inicial Surpresa",
      prompt: "Descubra qual imagem começa com o mesmo som apresentado no áudio.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP01",
      habilidades: ["EF01LP01"],
      category: "Som inicial",
      duration: 8,
      focus: "sons iniciais",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP01",
          description: "Participar de jogos orais com repetição de sons iniciais.",
        },
      ],
      questionPrompt: "Qual palavra começa com o som /m/?",
      questionHint: "Repita cada palavra em voz alta e sinta a vibração inicial.",
      correctOption: "Macaco",
      incorrectOptions: ["Bola", "Uva"],
      trueFalsePrompt: "A palavra 'mesa' começa com o mesmo som de 'mel'?",
      trueFalseHint: "Fale devagar: me-sa, mel.",
      trueFalseStatement: "As palavras 'mesa' e 'mel' começam com o som /m/.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "rimas-do-recreio",
      title: "Rimas do Recreio",
      prompt: "Escute a parlenda e escolha a palavra que rima com a palavra destacada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP01",
      habilidades: ["EF01LP01"],
      category: "Rimas",
      duration: 8,
      focus: "rimas",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "som-inicial-surpresa",
          description: "Retomar a escuta atenta antes de buscar rimas.",
        },
      ],
      questionPrompt: "Qual palavra rima com 'pato'?",
      questionHint: "Perceba o som final das palavras.",
      correctOption: "Gato",
      incorrectOptions: ["Pente", "Caneca"],
      trueFalsePrompt: "A palavra 'bola' rima com 'escola'?",
      trueFalseHint: "Compare o final das duas palavras.",
      trueFalseStatement: "As palavras 'bola' e 'escola' rimam.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "eco-dos-sons",
      title: "Eco dos Sons",
      prompt: "Identifique palavras que terminam com sons parecidos.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP01",
      habilidades: ["EF01LP01"],
      category: "Sons finais",
      duration: 9,
      focus: "sons finais",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "rimas-do-recreio",
          description: "Relembrar como identificar sons que se repetem no final.",
        },
      ],
      questionPrompt: "Qual palavra termina com o mesmo som de 'sol'?",
      questionHint: "Perceba o som final de cada palavra.",
      correctOption: "Farol",
      incorrectOptions: ["Pato", "Cola"],
      trueFalsePrompt: "As palavras 'pente' e 'gente' terminam com sons parecidos?",
      trueFalseHint: "Fale lentamente e compare o final das palavras.",
      trueFalseStatement: "As palavras 'pente' e 'gente' terminam com o som /te/.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "trilho-das-silabas",
      title: "Trilho das Sílabas",
      prompt: "Conte quantas partes sonoras cada palavra possui.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP02",
      habilidades: ["EF01LP02"],
      category: "Segmentação silábica",
      duration: 8,
      focus: "segmentação silábica",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP02",
          description: "Experimentar bater palmas para cada sílaba em palavras do cotidiano.",
        },
      ],
      questionPrompt: "Qual palavra tem três sílabas?",
      questionHint: "Bata palmas para cada parte da palavra.",
      correctOption: "Palito",
      incorrectOptions: ["Bola", "Sol"],
      trueFalsePrompt: "A palavra 'banana' tem três sílabas?",
      trueFalseHint: "Separe devagar: ba-na-na.",
      trueFalseStatement: "A palavra 'banana' possui três sílabas.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "detetive-dos-pedacinhos",
      title: "Detetive dos Pedacinhos",
      prompt: "Escolha a opção que mostra a divisão correta das sílabas.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP02",
      habilidades: ["EF01LP02"],
      category: "Sílabas",
      duration: 9,
      focus: "divisão silábica",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "trilho-das-silabas",
          description: "Retomar a contagem de sílabas antes de analisar a escrita.",
        },
      ],
      questionPrompt: "Qual opção mostra a divisão correta da palavra 'caderno'?",
      questionHint: "Pronuncie lentamente: ca-der-no.",
      correctOption: "CA-DER-NO",
      incorrectOptions: ["CAD-ER-NO", "CA-DR-NO"],
      trueFalsePrompt: "As sílabas de 'janela' são JA-NE-LA?",
      trueFalseHint: "Repita: ja-ne-la.",
      trueFalseStatement: "A palavra 'janela' pode ser segmentada em JA-NE-LA.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "batida-do-nome",
      title: "Batida do Nome",
      prompt: "Relacione batidas de palmas à quantidade de sílabas.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP02",
      habilidades: ["EF01LP02"],
      category: "Ritmo das sílabas",
      duration: 9,
      focus: "contagem de sílabas",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "detetive-dos-pedacinhos",
          description: "Usar a divisão anterior para reforçar a contagem de sílabas.",
        },
      ],
      questionPrompt: "Quantas palmas você bate para a palavra 'caderno'?",
      questionHint: "Conte as sílabas: ca-der-no.",
      correctOption: "3 palmas",
      incorrectOptions: ["2 palmas", "4 palmas"],
      trueFalsePrompt: "A palavra 'fada' tem duas palmas?",
      trueFalseHint: "Diga FA-DA e conte.",
      trueFalseStatement: "A palavra 'fada' possui duas sílabas.",
      trueFalseAnswer: true,
    }),
  ],
  puzzles: [
    makePuzzle({
      slug: "puzzle-rimas-sonoras",
      title: "Puzzle Rimas Sonoras",
      prompt: "Combine palavras que rimam para formar duplas divertidas.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP01",
      habilidades: ["EF01LP01"],
      category: "Rimas",
      duration: 10,
      focus: "rimas",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "rimas-do-recreio",
          description: "Retomar exemplos de rimas antes de montar o quebra-cabeça.",
        },
      ],
      pairs: [
        { prompt: "Pato", match: "Gato" },
        { prompt: "Pente", match: "Dente" },
        { prompt: "Chuva", match: "Uva" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-som-inicial",
      title: "Caixa dos Sons Iniciais",
      prompt: "Associe palavras que compartilham o mesmo som inicial.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP01",
      habilidades: ["EF01LP01"],
      category: "Som inicial",
      duration: 10,
      focus: "sons iniciais",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "eco-dos-sons",
          description: "Comparar sons finais antes de revisar os sons iniciais.",
        },
      ],
      pairs: [
        { prompt: "Bola", match: "Bolo" },
        { prompt: "Sapo", match: "Sapato" },
        { prompt: "Mala", match: "Macaco" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-silabas-dancarinas",
      title: "Sílabas Dançarinas",
      prompt: "Junte sílabas para revelar palavras escondidas.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP02",
      habilidades: ["EF01LP02"],
      category: "Montagem de sílabas",
      duration: 11,
      focus: "composição de sílabas",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "detetive-dos-pedacinhos",
          description: "Utilizar a divisão realizada anteriormente para formar novas palavras.",
        },
      ],
      pairs: [
        { prompt: "CA", match: "DER-NO" },
        { prompt: "PA", match: "LA-ÇO" },
        { prompt: "FE", match: "RI-A" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-compasso-silabico",
      title: "Compasso Silábico",
      prompt: "Relacione palavras à quantidade correta de sílabas.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP02",
      habilidades: ["EF01LP02"],
      category: "Contagem de sílabas",
      duration: 11,
      focus: "contagem de sílabas",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "batida-do-nome",
          description: "Aplicar a contagem com palmas para validar o número de sílabas.",
        },
      ],
      pairs: [
        { prompt: "2 sílabas", match: "Fada" },
        { prompt: "3 sílabas", match: "Janela" },
        { prompt: "4 sílabas", match: "Maracuja" },
      ],
    }),
  ],
  games: [
    makeGame({
      slug: "caca-sons-iniciais",
      title: "Caça aos Sons Iniciais",
      prompt: "Descubra palavras que começam com o som proposto em cada fase.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP01",
      habilidades: ["EF01LP01"],
      category: "Som inicial",
      duration: 12,
      focus: "sons iniciais",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "som-inicial-surpresa",
          description: "Retomar a escuta dos sons iniciais antes de jogar.",
        },
      ],
      victoryMessage: "Show! Os sons iniciais foram encontrados com atenção.",
      gameOverMessage: "Tudo bem! Revise cada som e tente novamente.",
      levels: [
        { challenge: "Qual palavra começa com o som /s/? (sol, gato, bolo)", answer: "sol" },
        {
          challenge: "Escolha a palavra com som inicial /p/: (pipoca, gato, uva)",
          answer: "pipoca",
        },
        { challenge: "Aponte a palavra que começa com /l/: (lapis, sapo, bola)", answer: "lapis" },
      ],
    }),
    makeGame({
      slug: "batalha-das-silabas",
      title: "Batalha das Sílabas",
      prompt: "Conte quantas sílabas cada palavra possui e digite o número correto.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP02",
      habilidades: ["EF01LP02"],
      category: "Contagem de sílabas",
      duration: 12,
      focus: "contagem de sílabas",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "detetive-dos-pedacinhos",
          description: "Usar a divisão em sílabas registrada na atividade anterior.",
        },
      ],
      victoryMessage: "Todas as sílabas foram contadas com ritmo certeiro!",
      gameOverMessage: "Respire, bata palmas novamente e tente de novo.",
      levels: [
        { challenge: "Quantas sílabas tem 'janela'?", answer: 3 },
        { challenge: "Quantas sílabas tem 'borboleta'?", answer: 4 },
        { challenge: "Quantas sílabas tem 'dado'?", answer: 2 },
      ],
    }),
    makeGame({
      slug: "orquestra-de-silabas",
      title: "Orquestra de Sílabas",
      prompt: "Combine sílabas para formar palavras e leia em voz alta.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP02",
      habilidades: ["EF01LP02"],
      category: "Formação de palavras",
      duration: 13,
      focus: "composição de sílabas",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-silabas-dancarinas",
          description: "Revisar as combinações de sílabas feitas no puzzle.",
        },
      ],
      victoryMessage: "Palavras formadas! As sílabas tocaram em harmonia.",
      gameOverMessage: "Experimente reorganizar as sílabas com calma e tente novamente.",
      levels: [
        { challenge: "Una as sílabas BA + LA para formar uma palavra.", answer: "bala" },
        { challenge: "Una as sílabas CA + SA para formar uma palavra.", answer: "casa" },
        { challenge: "Una as sílabas PA + TO para formar uma palavra.", answer: "pato" },
      ],
    }),
  ],
};

const module2: ModuleInput = {
  slug: "familia-das-vogais",
  title: "Família das Vogais",
  subtitle: "Letras que cantam",
  description:
    "Sequência para reconhecer vogais, comparar grafias e relacionar letras aos sons em palavras do cotidiano.",
  learningOutcomes: [
    "Reconhecer vogais em diferentes suportes e formatos.",
    "Relacionar vogais a sons iniciais, médios e finais de palavras.",
    "Utilizar vogais para completar palavras e criar novas combinações sonoras.",
  ],
  tags: ["vogais", "alfabeto", "letramento-inicial"],
  primaryBnccCode: "EF01LP03",
  secondaryBnccCodes: ["EF01LP04"],
  quizzes: [
    makeQuiz({
      slug: "vogal-exploradora",
      title: "Vogal Exploradora",
      prompt: "Identifique a vogal que representa o som apresentado.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP03",
      habilidades: ["EF01LP03"],
      category: "Vogais iniciais",
      duration: 8,
      focus: "reconhecimento de vogais",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP03",
          description: "Explorar músicas e parlendas destacando vogais.",
        },
      ],
      questionPrompt: "Qual letra corresponde ao som inicial de 'elefante'?",
      questionHint: "Repita 'elefante' e destaque o primeiro som.",
      correctOption: "E",
      incorrectOptions: ["I", "O"],
      trueFalsePrompt: "As letras 'A' e 'a' representam a mesma vogal?",
      trueFalseHint: "Observe a forma maiúscula e minúscula.",
      trueFalseStatement: "As letras 'A' e 'a' representam a mesma vogal.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "caixa-das-vogais",
      title: "Caixa das Vogais",
      prompt: "Escolha a vogal que completa a palavra apresentada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP03",
      habilidades: ["EF01LP03"],
      category: "Completar palavras",
      duration: 8,
      focus: "identificação de vogais em palavras",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "vogal-exploradora",
          description: "Retomar a identificação de vogais em palavras simples.",
        },
      ],
      questionPrompt: "Qual vogal completa a palavra 'c_sa' para formar 'casa'?",
      questionHint: "Perceba o som que falta ao pronunciar a palavra.",
      correctOption: "A",
      incorrectOptions: ["E", "O"],
      trueFalsePrompt: "A palavra 'uva' começa com a vogal U?",
      trueFalseHint: "Repita a palavra devagar.",
      trueFalseStatement: "A palavra 'uva' começa com a vogal U.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "ordem-das-vogais",
      title: "Ordem das Vogais",
      prompt: "Pense na sequência do alfabeto e identifique a próxima vogal.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP03",
      habilidades: ["EF01LP03"],
      category: "Sequência alfabética",
      duration: 9,
      focus: "ordem das vogais",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "caixa-das-vogais",
          description: "Revisar a identificação de vogais em palavras antes de ordenar.",
        },
      ],
      questionPrompt: "Qual vogal vem depois de 'E' na sequência alfabética?",
      questionHint: "Recite as vogais em voz alta.",
      correctOption: "I",
      incorrectOptions: ["A", "O"],
      trueFalsePrompt: "A vogal 'O' aparece na palavra 'sol'?",
      trueFalseHint: "Leia a palavra em voz alta destacando as vogais.",
      trueFalseStatement: "A palavra 'sol' contém a vogal 'O'.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "som-e-letra",
      title: "Som e Letra",
      prompt: "Relacione a vogal ao som final da palavra indicada.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP04",
      habilidades: ["EF01LP04"],
      category: "Som e grafia",
      duration: 8,
      focus: "correspondência som-vogal",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP04",
          description: "Escutar palavras destacando os sons das vogais.",
        },
      ],
      questionPrompt: "Qual vogal representa o som final de 'cafe'?",
      questionHint: "Repita a palavra e observe o som final.",
      correctOption: "E",
      incorrectOptions: ["A", "I"],
      trueFalsePrompt: "Na palavra 'mala', a vogal 'a' aparece no início e no fim?",
      trueFalseHint: "Leia a palavra destacando cada vogal.",
      trueFalseStatement: "A palavra 'mala' começa e termina com a vogal 'a'.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "vogal-misteriosa",
      title: "Vogal Misteriosa",
      prompt: "Descubra qual vogal produz o som indicado na palavra.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP04",
      habilidades: ["EF01LP04"],
      category: "Sons e vogais",
      duration: 9,
      focus: "associação som-vogal",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "som-e-letra",
          description: "Retomar os sons finais antes de completar com novas vogais.",
        },
      ],
      questionPrompt: "Qual vogal deve ser usada para escrever o som /i/ na palavra 'p_pa'?",
      questionHint: "Repita 'pipa' e perceba qual vogal produz o som /i/.",
      correctOption: "I",
      incorrectOptions: ["A", "O"],
      trueFalsePrompt: "A vogal 'E' representa o som /e/ em 'pente'?",
      trueFalseHint: "Escute o som das vogais em 'pente'.",
      trueFalseStatement: "Na palavra 'pente', a vogal 'E' representa o som /e/.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "coro-das-vogais",
      title: "Coro das Vogais",
      prompt: "Selecione a vogal que completa a palavra cantada.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP04",
      habilidades: ["EF01LP04"],
      category: "Vogais em canções",
      duration: 9,
      focus: "uso das vogais em contextos musicais",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "vogal-misteriosa",
          description: "Utilizar as descobertas anteriores para completar canções.",
        },
      ],
      questionPrompt: "Qual vogal completa a palavra 'l__a' para formar 'lua'?",
      questionHint: "Cante a palavra 'lua' enfatizando a vogal central.",
      correctOption: "U",
      incorrectOptions: ["A", "E"],
      trueFalsePrompt: "A vogal 'u' representa o som /u/ em 'lupa'?",
      trueFalseHint: "Pronuncie 'lupa' destacando a vogal.",
      trueFalseStatement: "Na palavra 'lupa', a vogal 'u' representa o som /u/.",
      trueFalseAnswer: true,
    }),
  ],
  puzzles: [
    makePuzzle({
      slug: "puzzle-vogais-amigas",
      title: "Vogais Amigas",
      prompt: "Combine vogais maiúsculas e minúsculas que representam o mesmo som.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP03",
      habilidades: ["EF01LP03"],
      category: "Maiúsculas e minúsculas",
      duration: 9,
      focus: "reconhecimento de vogais",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "vogal-exploradora",
          description: "Relembrar as vogais apresentadas anteriormente.",
        },
      ],
      pairs: [
        { prompt: "A", match: "a" },
        { prompt: "E", match: "e" },
        { prompt: "I", match: "i" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-vogal-e-imagem",
      title: "Vogal e Imagem",
      prompt: "Associe cada vogal a uma imagem que começa com o mesmo som.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP04",
      habilidades: ["EF01LP04"],
      category: "Associação vogal-imagem",
      duration: 10,
      focus: "associação vogal e imagem",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "caixa-das-vogais",
          description: "Retomar a escuta de palavras com diferentes vogais.",
        },
      ],
      pairs: [
        { prompt: "A", match: "Abacate" },
        { prompt: "E", match: "Elefante" },
        { prompt: "I", match: "Igreja" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-completa-vogal",
      title: "Completa Vogal",
      prompt: "Escolha a vogal que falta em cada palavra.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP04",
      habilidades: ["EF01LP04"],
      category: "Vogais em palavras",
      duration: 10,
      focus: "uso de vogais em palavras",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "vogal-misteriosa",
          description: "Reutilizar as vogais descobertas em novas palavras.",
        },
      ],
      pairs: [
        { prompt: "C_SA", match: "A" },
        { prompt: "P_PA", match: "I" },
        { prompt: "L_PA", match: "U" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-trilha-alfabeto",
      title: "Trilha do Alfabeto",
      prompt: "Relacione a posição ordinal à vogal correspondente.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP03",
      habilidades: ["EF01LP03"],
      category: "Sequência alfabética",
      duration: 10,
      focus: "ordem das vogais",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "ordem-das-vogais",
          description: "Retomar a sequência antes de jogar o puzzle.",
        },
      ],
      pairs: [
        { prompt: "1ª vogal", match: "A" },
        { prompt: "2ª vogal", match: "E" },
        { prompt: "3ª vogal", match: "I" },
      ],
    }),
  ],
  games: [
    makeGame({
      slug: "corrida-das-vogais",
      title: "Corrida das Vogais",
      prompt: "Escolha rapidamente a vogal que atende ao desafio de cada fase.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP03",
      habilidades: ["EF01LP03"],
      category: "Identificação de vogais",
      duration: 12,
      focus: "identificação de vogais",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "caixa-das-vogais",
          description: "Relembrar as vogais que completam palavras.",
        },
      ],
      victoryMessage: "Você acelerou com as vogais na ponta da língua!",
      gameOverMessage: "Revise as vogais com calma e tente a corrida novamente.",
      levels: [
        { challenge: "Qual vogal inicia a palavra 'igreja'? (i, o, a)", answer: "i" },
        { challenge: "Qual vogal completa 'c_sa' para formar 'casa'? (a, u, o)", answer: "a" },
        { challenge: "Qual vogal aparece duas vezes em 'uva'? (u, e, i)", answer: "u" },
      ],
    }),
    makeGame({
      slug: "laboratorio-das-vogais",
      title: "Laboratório das Vogais",
      prompt: "Relacione sons e letras para resolver cada desafio.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP04",
      habilidades: ["EF01LP04"],
      category: "Som e grafia",
      duration: 12,
      focus: "correspondência som-vogal",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "som-e-letra",
          description: "Retomar o reconhecimento de sons finais antes de jogar.",
        },
      ],
      victoryMessage: "Experimentos concluídos! As vogais ganharam vida.",
      gameOverMessage: "Revise os sons das vogais e tente novamente quando estiver pronto.",
      levels: [
        { challenge: "Qual vogal representa o som /e/ na palavra 'mesa'?", answer: "e" },
        { challenge: "Qual vogal completa 'b_lo' para formar 'bolo'?", answer: "o" },
        { challenge: "Qual vogal finaliza a palavra 'banana'?", answer: "a" },
      ],
    }),
    makeGame({
      slug: "memoria-das-vogais",
      title: "Memória das Vogais",
      prompt: "Complete sílabas com a vogal correta e leia em voz alta.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP04",
      habilidades: ["EF01LP04"],
      category: "Formação de sílabas",
      duration: 13,
      focus: "formação de sílabas com vogais",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-completa-vogal",
          description: "Reutilizar as vogais completando novas sílabas.",
        },
      ],
      victoryMessage: "Memória afiada! As sílabas cantaram em harmonia.",
      gameOverMessage: "Volte às pistas, repita as sílabas e tente outra vez.",
      levels: [
        { challenge: "Qual vogal completa a sílaba L_ para formar 'LA'?", answer: "a" },
        { challenge: "Qual vogal completa a sílaba L_ para formar 'LE'?", answer: "e" },
        { challenge: "Qual vogal completa a sílaba L_ para formar 'LU'?", answer: "u" },
      ],
    }),
  ],
};

const module3: ModuleInput = {
  slug: "palavras-em-acao",
  title: "Palavras em Ação",
  subtitle: "Leitura de uso cotidiano",
  description:
    "Sequência para ampliar repertório lexical, ler palavras frequentes e aplicar estratégias de decodificação em situações reais.",
  learningOutcomes: [
    "Ler palavras familiares presentes no cotidiano escolar e comunitário.",
    "Relacionar palavras a imagens, objetos e contextos de uso.",
    "Comparar palavras que compartilham sons, letras e sentidos próximos.",
  ],
  tags: ["leitura", "palavras-frequentes", "alfabetizacao"],
  primaryBnccCode: "EF01LP05",
  secondaryBnccCodes: ["EF01LP06"],
  quizzes: [
    makeQuiz({
      slug: "palavra-e-figura",
      title: "Palavra e Figura",
      prompt: "Leia a palavra e associe à imagem correspondente.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP05",
      habilidades: ["EF01LP05"],
      category: "Leitura de palavras",
      duration: 8,
      focus: "leitura de palavras usuais",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP05",
          description: "Explorar cartazes e cantigas com palavras familiares.",
        },
      ],
      questionPrompt: "Qual palavra nomeia a figura de uma bola?",
      questionHint: "Observe a imagem e leia cada opção com atenção.",
      correctOption: "Bola",
      incorrectOptions: ["Gato", "Pipa"],
      trueFalsePrompt: "A palavra 'bola' representa a imagem de uma bola?",
      trueFalseHint: "Compare a palavra escrita com a figura mostrada.",
      trueFalseStatement: "A palavra 'bola' representa a imagem de uma bola.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "cantinho-das-palavras",
      title: "Cantinho das Palavras",
      prompt: "Escolha a palavra que completa a frase apresentada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP05",
      habilidades: ["EF01LP05"],
      category: "Palavras em contexto",
      duration: 8,
      focus: "compreensão de palavras em contexto",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "palavra-e-figura",
          description: "Retomar a identificação de palavras antes de usá-las em frases.",
        },
      ],
      questionPrompt: "Qual palavra completa a frase 'Eu guardo meus lápis no ____'?",
      questionHint: "Pense no objeto usado para guardar materiais.",
      correctOption: "Estojo",
      incorrectOptions: ["Sapato", "Copo"],
      trueFalsePrompt: "A palavra 'livro' é usada para ler histórias?",
      trueFalseHint: "Lembre dos objetos presentes na sala de leitura.",
      trueFalseStatement: "A palavra 'livro' é usada para ler histórias.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "palavra-em-contexto",
      title: "Palavra em Contexto",
      prompt: "Relacione palavras a espaços e objetos da escola.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP05",
      habilidades: ["EF01LP05"],
      category: "Ambientes escolares",
      duration: 9,
      focus: "leitura contextualizada",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "cantinho-das-palavras",
          description: "Revisar palavras usadas em frases antes de mapear os ambientes.",
        },
      ],
      questionPrompt: "Qual palavra indica um lugar da escola?",
      questionHint: "Pense em onde guardamos ou pegamos livros.",
      correctOption: "Biblioteca",
      incorrectOptions: ["Janela", "Sapato"],
      trueFalsePrompt: "A palavra 'cantina' refere-se a um espaço da escola?",
      trueFalseHint: "Lembre dos locais visitados no recreio.",
      trueFalseStatement: "A palavra 'cantina' refere-se a um espaço da escola.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "duelo-de-palavras",
      title: "Duelo de Palavras",
      prompt: "Compare sons iniciais e identifique palavras que se aproximam.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP06",
      habilidades: ["EF01LP06"],
      category: "Sons iniciais",
      duration: 8,
      focus: "reconhecimento de padrões sonoros",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP06",
          description: "Explorar palavras que compartilham sons iniciais.",
        },
      ],
      questionPrompt: "Qual palavra tem o mesmo som inicial de 'banana'?",
      questionHint: "Diga as palavras em voz alta e compare o primeiro som.",
      correctOption: "Bala",
      incorrectOptions: ["Caneta", "Fone"],
      trueFalsePrompt: "As palavras 'bala' e 'bola' começam com o mesmo som?",
      trueFalseHint: "Pronuncie devagar: ba-la, bo-la.",
      trueFalseStatement: "As palavras 'bala' e 'bola' começam com o mesmo som.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "escolha-rapida",
      title: "Escolha Rápida",
      prompt: "Encontre palavras que rimam com as apresentadas.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP06",
      habilidades: ["EF01LP06"],
      category: "Rimas",
      duration: 9,
      focus: "comparação de palavras",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "duelo-de-palavras",
          description: "Retomar sons iniciais antes de comparar rimas.",
        },
      ],
      questionPrompt: "Qual palavra rima com 'casa'?",
      questionHint: "Foque no som final das palavras.",
      correctOption: "Asa",
      incorrectOptions: ["Copo", "Livro"],
      trueFalsePrompt: "As palavras 'faca' e 'saca' rimam?",
      trueFalseHint: "Repita as palavras percebendo o final.",
      trueFalseStatement: "As palavras 'faca' e 'saca' rimam.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "leitura-estrategica",
      title: "Leitura Estratégica",
      prompt: "Observe palavras com sons finais semelhantes e faça associações.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP06",
      habilidades: ["EF01LP06"],
      category: "Sons finais",
      duration: 9,
      focus: "comparação de sons finais",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "escolha-rapida",
          description: "Retomar exemplos de rimas antes de avançar para novos sons finais.",
        },
      ],
      questionPrompt: "Qual palavra tem o som final igual ao de 'papel'?",
      questionHint: "Pense em palavras que terminam com /el/.",
      correctOption: "Anel",
      incorrectOptions: ["Mesa", "Tigre"],
      trueFalsePrompt: "As palavras 'anel' e 'mel' terminam com o mesmo som?",
      trueFalseHint: "Pronuncie devagar: a-nel, mel.",
      trueFalseStatement: "As palavras 'anel' e 'mel' terminam com o mesmo som.",
      trueFalseAnswer: true,
    }),
  ],
  puzzles: [
    makePuzzle({
      slug: "puzzle-palavra-imagem",
      title: "Palavra & Imagem",
      prompt: "Relacione palavras a descrições de imagens.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP05",
      habilidades: ["EF01LP05"],
      category: "Associação palavra-imagem",
      duration: 10,
      focus: "leitura de palavras usuais",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "palavra-e-figura",
          description: "Retomar as palavras apresentadas nas imagens do quiz.",
        },
      ],
      pairs: [
        { prompt: "Bola", match: "Imagem de bola" },
        { prompt: "Livro", match: "Imagem de livro" },
        { prompt: "Pipa", match: "Imagem de pipa" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-palavras-frase",
      title: "Palavras na Frase",
      prompt: "Combine palavras a frases que fazem sentido.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP05",
      habilidades: ["EF01LP05"],
      category: "Frases do cotidiano",
      duration: 10,
      focus: "uso de palavras em frases",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "cantinho-das-palavras",
          description: "Reaproveitar as frases construídas anteriormente.",
        },
      ],
      pairs: [
        { prompt: "___ da escola", match: "Biblioteca" },
        { prompt: "Hora do ___", match: "Recreio" },
        { prompt: "Cartaz de ___", match: "Leitura" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-rima-palavra",
      title: "Rima Palavra",
      prompt: "Associe palavras que rimam.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP06",
      habilidades: ["EF01LP06"],
      category: "Rimas",
      duration: 11,
      focus: "comparação de palavras",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "escolha-rapida",
          description: "Relembrar rimas trabalhadas no quiz.",
        },
      ],
      pairs: [
        { prompt: "Casa", match: "Asa" },
        { prompt: "Bola", match: "Escola" },
        { prompt: "Pente", match: "Dente" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-familia-palavras",
      title: "Família de Palavras",
      prompt: "Relacione pistas com palavras que compartilham a mesma letra inicial.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP06",
      habilidades: ["EF01LP06"],
      category: "Sons iniciais",
      duration: 11,
      focus: "reconhecimento de padrões sonoros",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "duelo-de-palavras",
          description: "Reusar palavras com sons iniciais parecidos.",
        },
      ],
      pairs: [
        { prompt: "B_", match: "Bola" },
        { prompt: "C_", match: "Casa" },
        { prompt: "P_", match: "Pato" },
      ],
    }),
  ],
  games: [
    makeGame({
      slug: "caixa-de-palavras",
      title: "Caixa de Palavras",
      prompt: "Escolha palavras que resolvem desafios do cotidiano.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP05",
      habilidades: ["EF01LP05"],
      category: "Leitura funcional",
      duration: 12,
      focus: "leitura de palavras usuais",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "palavra-em-contexto",
          description: "Revisar palavras ligadas a espaços e objetos antes de jogar.",
        },
      ],
      victoryMessage: "Você escolheu as palavras certas para cada situação!",
      gameOverMessage: "Repasse as palavras do mural e tente novamente.",
      levels: [
        {
          challenge: "Escolha a palavra que nomeia a imagem de uma bola. (bola, casa, gato)",
          answer: "bola",
        },
        {
          challenge: "Escolha a palavra que usamos para guardar lápis. (estojo, janela, sapato)",
          answer: "estojo",
        },
        {
          challenge: "Qual palavra indica o local de livros na escola? (biblioteca, prato, sapo)",
          answer: "biblioteca",
        },
      ],
    }),
    makeGame({
      slug: "roda-das-rimas",
      title: "Roda das Rimas",
      prompt: "Encontre palavras que combinam nos sons finais.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP06",
      habilidades: ["EF01LP06"],
      category: "Rimas",
      duration: 12,
      focus: "comparação de palavras",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "escolha-rapida",
          description: "Retomar as rimas favoritas antes do jogo.",
        },
      ],
      victoryMessage: "As rimas giraram certinho! Excelente percepção sonora.",
      gameOverMessage: "Volte a cantar as rimas e tente novamente com calma.",
      levels: [
        { challenge: "Qual palavra rima com 'casa'? (asa, cama, roupa)", answer: "asa" },
        { challenge: "Qual palavra rima com 'papel'? (anel, colher, mesa)", answer: "anel" },
        { challenge: "Qual palavra rima com 'chapeu'? (ceu, copo, escola)", answer: "ceu" },
      ],
    }),
    makeGame({
      slug: "detective-leitor",
      title: "Detetive Leitor",
      prompt: "Digite palavras que combinam com as pistas apresentadas.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP06",
      habilidades: ["EF01LP06"],
      category: "Leitura ativa",
      duration: 13,
      focus: "uso estratégico de palavras",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-palavra-imagem",
          description: "Retomar as palavras associadas às imagens antes do desafio.",
        },
      ],
      victoryMessage: "Detetive aprovado! Todas as pistas foram decifradas.",
      gameOverMessage: "Revise o glossário da turma e tente novamente.",
      levels: [
        { challenge: "Digite a palavra que combina com o desenho de uma pipa.", answer: "pipa" },
        {
          challenge: "Digite a palavra que nomeia o objeto usado para ler histórias.",
          answer: "livro",
        },
        { challenge: "Digite a palavra que indica o lugar onde estudamos.", answer: "escola" },
      ],
    }),
  ],
};

const module4: ModuleInput = {
  slug: "frases-divertidas",
  title: "Frases Divertidas",
  subtitle: "Compreensão de textos curtinhos",
  description:
    "Sequência para ler, interpretar e criar frases curtas com humor, cooperação e atenção aos detalhes explícitos e implícitos.",
  learningOutcomes: [
    "Ler frases curtas identificando informações explícitas.",
    "Inferir intenções e efeitos de sentido em frases do cotidiano escolar.",
    "Reorganizar palavras para formar frases coerentes e significativas.",
  ],
  tags: ["frases", "compreensao", "interpretacao"],
  primaryBnccCode: "EF01LP07",
  secondaryBnccCodes: ["EF01LP08"],
  quizzes: [
    makeQuiz({
      slug: "frase-ilustrada",
      title: "Frase Ilustrada",
      prompt: "Leia a frase e responda à pergunta sobre ela.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP07",
      habilidades: ["EF01LP07"],
      category: "Compreensão literal",
      duration: 8,
      focus: "compreensão literal de frases",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP07",
          description: "Participar de leituras compartilhadas de frases curtas.",
        },
      ],
      questionPrompt: "A frase diz: 'O gato dorme no tapete.' O que o gato está fazendo?",
      questionHint: "Procure o verbo que indica a ação.",
      correctOption: "Dormindo",
      incorrectOptions: ["Pulando", "Comendo"],
      trueFalsePrompt: "Na frase, o gato dorme no tapete?",
      trueFalseHint: "Releia a frase com atenção.",
      trueFalseStatement: "Na frase, o gato dorme no tapete.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "quem-faz-o-que",
      title: "Quem faz o quê?",
      prompt: "Identifique o personagem responsável pela ação.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP07",
      habilidades: ["EF01LP07"],
      category: "Elementos da frase",
      duration: 8,
      focus: "identificação de sujeitos e ações",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "frase-ilustrada",
          description: "Revisar frases lidas anteriormente.",
        },
      ],
      questionPrompt: "A frase diz: 'Ana leva o livro para a sala.' Quem leva o livro?",
      questionHint: "Perceba o nome citado antes do verbo.",
      correctOption: "Ana",
      incorrectOptions: ["Pedro", "Gato"],
      trueFalsePrompt: "Na frase, Ana leva o livro para a sala?",
      trueFalseHint: "Leia novamente observando o sujeito.",
      trueFalseStatement: "Na frase, Ana leva o livro para a sala.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "onde-acontece",
      title: "Onde acontece?",
      prompt: "Descubra o local indicado pela frase.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP07",
      habilidades: ["EF01LP07"],
      category: "Localização",
      duration: 9,
      focus: "compreensão de informações explícitas",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "quem-faz-o-que",
          description: "Retomar frases para identificar elementos importantes.",
        },
      ],
      questionPrompt: "A frase diz: 'O recreio acontece no pátio.' Onde acontece o recreio?",
      questionHint: "Observe o lugar citado depois do verbo.",
      correctOption: "No pátio",
      incorrectOptions: ["Na biblioteca", "Na cozinha"],
      trueFalsePrompt: "O recreio acontece na biblioteca?",
      trueFalseHint: "Verifique o local indicado na frase.",
      trueFalseStatement: "O recreio acontece na biblioteca.",
      trueFalseAnswer: false,
    }),
    makeQuiz({
      slug: "intencao-da-frase",
      title: "Intenção da Frase",
      prompt: "Identifique a intenção comunicativa da frase.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP08",
      habilidades: ["EF01LP08"],
      category: "Intenções comunicativas",
      duration: 8,
      focus: "inferência de intenções",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP08",
          description: "Discutir diferentes intenções em diálogos curtos.",
        },
      ],
      questionPrompt: "Frase: 'Por favor, feche a porta.' Qual é a intenção da frase?",
      questionHint: "Perceba as palavras de gentileza e a ação proposta.",
      correctOption: "Fazer um pedido",
      incorrectOptions: ["Contar uma história", "Dar uma opinião"],
      trueFalsePrompt: "A frase faz um pedido educado?",
      trueFalseHint: "Observe a expressão 'por favor'.",
      trueFalseStatement: "A frase faz um pedido educado.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "descubra-o-humor",
      title: "Descubra o Humor",
      prompt: "Interprete o sentido figurado presente na frase.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP08",
      habilidades: ["EF01LP08"],
      category: "Sentido figurado",
      duration: 9,
      focus: "inferência de sentidos implícitos",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "intencao-da-frase",
          description: "Revisar como identificar intenções antes de analisar o humor.",
        },
      ],
      questionPrompt:
        "Frase: 'O lápis pediu férias depois de tantas provas!' O que a frase quer dizer?",
      questionHint: "Pense se objetos podem realmente pedir férias.",
      correctOption: "Que as provas foram cansativas",
      incorrectOptions: ["Que o lápis vai viajar", "Que não haverá mais provas"],
      trueFalsePrompt: "A frase usa humor para mostrar cansaço?",
      trueFalseHint: "Observe o exagero da expressão.",
      trueFalseStatement: "A frase usa humor para mostrar cansaço.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "completar-resposta",
      title: "Completar Resposta",
      prompt: "Escolha a resposta que combina com o diálogo apresentado.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP08",
      habilidades: ["EF01LP08"],
      category: "Diálogos",
      duration: 9,
      focus: "respostas adequadas",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "descubra-o-humor",
          description: "Analisar como frases podem mudar de sentido.",
        },
      ],
      questionPrompt:
        "Diálogo: '— Pode me emprestar o caderno? — ____' Qual resposta combina com o pedido?",
      questionHint: "Repare se a resposta concorda com o pedido.",
      correctOption: "Claro, pegue aqui.",
      incorrectOptions: ["Não tenho lápis.", "Vamos correr?"],
      trueFalsePrompt: "A resposta 'Claro, pegue aqui.' concorda com o pedido?",
      trueFalseHint: "Verifique se a resposta atende ao pedido.",
      trueFalseStatement: "A resposta 'Claro, pegue aqui.' concorda com o pedido.",
      trueFalseAnswer: true,
    }),
  ],
  puzzles: [
    makePuzzle({
      slug: "puzzle-frase-imagem",
      title: "Frase & Imagem",
      prompt: "Combine frases a descrições de imagens.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP07",
      habilidades: ["EF01LP07"],
      category: "Compreensão literal",
      duration: 10,
      focus: "compreensão literal de frases",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "frase-ilustrada",
          description: "Retomar frases trabalhadas para criar novas associações.",
        },
      ],
      pairs: [
        { prompt: "O cachorro bebe água.", match: "Cachorro no bebedouro" },
        { prompt: "A professora escreve no quadro.", match: "Professora escrevendo no quadro" },
        { prompt: "As crianças brincam no parque.", match: "Crianças no parque" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-ordem-frase",
      title: "Ordem da Frase",
      prompt: "Associe sequências embaralhadas à frase organizada.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP07",
      habilidades: ["EF01LP07"],
      category: "Organização de frases",
      duration: 10,
      focus: "organização sintática",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "quem-faz-o-que",
          description: "Revisar estrutura básica de frases.",
        },
      ],
      pairs: [
        { prompt: "Dormindo / gato / está", match: "O gato está dormindo." },
        { prompt: "Livro / Ana / leva", match: "Ana leva o livro." },
        { prompt: "Pátio / turma / corre", match: "A turma corre no pátio." },
      ],
    }),
    makePuzzle({
      slug: "puzzle-intencao-frase",
      title: "Intenção da Frase",
      prompt: "Relacione frases a suas intenções.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP08",
      habilidades: ["EF01LP08"],
      category: "Intenções comunicativas",
      duration: 11,
      focus: "inferência de intenções",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "intencao-da-frase",
          description: "Revisar diferentes intenções comunicativas.",
        },
      ],
      pairs: [
        { prompt: "Você pode fechar a janela?", match: "Pedido" },
        { prompt: "Que horas começa o filme?", match: "Pergunta" },
        { prompt: "Cuidado com o degrau!", match: "Aviso" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-humor-frase",
      title: "Humor na Frase",
      prompt: "Associe frases criativas a suas interpretações.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP08",
      habilidades: ["EF01LP08"],
      category: "Sentido figurado",
      duration: 11,
      focus: "inferência de sentidos implícitos",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "descubra-o-humor",
          description: "Reaproveitar exemplos de humor para novas interpretações.",
        },
      ],
      pairs: [
        { prompt: "O lápis pediu férias.", match: "Expressa cansaço com humor" },
        { prompt: "O relógio decidiu cochilar.", match: "Indica atraso com brincadeira" },
        { prompt: "A mochila virou foguete.", match: "Imagina algo muito rápido" },
      ],
    }),
  ],
  games: [
    makeGame({
      slug: "montar-frase",
      title: "Montar Frase",
      prompt: "Complete frases curtas escolhendo palavras adequadas.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP07",
      habilidades: ["EF01LP07"],
      category: "Construção de frases",
      duration: 12,
      focus: "organização de frases",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-ordem-frase",
          description: "Relembrar como ordenar palavras antes de jogar.",
        },
      ],
      victoryMessage: "Frases prontas! Você organizou cada ideia com cuidado.",
      gameOverMessage: "Releia as frases e tente novamente escolhendo com calma.",
      levels: [
        {
          challenge: "Complete: 'O ____ toca o sino.' (diretor, cachorro, lápis)",
          answer: "diretor",
        },
        {
          challenge: "Complete: 'A turma lê ____ histórias.' (novas, salgada, pesada)",
          answer: "novas",
        },
        {
          challenge: "Complete: 'O ônibus chega às ____ horas.' (sete, flor, doce)",
          answer: "sete",
        },
      ],
    }),
    makeGame({
      slug: "frase-surpresa",
      title: "Frase Surpresa",
      prompt: "Interpretar frases para descobrir intenções e sentidos.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP08",
      habilidades: ["EF01LP08"],
      category: "Interpretação",
      duration: 12,
      focus: "inferência de sentidos",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "intencao-da-frase",
          description: "Reforçar a leitura de intenções antes do jogo.",
        },
      ],
      victoryMessage: "Você decifrou cada frase com sensibilidade!",
      gameOverMessage: "Converse sobre cada frase com um colega e tente novamente.",
      levels: [
        {
          challenge:
            "Frase: 'Guarde os brinquedos, por favor.' Qual é a intenção? (pedido, piada, pergunta)",
          answer: "pedido",
        },
        {
          challenge:
            "Frase: 'Essa mochila pesa uma tonelada!' O que quer dizer? (está muito pesada, vai voar, está vazia)",
          answer: "está muito pesada",
        },
        {
          challenge:
            "Frase: 'A sala virou um mar de papel.' Significa que... (há papéis espalhados, todos estão desenhando, a sala encheu água)",
          answer: "há papéis espalhados",
        },
      ],
    }),
    makeGame({
      slug: "dialogo-rapido",
      title: "Diálogo Rápido",
      prompt: "Digite respostas que combinam com pedidos e convites.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP08",
      habilidades: ["EF01LP08"],
      category: "Diálogos",
      duration: 13,
      focus: "respostas adequadas",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "completar-resposta",
          description: "Retomar respostas adequadas em diálogos curtos.",
        },
      ],
      victoryMessage: "Diálogo alinhado! Você respondeu com gentileza.",
      gameOverMessage: "Revise as expressões de cortesia e tente novamente.",
      levels: [
        { challenge: "Complete o diálogo: '— Obrigado pela ajuda! — ____'", answer: "De nada!" },
        { challenge: "Complete: '— Você pode me ouvir? — ____'", answer: "Posso sim." },
        { challenge: "Complete: '— Vamos revisar a tarefa juntos? — ____'", answer: "Vamos!" },
      ],
    }),
  ],
};

const module5: ModuleInput = {
  slug: "bilhetes-e-recados",
  title: "Bilhetes e Recados",
  subtitle: "Produção de textos breves",
  description:
    "Sequência para planejar, escrever e revisar bilhetes e recados com destinatário definido e linguagem clara.",
  learningOutcomes: [
    "Planejar bilhetes identificando destinatário, objetivo e assinatura.",
    "Selecionar vocabulário adequado para mensagens curtas e diretas.",
    "Revisar bilhetes considerando clareza, cortesia e convenções básicas.",
  ],
  tags: ["bilhetes", "producao-textual", "revisao"],
  primaryBnccCode: "EF01LP09",
  secondaryBnccCodes: ["EF01LP10"],
  quizzes: [
    makeQuiz({
      slug: "elementos-do-bilhete",
      title: "Elementos do Bilhete",
      prompt: "Reconheça informações essenciais em um bilhete.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP09",
      habilidades: ["EF01LP09"],
      category: "Planejamento",
      duration: 8,
      focus: "planejamento de bilhetes",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP09",
          description: "Conversar sobre elementos que compõem um bilhete.",
        },
      ],
      questionPrompt: "Qual item não pode faltar em um bilhete para indicar quem escreveu?",
      questionHint: "Pense em como o destinatário saberá quem deixou o recado.",
      correctOption: "Assinatura",
      incorrectOptions: ["Desenho", "Hashtag"],
      trueFalsePrompt: "Todo bilhete precisa indicar quem escreve?",
      trueFalseHint: "Verifique se a pessoa destinatária sabe quem enviou.",
      trueFalseStatement: "Todo bilhete precisa indicar quem escreve.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "qual-o-destinatario",
      title: "Qual o Destinatário?",
      prompt: "Identifique para quem o bilhete foi escrito.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP09",
      habilidades: ["EF01LP09"],
      category: "Destinatário",
      duration: 8,
      focus: "definição de destinatário",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "elementos-do-bilhete",
          description: "Retomar a importância de destinatário e assinatura.",
        },
      ],
      questionPrompt:
        "Bilhete: 'Turma, lembrem-se de trazer a planta amanhã. — Professora Joana.' Para quem é o bilhete?",
      questionHint: "Observe a primeira palavra do bilhete.",
      correctOption: "Para a turma",
      incorrectOptions: ["Para a diretora", "Para a família"],
      trueFalsePrompt: "O bilhete é destinado à turma?",
      trueFalseHint: "Leia novamente a saudação.",
      trueFalseStatement: "O bilhete é destinado à turma.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "objetivo-do-recado",
      title: "Objetivo do Recado",
      prompt: "Entenda qual é o propósito da mensagem.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP09",
      habilidades: ["EF01LP09"],
      category: "Objetivo",
      duration: 9,
      focus: "objetivo do recado",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "qual-o-destinatario",
          description: "Relembrar que cada bilhete tem um objetivo claro.",
        },
      ],
      questionPrompt:
        "Bilhete: 'Mamãe, fui à biblioteca. Volto às 16h. Beijos, Ana.' Qual é o objetivo do recado?",
      questionHint: "Perceba a informação principal compartilhada.",
      correctOption: "Avisar onde está",
      incorrectOptions: ["Convidar para brincar", "Contar uma piada"],
      trueFalsePrompt: "O recado explica onde Ana está?",
      trueFalseHint: "Observe a primeira frase do bilhete.",
      trueFalseStatement: "O recado explica onde Ana está.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "revendo-o-texto",
      title: "Revendo o Texto",
      prompt: "Identifique ajustes necessários em um bilhete.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP10",
      habilidades: ["EF01LP10"],
      category: "Revisão básica",
      duration: 8,
      focus: "revisão de bilhetes",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "SKILL",
          reference: "EF01LP10",
          description: "Conversar sobre revisar textos antes de enviar.",
        },
      ],
      questionPrompt:
        "Bilhete: 'Pedro, leve o guarda-chuva.' O que falta para completar esse bilhete?",
      questionHint: "Pense em como Pedro saberá quem enviou a mensagem.",
      correctOption: "Assinatura de quem escreveu",
      incorrectOptions: ["Um desenho colorido", "Uma receita"],
      trueFalsePrompt: "Adicionar a assinatura deixa o bilhete mais completo?",
      trueFalseHint: "Veja se falta a identificação de quem escreve.",
      trueFalseStatement: "Adicionar a assinatura deixa o bilhete mais completo.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "corrige-a-frase",
      title: "Corrige a Frase",
      prompt: "Escolha a versão revisada de uma frase de recado.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP10",
      habilidades: ["EF01LP10"],
      category: "Pontuação",
      duration: 9,
      focus: "correção de bilhetes",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "revendo-o-texto",
          description: "Aplicar a revisão em frases específicas.",
        },
      ],
      questionPrompt:
        "Qual opção revisa corretamente a frase 'Por favor entregar os livros amanhã'?",
      questionHint: "Observe pontuação e conjugação do verbo.",
      correctOption: "Por favor, entregue os livros amanhã.",
      incorrectOptions: [
        "Por favor entrega os livros amanhã",
        "Por favor entregue os livros amanha",
      ],
      trueFalsePrompt: "A frase revisada usa vírgula para organizar o pedido?",
      trueFalseHint: "Note os sinais de pontuação adicionados.",
      trueFalseStatement: "A frase revisada usa vírgula para organizar o pedido.",
      trueFalseAnswer: true,
    }),
    makeQuiz({
      slug: "checar-claridade",
      title: "Checar Claridade",
      prompt: "Analise se a mensagem transmite todas as informações necessárias.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP10",
      habilidades: ["EF01LP10"],
      category: "Clareza de mensagem",
      duration: 9,
      focus: "clareza e completude",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "corrige-a-frase",
          description: "Reforçar a importância de detalhes na revisão.",
        },
      ],
      questionPrompt: "Bilhete: 'Oi, traz o livro? — Leo'. O que falta para ficar claro?",
      questionHint: "Pense no momento em que o pedido deve acontecer.",
      correctOption: "Dizer quando levar o livro",
      incorrectOptions: ["Adicionar adesivos coloridos", "Colocar emojis"],
      trueFalsePrompt: "Informar o horário deixa o bilhete mais claro?",
      trueFalseHint: "Considere se o destinatário saberá quando agir.",
      trueFalseStatement: "Informar o horário deixa o bilhete mais claro.",
      trueFalseAnswer: true,
    }),
  ],
  puzzles: [
    makePuzzle({
      slug: "puzzle-destinatario",
      title: "Destinatário Certo",
      prompt: "Associe o início do bilhete ao destinatário correspondente.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP09",
      habilidades: ["EF01LP09"],
      category: "Planejamento",
      duration: 10,
      focus: "planejamento de bilhetes",
      assetSlug: "lp-letra-a",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "qual-o-destinatario",
          description: "Retomar diferentes destinatários discutidos em sala.",
        },
      ],
      pairs: [
        { prompt: "Querida turma,", match: "Destinatário coletivo" },
        { prompt: "Mamãe,", match: "Destinatário da família" },
        { prompt: "Equipe da biblioteca,", match: "Destinatário da escola" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-ordem-bilhete",
      title: "Ordem do Bilhete",
      prompt: "Relacione partes do bilhete com exemplos.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP09",
      habilidades: ["EF01LP09"],
      category: "Estrutura",
      duration: 10,
      focus: "organização de bilhetes",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "elementos-do-bilhete",
          description: "Retomar cada parte do bilhete antes de montar.",
        },
      ],
      pairs: [
        { prompt: "Saudação", match: "Olá, Ana," },
        { prompt: "Mensagem", match: "Volto às 16h." },
        { prompt: "Assinatura", match: "Beijos, Luiza" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-revisao",
      title: "Revisão Necessária",
      prompt: "Combine problemas de escrita com as revisões sugeridas.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP10",
      habilidades: ["EF01LP10"],
      category: "Revisão",
      duration: 11,
      focus: "revisão de bilhetes",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "revendo-o-texto",
          description: "Refletir sobre ajustes comuns em bilhetes.",
        },
      ],
      pairs: [
        { prompt: "Sem pontuação", match: "Adicionar vírgula e ponto final" },
        { prompt: "Falta assinatura", match: "Escrever quem enviou" },
        { prompt: "Pedido confuso", match: "Explicar o horário" },
      ],
    }),
    makePuzzle({
      slug: "puzzle-melhorias",
      title: "Melhorias no Recado",
      prompt: "Associe situações de revisão às soluções adequadas.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP10",
      habilidades: ["EF01LP10"],
      category: "Aprimoramento",
      duration: 11,
      focus: "clareza e cortesia",
      assetSlug: "lp-silaba-la",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "checar-claridade",
          description: "Reforçar como deixar a mensagem clara e gentil.",
        },
      ],
      pairs: [
        { prompt: "Mensagem longa demais", match: "Resumir e ir direto ao ponto" },
        { prompt: "Letra difícil de ler", match: "Reescrever com calma" },
        { prompt: "Falta agradecimento", match: "Adicionar 'obrigado' ou 'por favor'" },
      ],
    }),
  ],
  games: [
    makeGame({
      slug: "planejar-bilhete",
      title: "Planejar Bilhete",
      prompt: "Escolha elementos para planejar um bilhete completo.",
      difficulty: "INICIAR",
      bnccCode: "EF01LP09",
      habilidades: ["EF01LP09"],
      category: "Planejamento",
      duration: 12,
      focus: "planejamento de bilhetes",
      assetSlug: "lp-material-caderno",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-ordem-bilhete",
          description: "Relembrar a estrutura do bilhete antes de jogar.",
        },
      ],
      victoryMessage: "Bilhete planejado! Todos os elementos estão no lugar.",
      gameOverMessage: "Revise os elementos essenciais e tente novamente.",
      levels: [
        {
          challenge:
            "Escolha a saudação ideal para um bilhete à professora. (Querida professora, Oi amigo, Caro vizinho)",
          answer: "Querida professora",
        },
        {
          challenge:
            "Escolha o melhor motivo para avisar sobre a tarefa. (Lembrar da pesquisa, Contar uma piada, Mostrar um desenho)",
          answer: "Lembrar da pesquisa",
        },
        {
          challenge:
            "Selecione como assinar o bilhete enviado pela turma. (Turma do 1º ano, Seu fã secreto, Tio Marcos)",
          answer: "Turma do 1º ano",
        },
      ],
    }),
    makeGame({
      slug: "revisao-rapida",
      title: "Revisão Rápida",
      prompt: "Escolha as melhores correções para bilhetes curtos.",
      difficulty: "PRATICAR",
      bnccCode: "EF01LP10",
      habilidades: ["EF01LP10"],
      category: "Revisão",
      duration: 12,
      focus: "revisão de bilhetes",
      assetSlug: "lp-silaba-ba",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "puzzle-revisao",
          description: "Retomar problemas comuns antes de revisar rapidamente.",
        },
      ],
      victoryMessage: "Correções feitas! Os bilhetes estão prontos para envio.",
      gameOverMessage: "Lembre dos critérios de revisão e tente novamente.",
      levels: [
        {
          challenge:
            "Bilhete: 'Pai, vou chegar tarde' Qual ajuste deixa mais claro? (incluir horário, trocar destinatário, apagar mensagem)",
          answer: "incluir horário",
        },
        {
          challenge:
            "Bilhete: 'Amiga, trouxe o livro' Como revisar? (colocar ponto final, remover saudação, trocar livro por caderno)",
          answer: "colocar ponto final",
        },
        {
          challenge:
            "Bilhete: 'Equipe, reunião sala 2.' Como melhorar? (acrescentar horário, tirar destinatário, usar letra cursiva)",
          answer: "acrescentar horário",
        },
      ],
    }),
    makeGame({
      slug: "roteiro-do-recado",
      title: "Roteiro do Recado",
      prompt: "Digite palavras-chave que deixam o bilhete completo.",
      difficulty: "DOMINAR",
      bnccCode: "EF01LP10",
      habilidades: ["EF01LP10"],
      category: "Clareza e cortesia",
      duration: 13,
      focus: "clareza e cortesia",
      assetSlug: "lp-letra-e",
      prerequisites: [
        {
          type: "ACTIVITY",
          reference: "checar-claridade",
          description: "Refletir sobre detalhes que completam o recado.",
        },
      ],
      victoryMessage: "Recado completo! Suas palavras tornaram a mensagem gentil e clara.",
      gameOverMessage: "Revise o roteiro do bilhete com a turma e tente novamente.",
      levels: [
        { challenge: "Digite uma palavra que indique cortesia no bilhete.", answer: "por favor" },
        { challenge: "Digite a palavra que mostra quem escreveu o bilhete.", answer: "assinatura" },
        { challenge: "Digite a palavra que informa a hora do recado.", answer: "horário" },
      ],
    }),
  ],
};

const modules: ModuleInput[] = [module1, module2, module3, module4, module5];

ensureOutputDir();
modules.forEach(writeModuleFile);
