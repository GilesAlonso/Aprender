import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Modal> = {
  title: "Componentes/Feedback/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    size: {
      control: { type: "inline-radio" },
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;

type Story = StoryObj<typeof Modal>;

const ModalStory = (args: Story["args"]) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4 text-center">
      <Button variant="primary" onClick={() => setOpen(true)}>
        Ver missão surpresa
      </Button>
      <Modal
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        primaryAction={{
          label: "Vamos nessa!",
          onClick: () => setOpen(false),
        }}
        secondaryAction={{
          label: "Quero revisar",
          onClick: () => setOpen(false),
        }}
      >
        <p>
          Esta missão foi criada especialmente para o seu grupo com base nos interesses marcados.
          Ela inclui minijogos, momentos de colaboração e pausas de autocuidado.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-left">
          <li>Ative o modo cooperativo para liberar dicas especiais do assistente.</li>
          <li>Use os cartões de sentimentos ao final para estimular a conversa em família.</li>
        </ul>
      </Modal>
    </div>
  );
};

export const Padrão: Story = {
  args: {
    title: "Missão relâmpago desbloqueada",
    description: "Uma nova aventura baseada no que você mais gostou até agora.",
  },
  render: (args) => <ModalStory {...args} />,
};
