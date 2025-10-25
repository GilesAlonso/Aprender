import { render, screen } from "@testing-library/react";
import HomePage from "../page";

describe("HomePage", () => {
  it("exibe o título principal e a missão", async () => {
    const component = await HomePage();

    render(component);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /trilhas personalizadas/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/nossa missão é apoiar estudantes brasileiros/i)).toBeInTheDocument();
  });

  it("lista destaques do projeto", async () => {
    const component = await HomePage();

    render(component);

    const highlights = screen.getAllByText(/inteligência artificial/i);
    expect(highlights.length).toBeGreaterThan(0);
  });
});
