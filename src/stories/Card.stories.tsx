import type { Meta, StoryObj } from "@storybook/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ProgressBar,
} from "@/components/ui";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Card> = {
  title: "Componentes/Conteúdo/Card",
  component: Card,
  parameters: {
    layout: "centered",
  },
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Laboratório de histórias</CardTitle>
          <CardDescription>
            Uma aventura guiada onde a turma cria finais alternativos para contos brasileiros.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ProgressBar label="Andamento" value={56} />
        </CardContent>
        <CardFooter>
          <Button variant="primary">Continuar criando</Button>
        </CardFooter>
      </>
    ),
  },
  argTypes: {
    tone: {
      options: ["default", "highlight", "calm", "neutral"],
      control: { type: "inline-radio" },
    },
    interactive: {
      control: "boolean",
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Basico: Story = {
  args: {
    tone: "default",
    interactive: true,
  },
};

export const Destaque: Story = {
  args: {
    tone: "highlight",
    children: (
      <>
        <CardHeader>
          <CardTitle>Meta da semana</CardTitle>
          <CardDescription>
            Compartilhe três ideias com impacto social e receba adesivos especiais para a turma.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="secondary">Ver sugestões</Button>
        </CardFooter>
      </>
    ),
  },
};

export const Calmante: Story = {
  args: {
    tone: "calm",
    children: (
      <>
        <CardHeader>
          <CardTitle>Pausa consciente</CardTitle>
          <CardDescription>
            Exercício guiado de respiração com acompanhamento do assistente Aurora.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="ghost" className="px-0 text-primary-600">
            Iniciar agora
          </Button>
        </CardFooter>
      </>
    ),
  },
};
