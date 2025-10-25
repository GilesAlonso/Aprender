import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { RocketIcon, SparkIcon } from "@/components/ui/icons";

const meta: Meta<typeof Button> = {
  title: "Componentes/Interação/Botão",
  component: Button,
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Começar agora",
  },
  argTypes: {
    variant: {
      options: ["primary", "secondary", "game", "ghost"],
      control: { type: "select" },
      description: "Define o estilo visual do botão de acordo com o contexto de uso.",
    },
    size: {
      options: ["md", "lg"],
      control: { type: "inline-radio" },
      description: "Controla o tamanho do botão para diferentes dispositivos e hierarquias.",
    },
    fullWidth: {
      control: "boolean",
      description: "Quando verdadeiro, expande o botão para ocupar toda a largura disponível.",
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primario: Story = {
  args: {
    variant: "primary",
  },
};

export const Secundario: Story = {
  args: {
    variant: "secondary",
    children: "Explorar trilhas",
  },
};

export const BotaoDeJogo: Story = {
  name: "Botão estilo jogo",
  args: {
    variant: "game",
    children: "Modo aventura",
    size: "lg",
  },
};

export const ComIcones: Story = {
  name: "Com ícones",
  args: {
    variant: "primary",
    children: "Lançar foguete",
    leadingIcon: <RocketIcon className="h-5 w-5 text-white" aria-hidden="true" />,
    trailingIcon: <SparkIcon className="h-4 w-4 text-white" aria-hidden="true" />,
  },
};

export const Fantasma: Story = {
  name: "Link fantasma",
  args: {
    variant: "ghost",
    children: "Ver detalhes",
  },
};
