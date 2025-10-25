"use client";

import type { ReactNode } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ProgressBar,
  ResponsiveNav,
  RewardChip,
} from "../ui";
import type { NavigationItem } from "../ui/responsive-nav";

interface HighlightCard {
  title: string;
  description: string;
  progress?: number;
  ctaLabel?: string;
}

interface Recommendation {
  title: string;
  description: string;
  tag: string;
}

export interface DashboardShellProps {
  navItems: NavigationItem[];
  userName: string;
  userRole?: string;
  heroMessage?: string;
  highlightCards?: HighlightCard[];
  recommendations?: Recommendation[];
  children?: ReactNode;
  aside?: ReactNode;
  navPrimaryAction?: { label: string; href: string };
  navSecondaryAction?: ReactNode;
  navLocaleSwitcher?: ReactNode;
  personalizationSummary?: {
    stage: string;
    label: string;
    ageRange: string;
    competencies: string[];
    habilidades: string[];
    guidanceNote?: string | null;
    learningStyle?: string | null;
    message?: string;
  };
}

const DEFAULT_HIGHLIGHTS: HighlightCard[] = [
  {
    title: "Trilha de matemática lúdica",
    description:
      "Jogos de tabuleiro digitais e desafios curtos para consolidar adição e subtração.",
    progress: 68,
    ctaLabel: "Continuar aventura",
  },
  {
    title: "Laboratório de histórias",
    description: "Crie finais alternativos para um conto brasileiro com apoio de IA generativa.",
    progress: 32,
    ctaLabel: "Criar agora",
  },
];

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  {
    title: "Missão cooperativa: Salvem a nascente!",
    description: "Planejem e apresentem soluções para proteger uma nascente usando dados reais.",
    tag: "Projeto em equipe",
  },
  {
    title: "Oficina de bem-estar digital",
    description: "Reflexões guiadas sobre tempo de tela e combinados familiares.",
    tag: "Para fazer em casa",
  },
];

