import type { PuzzleDefinition } from "./types";

type PuzzleMatchAnswer = {
  pairId: string;
  answer: string;
};

export type PuzzleSubmission = PuzzleMatchAnswer[];

export type PuzzlePairResult = {
  pairId: string;
  prompt: string;
  expected: string;
  answer: string | null;
  correct: boolean;
  feedback?: string;
};

export type PuzzleEvaluation = {
  totalPairs: number;
  totalCorrect: number;
  completed: boolean;
  allCorrect: boolean;
  pairResults: PuzzlePairResult[];
  summaryFeedback?: string;
};

type SubmissionLookup = Map<string, PuzzleMatchAnswer>;

const buildSubmissionLookup = (submission: PuzzleSubmission): SubmissionLookup => {
  const lookup: SubmissionLookup = new Map();
  for (const answer of submission) {
    lookup.set(answer.pairId, answer);
  }
  return lookup;
};

export const evaluatePuzzleSubmission = (
  definition: PuzzleDefinition,
  submission: PuzzleSubmission
): PuzzleEvaluation => {
  const lookup = buildSubmissionLookup(submission);
  const pairResults: PuzzlePairResult[] = [];

  let totalCorrect = 0;

  for (const pair of definition.pairs) {
    const answer = lookup.get(pair.id);
    const normalizedExpected = pair.match.trim().toLowerCase();
    const normalizedAnswer = answer?.answer.trim().toLowerCase() ?? null;
    const correct = normalizedAnswer === normalizedExpected;

    if (correct) {
      totalCorrect += 1;
    }

    pairResults.push({
      pairId: pair.id,
      prompt: pair.prompt,
      expected: pair.match,
      answer: answer?.answer ?? null,
      correct,
      feedback: correct ? pair.feedback : pair.hint ?? pair.feedback,
    });
  }

  const totalPairs = definition.pairs.length;
  const completed = pairResults.every((result) => result.answer !== null);
  const allCorrect = totalCorrect === totalPairs && totalPairs > 0;

  let summaryFeedback: string | undefined;
  if (allCorrect) {
    summaryFeedback = definition.successFeedback;
  } else if (completed) {
    summaryFeedback = definition.errorFeedback;
  }

  return {
    totalPairs,
    totalCorrect,
    completed,
    allCorrect,
    pairResults,
    summaryFeedback,
  };
};
