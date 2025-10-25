import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import clsx from "clsx";

export type ButtonVariant = "primary" | "secondary" | "game" | "ghost";
export type ButtonSize = "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  isLoading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white shadow-bubble hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-200",
  secondary:
    "border border-primary-100 bg-white text-primary-600 shadow-card hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-100",
  game: "border-2 border-secondary-400 bg-secondary-100 text-neutral-900 shadow-playful hover:bg-secondary-200 active:bg-secondary-300 focus-visible:ring-secondary-200 motion-safe:hover:animate-wiggle",
  ghost:
    "text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-100",
};

const sizeStyles: Record<ButtonSize, string> = {
  md: "text-body-md px-6 py-3",
  lg: "text-body-lg px-8 py-4",
};

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition ease-friendly focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const spinnerStyles = {
  primary: "border-white/80",
  secondary: "border-primary-500",
  game: "border-secondary-600",
  ghost: "border-primary-500",
} satisfies Record<ButtonVariant, string>;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth,
      leadingIcon,
      trailingIcon,
      isLoading,
      className,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={clsx(
                "inline-flex h-4 w-4 animate-spin-slow rounded-full border-[3px] border-t-transparent",
                spinnerStyles[variant]
              )}
            />
            <span>{children}</span>
          </span>
        ) : (
          <span className="flex items-center gap-3">
            {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
            <span>{children}</span>
            {trailingIcon ? <span aria-hidden="true">{trailingIcon}</span> : null}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
