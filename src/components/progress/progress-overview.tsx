import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ProgressSummaryData } from "@/lib/progress";

const formatNumber = (value: number) => value.toLocaleString("pt-BR");

export interface ProgressOverviewProps {
  summary: ProgressSummaryData;
}

export const ProgressOverview = ({ summary }: ProgressOverviewProps) => {
  const completedModules = summary.modules.filter((module) => module.completion >= 100).length;
  const averageMastery = summary.modules.length
    ? Math.round(
        summary.modules.reduce((accumulator, module) => accumulator + module.mastery, 0) /
          summary.modules.length
      )
    : 0;
  const strongestCompetency = summary.competencies[0];

  return (
    <Card tone="highlight" className="overflow-hidden">
      <CardHeader className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Badge variant="accent" soft>
            Jornada personalizada
          </Badge>
          <CardTitle className="text-display-sm">
            {summary.user.displayName ?? "Estudante"}, parabéns pelos avanços!
          </CardTitle>
          <p className="max-w-2xl text-body-md text-neutral-600">
            Você já acumula {formatNumber(summary.user.xp)} XP e está no nível {summary.user.level}.
            Continue avançando para desbloquear novas experiências e recompensas.
          </p>
        </div>
        <div className="min-w-[220px] rounded-3xl border border-primary-100 bg-white/80 p-4 text-right shadow-card">
          <p className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
            Próximo nível
          </p>
          <p className="text-display-xs font-semibold text-primary-600">
            {formatNumber(summary.user.nextLevelAt)} XP
          </p>
          <p className="text-body-sm text-neutral-500">
            Faltam {formatNumber(summary.user.xpToNext)} XP para alcançar o nível{" "}
            {summary.user.level + 1}.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ProgressBar
            value={summary.user.xpProgressPercent}
            label="Progresso de XP"
            helperText={`Sequência atual: ${summary.user.currentStreak} dia(s) — recorde: ${summary.user.longestStreak} dia(s)`}
          />
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <dt className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
                Módulos concluídos
              </dt>
              <dd className="text-display-sm font-semibold text-primary-600">{completedModules}</dd>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <dt className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
                Maestria média
              </dt>
              <dd className="text-display-sm font-semibold text-secondary-600">
                {averageMastery}%
              </dd>
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <dt className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
                Recompensas
              </dt>
              <dd className="text-display-sm font-semibold text-neutral-900">
                {summary.rewards.length}
              </dd>
            </div>
          </dl>
        </div>
        <div className="space-y-4 rounded-4xl border border-primary-50 bg-white/90 p-6 shadow-card">
          <h3 className="text-title-md font-semibold text-neutral-900">Destaque BNCC</h3>
          {strongestCompetency ? (
            <div className="space-y-2">
              <p className="text-label-lg uppercase tracking-[0.08em] text-primary-500">
                {strongestCompetency.bnccCode}
              </p>
              <p className="text-body-lg text-neutral-700">{strongestCompetency.competency}</p>
              <p className="text-body-sm text-neutral-500">
                Maestria atual:{" "}
                <span className="font-semibold text-primary-600">
                  {strongestCompetency.mastery}%
                </span>
              </p>
            </div>
          ) : (
            <p className="text-body-sm text-neutral-500">
              Complete atividades alinhadas à BNCC para revelar conquistas especiais aqui.
            </p>
          )}
          <div className="rounded-3xl bg-primary-50/70 px-4 py-3 text-body-sm text-primary-700 shadow-inner">
            Continue praticando por poucos minutos por dia para manter sua sequência ativa e
            garantir bônus extras de XP.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
