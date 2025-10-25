import type { Meta, StoryObj } from "@storybook/react";
import { ResponsiveNav } from "@/components/ui/responsive-nav";
import { RocketIcon, SparkIcon } from "@/components/ui/icons";

const meta: Meta<typeof ResponsiveNav> = {
  title: "Componentes/Navegação/Navegação responsiva",
  component: ResponsiveNav,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof ResponsiveNav>;

const items = [
  {
    label: "Painel",
    href: "/app",
    icon: <SparkIcon className="h-4 w-4 text-primary-500" aria-hidden="true" />,
    active: true,
    description: "Resumo geral das metas e avanços",
  },
  {
    label: "Missões",
    href: "/app/missoes",
    icon: <RocketIcon className="h-4 w-4 text-secondary-500" aria-hidden="true" />,
    badge: "3 novas",
    description: "Jogos cooperativos e desafios investigativos",
  },
  {
    label: "Família",
    href: "/app/familia",
    description: "Acompanhamento compartilhado com responsáveis",
  },
  {
    label: "Biblioteca",
    href: "/app/biblioteca",
    description: "Recursos e trilhas complementares",
  },
];

export const Padrao: Story = {
  args: {
    items,
    currentHref: "/app",
    brand: {
      name: "Aprender",
      tagline: "Educação viva em português",
      logo: <SparkIcon className="h-8 w-8 text-primary-500" aria-hidden="true" />,
      href: "/",
    },
    primaryAction: { label: "Nova jornada", href: "/app/jornadas/nova" },
    localeSwitcher: <span className="text-label-md text-neutral-500">PT-BR</span>,
  },
};
