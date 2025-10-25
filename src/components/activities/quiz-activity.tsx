"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
} from "@/components/ui";
import type {
  InteractiveActivity,
  QuizAnswer,
  QuizEvaluation,
  QuizQuestion,
} from "@/lib/activities";
import { evaluateQuizSubmission } from "@/lib/activities";
import { dispatchAnalyticsEvent } from "@/lib/analytics";

interface QuizActivityPlayerProps {
  activity: Extract<InteractiveActivity, { type: "QUIZ" }>;
  onComplete?: (evaluation: QuizEvaluation) => void;
}

type FeedbackState = {
  correct: boolean;
  message?: string;
};

type HintVisibility = Record<string, boolean>;

type AnswerState = Record<string, QuizAnswer>;

type FeedbackMap = Record<string, FeedbackState>;

const QUESTION_TYPES_LABEL: Record<QuizQuestion["type"], string> = {
  "multiple-choice": "Múltipla escolha",
  "true-false": "Verdadeiro ou falso",
  ordering: "Sequência",
};

const getDefaultFeedback = (question: QuizQuestion, correct: boolean): string => {
  switch (question.type) {
    case "multiple-choice":
      return correct
        ? "Resposta correta!"
        : "Releia as opções e busque o som inicial correspondente.";
    case "true-false":
      return correct ? "Perfeito!" : "Converse com a turma e tente novamente.";
    case "ordering":
      return correct ? "Sequência organizada com sucesso!" : "Revise a ordem das sílabas.";
    default:
      return correct ? "Muito bem!" : "Vamos revisar juntos.";
  }
};

const MultipleChoiceQuestion = ({
  question,
  selectedOptionId,
  onSelect,
  disabled,
}: {
  question: Extract<QuizQuestion, { type: "multiple-choice" }>;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  disabled: boolean;
}) => (
  <div className="flex flex-col gap-3">
    {question.options.map((option) => {
      const isSelected = option.id === selectedOptionId;
      return (
        <Button
          key={option.id}
          variant={isSelected ? "primary" : "secondary"}
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className={clsx("justify-start", !isSelected && "border-neutral-200")}
        >
          {option.text}
        </Button>
      );
    })}
  </div>
);

const TrueFalseQuestion = ({
  question,
  selected,
  onSelect,
  disabled,
}: {
  question: Extract<QuizQuestion, { type: "true-false" }>;
  selected?: boolean;
  onSelect: (value: boolean) => void;
  disabled: boolean;
}) => (
  <div className="flex flex-wrap gap-3">
    <Button
      variant={selected === true ? "primary" : "secondary"}
      onClick={() => onSelect(true)}
      disabled={disabled}
    >
      Verdadeiro
    </Button>
    <Button
      variant={selected === false ? "primary" : "secondary"}
      onClick={() => onSelect(false)}
      disabled={disabled}
    >
      Falso
    </Button>
  </div>
);

const OrderingQuestion = ({
  question,
  order,
  onChange,
  onConfirm,
  disabled,
}: {
  question: Extract<QuizQuestion, { type: "ordering" }>;
  order: string[];
  onChange: (nextOrder: string[]) => void;
  onConfirm: () => void;
  disabled: boolean;
}) => {
  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= order.length) return;

    const updated = [...order];
    const [moved] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, moved);
    onChange(updated);
  };

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-3">
        {order.map((itemId, index) => {
          const item = question.items.find((entry) => entry.id === itemId);
          return (
            <li key={itemId} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <span className="text-body-md font-medium text-neutral-800">{item?.text}</span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => moveItem(index, -1)}
                  disabled={disabled || index === 0}
                  aria-label={`Mover ${item?.text ?? "item"} para cima`}
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => moveItem(index, 1)}
                  disabled={disabled || index === order.length - 1}
                  aria-label={`Mover ${item?.text ?? "item"} para baixo`}
                >
                  ↓
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor={`ordering-select-${question.id}`}>
          Selecionar ordem alternativa
        </label>
        <select
          id={`ordering-select-${question.id}`}
          className="rounded-2xl border border-neutral-200 px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-400 focus:outline-none"
          value=""
          onChange={(event) => {
            const selectedId = event.target.value;
            if (!selectedId) return;
            const withoutItem = order.filter((itemId) => itemId !== selectedId);
            onChange([...withoutItem, selectedId]);
          }}
          disabled={disabled}
        >
          <option value="">Mover item para o final…</option>
          {question.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.text}
            </option>
          ))}
        </select>
        <Button variant="primary" onClick={onConfirm} disabled={disabled}>
          Verificar sequência
        </Button>
      </div>
    </div>
  );
};

