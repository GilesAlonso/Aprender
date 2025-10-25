'use client';

import { useMemo, useState } from "react";
import clsx from "clsx";

import { OnboardingFlow } from "@/components/layouts/onboarding-flow";
import { AgeSelector, type AgeOption, Badge } from "@/components/ui";
import { SparkIcon, PuzzleIcon, RocketIcon } from "@/components/ui/icons";
import { BNCC_STAGE_CONFIG, LEARNING_STYLE_OPTIONS } from "@/lib/personalization/age-stages";

type AgeGroupSummaryResponse = {
  id: string;
  slug: string;
  name: string;
  minAge: number;
  maxAge: number;
  description: string | null;
  stage: string;
  label: string;
  guidanceNote: string | null;
  competencies: string[];
  habilidades: string[];
};

type OnboardingResponse = {
  age: number;
  ageGroup: AgeGroupSummaryResponse;
  learningStyle: { id: string; label: string } | null;
  message: string;
  source: string;
};

const steps = [
  {
    id: "idade",
    title: "Vamos começar pela idade",
    description: "Usamos a idade para sugerir a etapa BNCC mais acolhedora",
    helper: "Informe a idade atual da criança. Podemos ajustar manualmente se você acompanhar uma turma multisseriada.",
    illustration: <SparkIcon className="h-12 w-12 text-secondary-500" aria-hidden="true" />,
    tip: "Compartilhe a idade junto com a criança ou responsável para envolver todo mundo desde o primeiro passo.",
  },
  {
    id: "estilo",
    title: "Preferências de aprendizagem",
    description: "Escolha o estilo que mais combina com a criança para preparar as primeiras missões",
    helper: "Selecione o formato favorito. Isso ajuda a plataforma a propor desafios acolhedores logo de início.",
    illustration: <PuzzleIcon className="h-12 w-12 text-primary-500" aria-hidden="true" />,
    tip: "Pode trocar depois! Experimente perguntar à criança o que mais a diverte em uma atividade.",
  },
  {
    id: "resumo",
    title: "Resumo da personalização",
    description: "Revise a etapa BNCC, competências e recados para a família",
    helper: "Ao concluir, salvaremos as preferências e apresentaremos um plano inicial alinhado à BNCC.",
    illustration: <RocketIcon className="h-12 w-12 text-accent-400" aria-hidden="true" />,
  },
];

const getStageBySlug = (slug: string) => BNCC_STAGE_CONFIG.find((stage) => stage.slug === slug);

const getStageForAge = (age: number) => {
  const stage = BNCC_STAGE_CONFIG.find((entry) => age >= entry.minAge && age <= entry.maxAge);
  if (stage) {
    return stage;
  }

  if (age < BNCC_STAGE_CONFIG[0]!.minAge) {
    return BNCC_STAGE_CONFIG[0]!;
  }

  return BNCC_STAGE_CONFIG[BNCC_STAGE_CONFIG.length - 1]!;
};

const ageSelectorMidpoint = (stageSlug: string) => {
  const stage = getStageBySlug(stageSlug);
  if (!stage) {
    return undefined;
  }
  return Math.round((stage.minAge + stage.maxAge) / 2);
};