export const DashboardShell = ({
  navItems,
  userName,
  userRole = "Estudante",
  heroMessage = "Que bom te ver! Preparamos missões fresquinhas para alimentar sua curiosidade hoje.",
  highlightCards = DEFAULT_HIGHLIGHTS,
  recommendations = DEFAULT_RECOMMENDATIONS,
  children,
  aside,
  navPrimaryAction,
  navSecondaryAction,
  navLocaleSwitcher,
  personalizationSummary,
}: DashboardShellProps) => {
  const defaultAside = (
    <div className="space-y-6 lg:sticky lg:top-8">
      <Card tone="highlight" className="space-y-4">
        <CardHeader>
          <Badge variant="accent">Meta da semana</Badge>
          <CardTitle className="text-display-sm">Transformar ideias em impacto</CardTitle>
          <CardDescription>
            Complete 3 missões colaborativas para liberar um novo mundo no estúdio de jogos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressBar value={68} label="Progresso" helperText="Faltam 2 missões" />
        </CardContent>
        <CardFooter>
          <RewardChip level="ouro" points={1200} label="Moedas do clube" />
        </CardFooter>
      </Card>

      <Card tone="calm">
        <CardHeader>
          <CardTitle className="text-display-xs">Clube da gentileza</CardTitle>
          <CardDescription>
            Deixe um recado positivo para alguém da turma. As mensagens ficam visíveis para toda a
            comunidade.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="secondary">Escrever mensagem</Button>
        </CardFooter>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <header className="border-b border-primary-50 bg-white/90 py-4 backdrop-blur">
        <div className="mx-auto w-full max-w-content px-gutter-lg">
          <ResponsiveNav
            items={navItems}
            currentHref={navItems.find((item) => item.active)?.href}
            primaryAction={navPrimaryAction ?? { label: "Abrir jornada", href: "/app/jornada" }}
            localeSwitcher={
              navLocaleSwitcher ?? <span className="text-label-md text-neutral-500">PT-BR</span>
            }
            secondaryAction={
              navSecondaryAction ?? (
                <Button variant="ghost" className="hidden lg:inline-flex">
                  Notificações
                </Button>
              )
            }
          />
        </div>
      </header>

      <main className="mx-auto w-full max-w-content px-gutter-lg py-section-sm">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <section className="space-y-10">
            <div className="space-y-4">
              <Badge variant="info">Olá, {userRole.toLowerCase()}</Badge>
              <div className="space-y-2">
                <h1 className="text-display-lg font-semibold text-neutral-900">
                  {userName}, que desafio vamos encarar hoje?
                </h1>
                <p className="text-body-lg text-neutral-600">{heroMessage}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Continuar missão principal</Button>
                <Button variant="secondary">Descobrir novidades</Button>
              </div>
            </div>

            {personalizationSummary ? (
              <Card tone="default" className="space-y-4">
                <CardHeader className="space-y-3">
                  <Badge variant="accent" soft>
                    Jornada personalizada
                  </Badge>
                  <CardTitle className="text-display-xs">{personalizationSummary.label}</CardTitle>
                  <CardDescription>
                    {personalizationSummary.message ??
                      `Conteúdos adaptados para ${personalizationSummary.stage} (${personalizationSummary.ageRange}).`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-body-lg font-semibold text-neutral-900">Competências</h3>
                    <ul className="space-y-2 text-body-sm text-neutral-600">
                      {personalizationSummary.competencies.map((competency) => (
                        <li key={competency} className="flex gap-2">
                          <span
                            className="mt-2 inline-flex h-2 w-2 flex-none rounded-full bg-primary-400"
                            aria-hidden="true"
                          />
                          <span>{competency}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-body-lg font-semibold text-neutral-900">Habilidades</h3>
                    <ul className="space-y-2 text-body-sm text-neutral-600">
                      {personalizationSummary.habilidades.map((habilidade) => (
                        <li key={habilidade} className="flex gap-2">
                          <span
                            className="mt-2 inline-flex h-2 w-2 flex-none rounded-full bg-secondary-400"
                            aria-hidden="true"
                          />
                          <span>{habilidade}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {personalizationSummary.learningStyle ? (
                    <div className="lg:col-span-2 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body-sm text-neutral-700">
                      Estilo de aprendizagem favorito:{" "}
                      <span className="font-semibold text-primary-600">
                        {personalizationSummary.learningStyle}
                      </span>
                    </div>
                  ) : null}
                  {personalizationSummary.guidanceNote ? (
                    <div className="lg:col-span-2 rounded-3xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-body-sm text-primary-700">
                      {personalizationSummary.guidanceNote}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              {highlightCards.map((card) => (
                <Card key={card.title} tone="default" interactive>
                  <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </CardHeader>
                  {typeof card.progress === "number" ? (
                    <CardContent>
                      <ProgressBar value={card.progress} label="Avanço" />
                    </CardContent>
                  ) : null}
                  {card.ctaLabel ? (
                    <CardFooter>
                      <Button variant="primary">{card.ctaLabel}</Button>
                    </CardFooter>
                  ) : null}
                </Card>
              ))}
            </div>

            <section className="space-y-4">
              <h2 className="text-display-sm font-semibold text-neutral-900">
                Recomendações para fortalecer suas super-habilidades
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {recommendations.map((item) => (
                  <Card key={item.title} tone="neutral" interactive>
                    <CardHeader className="gap-3">
                      <Badge variant="accent" soft>
                        {item.tag}
                      </Badge>
                      <CardTitle className="text-display-xs">{item.title}</CardTitle>
                    </CardHeader>
                    <CardDescription>{item.description}</CardDescription>
                    <CardFooter>
                      <Button variant="ghost" className="px-0 text-primary-600">
                        Ver detalhes
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>

            {children}
          </section>

          <aside className="space-y-6">{aside ?? defaultAside}</aside>
        </div>
      </main>
    </div>
  );
};
