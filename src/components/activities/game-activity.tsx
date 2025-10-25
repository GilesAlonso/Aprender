"use client";

import { FormEvent, useMemo, useState } from "react";

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
import type { GameEvaluation, GameSubmission, InteractiveActivity } from "@/lib/activities";
import { evaluateGameSubmission } from "@/lib/activities";
import { dispatchAnalyticsEvent } from "@/lib/analytics";

interface GameActivityPlayerProps {
  activity: Extract<InteractiveActivity, { type: "GAME" }>;
  onComplete?: (evaluation: GameEvaluation) => void;
}

export const GameActivityPlayer = ({ activity, onComplete }: GameActivityPlayerProps) => {
  const { game } = activity;
  const [submissions, setSubmissions] = useState<GameSubmission>([]);
  const [evaluation, setEvaluation] = useState<GameEvaluation | null>(null);
  const [currentInput, setCurrentInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const currentLevelIndex = submissions.length;
  const currentLevel = game.levels[currentLevelIndex];
  const livesRemaining = evaluation?.livesRemaining ?? game.lives ?? 3;

  const progressValue = useMemo(() => {
    const total = game.levels.length;
    if (total === 0) return 0;
    return Math.round((submissions.length / total) * 100);
  }, [game.levels.length, submissions.length]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentLevel) {
      return;
    }

    const trimmed = currentInput.trim();
    if (!trimmed) {
      setInputError("Digite uma resposta antes de continuar.");
      return;
    }

    let answer: string | number = trimmed;
    if (typeof currentLevel.answer === "number") {
      const numeric = Number(trimmed.replace(",", "."));
      if (!Number.isFinite(numeric)) {
        setInputError("Use apenas números nesta fase.");
        return;
      }
      answer = numeric;
    }

    setInputError(null);

    const nextSubmissions: GameSubmission = [...submissions, { levelId: currentLevel.id, answer }];
    const result = evaluateGameSubmission(game, nextSubmissions);
    setSubmissions(nextSubmissions);
    setEvaluation(result);

    const latestResult = result.levelResults.find((level) => level.levelId === currentLevel.id);
    const correct = latestResult?.correct ?? false;
    const feedback = correct ? latestResult?.successFeedback : latestResult?.failureFeedback;
    setFeedbackMessage(feedback ?? null);

    dispatchAnalyticsEvent({
      type: "activity_interaction",
      activitySlug: activity.slug,
      activityType: activity.type,
      detail: {
        id: currentLevel.id,
        correct,
        position: currentLevelIndex,
      },
    });

    setCurrentInput("");

    if (result.status === "victory" || result.status === "game-over") {
      dispatchAnalyticsEvent({
        type: "activity_completed",
        activitySlug: activity.slug,
        activityType: activity.type,
        score: result.score,
        completion: result.score,
        metadata: {
          activitySlug: activity.activitySlug,
          contentModuleSlug: activity.contentModuleSlug,
          status: result.status,
          livesRemaining: result.livesRemaining,
        },
      });

      onComplete?.(result);
    }
  };

  const resetGame = () => {
    setSubmissions([]);
    setEvaluation(null);
    setCurrentInput("");
    setInputError(null);
    setFeedbackMessage(null);
  };

  if (!currentLevel) {
    const finalEvaluation = evaluation ?? evaluateGameSubmission(game, submissions);
    return (
      <Card tone="highlight" className="gap-5">
        <CardHeader className="gap-3">
          <CardTitle className="text-display-xs text-neutral-900">
            {finalEvaluation.status === "victory" ? "Missão concluída" : "Hora de revisar a estratégia"}
          </CardTitle>
          <CardDescription>
            {finalEvaluation.status === "victory"
              ? game.victoryMessage ?? "Parabéns! Todos os desafios foram resolvidos com sucesso."
              : game.gameOverMessage ??
                "Conversem sobre outras estratégias de cálculo e tentem a missão novamente."}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-4">
          <ProgressBar value={finalEvaluation.score} label={`Pontuação: ${finalEvaluation.score}%`} />
          <p className="text-body-sm text-neutral-600">
            Você respondeu {finalEvaluation.correctLevels} de {finalEvaluation.totalLevels} desafios corretamente.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={resetGame}>
              Jogar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card tone="neutral" className="gap-6">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="info">Fase {currentLevelIndex + 1} de {game.levels.length}</Badge>
          <Badge variant="accent">Vidas restantes: {livesRemaining}</Badge>
          {game.timeLimitSeconds ? (
            <Badge variant="warning">Tempo sugerido: {game.timeLimitSeconds}s</Badge>
          ) : null}
        </div>
        <CardTitle className="text-display-xs text-neutral-900">{currentLevel.challenge}</CardTitle>
        {currentLevel.hint ? (
          <CardDescription>{currentLevel.hint}</CardDescription>
        ) : null}
        <ProgressBar value={progressValue} label={`Progresso da missão: ${progressValue}%`} />
      </CardHeader>
      <CardContent className="gap-4">
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="text-body-sm font-semibold text-neutral-700" htmlFor="game-answer">
            Qual é a resposta?
          </label>
          <input
            id="game-answer"
            value={currentInput}
            onChange={(event) => setCurrentInput(event.target.value)}
            className="rounded-2xl border border-neutral-200 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-400 focus:outline-none"
            autoComplete="off"
          />
          {inputError ? <span className="text-body-sm text-accent-700">{inputError}</span> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary">
              Confirmar resposta
            </Button>
            <Button type="button" variant="secondary" onClick={() => setCurrentInput("")}>
              Limpar campo
            </Button>
            <Button type="button" variant="ghost" onClick={resetGame}>
              Recomeçar missão
            </Button>
          </div>
        </form>
        {feedbackMessage ? (
          <div className="rounded-2xl bg-secondary-50 px-4 py-3 text-body-sm text-secondary-700">
            {feedbackMessage}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};
