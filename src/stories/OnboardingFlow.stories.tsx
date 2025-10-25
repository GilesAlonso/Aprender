import type { Meta, StoryObj } from "@storybook/react";
import { OnboardingFlow } from "@/components/layouts/onboarding-flow";

const meta: Meta<typeof OnboardingFlow> = {
  title: "Layouts/Onboarding",
  component: OnboardingFlow,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof OnboardingFlow>;

export const Padrao: Story = {};
