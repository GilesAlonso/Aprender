"use client";

import { useEffect, useMemo, useState } from "react";
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
import type {
  GameEvaluation,
  InteractiveActivity,
  PuzzleEvaluation,
  QuizEvaluation,
} from "@/lib/activities";
import { dispatchAnalyticsEvent } from "@/lib/analytics";

import { GameActivityPlayer } from "./game-activity";
import { PuzzleActivityPlayer } from "./puzzle-activity";
import { QuizActivityPlayer } from "./quiz-activity";

const difficultyLabels: Record<string, string> = {
  BEGINNER: "Nível iniciante",
  INTERMEDIATE: "Nível intermediário",
  ADVANCED: "Nível avançado",
};

const activityTypeLabel: Record<InteractiveActivity["type"], string> = {
  QUIZ: "Quiz interativo",
  PUZZLE: "Quebra-cabeça pedagógico",
  GAME: "Mini-jogo educativo",
};

export type InteractiveCompletionResult = QuizEvaluation | PuzzleEvaluation | GameEvaluation;

interface InteractiveActivityProps {
  activity: InteractiveActivity;
  autoStart?: boolean;
  className?: string;
  onCompleted?: (result: InteractiveCompletionResult) => void;
}

const computePuzzleScore = (evaluation: PuzzleEvaluation): number => {
  if (evaluation.totalPairs === 0) return 0;
  return Math.round((evaluation.totalCorrect / evaluation.totalPairs) * 100);
};

export const InteractiveActivity = ({
  activity,
  autoStart = false,
  className,
  onCompleted,
}: InteractiveActivityProps) => {
  const [started, setStarted] = useState(autoStart);
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    if (autoStart) {
      dispatchAnalyticsEvent({
        type: "activity_started",
        activitySlug: activity.slug,
        activityType: activity.type,
      });
    }
  }, [activity.slug, activity.type, autoStart]);

  const handleStart = () => {
    setStarted(true);
    dispatchAnalyticsEvent({
      type: "activity_started",
      activitySlug: activity.slug,
      activityType: activity.type,
    });
  };

  const difficultyLabel = difficultyLabels[activity.difficulty] ?? "Dificuldade flexível";
  const timeLabel = `${activity.estimatedTimeMinutes} minutos`;
  const typeLabel = activityTypeLabel[activity.type];

  const objectiveList = useMemo(
    () => activity.objectives.map((objective, index) => ({ id: `${activity.slug}-objective-${index}`, text: objective })),
    [activity.objectives, activity.slug]
  );

  return (
    <div className={clsx("flex flex-col gap-6", className)}>
      <Card tone="highlight" className="gap-5">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">{typeLabel}</Badge>
            <Badge variant="accent">BNCC {activity.bnccCode}</Badge>
            <Badge variant="neutral">{difficultyLabel}</Badge>
            <Badge variant="success">Tempo estimado: {timeLabel}</Badge>
          </div>
          <CardTitle className="text-display-xs text-neutral-900">{activity.title}</CardTitle>
          <CardDescription>{activity.bnccDescription}</CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <section>
            <h4 className="text-label-lg uppercase tracking-[0.08em] text-neutral-600">Instruções</h4>
            <ol className="mt-2 list-decimal space-y-2 pl-6 text-body-sm text-neutral-700">
              {activity.instructions.map((instruction, index) => (
                <li key={`${activity.slug}-instruction-${index}`}>{instruction}</li>
              ))}
            </ol>
          </section>

          <section>
            <h4 className="text-label-lg uppercase tracking-[0.08em] text-neutral-600">Objetivos de aprendizagem</h4>
            <ul className="mt-2 space-y-2 text-body-sm text-neutral-700">
              {objectiveList.map((objective) => (
                <li key={objective.id} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary-500" />
                  <span>{objective.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button variant="primary" size="lg" onClick={handleStart} disabled={started}>
              {started ? "Atividade iniciada" : "Iniciar atividade"}
            </Button>
            {lastScore !== null ? (
              <span className="inline-flex items-center rounded-pill bg-secondary-50 px-4 py-2 text-body-sm font-semibold text-secondary-700">
                Última pontuação: {lastScore}%
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {started ? (
        activity.type === "QUIZ" ? (
          <QuizActivityPlayer
            activity={activity}
            onComplete={(result) => {
              setLastScore(result.score);
              onCompleted?.(result);
            }}
          />
        ) : activity.type === "PUZZLE" ? (
          <PuzzleActivityPlayer
            activity={activity}
            onComplete={(result) => {
              const score = computePuzzleScore(result);
              setLastScore(score);
              onCompleted?.(result);
            }}
          />
        ) : (
          <GameActivityPlayer
            activity={activity}
            onComplete={(result) => {
              setLastScore(result.score);
              onCompleted?.(result);
            }}
          />
        )
      ) : null}
    </div>
  );
};
