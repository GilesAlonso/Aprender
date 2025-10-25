"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "./button";
import { SparkIcon } from "./icons";

export interface NavigationItem {
  label: string;
  href: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  active?: boolean;
  ariaLabel?: string;
}

export interface ResponsiveNavProps {
  items: NavigationItem[];
  currentHref?: string;
  ariaLabel?: string;
  brand?: {
    name: string;
    tagline?: string;
    logo?: ReactNode;
    href?: string;
  };
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: ReactNode;
  localeSwitcher?: ReactNode;
  onMenuToggle?: (open: boolean) => void;
}

export const ResponsiveNav = ({
  items,
  currentHref,
  ariaLabel = "Navegação principal",
  brand = {
    name: "Aprender",
    tagline: "Educação criativa para todas as infâncias",
    logo: <SparkIcon className="h-8 w-8 text-primary-500" aria-hidden="true" />,
    href: "/",
  },
  primaryAction,
  secondaryAction,
  localeSwitcher,
  onMenuToggle,
}: ResponsiveNavProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);
  const previousOverflow = useRef<string | null>(null);

  const activeHref = useMemo(() => {
    const directActive = items.find((item) => item.active)?.href;
    if (directActive) {
      return directActive;
    }
    return currentHref;
  }, [currentHref, items]);

  useEffect(() => {
    if (isOpen) {
      previousOverflow.current = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      firstLinkRef.current?.focus({ preventScroll: true });
    } else if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        onMenuToggle?.(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
        onMenuToggle?.(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, onMenuToggle]);

  const toggleMenu = () => {
    setIsOpen((previous) => {
      const next = !previous;
      onMenuToggle?.(next);
      return next;
    });
  };

  const closeMenu = () => {
    setIsOpen(false);
    onMenuToggle?.(false);
  };

  const renderNavLink = (item: NavigationItem, index: number, linkRole?: string) => {
    const isActive = activeHref === item.href;

    return (
      <Link
        ref={index === 0 ? firstLinkRef : null}
        href={item.href}
        aria-label={item.ariaLabel ?? item.label}
        role={linkRole}
        className={clsx(
          "flex w-full flex-col gap-1 rounded-3xl px-4 py-3 transition ease-friendly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 lg:flex-row lg:items-center lg:justify-center",
          isActive
            ? "bg-primary-100 text-primary-700 shadow-card"
            : "text-neutral-600 hover:bg-primary-50 hover:text-primary-600"
        )}
        onClick={closeMenu}
      >
        <span className="flex items-center gap-3 text-body-md font-semibold">
          {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
          {item.label}
          {item.badge ? (
            <span className="inline-flex items-center rounded-pill bg-accent-100 px-2 py-0.5 text-label-sm font-semibold uppercase tracking-[0.08em] text-accent-600">
              {item.badge}
            </span>
          ) : null}
        </span>
        {item.description ? (
          <span className="text-sm text-neutral-500 lg:ml-3 lg:text-left">{item.description}</span>
        ) : null}
      </Link>
    );
  };

  return (
    <nav
      className="relative rounded-3xl border border-primary-50 bg-white/85 px-4 py-3 shadow-card backdrop-blur"
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {brand.logo ? (
            brand.href ? (
              <Link href={brand.href} className="flex items-center" onClick={closeMenu}>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-card">
                  {brand.logo}
                </span>
              </Link>
            ) : (
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 shadow-card">
                {brand.logo}
              </span>
            )
          ) : null}
          <div className="flex flex-col">
            <span className="text-body-md font-semibold text-neutral-900">{brand.name}</span>
            {brand.tagline ? (
              <span className="text-label-md text-neutral-500">{brand.tagline}</span>
            ) : null}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          {localeSwitcher}
          {secondaryAction}
          {primaryAction ? (
            <Link
              href={primaryAction.href}
              className="inline-flex items-center justify-center gap-2 rounded-pill bg-primary-500 px-6 py-3 text-body-md font-semibold text-white shadow-bubble transition ease-friendly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:bg-primary-600 active:bg-primary-700"
              onClick={closeMenu}
            >
              {primaryAction.label}
            </Link>
          ) : null}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {localeSwitcher}
          <Button
            variant="secondary"
            className="h-12 w-12 rounded-2xl p-0 text-neutral-700"
            aria-expanded={isOpen}
            aria-controls={menuId}
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            onClick={toggleMenu}
          >
            {isOpen ? "×" : "≡"}
          </Button>
        </div>
      </div>

      <div className="mt-4 hidden lg:block">
        <ul className="grid grid-cols-4 gap-2">
          {items.map((item, index) => (
            <li key={item.href} className="w-full">
              {renderNavLink(item, index)}
            </li>
          ))}
        </ul>
      </div>

      {isOpen ? (
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[998] flex items-center justify-center bg-neutral-900/25 px-gutter py-10 backdrop-blur-sm lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeMenu();
            }
          }}
        >
          <div className="w-full max-w-xl rounded-4xl border border-primary-50 bg-white p-6 shadow-bubble">
            <ul className="flex flex-col gap-2" role="menu">
              {items.map((item, index) => (
                <li key={item.href} role="none">
                  {renderNavLink(item, index, "menuitem")}
                </li>
              ))}
            </ul>
            {primaryAction ? (
              <div className="mt-6">
                <Link
                  href={primaryAction.href}
                  onClick={closeMenu}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-pill bg-primary-500 px-6 py-3 text-body-md font-semibold text-white shadow-bubble transition ease-friendly focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-200 focus-visible:ring-offset-2 focus-visible:ring-offset-white hover:bg-primary-600 active:bg-primary-700"
                >
                  {primaryAction.label}
                </Link>
              </div>
            ) : null}
            {secondaryAction ? <div className="mt-4">{secondaryAction}</div> : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
};
