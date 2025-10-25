import { NextRequest } from "next/server";
import { afterAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { POST as postOnboarding } from "@/app/api/onboarding/route";

describe("Onboarding API", () => {
  it("salva a faixa etária do estudante e registra preferências", async () => {
    const user = await prisma.user.create({
      data: {
        email: `onboarding-${Date.now()}@aprender.dev`,
        name: "Estudante Onboarding",
        displayName: "Onboarding",
      },
    });

    const payload = {
      age: 15,
      userId: user.id,
      learningStyle: "digital",
      overrideAgeGroupSlug: undefined,
    };

    const request = NextRequest.from(
      new Request("http://localhost:3000/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );

    const response = await postOnboarding(request);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      age: number;
      ageGroup: { slug: string; stage: string; guidanceNote: string | null };
      learningStyle: { id: string; label: string } | null;
      source: string;
      message: string;
    };

    expect(body.age).toBe(15);
    expect(body.ageGroup.slug).toBe("ensino-medio");
    expect(body.learningStyle?.id).toBe("digital");
    expect(body.source).toBe("age");
    expect(body.message).toMatch(/Personalização atualizada/i);

    const updatedUser = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updatedUser.ageGroupId).not.toBeNull();

    const ageGroupCookie = response.cookies.get("ageGroupSlug");
    expect(ageGroupCookie?.value).toBe("ensino-medio");

    const learningStyleCookie = response.cookies.get("learningStyle");
    expect(learningStyleCookie?.value).toBe("digital");
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
