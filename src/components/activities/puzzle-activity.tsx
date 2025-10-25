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
} from "@/components/ui";
import type { InteractiveActivity, PuzzleEvaluation } from "@/lib/activities";
import { evaluatePuzzleSubmission } from "@/lib/activities";
import { dispatchAnalyticsEvent } from "@/lib/analytics";

interface PuzzleActivityPlayerProps {
  activity: Extract<InteractiveActivity, { type: "PUZZLE" }>;
  onComplete?: (evaluation: PuzzleEvaluation) => void;
}

type AssignmentState = Record<string, string | null>;

const buildInitialAssignments = (activity: Extract<InteractiveActivity, { type: "PUZZLE" }>): AssignmentState => {
  const state: AssignmentState = {};
  for (const pair of activity.puzzle.pairs) {
    state[pair.id] = null;
  }
  return state;
};

export const PuzzleActivityPlayer = ({ activity, onComplete }: PuzzleActivityPlayerProps) => {
  const { puzzle } = activity;
  const [assignments, setAssignments] = useState<AssignmentState>(() => buildInitialAssignments(activity));
  const [dragging, setDragging] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<PuzzleEvaluation | null>(null);

  const usedMatches = useMemo(() => {
    const result = new Set<string>();
    Object.values(assignments).forEach((value) => {
      if (value) {
        result.add(value);
      }
    });
    return result;
  }, [assignments]);

  const allPairsAnswered = useMemo(
    () => puzzle.pairs.every((pair) => Boolean(assignments[pair.id])),
    [assignments, puzzle.pairs]
  );

  const assignMatch = (pairId: string, match: string | null) => {
    setAssignments((prev) => {
      const next: AssignmentState = { ...prev };

      if (match) {
        for (const key of Object.keys(next)) {
          if (key !== pairId && next[key] === match) {
            next[key] = null;
          }
        }
      }

      next[pairId] = match;
      return next;
    });

    if (match) {
      dispatchAnalyticsEvent({
        type: "activity_interaction",
        activitySlug: activity.slug,
        activityType: activity.type,
        detail: {
          id: pairId,
          correct: undefined,
        },
      });
    }
  };

  const availableMatches = useMemo(() => puzzle.pairs.map((pair) => pair.match), [puzzle.pairs]);

  const handleValidate = () => {
    const submission = puzzle.pairs
      .filter((pair) => assignments[pair.id])
      .map((pair) => ({ pairId: pair.id, answer: assignments[pair.id] as string }));

    const result = evaluatePuzzleSubmission(puzzle, submission);
    setEvaluation(result);

    for (const pairResult of result.pairResults) {
      dispatchAnalyticsEvent({
        type: "activity_interaction",
        activitySlug: activity.slug,
        activityType: activity.type,
        detail: {
          id: pairResult.pairId,
          correct: pairResult.correct,
        },
      });
    }

    if (result.completed) {
      const score = result.totalPairs === 0 ? 0 : Math.round((result.totalCorrect / result.totalPairs) * 100);
      dispatchAnalyticsEvent({
        type: "activity_completed",
        activitySlug: activity.slug,
        activityType: activity.type,
        score,
        completion: score,
        metadata: {
          activitySlug: activity.activitySlug,
          contentModuleSlug: activity.contentModuleSlug,
          totalCorrect: result.totalCorrect,
          totalPairs: result.totalPairs,
        },
      });

      onComplete?.(result);
    }
  };

  const reset = () => {
    setAssignments(buildInitialAssignments(activity));
    setEvaluation(null);
    setDragging(null);
  };

  return (
    <Card tone="neutral" className="gap-6">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">Quebra-cabeça colaborativo</Badge>
          <Badge variant="accent">{puzzle.pairs.length} combinações</Badge>
        </div>
        <CardTitle className="text-display-xs text-neutral-900">
          Combine sons e movimentos para completar a experiência.
        </CardTitle>
        <CardDescription>
          Arraste cada sugestão de movimento para o ritmo correspondente ou utilize o seletor acessível.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-4">
          {puzzle.pairs.map((pair) => {
            const assignedValue = assignments[pair.id];
            const options = availableMatches.filter(
              (match) => !usedMatches.has(match) || match === assignedValue
            );

            return (
              <div
                key={pair.id}
                className={clsx(
                  "rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm transition ease-friendly",
                  dragging && !assignedValue && "border-primary-300 bg-primary-50/80"
                )}
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  const data = event.dataTransfer.getData("text/plain");
                  if (data) {
                    assignMatch(pair.id, data);
                    setDragging(null);
                  }
                }}
              >
                <p className="text-body-sm font-semibold text-neutral-700">{pair.prompt}</p>
                <p className="text-body-sm text-neutral-600">{pair.hint ?? "Escolha um movimento que combine."}</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl bg-neutral-100 px-3 py-2 text-body-sm text-neutral-700">
                    {assignedValue ?? "Arraste um movimento até aqui"}
                  </span>
                  {assignedValue ? (
                    <Button variant="ghost" onClick={() => assignMatch(pair.id, null)}>
                      Limpar combinação
                    </Button>
                  ) : null}
                </div>

                <label className="sr-only" htmlFor={`puzzle-select-${pair.id}`}>
                  Selecionar movimento para {pair.prompt}
                </label>
                <select
                  id={`puzzle-select-${pair.id}`}
                  className="mt-3 w-full rounded-2xl border border-neutral-200 px-3 py-2 text-body-sm text-neutral-700 focus:border-primary-400 focus:outline-none"
                  value={assignedValue ?? ""}
                  onChange={(event) => {
                    const value = event.target.value || null;
                    assignMatch(pair.id, value);
                  }}
                >
                  <option value="">Escolha pelo teclado…</option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>

                {evaluation ? (
                  <div
                    className={clsx(
                      "mt-3 rounded-2xl px-4 py-2 text-body-sm",
                      evaluation.pairResults.find((result) => result.pairId === pair.id)?.correct
                        ? "bg-secondary-50 text-secondary-700"
                        : "bg-accent-50 text-accent-700"
                    )}
                  >
                    {evaluation.pairResults.find((result) => result.pairId === pair.id)?.feedback ?? pair.feedback}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-label-lg font-semibold uppercase tracking-[0.08em] text-neutral-600">
            Movimentos disponíveis
          </p>
          <div className="flex flex-col gap-3">
            {availableMatches.map((match) => (
              <div
                key={match}
                role="button"
                tabIndex={0}
                className={clsx(
                  "cursor-grab rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-body-sm font-semibold text-primary-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-300",
                  dragging === match && "border-primary-300 bg-primary-100"
                )}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", match);
                  setDragging(match);
                }}
                onDragEnd={() => setDragging(null)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    const firstIncomplete = puzzle.pairs.find((pair) => !assignments[pair.id]);
                    if (firstIncomplete) {
                      assignMatch(firstIncomplete.id, match);
                    }
                  }
                }}
              >
                {match}
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <CardContent className="border-t border-neutral-100 pt-4">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={reset}>
            Reiniciar combinações
          </Button>
          <Button variant="primary" onClick={handleValidate} disabled={!allPairsAnswered}>
            Validar combinações
          </Button>
        </div>
        {evaluation ? (
          <div
            className={clsx(
              "mt-4 rounded-2xl px-4 py-3 text-body-sm",
              evaluation.allCorrect
                ? "bg-secondary-50 text-secondary-700"
                : "bg-accent-50 text-accent-700"
            )}
          >
            {evaluation.summaryFeedback ??
              "Ainda há combinações para revisar. Troquem ideias com a turma e tentem novamente."}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
