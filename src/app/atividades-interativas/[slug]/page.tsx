import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { InteractiveActivity as InteractiveActivityPlayer } from "@/components/activities";
import { getInteractiveActivityBySlug } from "@/lib/activities";

const typeLabel: Record<string, string> = {
  QUIZ: "Quiz",
  PUZZLE: "Quebra-cabeça",
  GAME: "Jogo",
};

interface ActivityPageProps {
  params: {
    slug: string;
  };
}

export default function InteractiveActivityPage({ params }: ActivityPageProps) {
  const activity = getInteractiveActivityBySlug(params.slug);

  if (!activity) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <nav>
        <Link
          href="/atividades-interativas"
          className="inline-flex items-center gap-2 text-body-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          ← Voltar para catálogo
        </Link>
      </nav>

      <Card tone="neutral" className="gap-4">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="info">{typeLabel[activity.type] ?? activity.type}</Badge>
            <Badge variant="accent">BNCC {activity.bnccCode}</Badge>
            <Badge variant="neutral">{activity.contentModuleSlug}</Badge>
          </div>
          <CardTitle className="text-display-sm text-neutral-900">{activity.title}</CardTitle>
        </CardHeader>
        <CardContent className="gap-3 text-body-sm text-neutral-600">
          <p>{activity.bnccDescription}</p>
          <p>
            Atividade vinculada ao módulo <strong>{activity.contentModuleSlug}</strong> e à proposta pedagógica{" "}
            <strong>{activity.activitySlug}</strong>.
          </p>
        </CardContent>
      </Card>

      <InteractiveActivityPlayer activity={activity} autoStart />
    </main>
  );
}
