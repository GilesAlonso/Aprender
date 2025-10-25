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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui";

interface ActivityStep {
  title: string;
  description: string;
  duration: string;
}

interface ActivityResource {
  label: string;
  description: string;
  type: "vídeo" | "leitura" | "jogo" | "áudio" | string;
  href?: string;
}

interface ReflectionPrompt {
  title: string;
  question: string;
}

export interface ActivityDetailLayoutProps {
  title: string;
  subtitle?: string;
  objective: string;
  summary: string;
  estimatedTime: string;
  recommendedAges?: string;
  competenceTags?: string[];
  steps?: ActivityStep[];
  resources?: ActivityResource[];
  reflections?: ReflectionPrompt[];
  progressValue?: number;
  onStart?: () => void;
  footer?: ReactNode;
}

const DEFAULT_STEPS: ActivityStep[] = [
  {
    title: "Investigue a situação",
    description: "Assista ao vídeo introdutório e anote as pistas que aparecem na tela.",
    duration: "5 min",
  },
  {
    title: "Organize a equipe",
    description: "Definam os papéis: quem vai entrevistar, registrar dados e apresentar a solução.",
    duration: "8 min",
  },
  {
    title: "Construa a proposta",
    description: "Use o canvas colaborativo para escolher até três ações que resolvam o problema.",
    duration: "12 min",
  },
];

const DEFAULT_RESOURCES: ActivityResource[] = [
  {
    label: "Mapa interativo da comunidade",
    description: "Localize pontos de coleta de lixo e identifique oportunidades de melhoria.",
    type: "jogo",
  },
  {
    label: "Guia rápido de entrevistas",
    description: "Perguntas simples e acolhedoras para ouvir moradores e familiares.",
    type: "leitura",
  },
  {
    label: "Banco de dados da prefeitura",
    description: "Dados abertos com indicadores de sustentabilidade da cidade.",
    type: "vídeo",
  },
];

const DEFAULT_REFLECTIONS: ReflectionPrompt[] = [
  {
    title: "O que aprendemos?",
    question: "Qual foi a maior descoberta da equipe durante a investigação?",
  },
  {
    title: "Qual é o próximo passo?",
    question: "Que atitude podemos tomar amanhã para continuar cuidando da comunidade?",
  },
];

export const ActivityDetailLayout = ({
  title,
  subtitle = "Missão investigativa",
  objective,
  summary,
  estimatedTime,
  recommendedAges = "9 a 12 anos",
  competenceTags = ["Empatia", "Cidadania", "Modelagem de dados"],
  steps = DEFAULT_STEPS,
  resources = DEFAULT_RESOURCES,
  reflections = DEFAULT_REFLECTIONS,
  progressValue = 45,
  onStart,
  footer,
}: ActivityDetailLayoutProps) => (
  <div className="min-h-screen bg-surface-100 py-section-sm">
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-gutter-lg">
      <header className="space-y-3">
        <Badge variant="info">{subtitle}</Badge>
        <div className="space-y-2">
          <h1 className="text-display-lg font-semibold text-neutral-900">{title}</h1>
          <p className="text-body-lg text-neutral-600">{summary}</p>
        </div>

        <div className="flex flex-wrap gap-3 text-body-sm text-neutral-600">
          <span className="inline-flex items-center rounded-pill bg-primary-50 px-4 py-1 font-semibold text-primary-700">
            Tempo estimado: {estimatedTime}
          </span>
          <span className="inline-flex items-center rounded-pill bg-secondary-50 px-4 py-1 font-semibold text-secondary-700">
            Faixa sugerida: {recommendedAges}
          </span>
          {competenceTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-pill bg-accent-100 px-3 py-1 font-semibold text-accent-700"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <Card tone="default" className="space-y-6">
        <CardHeader>
          <CardTitle className="text-display-sm">Objetivo principal</CardTitle>
          <CardDescription>{objective}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ProgressBar value={progressValue} label="Avanço da turma" />
          <Button variant="primary" onClick={onStart}>
            Iniciar missão agora
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="missao" label="Detalhes da atividade investigativa">
        <TabsList>
          <TabsTrigger value="missao">Passo a passo</TabsTrigger>
          <TabsTrigger value="recursos">Recursos de apoio</TabsTrigger>
          <TabsTrigger value="reflexoes">Reflexões finais</TabsTrigger>
        </TabsList>

        <TabsContent value="missao" className="space-y-4">
          {steps.map((step, index) => (
            <Card key={step.title} tone="neutral">
              <CardHeader className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Badge variant="info" soft>
                    Etapa {index + 1}
                  </Badge>
                  <CardTitle className="text-display-xs">{step.title}</CardTitle>
                </div>
                <span className="rounded-pill bg-neutral-100 px-3 py-1 text-label-lg font-semibold text-neutral-600">
                  {step.duration}
                </span>
              </CardHeader>
              <CardDescription>{step.description}</CardDescription>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="recursos" className="space-y-4">
          {resources.map((resource) => (
            <Card key={resource.label} tone="calm">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <Badge variant="info" soft>
                    {resource.type}
                  </Badge>
                  <CardTitle className="text-display-xs">{resource.label}</CardTitle>
                </div>
                {resource.href ? (
                  <Button variant="secondary" className="whitespace-nowrap">
                    Abrir recurso
                  </Button>
                ) : null}
              </CardHeader>
              <CardDescription>{resource.description}</CardDescription>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reflexoes" className="space-y-4">
          {reflections.map((reflection) => (
            <Card key={reflection.title} tone="neutral">
              <CardHeader>
                <CardTitle className="text-display-xs">{reflection.title}</CardTitle>
              </CardHeader>
              <CardDescription>{reflection.question}</CardDescription>
              <CardFooter>
                <Button variant="ghost" className="px-0 text-primary-600">
                  Registrar resposta
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {footer ? <div>{footer}</div> : null}
    </div>
  </div>
);
