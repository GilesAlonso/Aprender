"use client";

import { useEffect, useMemo, useState } from "react";

import {
  subscribeToAnalytics,
  type AnalyticsEvent,
  type RewardUnlockedEvent,
} from "@/lib/analytics";

interface RewardToast {
  id: string;
  title: string;
  code: string;
  rarity: string;
  category: string;
  xpAwarded: number;
}

const TOAST_DURATION = 6000;

const rarityTone: Record<string, string> = {
  COMMON: "bg-neutral-900/90",
  RARE: "bg-sky-900/90",
  EPIC: "bg-violet-900/90",
  LEGENDARY: "bg-amber-900/90",
};

const playCelebrationTone = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return;
    }
    const context = new AudioCtx();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, context.currentTime + 0.35);

    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, context.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.65);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.7);

    setTimeout(() => {
      context.close().catch(() => {
        /* noop */
      });
    }, 900);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Não foi possível reproduzir o áudio da celebração", error);
    }
  }
};

const isReducedMotionPreferred = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const rewardToToast = (event: RewardUnlockedEvent): RewardToast => ({
  id: `${event.reward.id}-${event.timestamp ?? Date.now()}`,
  title: event.reward.title,
  code: event.reward.code,
  rarity: event.reward.rarity,
  category: event.reward.category,
  xpAwarded: event.reward.xpAwarded,
});

export const RewardToastLayer = () => {
  const [toasts, setToasts] = useState<RewardToast[]>([]);
  const reduceMotion = useMemo(() => isReducedMotionPreferred(), []);

  useEffect(() => {
    const unsubscribe = subscribeToAnalytics((event: AnalyticsEvent) => {
      if (event.type !== "reward_unlocked") {
        return;
      }

      setToasts((previous) => [...previous, rewardToToast(event)]);
      if (!reduceMotion) {
        playCelebrationTone();
      }
    });

    return unsubscribe;
  }, [reduceMotion]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((previous) => previous.filter((item) => item.id !== toast.id));
      }, TOAST_DURATION)
    );

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [toasts]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[1200] flex flex-col items-center gap-3 px-4">
      {toasts.map((toast) => {
        const tone = rarityTone[toast.rarity] ?? rarityTone.COMMON;

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="assertive"
            className={`pointer-events-auto w-full max-w-lg overflow-hidden rounded-3xl ${tone} px-5 py-4 text-white shadow-2xl ring-1 ring-white/20 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70`}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1 inline-flex h-3 w-3 flex-none rounded-full bg-white/80"
                aria-hidden="true"
              />
              <div className="flex-1 space-y-1">
                <p className="text-label-lg uppercase tracking-[0.08em] text-white/70">
                  {toast.category}
                </p>
                <p className="text-body-lg font-semibold">{toast.title}</p>
                <p className="text-body-sm text-white/70">
                  +{toast.xpAwarded} XP • {toast.rarity}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setToasts((previous) => previous.filter((item) => item.id !== toast.id))
                }
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-label-md text-white/80 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Fechar
              </button>
            </div>
            {!reduceMotion ? (
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
                <span className="block h-full w-full animate-[toastProgress_6s_linear_forwards] origin-left bg-white/70" />
              </div>
            ) : null}
          </div>
        );
      })}
      <style jsx global>{`
        @keyframes toastProgress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};
