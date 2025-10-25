"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "../ui";
import type { ReactNode } from "react";
import { PuzzleIcon, RocketIcon, SparkIcon } from "../ui/icons";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  helper: string;
  illustration?: ReactNode;
  tip?: string;
}

export interface OnboardingFlowProps {
  steps?: OnboardingStep[];
  currentStep?: number;
  onStepChange?: (index: number) => void;
  onContinue?: () => void;
  onFinish?: () => void;
  onBack?: () => void;
  supportMessage?: string;
  renderStepContent?: (step: OnboardingStep, index: number) => ReactNode;
}

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "perfil",
    title: "Conhecer cada criança",
    description: "Conte pra gente como a criança prefere aprender, seus interesses e curiosidades.",
    helper: "Perguntas rápidas ajudam a IA a propor experiências únicas.",
    illustration: <SparkIcon className="h-12 w-12 text-secondary-500" aria-hidden="true" />,
    tip: "Dica: pense em habilidades que ela já domina e outras que deseja explorar.",
  },
  {
    id: "preferencias",
    title: "Escolher temas favoritos",
    description: "Selecione áreas como artes, natureza, jogos cooperativos e cultura brasileira.",
    helper: "Isso nos ajuda a propor desafios apaixonantes logo no início.",
    illustration: <PuzzleIcon className="h-12 w-12 text-primary-500" aria-hidden="true" />,
    tip: "Escolha pelo menos três temas para deixar a trilha variada.",
  },
  {
    id: "acessibilidade",
    title: "Personalizar acessibilidade",
    description:
      "Ative narração, contraste ampliado, traduções em Libras ou tempo estendido nas atividades.",
    helper: "Tudo pode ser ajustado a qualquer momento dentro da plataforma.",
    illustration: <RocketIcon className="h-12 w-12 text-accent-400" aria-hidden="true" />,
    tip: "Combine com a criança quais recursos deixam o aprendizado mais confortável.",
  },
  {
    id: "primeira-missao",
    title: "Preparar a primeira missão",
    description:
      "Defina metas afetivas e acadêmicas para receber um plano de 7 dias com apoio da IA.",
    helper: "Você pode convidar outros responsáveis ou educadores para acompanhar a jornada.",
    illustration: <SparkIcon className="h-12 w-12 text-success-500" aria-hidden="true" />,
    tip: "Compartilhe a missão com a família para celebrar cada conquista.",
  },
];

export const OnboardingFlow = ({
  steps = DEFAULT_STEPS,
  currentStep,
  onStepChange,
  onContinue,
  onFinish,
  onBack,
  supportMessage = "Dica: responda com sinceridade. Podemos ajustar tudo depois com um clique!",
  renderStepContent,
}: OnboardingFlowProps) => {
  const isControlled = currentStep !== undefined;
  const [internalStep, setInternalStep] = useState(0);

  useEffect(() => {
    if (isControlled && typeof currentStep === "number") {
      setInternalStep(Math.min(Math.max(currentStep, 0), steps.length - 1));
    }
  }, [currentStep, isControlled, steps.length]);

  const activeIndex = isControlled
    ? Math.min(Math.max(currentStep ?? 0, 0), steps.length - 1)
    : internalStep;

  const progress = useMemo(
    () => Math.round(((activeIndex + 1) / steps.length) * 100),
    [activeIndex, steps.length]
  );

  const goToStep = (index: number) => {
    const safeIndex = Math.min(Math.max(index, 0), steps.length - 1);
    if (!isControlled) {
      setInternalStep(safeIndex);
    }
    onStepChange?.(safeIndex);
  };

  const handleContinue = () => {
    const isLastStep = activeIndex === steps.length - 1;
    if (isLastStep) {
      onFinish?.();
      onContinue?.();
      return;
    }

    const nextIndex = Math.min(activeIndex + 1, steps.length - 1);
    goToStep(nextIndex);
    onContinue?.();
  };

  const handleBack = () => {
    const previousIndex = Math.max(activeIndex - 1, 0);
    goToStep(previousIndex);
    onBack?.();
  };

  const activeStep = steps[activeIndex] ?? steps[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-secondary-50/40 to-white py-section-sm">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-gutter-lg">
        <header className="space-y-3 text-center">
          <Badge variant="accent">Vamos juntos!</Badge>
          <h1 className="text-display-lg font-semibold text-neutral-900">
            Configuramos a experiência com carinho
          </h1>
          <p className="text-body-lg text-neutral-600">
            Em poucos passos, adaptamos a jornada às necessidades da criança e envolvemos a rede de
            cuidado.
          </p>
        </header>

        <ProgressBar value={progress} label="Progresso do cadastro" />

        <ol className="grid gap-3 md:grid-cols-4" aria-label="Etapas da configuração">
          {steps.map((step, index) => {
            const status =
              index < activeIndex ? "complete" : index === activeIndex ? "current" : "upcoming";
            return (
              <li key={step.id} className="flex flex-col gap-2">
                <button
                  type="button"
                  className="flex flex-col gap-2 rounded-3xl border border-primary-50 bg-white px-4 py-3 text-left shadow-sm transition ease-friendly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200"
                  onClick={() => goToStep(index)}
                  aria-current={status === "current" ? "step" : undefined}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    {index + 1}
                  </span>
                  <span className="text-body-sm font-semibold text-neutral-900">{step.title}</span>
                  <span className="text-label-sm text-neutral-500">
                    {status === "complete"
                      ? "Concluída"
                      : status === "current"
                        ? "Em andamento"
                        : "A fazer"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <Card tone="default" className="space-y-6">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {activeStep.illustration ? (
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-neutral-100 text-primary-600">
                  {activeStep.illustration}
                </span>
              ) : null}
              <div>
                <CardTitle className="text-display-sm">{activeStep.title}</CardTitle>
                <CardDescription>{activeStep.description}</CardDescription>
              </div>
            </div>
            <Badge variant="info" soft>
              Etapa {activeIndex + 1} de {steps.length}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-body-md text-neutral-600">{activeStep.helper}</p>
            {activeStep.tip ? (
              <div className="rounded-3xl border border-accent-100 bg-accent-50 px-4 py-3 text-body-sm text-accent-700">
                {activeStep.tip}
              </div>
            ) : null}
            {renderStepContent ? (
              <div className="space-y-4">{renderStepContent(activeStep, activeIndex)}</div>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span className="text-body-sm text-neutral-500">{supportMessage}</span>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" disabled={activeIndex === 0} onClick={handleBack}>
                Voltar
              </Button>
              <Button variant="primary" onClick={handleContinue}>
                {activeIndex === steps.length - 1 ? "Concluir" : "Salvar e continuar"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
