import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { CompetencyHighlights } from "@/components/progress/competency-highlights";
import { ProgressOverview } from "@/components/progress/progress-overview";
import { RewardShelf } from "@/components/progress/reward-shelf";
import { RewardToastLayer } from "@/components/progress/reward-toast-layer";
import { UpcomingGoals } from "@/components/progress/upcoming-goals";
import { getProgressSummary } from "@/lib/progress";

interface LearnerProgressPageProps {
  params: {
    userId: string;
  };
}

export default async function LearnerProgressPage({ params }: LearnerProgressPageProps) {
  const summary = await getProgressSummary(params.userId).catch(() => null);

  if (!summary) {
    notFound();
  }

  const navItems = [
    {
      label: "Progresso",
      href: `/progresso/${params.userId}`,
      active: true,
    },
    {
      label: "Visão do educador",
      href: `/progresso/${params.userId}/educador`,
      active: false,
    },
  ];

  const leadCompetency = summary.competencies[0];
  const leadModule = [...summary.modules].sort((a, b) => b.mastery - a.mastery)[0];

  const highlightCards = [
    {
      title: "Rumo ao próximo nível",
      description: `Faltam ${summary.user.xpToNext.toLocaleString("pt-BR")} XP para destravar novos desafios.`,
      progress: summary.user.xpProgressPercent,
      ctaLabel: "Registrar tentativa",
    },
    leadCompetency && leadModule
      ? {
          title: `Destaque: ${leadCompetency.bnccCode}`,
          description: leadCompetency.competency,
          progress: leadModule.mastery,
          ctaLabel: "Revisar módulo",
        }
      : undefined,
  ].filter(Boolean) as Array<{
    title: string;
    description: string;
    progress: number;
    ctaLabel: string;
  }>;

  const recommendationCards = summary.upcomingGoals.slice(0, 2).map((goal) => ({
    title: goal.title,
    description: goal.description,
    tag: `${goal.progress}%`,
  }));

  return (
    <>
      <RewardToastLayer />
      <DashboardShell
        navItems={navItems}
        userName={summary.user.displayName ?? "Estudante"}
        userRole="Estudante"
        heroMessage="Acompanhe seu progresso em tempo real e descubra quais metas estão mais próximas de serem concluídas."
        highlightCards={highlightCards}
        recommendations={recommendationCards}
        aside={
          <CompetencyHighlights competencies={summary.competencies} modules={summary.modules} />
        }
      >
        <div className="space-y-6">
          <ProgressOverview summary={summary} />
          <UpcomingGoals goals={summary.upcomingGoals} />
          <RewardShelf rewards={summary.rewards} />
        </div>
      </DashboardShell>
    </>
  );
}