export const QuizActivityPlayer = ({ activity, onComplete }: QuizActivityPlayerProps) => {
  const { quiz } = activity;
  const questions = quiz.questions;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [feedbackMap, setFeedbackMap] = useState<FeedbackMap>({});
  const [hintVisibility, setHintVisibility] = useState<HintVisibility>({});
  const [orderingState, setOrderingState] = useState<Record<string, string[]>>(() => {
    const initialState: Record<string, string[]> = {};
    for (const question of questions) {
      if (question.type === "ordering") {
        initialState[question.id] = question.items.map((item) => item.id);
      }
    }
    return initialState;
  });
  const [evaluation, setEvaluation] = useState<QuizEvaluation | null>(null);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = questions.length;
  const progressValue = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

  const currentQuestion = questions[currentIndex];
  const questionFeedback = currentQuestion ? feedbackMap[currentQuestion.id] : undefined;
  const questionAnswered = currentQuestion ? Boolean(answers[currentQuestion.id]) : false;

  const handleAnswer = (question: QuizQuestion, answer: QuizAnswer, feedback?: string, correct?: boolean) => {
    setAnswers((prev) => ({ ...prev, [question.id]: answer }));

    const feedbackMessage = feedback ?? getDefaultFeedback(question, Boolean(correct));

    setFeedbackMap((prev) => ({
      ...prev,
      [question.id]: {
        correct: Boolean(correct),
        message: feedbackMessage,
      },
    }));

    dispatchAnalyticsEvent({
      type: "activity_interaction",
      activitySlug: activity.slug,
      activityType: activity.type,
      detail: {
        id: question.id,
        correct,
        hintUsed: answer.usedHint,
        position: questions.findIndex((item) => item.id === question.id),
      },
    });
  };

  const handleHint = (questionId: string) => {
    setHintVisibility((prev) => ({ ...prev, [questionId]: true }));
  };

  const goToQuestion = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= questions.length) return;
    setCurrentIndex(nextIndex);
  };

  const resetActivity = () => {
    setAnswers({});
    setFeedbackMap({});
    setHintVisibility({});
    setOrderingState(() => {
      const initialState: Record<string, string[]> = {};
      for (const question of questions) {
        if (question.type === "ordering") {
          initialState[question.id] = question.items.map((item) => item.id);
        }
      }
      return initialState;
    });
    setCurrentIndex(0);
    setEvaluation(null);
  };

  const finalizeActivity = () => {
    const submission = Object.values(answers);
    const result = evaluateQuizSubmission(quiz, submission);
    setEvaluation(result);

    dispatchAnalyticsEvent({
      type: "activity_completed",
      activitySlug: activity.slug,
      activityType: activity.type,
      score: result.score,
      completion: result.score,
      metadata: {
        activitySlug: activity.activitySlug,
        contentModuleSlug: activity.contentModuleSlug,
        totalCorrect: result.totalCorrect,
        totalQuestions: result.totalQuestions,
        suggestion: result.suggestion,
      },
    });

    onComplete?.(result);
  };

  if (evaluation) {
    return (
      <Card tone="calm">
        <CardHeader>
          <CardTitle>Resultado do quiz</CardTitle>
          <CardDescription>
            Você concluiu {evaluation.totalQuestions} questões com {evaluation.totalCorrect} acertos.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <ProgressBar value={evaluation.score} label={`Pontuação geral: ${evaluation.score}%`} />
          <div className="space-y-2">
            {evaluation.results.map((result) => (
              <div key={result.questionId} className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-body-sm font-medium text-neutral-700">
                  Questão {questions.findIndex((item) => item.id === result.questionId) + 1}
                </p>
                <p className="text-body-sm text-neutral-600">
                  {result.correct ? "Resposta correta" : "Reveja esta questão"}
                </p>
                {result.feedback ? (
                  <p className="mt-2 text-body-sm text-primary-700">{result.feedback}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={resetActivity}>
              Refazer atividade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  const questionTypeLabel = QUESTION_TYPES_LABEL[currentQuestion.type];
  const hintVisible = hintVisibility[currentQuestion.id];
  const orderingValue = orderingState[currentQuestion.id];
  const hasAllAnswers = Object.keys(answers).length === questions.length;

  return (
    <Card tone="neutral" className="gap-6">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">Questão {currentIndex + 1} de {totalQuestions}</Badge>
          <Badge variant="accent">{questionTypeLabel}</Badge>
        </div>
        <CardTitle className="text-display-xs text-neutral-900">{currentQuestion.prompt}</CardTitle>
        {currentQuestion.type === "true-false" ? (
          <CardDescription>{currentQuestion.statement}</CardDescription>
        ) : null}
        <ProgressBar value={progressValue} label={`Progresso do quiz: ${progressValue}%`} />
      </CardHeader>

      <CardContent className="gap-5">
        {currentQuestion.type === "multiple-choice" ? (
          <MultipleChoiceQuestion
            question={currentQuestion}
            selectedOptionId={answers[currentQuestion.id]?.type === "multiple-choice"
              ? answers[currentQuestion.id]?.optionId
              : undefined}
            onSelect={(optionId) => {
              const option = currentQuestion.options.find((item) => item.id === optionId);
              const correct = option?.isCorrect ?? false;
              const answer: QuizAnswer = {
                questionId: currentQuestion.id,
                type: "multiple-choice",
                optionId,
                usedHint: hintVisible,
              };
              handleAnswer(currentQuestion, answer, option?.feedback, correct);
            }}
            disabled={Boolean(evaluation)}
          />
        ) : null}

        {currentQuestion.type === "true-false" ? (
          <TrueFalseQuestion
            question={currentQuestion}
            selected={answers[currentQuestion.id]?.type === "true-false"
              ? answers[currentQuestion.id]?.answer
              : undefined}
            onSelect={(value) => {
              const correct = currentQuestion.answer === value;
              const feedback = correct
                ? currentQuestion.feedback.true
                : currentQuestion.feedback.false;
              const answer: QuizAnswer = {
                questionId: currentQuestion.id,
                type: "true-false",
                answer: value,
                usedHint: hintVisible,
              };
              handleAnswer(currentQuestion, answer, feedback, correct);
            }}
            disabled={Boolean(evaluation)}
          />
        ) : null}

        {currentQuestion.type === "ordering" && orderingValue ? (
          <OrderingQuestion
            question={currentQuestion}
            order={orderingValue}
            onChange={(nextOrder) =>
              setOrderingState((prev) => ({ ...prev, [currentQuestion.id]: nextOrder }))
            }
            onConfirm={() => {
              const answerOrder = orderingState[currentQuestion.id];
              const correct = currentQuestion.correctOrder.every(
                (item, index) => item === answerOrder[index]
              );
              const answer: QuizAnswer = {
                questionId: currentQuestion.id,
                type: "ordering",
                order: answerOrder,
                usedHint: hintVisible,
              };
              const feedback = correct
                ? currentQuestion.successFeedback
                : currentQuestion.failureFeedback;
              handleAnswer(currentQuestion, answer, feedback, correct);
            }}
            disabled={Boolean(evaluation)}
          />
        ) : null}

        {currentQuestion.hint ? (
          <Button
            variant="ghost"
            onClick={() => handleHint(currentQuestion.id)}
            disabled={hintVisible}
            className="self-start text-primary-700"
          >
            {hintVisible ? "Dica exibida" : "Ver dica"}
          </Button>
        ) : null}
        {hintVisible && currentQuestion.hint ? (
          <div className="rounded-2xl bg-primary-50 px-4 py-3 text-body-sm text-primary-700 shadow-inner">
            {currentQuestion.hint}
          </div>
        ) : null}

        {questionFeedback ? (
          <div
            className={clsx(
              "rounded-2xl px-4 py-3 text-body-sm",
              questionFeedback.correct
                ? "bg-secondary-50 text-secondary-700"
                : "bg-accent-50 text-accent-700"
            )}
          >
            {questionFeedback.message}
          </div>
        ) : null}
      </CardContent>

      <CardContent className="border-t border-neutral-100 pt-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => goToQuestion(currentIndex - 1)} disabled={currentIndex === 0}>
            Pergunta anterior
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => goToQuestion(currentIndex + 1)}
              disabled={!questionAnswered}
            >
              Próxima pergunta
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={finalizeActivity}
              disabled={!hasAllAnswers}
            >
              Ver resultado
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
