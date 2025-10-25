import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "@/components/ui/progress-bar";

const meta: Meta<typeof ProgressBar> = {
  title: "Componentes/Dados/Barra de progresso",
  component: ProgressBar,
  parameters: {
    layout: "centered",
  },
  args: {
    value: 64,
    label: "Missão da semana",
    helperText: "Faltam 2 atividades colaborativas para liberar o novo mundo.",
  },
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 5 },
    },
    showPercentage: {
      control: "boolean",
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Padrao: Story = {};

export const SemPercentual: Story = {
  args: {
    showPercentage: false,
    helperText: "Monitoramento reservado apenas para educadores.",
  },
};