export default function OnboardingPage() {
  const [age, setAge] = useState(8);
  const [overrideSlug, setOverrideSlug] = useState<string | null>(null);
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<string | null>(null);
  const [persistedLearningStyle, setPersistedLearningStyle] = useState<{ id: string; label: string } | null>(
    null
  );
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<AgeGroupSummaryResponse | null>(null);
  const [resolutionSource, setResolutionSource] = useState<string>("age");

  const suggestedStage = useMemo(() => getStageForAge(age), [age]);
  const manualStage = useMemo(
    () => (overrideSlug ? getStageBySlug(overrideSlug) ?? null : null),
    [overrideSlug]
  );
  const activeStage = manualStage ?? suggestedStage;

  const stageSelectionValue = manualStage ? manualStage.slug : suggestedStage.slug;

  const learningStyleOption = useMemo(
    () =>
      persistedLearningStyle
        ? persistedLearningStyle
        : selectedLearningStyle
          ? {
              id: selectedLearningStyle,
              label:
                LEARNING_STYLE_OPTIONS.find((option) => option.id === selectedLearningStyle)?.title ??
                selectedLearningStyle,
            }
          : null,
    [persistedLearningStyle, selectedLearningStyle]
  );

  const resetFeedback = () => {
    setStatus("idle");
    setMessage(null);
    setPersistedLearningStyle(null);
    setResultSummary(null);
  };

  const handleAgeSelectorChange = (option: AgeOption) => {
    const midpoint = ageSelectorMidpoint(option.id);
    if (typeof midpoint === "number") {
      setAge(midpoint);
      setOverrideSlug(null);
      setResolutionSource("age");
      resetFeedback();
    }
  };

  const handleManualOverrideChange = (value: string) => {
    setOverrideSlug(value ? value : null);
    setResolutionSource(value ? "override" : "age");
    resetFeedback();
  };

  const handleAgeInputChange = (value: number) => {
    setAge(Math.max(4, Math.min(17, Number.isNaN(value) ? age : value)));
    setResolutionSource("age");
    resetFeedback();
  };

  const submitOnboarding = async () => {
    if (status === "loading") {
      return;
    }

    setStatus("loading");
    setMessage(null);
    setPersistedLearningStyle(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          age,
          learningStyle: selectedLearningStyle ?? undefined,
          overrideAgeGroupSlug: overrideSlug ?? undefined,
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(errorBody?.message ?? "Não foi possível salvar a personalização.");
      }

      const data = (await response.json()) as OnboardingResponse;
      setStatus("success");
      setMessage(data.message);
      setResultSummary(data.ageGroup);
      setResolutionSource(data.source);
      setPersistedLearningStyle(data.learningStyle);
      setOverrideSlug(data.ageGroup.slug);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Ocorreu um erro ao salvar a personalização."
      );
    }
  };

  const renderStepContent = (_step: unknown, index: number) => {
    if (index === 0) {
      return (
        <div className="space-y-6">
          <AgeSelector value={stageSelectionValue} onChange={handleAgeSelectorChange} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <div className="rounded-4xl border border-neutral-200 bg-white p-5 shadow-sm">
                <label className="flex items-center justify-between text-body-md font-semibold text-neutral-900">
                  <span>Quantos anos a criança tem hoje?</span>
                  <span className="text-display-sm text-primary-600">{age}</span>
                </label>
                <input
                  aria-label="Selecione a idade"
                  type="range"
                  min={4}
                  max={17}
                  value={age}
                  onChange={(event) => handleAgeInputChange(Number(event.target.value))}
                  className="mt-4 w-full accent-primary-500"
                />
                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="number"
                    min={4}
                    max={17}
                    value={age}
                    onChange={(event) => handleAgeInputChange(Number(event.target.value))}
                    className="w-24 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-body-md text-neutral-900 focus:outline-none focus:ring-4 focus:ring-primary-200"
                  />
                  <span className="text-body-md text-neutral-600">anos</span>
                </div>
              </div>

              <div className="rounded-4xl border border-neutral-200 bg-neutral-50 p-5">
                <label className="text-label-md font-semibold text-neutral-700">
                  Educador(a): deseja ajustar manualmente a etapa BNCC?
                </label>
                <select
                  value={overrideSlug ?? ""}
                  onChange={(event) => handleManualOverrideChange(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-body-sm text-neutral-800 focus:outline-none focus:ring-4 focus:ring-primary-200"
                >
                  <option value="">Manter faixa sugerida ({suggestedStage.stage})</option>
                  {BNCC_STAGE_CONFIG.map((stage) => (
                    <option key={stage.slug} value={stage.slug}>
                      {stage.stage} ({stage.minAge}-{stage.maxAge} anos)
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-neutral-500">
                  Ajustes manuais salvam a etapa selecionada para registros pedagógicos e relatórios.
                </p>
                {overrideSlug ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-pill bg-primary-100 px-3 py-1 text-label-sm font-semibold text-primary-700">
                    Ajuste manual ativo ({manualStage?.stage ?? overrideSlug})
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="space-y-4 rounded-4xl border border-primary-100 bg-white/95 p-5 shadow-lg">
              <Badge variant="accent" soft>
                Faixa sugerida
              </Badge>
              <div className="space-y-2">
                <h3 className="text-display-xs font-semibold text-neutral-900">{activeStage.stage}</h3>
                <p className="text-label-lg text-neutral-500">
                  {activeStage.minAge} a {activeStage.maxAge} anos
                </p>
                <p className="text-body-sm text-neutral-600">{activeStage.childSummary}</p>
              </div>
              {activeStage.guidanceNote ? (
                <div className="rounded-3xl border border-primary-100 bg-primary-50/70 px-4 py-3 text-body-xs text-primary-700">
                  {activeStage.guidanceNote}
                </div>
              ) : null}
            </aside>
          </div>
        </div>
      );
    }

    if (index === 1) {
      return (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            {LEARNING_STYLE_OPTIONS.map((option) => {
              const isActive = selectedLearningStyle === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setSelectedLearningStyle((current) =>
                      current === option.id ? null : option.id
                    )
                  }
                  className={clsx(
                    "flex h-full flex-col gap-3 rounded-3xl border px-5 py-4 text-left transition ease-friendly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                    isActive
                      ? "border-primary-300 bg-white shadow-bubble"
                      : "border-transparent bg-neutral-50 hover:border-primary-200"
                  )}
                >
                  <span className="text-body-lg font-semibold text-neutral-900">{option.title}</span>
                  <p className="text-body-sm text-neutral-600">{option.description}</p>
                  {isActive ? (
                    <span className="inline-flex items-center gap-2 text-label-sm font-semibold text-primary-600">
                      Preferência selecionada
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="rounded-4xl border border-neutral-200 bg-white p-5 text-body-sm text-neutral-600 shadow-sm">
            Dica: se a criança tiver mais de um estilo favorito, escolha o que melhor representa o
            momento atual. Você poderá ajustar novamente na dashboard.
          </div>
        </div>
      );
    }

    const fallbackSummary: AgeGroupSummaryResponse = {
      id: activeStage.slug,
      slug: activeStage.slug,
      name: `${activeStage.stage} (${activeStage.minAge}-${activeStage.maxAge} anos)`,
      minAge: activeStage.minAge,
      maxAge: activeStage.maxAge,
      description: activeStage.educatorSummary,
      stage: activeStage.stage,
      label: activeStage.label,
      guidanceNote: activeStage.guidanceNote,
      competencies: activeStage.competencies,
      habilidades: activeStage.habilidades,
    };

    const summary = resultSummary ?? fallbackSummary;

    const sourceLabel = (() => {
      switch (resolutionSource) {
        case "override":
          return "ajuste manual";
        case "profile":
          return "perfil";
        case "cookie":
          return "registro anterior";
        case "default":
          return "configuração inicial";
        default:
          return "idade";
      }
    })();

    return (
      <div className="space-y-6">
        <div className="rounded-4xl border border-primary-100 bg-white/95 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Badge variant="info">Etapa BNCC</Badge>
              <h3 className="mt-3 text-display-xs font-semibold text-neutral-900">{summary.stage}</h3>
              <p className="text-body-sm text-neutral-600">
                Faixa de {summary.minAge} a {summary.maxAge} anos · Fonte: {sourceLabel}
              </p>
            </div>
            <div className="text-right text-body-md text-neutral-600">
              <span className="block text-label-sm uppercase tracking-[0.08em] text-neutral-500">
                Idade informada
              </span>
              <span className="text-display-sm font-semibold text-primary-600">{age} anos</span>
            </div>
          </div>
          {summary.guidanceNote ? (
            <p className="mt-4 rounded-3xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body-sm text-neutral-700">
              {summary.guidanceNote}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-3 rounded-4xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h4 className="text-body-lg font-semibold text-neutral-900">Competências em destaque</h4>
            <ul className="space-y-2 text-body-sm text-neutral-600">
              {summary.competencies.map((competency) => (
                <li key={competency} className="flex gap-2">
                  <span className="mt-2 inline-flex h-2 w-2 flex-none rounded-full bg-primary-400" aria-hidden="true" />
                  <span>{competency}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3 rounded-4xl border border-neutral-200 bg-white p-5 shadow-sm">
            <h4 className="text-body-lg font-semibold text-neutral-900">Habilidades sugeridas</h4>
            <ul className="space-y-2 text-body-sm text-neutral-600">
              {summary.habilidades.map((habilidade) => (
                <li key={habilidade} className="flex gap-2">
                  <span className="mt-2 inline-flex h-2 w-2 flex-none rounded-full bg-secondary-400" aria-hidden="true" />
                  <span>{habilidade}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="rounded-4xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h4 className="text-body-lg font-semibold text-neutral-900">Preferências registradas</h4>
          <div className="mt-3 flex flex-wrap gap-3 text-body-sm text-neutral-600">
            {learningStyleOption ? (
              <span className="inline-flex items-center gap-2 rounded-pill bg-primary-100 px-4 py-1 text-label-sm font-semibold text-primary-700">
                {learningStyleOption.label}
              </span>
            ) : (
              <span>Estilo de aprendizagem ainda não selecionado.</span>
            )}
          </div>
        </section>

        {status === "success" && message ? (
          <div className="rounded-4xl border border-green-200 bg-green-50 px-4 py-3 text-body-sm text-green-800">
            {message}
          </div>
        ) : null}
        {status === "error" && message ? (
          <div className="rounded-4xl border border-red-200 bg-red-50 px-4 py-3 text-body-sm text-red-700">
            {message}
          </div>
        ) : null}
        {status === "loading" ? (
          <div className="rounded-4xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-body-sm text-neutral-600">
            Personalizando jornada... aguarde um instante.
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <OnboardingFlow
      steps={steps}
      onFinish={submitOnboarding}
      supportMessage="Responsáveis podem revisar as respostas no painel a qualquer momento."
      renderStepContent={renderStepContent}
    />
  );
}
