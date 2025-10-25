import clsx from "clsx";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProgressSummaryReward } from "@/lib/progress";

const rarityStyles: Record<string, { border: string; accent: string; glow: string }> = {
  COMMON: {
    border: "border-neutral-200",
    accent: "from-neutral-200 to-neutral-100",
    glow: "shadow-[0_0_24px_rgba(128,128,128,0.2)]",
  },
  RARE: {
    border: "border-sky-200",
    accent: "from-sky-200 via-sky-100 to-white",
    glow: "shadow-[0_0_26px_rgba(56,189,248,0.35)]",
  },
  EPIC: {
    border: "border-violet-200",
    accent: "from-violet-200 via-fuchsia-100 to-white",
    glow: "shadow-[0_0_28px_rgba(139,92,246,0.4)]",
  },
  LEGENDARY: {
    border: "border-amber-300",
    accent: "from-amber-200 via-yellow-100 to-white",
    glow: "shadow-[0_0_32px_rgba(250,204,21,0.45)]",
  },
};

const rarityLabel: Record<string, string> = {
  COMMON: "Comum",
  RARE: "Raro",
  EPIC: "Épico",
  LEGENDARY: "Lendário",
};

export interface RewardShelfProps {
  rewards: ProgressSummaryReward[];
}

export const RewardShelf = ({ rewards }: RewardShelfProps) => {
  const visibleRewards = rewards.slice(0, 6);

  return (
    <Card tone="default">
      <CardHeader className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle className="text-title-md">Coleção de recompensas</CardTitle>
          <p className="text-body-sm text-neutral-500">
            Celebre conquistas e acompanhe as próximas a desbloquear.
          </p>
        </div>
        <span className="rounded-full bg-primary-50 px-4 py-1 text-label-md text-primary-600">
          {rewards.length} conquistas
        </span>
      </CardHeader>
      <CardContent>
        {visibleRewards.length === 0 ? (
          <p className="text-body-sm text-neutral-500">
            Participe de atividades alinhadas à BNCC para começar a desbloquear medalhas e itens
            colecionáveis.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRewards.map((reward, index) => {
              const styles = rarityStyles[reward.rarity] ?? rarityStyles.COMMON;

              return (
                <article
                  key={reward.id}
                  className={clsx(
                    "group relative overflow-hidden rounded-4xl border bg-white/95 p-5 transition duration-500 hover:-translate-y-1 hover:rotate-[0.5deg]",
                    styles.border,
                    styles.glow && `hover:${styles.glow}`
                  )}
                >
                  <div
                    className={`absolute inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100 bg-gradient-to-br ${styles.accent}`}
                  />
                  <div className="relative flex flex-col gap-3">
                    <header className="flex items-center justify-between">
                      <span className="text-label-lg uppercase tracking-[0.08em] text-neutral-500">
                        {rarityLabel[reward.rarity] ?? reward.rarity}
                      </span>
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-label-md text-primary-600">
                        +{reward.xpAwarded} XP
                      </span>
                    </header>
                    <h3 className="text-title-sm font-semibold text-neutral-900">{reward.title}</h3>
                    <p className="text-body-sm text-neutral-500">
                      Desbloqueada em {new Date(reward.unlockedAt).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex flex-wrap gap-2 text-body-sm text-neutral-500">
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">
                        {reward.category}
                      </span>
                      {reward.levelAchieved ? (
                        <span className="rounded-full bg-secondary-100 px-3 py-1 text-secondary-700">
                          Nível {reward.levelAchieved}
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-white/20 to-white/0 opacity-0 blur-3xl transition group-hover:opacity-100"
                      aria-hidden="true"
                    />
                    <div
                      className="pointer-events-none absolute -bottom-8 left-1/2 h-20 w-32 -translate-x-1/2 rounded-full bg-primary-200/30 blur-2xl opacity-0 transition group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                    <div
                      className="absolute -inset-16 origin-center rotate-[-8deg] scale-0 animate-[spin_12s_linear_infinite] bg-[radial-gradient(circle,_rgba(255,255,255,0.12)_0,_rgba(255,255,255,0)_70%)] group-hover:scale-100"
                      style={{ animationDelay: `${index * 1.2}s` }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
