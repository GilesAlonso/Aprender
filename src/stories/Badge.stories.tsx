import type { Meta, StoryObj } from "@storybook/react";
import { Badge, RewardChip } from "@/components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "Componentes/Indicadores/Badges",
  component: Badge,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Novidade",
    variant: "info",
  },
  argTypes: {
    variant: {
      options: ["info", "success", "warning", "neutral", "accent"],
      control: { type: "inline-radio" },
    },
    soft: {
      control: "boolean",
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Variacoes: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-3">
      <Badge {...args}>Info</Badge>
      <Badge {...args} variant="success">
        Meta batida
      </Badge>
      <Badge {...args} variant="warning">
        Atenção
      </Badge>
      <Badge {...args} variant="accent">
        Evento
      </Badge>
    </div>
  ),
};

export const Recompensa: StoryObj<typeof Badge> = {
  name: "Reward chip",
  render: () => (
    <div className="flex flex-col gap-3">
      <RewardChip level="ouro" points={1200} label="Clube" />
      <RewardChip level="prata" points={800} label="Colaboração" />
      <RewardChip level="bronze" points={450} label="Descoberta" />
    </div>
  ),
};
