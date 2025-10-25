import type { HTMLAttributes } from "react";
import clsx from "clsx";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  label?: string;
  helperText?: string;
  showPercentage?: boolean;
}

export const ProgressBar = ({
  value,
  max = 100,
  label,
  helperText,
  showPercentage = true,
  className,
  ...props
}: ProgressBarProps) => {
  const safeMax = max <= 0 ? 1 : max;
  const safeValue = Math.min(Math.max(value, 0), safeMax);
  const percent = Math.round((safeValue / safeMax) * 100);

  return (
    <div className={clsx("flex flex-col gap-2", className)} {...props}>
      <div className="flex items-center justify-between gap-3">
        {label ? (
          <span className="text-label-lg uppercase tracking-[0.08em] text-neutral-600">
            {label}
          </span>
        ) : null}
        {showPercentage ? (
          <span className="text-body-sm font-semibold text-primary-600" aria-live="polite">
            {percent}%
          </span>
        ) : null}
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        className="relative h-3 w-full overflow-hidden rounded-pill bg-neutral-100"
      >
        <span
          className="block h-full rounded-pill bg-gradient-to-r from-primary-400 to-secondary-400 transition-[width] duration-500 ease-friendly"
          style={{ width: `${percent}%` }}
        >
          <span className="sr-only">{percent}% concluído</span>
        </span>
      </div>
      {helperText ? <p className="text-body-sm text-neutral-500">{helperText}</p> : null}
    </div>
  );
};
