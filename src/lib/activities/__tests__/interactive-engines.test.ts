import { describe, expect, it } from "vitest";

import {
  evaluateGameSubmission,
  evaluatePuzzleSubmission,
  evaluateQuizSubmission,
  getInteractiveActivityBySlug,
  loadInteractiveDataset,
} from "@/lib/activities";

const getQuizActivity = () => {
  const activity = getInteractiveActivityBySlug("quiz-detectives-das-palavras");
  if (!activity || activity.type !== "QUIZ") {
    throw new Error("Atividade de quiz não encontrada no catálogo");
  }
  return activity;
};

const getPuzzleActivity = () => {
  const activity = getInteractiveActivityBySlug("puzzle-danca-dos-sons");
  if (!activity || activity.type !== "PUZZLE") {
    throw new Error("Atividade de puzzle não encontrada no catálogo");
  }
  return activity;
};

const getGameActivity = () => {
  const activity = getInteractiveActivityBySlug("game-missao-equipes-multiplicadoras");
  if (!activity || activity.type !== "GAME") {
    throw new Error("Atividade de jogo não encontrada no catálogo");
  }
  return activity;
};

describe("Catálogo de atividades interativas", () => {
  it("carrega o dataset completo com as três categorias", () => {
    const dataset = loadInteractiveDataset();

    expect(() => new Date(dataset.updatedAt)).not.toThrow();
    expect(dataset.activities.length).toBeGreaterThanOrEqual(3);

    const types = new Set(dataset.activities.map((activity) => activity.type));
    expect(types.has("QUIZ")).toBe(true);
    expect(types.has("PUZZLE")).toBe(true);
    expect(types.has("GAME")).toBe(true);
  });
});

describe("Motor de quiz", () => {
  it("calcula pontuação perfeita e sugere aumento de dificuldade", () => {
    const quizActivity = getQuizActivity();
    const evaluation = evaluateQuizSubmission(quizActivity.quiz, [
      { questionId: "det-q1", type: "multiple-choice", optionId: "det-q1-a" },
      { questionId: "det-q2", type: "true-false", answer: true },
      {
        questionId: "det-q3",
        type: "ordering",
        order: ["bor", "bo", "le", "ta"],
      },
    ]);

    expect(evaluation.totalCorrect).toBe(3);
    expect(evaluation.score).toBe(100);
    expect(evaluation.completed).toBe(true);
    expect(evaluation.suggestion).toBe("increase");
  });

  it("identifica respostas incorretas e sugere revisão", () => {
    const quizActivity = getQuizActivity();
    const evaluation = evaluateQuizSubmission(quizActivity.quiz, [
      { questionId: "det-q1", type: "multiple-choice", optionId: "det-q1-b" },
      { questionId: "det-q2", type: "true-false", answer: false },
    ]);

    expect(evaluation.totalCorrect).toBe(0);
    expect(evaluation.score).toBe(0);
    expect(evaluation.completed).toBe(false);
    expect(evaluation.suggestion).toBe("decrease");
    expect(evaluation.results[0]?.feedback).toMatch(/Quase/);
  });
});

describe("Motor de puzzle", () => {
  it("reconhece combinações corretas e retorna feedback de sucesso", () => {
    const puzzleActivity = getPuzzleActivity();
    const evaluation = evaluatePuzzleSubmission(puzzleActivity.puzzle, [
      { pairId: "ritmo-lento", answer: "Balance o corpo como se ninasse um bebê." },
      { pairId: "ritmo-rapido", answer: "Pule em pequenos passos como pipoca estourando." },
      { pairId: "ritmo-eco", answer: "Forme duplas e alterne quem lidera a batida." },
    ]);

    expect(evaluation.allCorrect).toBe(true);
    expect(evaluation.summaryFeedback).toMatch(/Brilhante/);
  });

  it("orienta novas tentativas quando existem erros", () => {
    const puzzleActivity = getPuzzleActivity();
    const evaluation = evaluatePuzzleSubmission(puzzleActivity.puzzle, [
      { pairId: "ritmo-lento", answer: "Pule em pequenos passos como pipoca estourando." },
    ]);

    expect(evaluation.allCorrect).toBe(false);
    expect(evaluation.completed).toBe(false);
    expect(evaluation.summaryFeedback).toBeUndefined();
    const firstPair = evaluation.pairResults[0];
    expect(firstPair?.feedback).toBeDefined();
  });
});

describe("Motor de jogo", () => {
  it("mantém vidas e status de vitória ao acertar todos os desafios", () => {
    const gameActivity = getGameActivity();
    const evaluation = evaluateGameSubmission(gameActivity.game, [
      { levelId: "nivel-1", answer: 8 },
      { levelId: "nivel-2", answer: 30 },
      { levelId: "nivel-3", answer: 6 },
    ]);

    expect(evaluation.status).toBe("victory");
    expect(evaluation.score).toBe(100);
    expect(evaluation.livesRemaining).toBe(gameActivity.game.lives ?? 3);
    expect(evaluation.summaryFeedback).toMatch(/Missão cumprida/);
  });

  it("reduz vidas e classifica como game-over ao errar repetidamente", () => {
    const gameActivity = getGameActivity();
    const evaluation = evaluateGameSubmission(gameActivity.game, [
      { levelId: "nivel-1", answer: 5 },
      { levelId: "nivel-2", answer: 10 },
      { levelId: "nivel-3", answer: 2 },
    ]);

    expect(evaluation.status).toBe("game-over");
    expect(evaluation.livesRemaining).toBe(0);
    expect(evaluation.summaryFeedback).toMatch(/retomada/);
  });
});
