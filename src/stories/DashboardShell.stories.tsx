import type { Meta, StoryObj } from "@storybook/react";
import { DashboardShell } from "@/components/layouts/dashboard-shell";
import type { NavigationItem } from "@/components/ui/responsive-nav";
import { SparkIcon } from "@/components/ui/icons";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof DashboardShell> = {
  title: "Layouts/Dashboard",
  component: DashboardShell,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof DashboardShell>;

const navItems: NavigationItem[] = [
  {
    label: "Início",
    href: "/app",
    active: true,
    icon: <SparkIcon className="h-4 w-4 text-primary-500" aria-hidden="true" />,
    description: "Resumo geral da jornada",
  },
  {
    label: "Missões",
    href: "/app/missoes",
    description: "Desafios personalizados e jogos",
  },
  {
    label: "Clube",
    href: "/app/clube",
    description: "Eventos e conquistas da comunidade",
  },
  {
    label: "Família",
    href: "/app/familia",
    description: "Mensagens e combinados colaborativos",
  },
];

export const Completo: Story = {
  args: {
    navItems,
    userName: "Helena",
    userRole: "Exploradora",
    heroMessage:
      "Escolhemos missões que conectam ciência, cuidado com o planeta e expressão artística.",
    children: (
      <section className="space-y-4">
        <h2 className="text-display-sm font-semibold text-neutral-900">Acompanhamento familiar</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card tone="neutral">
            <CardHeader>
              <Badge variant="success">Família conectada</Badge>
              <CardTitle className="text-display-xs">Conversa em família</CardTitle>
            </CardHeader>
            <CardDescription>
              A mãe de Helena celebrou as conquistas da semana e sugeriu um passeio ao parque no
              sábado.
            </CardDescription>
          </Card>
          <Card tone="neutral">
            <CardHeader>
              <Badge variant="info">Agenda</Badge>
              <CardTitle className="text-display-xs">Encontro na escola</CardTitle>
            </CardHeader>
            <CardDescription>
              O educador combinou uma roda de apresentação na próxima terça-feira para compartilhar
              projetos.
            </CardDescription>
          </Card>
        </div>
      </section>
    ),
  },
};
