"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import type { ButtonVariant } from "./button";
import { Button } from "./button";

interface ModalAction {
  label: string;
  onClick: () => void;
  variant?: Exclude<ButtonVariant, "game">;
  icon?: ReactNode;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;
  size?: "sm" | "md" | "lg";
  hideCloseButton?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  size = "md",
  hideCloseButton,
}: ModalProps) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElementRef = useRef<Element | null>(null);
  const [portalElement, setPortalElement] = useState<Element | null>(null);
  const headingId = useId();
  const descriptionId = description ? `${headingId}-description` : undefined;

  useEffect(() => {
    const elementId = "app-modal-root";
    let element = document.getElementById(elementId);
    let created = false;

    if (!element) {
      element = document.createElement("div");
      element.setAttribute("id", elementId);
      document.body.appendChild(element);
      created = true;
    }

    setPortalElement(element);

    return () => {
      if (created && element?.parentNode) {
        element.parentNode.removeChild(element);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    lastFocusedElementRef.current = document.activeElement;
    const dialogNode = dialogRef.current;
    const focusableItems = dialogNode?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    focusableItems?.[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab" && focusableItems && focusableItems.length > 0) {
        const focusable = Array.from(focusableItems).filter(
          (item) => !item.hasAttribute("disabled")
        );
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const activeElement = document.activeElement;

        if (event.shiftKey) {
          if (activeElement === first) {
            event.preventDefault();
            last.focus();
          }
        } else if (activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
      if (lastFocusedElementRef.current instanceof HTMLElement) {
        lastFocusedElementRef.current.focus({ preventScroll: true });
      }
    };
  }, [onClose, open]);

  if (!portalElement) {
    return null;
  }

  if (!open) {
    return null;
  }

  const sizeClass = {
    sm: "max-w-lg",
    md: "max-w-2xl",
    lg: "max-w-3xl",
  }[size];

  const modal = (
    <div
      ref={overlayRef}
      aria-hidden={!open}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-neutral-900/40 px-gutter-lg py-10 backdrop-blur-sm transition"
      onClick={(event) => {
        if (event.target === overlayRef.current) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
        className={clsx(
          "w-full rounded-4xl border border-primary-50 bg-white p-6 shadow-bubble",
          "transition ease-friendly animate-fade-slide-up",
          sizeClass
        )}
      >
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 id={headingId} className="text-display-sm font-semibold text-neutral-900">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-body-sm text-neutral-600">
                {description}
              </p>
            ) : null}
          </div>
          {hideCloseButton ? null : (
            <Button
              variant="ghost"
              aria-label="Fechar janela"
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-neutral-100/60 p-0 text-neutral-500 hover:text-neutral-700"
            >
              ×
            </Button>
          )}
        </header>

        <div className="mt-5 space-y-4 text-body-sm text-neutral-600">{children}</div>

        {primaryAction || secondaryAction ? (
          <footer className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
            {secondaryAction ? (
              <Button
                variant={secondaryAction.variant ?? "secondary"}
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            ) : null}
            {primaryAction ? (
              <Button variant={primaryAction.variant ?? "primary"} onClick={primaryAction.onClick}>
                {primaryAction.label}
              </Button>
            ) : null}
          </footer>
        ) : null}
      </div>
    </div>
  );

  return createPortal(modal, portalElement);
};
