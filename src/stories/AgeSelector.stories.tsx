import type { Meta, StoryObj } from "@storybook/react";
import { AgeSelector } from "@/components/ui/age-selector";

const meta: Meta<typeof AgeSelector> = {
  title: "Componentes/Formulários/Seletor de faixa etária",
  component: AgeSelector,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof AgeSelector>;

export const Padrao: Story = {};

export const Personalizado: Story = {
  args: {
    legend: "Qual fase de estudos vamos acompanhar?",
    helperText: "Você pode escolher mais de uma faixa ao longo da jornada.",
  },
};
