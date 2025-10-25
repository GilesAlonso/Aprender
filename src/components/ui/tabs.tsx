"use client";

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";

type TabsOrientation = "horizontal" | "vertical";

interface TabsContextValue {
  activeValue: string;
  setActiveValue: (value: string) => void;
  registerTrigger: (value: string, node: HTMLButtonElement | null) => void;
  focusByOffset: (offset: number) => void;
  focusFirst: () => void;
  focusLast: () => void;
  orientation: TabsOrientation;
  getTabId: (value: string) => string;
  getPanelId: (value: string) => string;
  label?: string;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

export interface TabsProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  label?: string;
}

export const Tabs = ({
  children,
  value,
  defaultValue,
  onValueChange,
  orientation = "horizontal",
  label,
}: TabsProps) => {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const activeValue = isControlled ? value : internalValue;
  const id = useId();

  const tabsOrder = useRef<string[]>([]);
  const nodeMap = useRef(new Map<string, HTMLButtonElement>());

  const setActiveValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setInternalValue(nextValue);
      }
      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange]
  );

  const registerTrigger = useCallback((tabValue: string, node: HTMLButtonElement | null) => {
    if (node) {
      nodeMap.current.set(tabValue, node);
      const existingIndex = tabsOrder.current.indexOf(tabValue);
      if (existingIndex === -1) {
        tabsOrder.current.push(tabValue);
      }
    } else {
      nodeMap.current.delete(tabValue);
      tabsOrder.current = tabsOrder.current.filter((valueKey) => valueKey !== tabValue);
    }
  }, []);

  const focusTab = useCallback(
    (nextValue: string) => {
      const node = nodeMap.current.get(nextValue);
      if (node) {
        node.focus();
      }
      setActiveValue(nextValue);
    },
    [setActiveValue]
  );

  const focusByOffset = useCallback(
    (offset: number) => {
      if (tabsOrder.current.length === 0) {
        return;
      }
      const currentIndex = activeValue ? tabsOrder.current.indexOf(activeValue) : 0;
      const safeIndex = currentIndex === -1 ? 0 : currentIndex;
      const nextIndex = (safeIndex + offset + tabsOrder.current.length) % tabsOrder.current.length;
      const nextValue = tabsOrder.current[nextIndex];
      if (nextValue) {
        focusTab(nextValue);
      }
    },
    [activeValue, focusTab]
  );

  const focusFirst = useCallback(() => {
    const firstValue = tabsOrder.current[0];
    if (firstValue) {
      focusTab(firstValue);
    }
  }, [focusTab]);

  const focusLast = useCallback(() => {
    const lastValue = tabsOrder.current[tabsOrder.current.length - 1];
    if (lastValue) {
      focusTab(lastValue);
    }
  }, [focusTab]);

  useEffect(() => {
    if (!activeValue && tabsOrder.current.length > 0) {
      setActiveValue(tabsOrder.current[0]);
    }
  }, [activeValue, setActiveValue]);

  const sanitizeValue = useCallback(
    (rawValue: string) => rawValue.replace(/[^a-z0-9_-]/gi, "-"),
    []
  );

  const getTabId = useCallback(
    (tabValue: string) => `${id}-tab-${sanitizeValue(tabValue)}`,
    [id, sanitizeValue]
  );

  const getPanelId = useCallback(
    (tabValue: string) => `${id}-panel-${sanitizeValue(tabValue)}`,
    [id, sanitizeValue]
  );

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      activeValue: activeValue ?? "",
      setActiveValue,
      registerTrigger,
      focusByOffset,
      focusFirst,
      focusLast,
      orientation,
      getTabId,
      getPanelId,
      label,
    }),
    [
      activeValue,
      focusByOffset,
      focusFirst,
      focusLast,
      getPanelId,
      getTabId,
      label,
      orientation,
      registerTrigger,
      setActiveValue,
    ]
  );

  return <TabsContext.Provider value={contextValue}>{children}</TabsContext.Provider>;
};

const useTabsContext = (component: string) => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error(`${component} deve ser usado dentro de <Tabs />`);
  }
  return context;
};

export const TabsList = ({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { focusByOffset, focusFirst, focusLast, orientation, label } = useTabsContext("TabsList");

  return (
    <div
      role="tablist"
      aria-label={label}
      aria-orientation={orientation}
      className={clsx(
        "flex gap-2 rounded-pill bg-surface-200/80 p-1 text-label-lg",
        orientation === "vertical" && "flex-col",
        className
      )}
      onKeyDown={(event) => {
        switch (event.key) {
          case "ArrowRight":
            if (orientation === "horizontal") {
              event.preventDefault();
              focusByOffset(1);
            }
            break;
          case "ArrowLeft":
            if (orientation === "horizontal") {
              event.preventDefault();
              focusByOffset(-1);
            }
            break;
          case "ArrowDown":
            if (orientation === "vertical") {
              event.preventDefault();
              focusByOffset(1);
            }
            break;
          case "ArrowUp":
            if (orientation === "vertical") {
              event.preventDefault();
              focusByOffset(-1);
            }
            break;
          case "Home":
            event.preventDefault();
            focusFirst();
            break;
          case "End":
            event.preventDefault();
            focusLast();
            break;
          default:
            break;
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export interface TabsTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  leadingIcon?: ReactNode;
}

export const TabsTrigger = ({
  value,
  leadingIcon,
  className,
  children,
  ...props
}: TabsTriggerProps) => {
  const { activeValue, setActiveValue, registerTrigger, getPanelId, getTabId } =
    useTabsContext("TabsTrigger");
  const isActive = activeValue === value;
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    registerTrigger(value, buttonRef.current);
    return () => {
      registerTrigger(value, null);
    };
  }, [registerTrigger, value]);

  return (
    <button
      ref={buttonRef}
      role="tab"
      type="button"
      id={getTabId(value)}
      aria-controls={getPanelId(value)}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      className={clsx(
        "flex min-h-[3rem] flex-1 items-center justify-center gap-2 rounded-pill px-4 py-2 font-semibold transition ease-friendly",
        isActive
          ? "bg-white text-primary-700 shadow-card"
          : "bg-transparent text-neutral-500 hover:bg-white/70 hover:text-primary-600",
        className
      )}
      onClick={(event) => {
        props.onClick?.(event);
        setActiveValue(value);
      }}
      {...props}
    >
      {leadingIcon ? <span aria-hidden="true">{leadingIcon}</span> : null}
      <span>{children}</span>
    </button>
  );
};

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = ({ value, className, children, ...props }: TabsContentProps) => {
  const { activeValue, getPanelId, getTabId } = useTabsContext("TabsContent");
  const isActive = activeValue === value;

  return (
    <div
      role="tabpanel"
      id={getPanelId(value)}
      aria-labelledby={getTabId(value)}
      hidden={!isActive}
      className={clsx(
        "mt-4 rounded-3xl border border-primary-50 bg-white p-6 shadow-card transition ease-friendly",
        !isActive && "pointer-events-none select-none opacity-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
