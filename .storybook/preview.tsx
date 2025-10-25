import type { Preview } from "@storybook/react";
import { useEffect } from "react";
import type { ReactNode } from "react";
import "../src/app/globals.css";

type MotionToggleProps = {
  prefersReduced: boolean;
  children: ReactNode;
};

const MotionToggle = ({ prefersReduced, children }: MotionToggleProps) => {
  useEffect(() => {
    const { documentElement, body } = document;
    if (prefersReduced) {
      documentElement.style.setProperty("scroll-behavior", "auto");
      body.dataset.motion = "reduce";
    } else {
      documentElement.style.removeProperty("scroll-behavior");
      delete body.dataset.motion;
    }
  }, [prefersReduced]);

  return (
    <div className="min-h-screen bg-surface-100 px-gutter-lg py-section-sm">
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </div>
  );
};

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "Neve suave",
      values: [
        { name: "Neve suave", value: "#f9fafc" },
        { name: "Aurora", value: "#fff6eb" },
        { name: "Céu fresco", value: "#ecfcff" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: "centered",
    viewport: {
      viewports: {
        xxs: {
          name: "Mobile pequeno",
          styles: { width: "320px", height: "640px" },
        },
        xs: {
          name: "Mobile largo",
          styles: { width: "414px", height: "780px" },
        },
        md: {
          name: "Tablet",
          styles: { width: "768px", height: "1024px" },
        },
        lg: {
          name: "Desktop",
          styles: { width: "1280px", height: "720px" },
        },
      },
    },
    options: {
      storySort: {
        order: ["Fundamentos", "Componentes", "Layouts"],
      },
    },
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
      options: {
        element: "#storybook-root",
        manual: false,
      },
    },
  },
  decorators: [
    (Story, context) => (
      <MotionToggle prefersReduced={Boolean(context.globals.reduceMotion)}>
        <Story />
      </MotionToggle>
    ),
  ],
  globalTypes: {
    reduceMotion: {
      name: "Movimento reduzido",
      description: "Simula usuários que preferem menos animação",
      defaultValue: false,
      toolbar: {
        icon: "contrast",
        items: [
          { value: false, title: "Movimento padrão" },
          { value: true, title: "Reduzir movimento" },
        ],
      },
    },
  },
};

export default preview;
