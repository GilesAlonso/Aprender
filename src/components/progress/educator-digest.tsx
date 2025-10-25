import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EducatorDigest } from "@/lib/progress";

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export interface EducatorDigestProps {
  digest: EducatorDigest;
}

export const EducatorDigestPanel = ({ digest }: EducatorDigestProps) => (
  <div className="space-y-6">
    <Card tone="highlight">
      <CardHeader className="space-y-2">
        <Badge variant="accent" soft>
          Resumo para educadores
        </Badge>
        <CardTitle className="text-title-lg">
          {digest.learner.displayName ?? "Estudante"} — Nível {digest.learner.level}
        </CardTitle>
        <p className="text-body-sm text-neutral-600">
          Faltam {digest.learner.xpToNext.toLocaleString("pt-BR")} XP para o próximo nível. Maestria
          média atual em módulos: {digest.learner.masteryAverage}%.
        </p>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 text-center shadow-sm">
            <dt className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
              Módulos concluídos
            </dt>
            <dd className="text-display-xs font-semibold text-primary-600">
              {digest.learner.completedModules}
            </dd>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 text-center shadow-sm">
            <dt className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
              Série de acertos
            </dt>
            <dd className="text-display-xs font-semibold text-secondary-600">
              {digest.learner.currentStreak}
            </dd>
          </div>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-4 text-center shadow-sm">
            <dt className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
              Recompensas ativas
            </dt>
            <dd className="text-display-xs font-semibold text-neutral-900">
              {digest.learner.rewardCount}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>

    <div className="grid gap-6 lg:grid-cols-2">
      <Card tone="default">
        <CardHeader>
          <CardTitle className="text-title-md">Competências de destaque</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {digest.strengths.length === 0 ? (
            <p className="text-body-sm text-neutral-500">
              Ainda não há competências com alto domínio. Utilize as metas sugeridas para planejar
              ações personalizadas.
            </p>
          ) : (
            <ul className="space-y-3">
              {digest.strengths.map((item) => (
                <li
                  key={item.bnccCode}
                  className="rounded-3xl border border-primary-100 bg-primary-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="accent">{item.bnccCode}</Badge>
                    <span className="text-label-lg text-primary-600">{item.mastery}%</span>
                  </div>
                  <p className="mt-2 text-body-sm text-neutral-700">{item.competency}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card tone="neutral">
        <CardHeader>
          <CardTitle className="text-title-md">Focos prioritários</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {digest.focusAreas.length === 0 ? (
            <p className="text-body-sm text-neutral-500">
              Nenhum módulo está abaixo de 70% de maestria. Continue oferecendo desafios ampliados.
            </p>
          ) : (
            <ul className="space-y-3">
              {digest.focusAreas.map((item) => (
                <li
                  key={item.moduleId}
                  className="rounded-3xl border border-neutral-100 bg-white/90 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-label-lg text-neutral-600">{item.title}</span>
                    <span className="text-label-lg text-warning-600">{item.mastery}%</span>
                  </div>
                  <p className="mt-2 text-body-sm text-neutral-600">{item.recommendation}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>

    <Card tone="default">
      <CardHeader>
        <CardTitle className="text-title-md">Recomendações práticas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {digest.recommendations.length === 0 ? (
          <p className="text-body-sm text-neutral-500">
            As recomendações serão atualizadas conforme novas atividades forem registradas.
          </p>
        ) : (
          <ul className="space-y-2">
            {digest.recommendations.map((recommendation, index) => (
              <li key={`${recommendation}-${index}`} className="flex items-start gap-3">
                <span
                  className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-primary-500"
                  aria-hidden="true"
                />
                <span className="text-body-sm text-neutral-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>

    <Card tone="neutral">
      <CardHeader>
        <CardTitle className="text-title-md">Recompensas recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {digest.recentRewards.length === 0 ? (
          <p className="text-body-sm text-neutral-500">
            As próximas conquistas aparecerão aqui assim que forem desbloqueadas.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {digest.recentRewards.map((reward) => (
              <li key={reward.id} className="rounded-3xl border border-neutral-100 bg-white/80 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-label-lg text-neutral-500">{reward.category}</span>
                  <Badge variant="accent" soft>
                    {reward.rarity}
                  </Badge>
                </div>
                <p className="mt-2 text-body-sm font-semibold text-neutral-900">{reward.title}</p>
                <p className="text-body-xs text-neutral-500">{formatDate(reward.unlockedAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  </div>
);
