"use client";

import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ProgressBar,
} from "../ui";

interface PlayerStatus {
  name: string;
  avatarColor: string;
  score: number;
  streak?: number;
}

interface GameEvent {
  description: string;
  timestamp: string;
}

export interface GameCanvasContainerProps {
  title: string;
  mission: string;
  environmentTag?: string;
  timer?: string;
  energyLevel?: number;
  players: PlayerStatus[];
  children: ReactNode;
  events?: GameEvent[];
  onPause?: () => void;
  onFinish?: () => void;
}

const DEFAULT_EVENTS: GameEvent[] = [
  { description: "Equipe EcoPulsar coletou 10 pontos bônus", timestamp: "00:45" },
  { description: "Novo desafio desbloqueado: Corrente da imaginação", timestamp: "01:12" },
  { description: "Assistente Aurora sugeriu pista extra", timestamp: "02:05" },
];

export const GameCanvasContainer = ({
  title,
  mission,
  environmentTag = "Missão colaborativa",
  timer = "03:15",
  energyLevel = 72,
  players,
  children,
  events = DEFAULT_EVENTS,
  onPause,
  onFinish,
}: GameCanvasContainerProps) => (
  <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-calm-50 py-section-sm">
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-gutter-lg">
      <header className="flex flex-col gap-4 rounded-4xl border border-primary-100 bg-white/90 p-6 shadow-card backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <Badge variant="accent">{environmentTag}</Badge>
          <h1 className="text-display-lg font-semibold text-neutral-900">{title}</h1>
          <p className="text-body-md text-neutral-600">{mission}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-pill bg-neutral-100 px-4 py-2 text-body-sm font-semibold text-neutral-600">
            Tempo restante: {timer}
          </div>
          <Button variant="secondary" onClick={onPause}>
            Pausar
          </Button>
          <Button variant="primary" onClick={onFinish}>
            Finalizar rodada
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-5">
          <Card tone="default">
            <CardHeader>
              <CardTitle className="text-display-sm">Painel da equipe</CardTitle>
              <CardDescription>
                A cada avanço coletivo, a barra de energia libera poderes especiais para toda a
                equipe.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProgressBar value={energyLevel} label="Energia compartilhada" />
              <ul className="space-y-3">
                {players.map((player) => (
                  <li
                    key={player.name}
                    className="flex items-center justify-between rounded-3xl bg-white px-4 py-3 shadow-sm"
                  >
                    <span className="flex items-center gap-3 text-body-md font-semibold text-neutral-700">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-white"
                        style={{ backgroundColor: player.avatarColor }}
                        aria-hidden="true"
                      >
                        {player.name.slice(0, 1).toUpperCase()}
                      </span>
                      {player.name}
                    </span>
                    <span className="text-body-md text-primary-600">
                      {player.score} pts{player.streak ? ` • combo ${player.streak}x` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card tone="calm">
            <CardHeader>
              <CardTitle className="text-display-xs">Atalhos do assistente</CardTitle>
              <CardDescription>
                Ative os poderes inclusivos para adaptar o desafio: modo descrevendo cenas, narração
                em Libras ou áudio descrição de objetos.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {[
                "Recurso visual acessível",
                "Simplificar instruções",
                "Converter texto em áudio",
                "Traduzir para Libras",
              ].map((item) => (
                <Button
                  key={item}
                  variant="ghost"
                  className="bg-white px-3 py-2 text-body-sm text-primary-600"
                >
                  {item}
                </Button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="flex flex-col gap-4 rounded-4xl border border-primary-50 bg-white/95 p-6 shadow-bubble">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-display-sm font-semibold text-neutral-900">Canvas colaborativo</h2>
            <Badge variant="info" soft>
              Espaço criativo em tempo real
            </Badge>
          </header>
          <div className="relative min-h-[360px] rounded-3xl border border-primary-100 bg-soft-grid bg-[length:48px_48px] p-4">
            <div
              className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/95 to-white/60"
              aria-hidden="true"
            />
            <div className="relative z-10 h-full w-full overflow-hidden rounded-2xl border border-primary-50 bg-white/90">
              {children}
            </div>
          </div>
        </section>
      </div>

      <footer className="space-y-3 rounded-4xl border border-primary-50 bg-white/90 p-6 shadow-card">
        <h3 className="text-display-xs font-semibold text-neutral-900">Eventos recentes</h3>
        <ul className="flex flex-col gap-3 md:flex-row">
          {events.map((event) => (
            <li
              key={`${event.timestamp}-${event.description}`}
              className="flex min-w-[200px] flex-1 flex-col gap-1 rounded-3xl bg-neutral-50 px-4 py-3 text-body-sm text-neutral-600"
            >
              <span className="text-label-sm font-semibold uppercase tracking-[0.08em] text-primary-600">
                {event.timestamp}
              </span>
              {event.description}
            </li>
          ))}
        </ul>
      </footer>
    </div>
  </div>
);
