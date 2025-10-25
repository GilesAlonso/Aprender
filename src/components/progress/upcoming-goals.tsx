import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProgressUpcomingGoal } from "@/lib/progress";

const goalTone: Record<
  ProgressUpcomingGoal["type"],
  { label: string; badgeVariant: "info" | "accent" | "warning" }
> = {
  module: { label: "Módulo", badgeVariant: "accent" },
  competency: { label: "Competência", badgeVariant: "info" },
  streak: { label: "Sequência", badgeVariant: "warning" },
};

export interface UpcomingGoalsProps {
  goals: ProgressUpcomingGoal[];
}

export const UpcomingGoals = ({ goals }: UpcomingGoalsProps) => {
  if (goals.length === 0) {
    return (
      <Card tone="neutral">
        <CardHeader>
          <CardTitle className="text-title-md">Próximas metas</CardTitle>
        </CardHeader>
        <CardContent className="text-body-sm text-neutral-500">
          Nada por aqui por enquanto. Continue explorando atividades para receber novas sugestões
          personalizadas.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card tone="neutral">
      <CardHeader className="space-y-2">
        <CardTitle className="text-title-md">Próximas metas</CardTitle>
        <p className="text-body-sm text-neutral-500">
          Um conjunto de objetivos rápidos para manter o ritmo de aprendizagem.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => {
            const tone = goalTone[goal.type];
            const progressPercent = Math.min(100, Math.round((goal.progress / goal.target) * 100));

            return (
              <li
                key={goal.id}
                className="group relative overflow-hidden rounded-3xl border border-neutral-100 bg-white/90 p-4 shadow-card transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={tone.badgeVariant}>{tone.label}</Badge>
                  <span className="text-label-lg text-neutral-400">{progressPercent}%</span>
                </div>
                <h3 className="mt-3 text-body-lg font-semibold text-neutral-900">{goal.title}</h3>
                <p className="mt-2 text-body-sm text-neutral-500">{goal.description}</p>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-primary-400 to-secondary-400 transition-[width] duration-700 ease-friendly"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
};
