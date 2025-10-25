import type { HTMLAttributes } from "react";
import clsx from "clsx";
import { StarIcon } from "./icons";

export type BadgeVariant = "info" | "success" | "warning" | "neutral" | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  soft?: boolean;
}

const badgeStyles: Record<BadgeVariant, string> = {
  info: "bg-calm-100 text-calm-700",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  neutral: "bg-neutral-100 text-neutral-700",
  accent: "bg-accent-100 text-accent-700",
};

export const Badge = ({ variant = "info", soft, className, children, ...props }: BadgeProps) => (
  <span
    className={clsx(
      "inline-flex items-center gap-2 rounded-pill px-4 py-1 text-label-lg font-semibold uppercase tracking-[0.08em] transition ease-friendly",
      soft ? "bg-white/80 text-neutral-700" : badgeStyles[variant],
      className
    )}
    {...props}
  >
    {children}
  </span>
);

export type RewardLevel = "bronze" | "prata" | "ouro";

export interface RewardChipProps extends HTMLAttributes<HTMLDivElement> {
  level?: RewardLevel;
  points?: number;
  label?: string;
}

const rewardStyles: Record<RewardLevel, { container: string; icon: string }> = {
  bronze: {
    container: "bg-[#f6e2c4] text-[#8a5a1d]",
    icon: "text-[#c7842f]",
  },
  prata: {
    container: "bg-[#e7ecf6] text-[#4a5b7a]",
    icon: "text-[#7f8fb4]",
  },
  ouro: {
    container: "bg-[#ffe7ad] text-[#8a6000]",
    icon: "text-[#f3a600]",
  },
};

export const RewardChip = ({
  level = "ouro",
  points,
  label = "Recompensa",
  className,
  ...props
}: RewardChipProps) => (
  <div
    role="status"
    className={clsx(
      "inline-flex items-center gap-3 rounded-3xl px-5 py-2 text-body-sm font-semibold shadow-card",
      rewardStyles[level].container,
      className
    )}
    {...props}
  >
    <StarIcon
      aria-hidden="true"
      className={clsx("h-6 w-6 drop-shadow-badge", rewardStyles[level].icon)}
    />
    <div className="flex flex-col leading-tight">
      <span className="text-label-lg uppercase tracking-[0.08em]">{label}</span>
      {typeof points === "number" ? <span>{points} pontos</span> : null}
    </div>
  </div>
);
