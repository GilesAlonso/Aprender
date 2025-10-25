import type { Meta, StoryObj } from "@storybook/react";
import { ActivityDetailLayout } from "@/components/layouts/activity-detail";

const meta: Meta<typeof ActivityDetailLayout> = {
  title: "Layouts/Detalhe de atividade",
  component: ActivityDetailLayout,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Operação águas claras",
    subtitle: "Missão investigativa",
    objective:
      "Criar, em grupo, um plano de cuidado para uma nascente da comunidade, usando dados reais e entrevistas com moradores.",
    summary:
      "Os estudantes assumem o papel de guardiões da natureza e investigam como preservar a água da cidade.",
    estimatedTime: "25 minutos",
    recommendedAges: "10 a 12 anos",
    bnccTags: ["BNCC EF07CI02"],
  },
};

export default meta;

type Story = StoryObj<typeof ActivityDetailLayout>;

export const Padrao: Story = {};
