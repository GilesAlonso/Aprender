import type { GameDefinition } from "./types";

type GameLevelAttempt = {
  levelId: string;
  answer: string | number;
  timeSpentSeconds?: number;
};

export type GameSubmission = GameLevelAttempt[];

export type GameLevelResult = {
  levelId: string;
  challenge: string;
  expected: string | number;
  answer: string | number | null;
  correct: boolean;
  successFeedback?: string;
  failureFeedback?: string;
};

export type GameEvaluationStatus = "victory" | "game-over" | "incomplete";

export type GameEvaluation = {
  score: number;
  livesRemaining: number;
  totalLevels: number;
  correctLevels: number;
  totalTimeSpentSeconds: number;
  status: GameEvaluationStatus;
  levelResults: GameLevelResult[];
  summaryFeedback?: string;
  timedOut: boolean;
};

type SubmissionLookup = Map<string, GameLevelAttempt>;

const buildSubmissionLookup = (submission: GameSubmission): SubmissionLookup => {
  const lookup: SubmissionLookup = new Map();
  for (const attempt of submission) {
    lookup.set(attempt.levelId, attempt);
  }
  return lookup;
};

const normalizeAnswer = (answer: string | number | null | undefined): string => {
  if (answer === null || answer === undefined) {
    return "";
  }
  return String(answer).trim().toLowerCase();
};

export const evaluateGameSubmission = (
  definition: GameDefinition,
  submission: GameSubmission
): GameEvaluation => {
  const lookup = buildSubmissionLookup(submission);
  const levelResults: GameLevelResult[] = [];

  let livesRemaining = definition.lives ?? 3;
  let correctLevels = 0;
  let totalTimeSpentSeconds = 0;

  for (const level of definition.levels) {
    const attempt = lookup.get(level.id);
    const expectedNormalized = normalizeAnswer(level.answer);
    const answerNormalized = normalizeAnswer(attempt?.answer);
    const correct = expectedNormalized.length > 0 && expectedNormalized === answerNormalized;

    if (!correct) {
      livesRemaining = Math.max(0, livesRemaining - 1);
    } else {
      correctLevels += 1;
    }

    if (attempt?.timeSpentSeconds) {
      totalTimeSpentSeconds += attempt.timeSpentSeconds;
    }

    levelResults.push({
      levelId: level.id,
      challenge: level.challenge,
      expected: level.answer,
      answer: attempt?.answer ?? null,
      correct,
      successFeedback: level.successFeedback,
      failureFeedback: level.failureFeedback,
    });

    if (livesRemaining === 0) {
      break;
    }
  }

  const totalLevels = definition.levels.length;
  const score = totalLevels === 0 ? 0 : Math.round((correctLevels / totalLevels) * 100);

  const timedOut = Boolean(
    definition.timeLimitSeconds && totalTimeSpentSeconds > definition.timeLimitSeconds
  );

  let status: GameEvaluationStatus = "incomplete";
  if (livesRemaining === 0 || timedOut) {
    status = "game-over";
  } else if (correctLevels === totalLevels) {
    status = "victory";
  }

  let summaryFeedback: string | undefined;
  if (status === "victory") {
    summaryFeedback = definition.victoryMessage;
  } else if (status === "game-over") {
    summaryFeedback = definition.gameOverMessage;
  }

  return {
    score,
    livesRemaining,
    totalLevels,
    correctLevels,
    totalTimeSpentSeconds,
    status,
    levelResults,
    summaryFeedback,
    timedOut,
  };
};
