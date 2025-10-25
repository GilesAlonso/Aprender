import type { QuizDefinition, QuizQuestion } from "./types";

type BaseAnswer = {
  questionId: string;
  usedHint?: boolean;
};

type MultipleChoiceAnswer = BaseAnswer & {
  type: "multiple-choice";
  optionId: string;
};

type TrueFalseAnswer = BaseAnswer & {
  type: "true-false";
  answer: boolean;
};

type OrderingAnswer = BaseAnswer & {
  type: "ordering";
  order: string[];
};

export type QuizAnswer = MultipleChoiceAnswer | TrueFalseAnswer | OrderingAnswer;
export type QuizSubmission = QuizAnswer[];

export type QuizQuestionResult = {
  questionId: string;
  type: QuizQuestion["type"];
  correct: boolean;
  feedback?: string;
  hintUsed: boolean;
  userAnswer: string | string[] | boolean | null;
};

export type QuizEvaluation = {
  score: number;
  pointsEarned: number;
  maxPoints: number;
  totalQuestions: number;
  totalCorrect: number;
  completed: boolean;
  results: QuizQuestionResult[];
  suggestion: "increase" | "maintain" | "decrease";
};

type SubmissionLookup = Map<string, QuizAnswer>;

const buildSubmissionLookup = (submission: QuizSubmission): SubmissionLookup => {
  const lookup: SubmissionLookup = new Map();
  for (const answer of submission) {
    lookup.set(answer.questionId, answer);
  }
  return lookup;
};

const isOrderingCorrect = (question: Extract<QuizQuestion, { type: "ordering" }>, order: string[]) => {
  if (question.correctOrder.length !== order.length) {
    return false;
  }

  return question.correctOrder.every((item, index) => item === order[index]);
};

const evaluateQuestion = (
  question: QuizQuestion,
  answer: QuizAnswer | undefined
): QuizQuestionResult => {
  const hintUsed = Boolean(answer?.usedHint);

  if (!answer) {
    return {
      questionId: question.id,
      type: question.type,
      correct: false,
      feedback: undefined,
      hintUsed,
      userAnswer: null,
    };
  }

  switch (question.type) {
    case "multiple-choice": {
      if (answer.type !== "multiple-choice") {
        return {
          questionId: question.id,
          type: question.type,
          correct: false,
          feedback: undefined,
          hintUsed,
          userAnswer: null,
        };
      }

      const selectedOption = question.options.find((option) => option.id === answer.optionId);
      return {
        questionId: question.id,
        type: question.type,
        correct: selectedOption?.isCorrect ?? false,
        feedback: selectedOption?.feedback,
        hintUsed,
        userAnswer: answer.optionId,
      };
    }
    case "true-false": {
      if (answer.type !== "true-false") {
        return {
          questionId: question.id,
          type: question.type,
          correct: false,
          feedback: question.feedback.false,
          hintUsed,
          userAnswer: null,
        };
      }

      const correct = question.answer === answer.answer;
      const feedback = correct ? question.feedback.true : question.feedback.false;
      return {
        questionId: question.id,
        type: question.type,
        correct,
        feedback,
        hintUsed,
        userAnswer: answer.answer,
      };
    }
    case "ordering": {
      if (answer.type !== "ordering") {
        return {
          questionId: question.id,
          type: question.type,
          correct: false,
          feedback: question.failureFeedback,
          hintUsed,
          userAnswer: null,
        };
      }

      const correct = isOrderingCorrect(question, answer.order);
      const feedback = correct ? question.successFeedback : question.failureFeedback;
      return {
        questionId: question.id,
        type: question.type,
        correct,
        feedback,
        hintUsed,
        userAnswer: answer.order,
      };
    }
    default: {
      const exhaustiveCheck: never = question;
      throw new Error(`Tipo de questão não suportado: ${exhaustiveCheck}`);
    }
  }
};

const DEFAULT_CORRECT_POINTS = 10;
const DEFAULT_INCORRECT_POINTS = 0;

export const evaluateQuizSubmission = (
  quiz: QuizDefinition,
  submission: QuizSubmission
): QuizEvaluation => {
  const lookup = buildSubmissionLookup(submission);
  const results: QuizQuestionResult[] = [];

  const correctPoints = quiz.scoring?.correct ?? DEFAULT_CORRECT_POINTS;
  const incorrectPoints = quiz.scoring?.incorrect ?? DEFAULT_INCORRECT_POINTS;

  let pointsEarned = 0;
  let totalCorrect = 0;

  for (const question of quiz.questions) {
    const answer = lookup.get(question.id);
    const questionResult = evaluateQuestion(question, answer);
    results.push(questionResult);

    if (questionResult.correct) {
      totalCorrect += 1;
      pointsEarned += correctPoints;
    } else {
      pointsEarned += incorrectPoints;
    }
  }

  const totalQuestions = quiz.questions.length;
  const maxPoints = totalQuestions * correctPoints;

  let score: number;
  if (maxPoints > 0) {
    score = Math.round((pointsEarned / maxPoints) * 100);
  } else if (totalQuestions > 0) {
    score = Math.round((totalCorrect / totalQuestions) * 100);
  } else {
    score = 0;
  }

  const completed = results.every((result) => result.userAnswer !== null);

  let suggestion: QuizEvaluation["suggestion"] = "maintain";
  if (quiz.adaptive) {
    const { increaseAfter = 2, decreaseAfter = 1 } = quiz.adaptive;
    if (totalCorrect >= Math.min(increaseAfter, totalQuestions)) {
      suggestion = "increase";
    } else if (totalQuestions - totalCorrect >= Math.min(decreaseAfter, totalQuestions)) {
      suggestion = "decrease";
    }
  } else {
    if (totalCorrect === totalQuestions && totalQuestions > 0) {
      suggestion = "increase";
    } else if (totalCorrect === 0) {
      suggestion = "decrease";
    }
  }

  return {
    score,
    pointsEarned,
    maxPoints,
    totalQuestions,
    totalCorrect,
    completed,
    results,
    suggestion,
  };
};
