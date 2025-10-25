import type { Meta, StoryObj } from "@storybook/react";
import { GameCanvasContainer } from "@/components/layouts/game-canvas";

const meta: Meta<typeof GameCanvasContainer> = {
  title: "Layouts/Game Canvas",
  component: GameCanvasContainer,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Guardas da Imaginópolis",
    mission:
      "Criem uma cidade sustentável cooperando com o assistente Aurora. Conectem ideias, testem hipóteses e cuidem das pessoas.",
    environmentTag: "Missão colaborativa",
    timer: "05:00",
    energyLevel: 72,
    players: [
      { name: "Helena", avatarColor: "#3773F6", score: 240, streak: 3 },
      { name: "Davi", avatarColor: "#FF8D1F", score: 220, streak: 2 },
      { name: "Iara", avatarColor: "#FF2EB7", score: 210 },
    ],
    events: [
      { description: "Equipe desbloqueou o poder da empatia.", timestamp: "00:55" },
      { description: "Energia coletiva aumentou em 15 pontos.", timestamp: "01:20" },
      { description: "Novo mini-desafio disponível.", timestamp: "02:10" },
    ],
  },
};

export default meta;

type Story = StoryObj<typeof GameCanvasContainer>;

export const Padrao: Story = {
  render: (args) => (
    <GameCanvasContainer {...args}>
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 via-white to-accent-100 text-neutral-600">
        <span className="text-body-lg">Área interativa do jogo (canvas, mapa ou simulação)</span>
      </div>
    </GameCanvasContainer>
  ),
};
