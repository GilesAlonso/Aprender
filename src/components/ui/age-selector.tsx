"use client";

import type { ReactNode } from "react";
import { useCallback, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { PuzzleIcon, RocketIcon, SparkIcon } from "./icons";

export interface AgeOption {
  id: string;
  faixa: string;
  label: string;
  description: string;
  icon?: ReactNode;
  accentColorClass?: string;
}

export interface AgeSelectorProps {
  name?: string;
  options?: AgeOption[];
  value?: string;
  onChange?: (option: AgeOption) => void;
  legend?: string;
  helperText?: string;
}

const DEFAULT_OPTIONS: AgeOption[] = [
  {
    id: "exploradores-6-8",
    faixa: "6 a 8 anos",
    label: "Exploradores",
    description: "Brincadeiras guiadas, histórias interativas e missões curtinhas.",
    icon: <SparkIcon className="h-9 w-9 text-secondary-500" aria-hidden="true" />,
    accentColorClass: "bg-secondary-100",
  },
  {
    id: "inventores-9-12",
    faixa: "9 a 12 anos",
    label: "Inventores",
    description: "Projetos colaborativos, desafios lógicos e construção de repertório.",
    icon: <PuzzleIcon className="h-9 w-9 text-primary-500" aria-hidden="true" />,
    accentColorClass: "bg-primary-100",
  },
  {
    id: "visionarios-13-17",
    faixa: "13 a 17 anos",
    label: "Visionários",
    description: "Trilhas para autonomia, debates e simuladores com propósito social.",
    icon: <RocketIcon className="h-9 w-9 text-accent-400" aria-hidden="true" />,
    accentColorClass: "bg-accent-100",
  },
];

export const AgeSelector = ({
  name = "faixa-etaria",
  options = DEFAULT_OPTIONS,
  value,
  onChange,
  legend = "Qual faixa etária devemos apoiar?",
  helperText = "Escolha a faixa principal: personalizaremos sugestões e linguagem automaticamente.",
}: AgeSelectorProps) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(options[0]?.id ?? "");
  const currentValue = isControlled ? value : internalValue;
  const groupId = useId();
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const handleSelect = useCallback(
    (option: AgeOption) => {
      if (!isControlled) {
        setInternalValue(option.id);
      }
      onChange?.(option);
    },
    [isControlled, onChange]
  );

  const focusByOffset = useCallback(
    (currentIndex: number, direction: number) => {
      const total = options.length;
      if (total === 0) {
        return;
      }
      const nextIndex = (currentIndex + direction + total) % total;
      optionRefs.current[nextIndex]?.focus();
      handleSelect(options[nextIndex]);
    },
    [handleSelect, options]
  );

  const helperId = useMemo(() => `${groupId}-hint`, [groupId]);

  return (
    <fieldset className="w-full rounded-4xl border border-primary-50 bg-white/90 p-6 shadow-card">
      <legend
        id={groupId}
        className="flex items-center gap-3 text-display-xs font-semibold text-neutral-900"
      >
        {legend}
      </legend>
      {helperText ? (
        <p id={helperId} className="mt-2 text-body-sm text-neutral-600">
          {helperText}
        </p>
      ) : null}

      <div
        role="radiogroup"
        aria-describedby={helperText ? helperId : undefined}
        aria-labelledby={groupId}
        className="mt-6 grid gap-4 md:grid-cols-3"
      >
        {options.map((option, index) => {
          const isActive = option.id === currentValue;

          return (
            <button
              key={option.id}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={isActive}
              name={name}
              data-testid={`age-option-${option.id}`}
              className={clsx(
                "flex h-full flex-col gap-4 rounded-3xl border px-5 py-6 text-left transition ease-friendly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200",
                isActive
                  ? "border-primary-300 bg-white shadow-bubble"
                  : "border-transparent bg-surface hover:border-primary-200 hover:bg-white"
              )}
              onClick={() => handleSelect(option)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  focusByOffset(index, 1);
                }
                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  focusByOffset(index, -1);
                }
                if (event.key === "Home") {
                  event.preventDefault();
                  optionRefs.current[0]?.focus();
                  handleSelect(options[0]);
                }
                if (event.key === "End") {
                  event.preventDefault();
                  optionRefs.current[options.length - 1]?.focus();
                  handleSelect(options[options.length - 1]);
                }
              }}
            >
              <span
                aria-hidden="true"
                className={clsx(
                  "inline-flex h-12 w-12 items-center justify-center rounded-2xl text-primary-600",
                  option.accentColorClass ?? "bg-primary-100",
                  isActive && "shadow-bubble"
                )}
              >
                {option.icon}
              </span>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-pill bg-neutral-100 px-3 py-1 text-label-sm font-semibold uppercase tracking-[0.08em] text-neutral-600">
                  {option.faixa}
                  {isActive ? (
                    <span
                      className="inline-flex h-2 w-2 rounded-full bg-primary-500"
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <div className="space-y-1">
                  <span className="block text-body-lg font-semibold text-neutral-900">
                    {option.label}
                  </span>
                  <p className="text-body-sm text-neutral-600">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
};
