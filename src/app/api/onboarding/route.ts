import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  buildAgeGroupSummary,
  getStageConfigBySlug,
  resolveStudentAgeGroup,
} from "@/lib/personalization/age-groups";
import { LEARNING_STYLE_OPTIONS } from "@/lib/personalization/age-stages";

const learningStyleIds = LEARNING_STYLE_OPTIONS.map((option) => option.id);

const onboardingSchema = z.object({
  age: z.coerce.number().int().min(4).max(17),
  userId: z.string().cuid("userId inválido").optional(),
  learningStyle: z
    .string()
    .trim()
    .refine((value) => value === "" || learningStyleIds.includes(value), "learningStyle inválido")
    .optional(),
  overrideAgeGroupSlug: z
    .string()
    .trim()
    .refine((value) => value === "" || !!getStageConfigBySlug(value), "Etapa BNCC não reconhecida")
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawPayload = (await request.json()) as unknown;
    const payload = onboardingSchema.parse(rawPayload);

    let userId: string | null = null;

    if (payload.userId) {
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
      }
      userId = user.id;
    }

    const resolution = await resolveStudentAgeGroup({
      age: payload.age,
      overrideSlug: payload.overrideAgeGroupSlug,
      ignoreProfile: true,
      ignoreCookie: true,
    });

    const summary = buildAgeGroupSummary(resolution.ageGroup, resolution.stageConfig);

    if (userId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ageGroupId: resolution.ageGroup.id,
        },
      });
    }

    const learningStyleOption = LEARNING_STYLE_OPTIONS.find(
      (option) => option.id === payload.learningStyle
    );

    const response = NextResponse.json({
      age: payload.age,
      ageGroup: summary,
      learningStyle: payload.learningStyle ? { id: payload.learningStyle, label: learningStyleOption?.title ?? payload.learningStyle } : null,
      message: `Personalização atualizada para ${summary.stage}.`,
      source: resolution.source,
    });

    const maxAgeSeconds = 60 * 60 * 24 * 30;
    const cookieOptions = {
      path: "/",
      httpOnly: false,
      sameSite: "lax" as const,
      maxAge: maxAgeSeconds,
    };

    response.cookies.set("ageGroupSlug", summary.slug, cookieOptions);
    response.cookies.set("studentAge", String(payload.age), cookieOptions);

    if (payload.learningStyle) {
      response.cookies.set("learningStyle", payload.learningStyle, cookieOptions);
    }

    return response;
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Dados inválidos para personalização",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Erro ao personalizar jornada", error);
    return NextResponse.json({ message: "Erro interno ao salvar preferências" }, { status: 500 });
  }
}
