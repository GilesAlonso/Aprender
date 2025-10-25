import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProgressSummaryCompetency, ProgressSummaryModule } from "@/lib/progress";

export interface CompetencyHighlightsProps {
  competencies: ProgressSummaryCompetency[];
  modules: ProgressSummaryModule[];
}

export const CompetencyHighlights = ({ competencies, modules }: CompetencyHighlightsProps) => {
  const strengths = competencies.filter((competency) => competency.mastery >= 80).slice(0, 3);

  const opportunities = modules
    .filter((module) => module.mastery < 70)
    .sort((a, b) => a.mastery - b.mastery)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      <Card tone="default">
        <CardHeader>
          <CardTitle className="text-title-sm">Forças BNCC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {strengths.length === 0 ? (
            <p className="text-body-sm text-neutral-500">
              Assim que a maestria atingir 80% em uma competência BNCC, ela aparecerá aqui como
              destaque.
            </p>
          ) : (
            <ul className="space-y-3">
              {strengths.map((competency) => (
                <li
                  key={competency.id}
                  className="rounded-3xl border border-primary-50 bg-primary-50/60 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="accent" soft>
                      {competency.bnccCode}
                    </Badge>
                    <span className="text-label-lg text-primary-600">{competency.mastery}%</span>
                  </div>
                  <p className="mt-2 text-body-sm text-neutral-700">{competency.competency}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card tone="neutral">
        <CardHeader>
          <CardTitle className="text-title-sm">Focos de acompanhamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {opportunities.length === 0 ? (
            <p className="text-body-sm text-neutral-500">
              Nenhum módulo exige atenção imediata. Siga celebrando as conquistas recentes!
            </p>
          ) : (
            <ul className="space-y-3">
              {opportunities.map((module) => (
                <li
                  key={module.id}
                  className="rounded-3xl border border-neutral-100 bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-lg text-neutral-500">{module.title}</span>
                    <span className="text-label-lg text-warning-600">{module.mastery}%</span>
                  </div>
                  <p className="mt-2 text-body-sm text-neutral-600">
                    Reserve um momento para reforçar evidências nesse módulo e registrar novas
                    tentativas.
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
