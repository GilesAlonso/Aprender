import type { HTMLAttributes, PropsWithChildren } from "react";
import clsx from "clsx";

export type CardTone = "default" | "highlight" | "calm" | "neutral";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  interactive?: boolean;
  subduedBorder?: boolean;
}

const toneStyles: Record<CardTone, string> = {
  default: "bg-surface shadow-card border border-primary-50",
  highlight: "bg-primary-50/80 border border-primary-100",
  calm: "bg-calm-50/80 border border-calm-100",
  neutral: "bg-white border border-neutral-200",
};

const Card = ({
  tone = "default",
  interactive,
  subduedBorder,
  className,
  children,
  ...props
}: PropsWithChildren<CardProps>) => (
  <div
    className={clsx(
      "group relative flex flex-col gap-4 rounded-3xl p-6 transition ease-friendly",
      toneStyles[tone],
      interactive &&
        "hover:-translate-y-1 hover:shadow-bubble focus-within:-translate-y-1 focus-within:shadow-bubble",
      subduedBorder && "border-dashed",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("flex flex-col gap-2", className)} {...props} />
);

const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={clsx("text-display-xs font-semibold text-neutral-900", className)} {...props} />
);

const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={clsx("text-body-sm text-neutral-600", className)} {...props} />
);

const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("flex flex-col gap-3", className)} {...props} />
);

const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("mt-auto flex flex-wrap items-center gap-3", className)} {...props} />
);

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
