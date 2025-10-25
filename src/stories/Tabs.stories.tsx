import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SparkIcon } from "@/components/ui/icons";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const meta: Meta<typeof Tabs> = {
  title: "Componentes/Navegação/Abas",
  component: Tabs,
  parameters: {
    layout: "centered",
  },
  args: {
    defaultValue: "trilhas",
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Padrao: Story = {
  render: (args) => (
    <Tabs {...args} label="Coleção de experiências">
      <TabsList className="max-w-xl">
        <TabsTrigger
          value="trilhas"
          leadingIcon={<SparkIcon className="h-4 w-4 text-primary-500" aria-hidden="true" />}
        >
          Trilhas sugeridas
        </TabsTrigger>
        <TabsTrigger value="jogos">Jogos cooperativos</TabsTrigger>
        <TabsTrigger value="bem-estar">Bem-estar</TabsTrigger>
      </TabsList>
      <TabsContent value="trilhas" className="space-y-3">
        <Card tone="neutral">
          <CardHeader>
            <CardTitle>Missão Guardiões da Mata</CardTitle>
            <CardDescription>
              Investigue os cuidados com a floresta urbana e proponha ações com apoio da comunidade.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card tone="neutral">
          <CardHeader>
            <CardTitle>Jornada dos Inventores</CardTitle>
            <CardDescription>
              Experimentos rápidos de ciências com foco em energia limpa e soluções criativas.
            </CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="jogos">
        <Card tone="highlight">
          <CardHeader>
            <CardTitle>Cooperação relâmpago</CardTitle>
            <CardDescription>
              Em duplas, resolvam enigmas antes que o tempo acabe e liberem adesivos digitais.
            </CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
      <TabsContent value="bem-estar">
        <Card tone="calm">
          <CardHeader>
            <CardTitle>Respira comigo</CardTitle>
            <CardDescription>
              Exercícios guiados de respiração e alongamento para toda a família.
            </CardDescription>
          </CardHeader>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};
