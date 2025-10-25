import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/layouts/dashboard-shell";
import { EducatorDigestPanel } from "@/components/progress/educator-digest";
import { RewardToastLayer } from "@/components/progress/reward-toast-layer";
import { UpcomingGoals } from "@/components/progress/upcoming-goals";
import { getEducatorDigest } from "@/lib/progress";

interface EducatorProgressPageProps {
  params: {
    userId: string;
  };
}

export default async function EducatorProgressPage({ params }: EducatorProgressPageProps) {
  const digest = await getEducatorDigest(params.userId).catch(() => null);

  if (!digest) {
    notFound();
  }

  const navItems = [
    {
      label: "Progresso",
      href: `/progresso/${params.userId}`,
      active: false,
    },
    {
      label: "Visão do educador",
      href: `/progresso/${params.userId}/educador`,
      active: true,
    },
  ];

  return (
    <>
      <RewardToastLayer />
      <DashboardShell
        navItems={navItems}
        userName={digest.learner.displayName ?? "Estudante"}
        userRole="Educador"
        heroMessage="Use este resumo para orientar conversas com a família, planejar próximos passos e fortalecer a autonomia do estudante."
        highlightCards={[]}
        recommendations={[]}
        aside={<UpcomingGoals goals={digest.upcomingGoals} />}
      >
        <EducatorDigestPanel digest={digest} />
      </DashboardShell>
    </>
  );
}
