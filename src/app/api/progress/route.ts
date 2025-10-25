import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { progressMutationSchema, progressStatusValues } from "@/lib/validation";

const PROGRESS_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const satisfies Record<(typeof progressStatusValues)[number], string>;

const deriveStatus = (completion: number) => {
  if (completion >= 100) return PROGRESS_STATUS.COMPLETED;
  if (completion > 0) return PROGRESS_STATUS.IN_PROGRESS;
  return PROGRESS_STATUS.NOT_STARTED;
};

export async function PATCH(request: NextRequest) {
  try {
    const payload = (await request.json()) as unknown;
    const input = progressMutationSchema.parse(payload);

    const [user, module] = await Promise.all([
      prisma.user.findUnique({ where: { id: input.userId } }),
      prisma.contentModule.findUnique({
        where: { id: input.contentModuleId },
        include: {
          curriculumStandard: true,
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    if (!module) {
      return NextResponse.json({ message: "Módulo não encontrado" }, { status: 404 });
    }

    const lastActivityAt = input.lastActivityAt ? new Date(input.lastActivityAt) : new Date();
    const status = input.status ?? deriveStatus(input.completion);

    const progress = await prisma.progress.upsert({
      where: {
        userId_contentModuleId: {
          userId: input.userId,
          contentModuleId: input.contentModuleId,
        },
      },
      update: {
        completion: input.completion,
        status,
        lastActivityAt,
        ...(input.totalAttempts !== undefined
          ? {
              totalAttempts: input.totalAttempts,
            }
          : {}),
      },
      create: {
        userId: input.userId,
        contentModuleId: input.contentModuleId,
        completion: input.completion,
        status,
        lastActivityAt,
        totalAttempts: input.totalAttempts ?? 0,
      },
      include: {
        contentModule: {
          select: {
            id: true,
            slug: true,
            title: true,
            curriculumStandardId: true,
          },
        },
      },
    });

    return NextResponse.json({
      progress: {
        id: progress.id,
        userId: progress.userId,
        contentModuleId: progress.contentModuleId,
        completion: progress.completion,
        status: progress.status,
        lastActivityAt: progress.lastActivityAt?.toISOString() ?? null,
        totalAttempts: progress.totalAttempts,
        updatedAt: progress.updatedAt.toISOString(),
        contentModule: progress.contentModule,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Dados inválidos para atualizar progresso",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Erro ao atualizar progresso", error);
    return NextResponse.json({ message: "Erro interno ao atualizar progresso" }, { status: 500 });
  }
}
