import Link from "next/link";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { loadInteractiveDataset } from "@/lib/activities";

const typeLabel: Record<string, string> = {
  QUIZ: "Quiz",
  PUZZLE: "Quebra-cabeça",
  GAME: "Jogo",
};

export default function InteractiveActivitiesIndex() {
  const dataset = loadInteractiveDataset();

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <header className="mb-12 space-y-3 text-center">
        <h1 className="text-4xl font-bold text-neutral-900">Atividades interativas</h1>
        <p className="text-lg text-neutral-600">
          Explore experiências lúdicas em português com feedback imediato, alinhadas à BNCC.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {dataset.activities.map((activity) => (
          <Card key={activity.slug} tone="neutral" className="h-full justify-between">
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{typeLabel[activity.type] ?? activity.type}</Badge>
                <Badge variant="accent">BNCC {activity.bnccCode}</Badge>
                <Badge variant="neutral">{activity.difficulty}</Badge>
              </div>
              <CardTitle className="text-display-xs text-neutral-900">{activity.title}</CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <p className="text-body-sm text-neutral-600">{activity.bnccDescription}</p>
              <ul className="space-y-1 text-body-xs text-neutral-500">
                {activity.instructions.slice(0, 2).map((instruction, index) => (
                  <li key={`${activity.slug}-instruction-${index}`}>• {instruction}</li>
                ))}
              </ul>
              <Link
                href={`/atividades-interativas/${activity.slug}`}
                className="inline-flex items-center gap-2 text-body-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Abrir atividade
                <span aria-hidden="true">→</span>
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
