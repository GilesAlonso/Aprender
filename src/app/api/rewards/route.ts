import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { safeJsonParse } from "@/lib/json";
import { rewardsQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = rewardsQuerySchema.parse({
      userId: searchParams.get("userId") ?? undefined,
    });

    const userExists = await prisma.user.findUnique({
      where: { id: query.userId },
      select: { id: true },
    });

    if (!userExists) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    const rewards = await prisma.reward.findMany({
      where: { userId: query.userId },
      orderBy: {
        unlockedAt: "desc",
      },
    });

    return NextResponse.json({
      rewards: rewards.map((reward) => ({
        id: reward.id,
        code: reward.code,
        title: reward.title,
        description: reward.description,
        criteria: reward.criteria,
        icon: reward.icon,
        category: reward.category,
        rarity: reward.rarity,
        xpAwarded: reward.xpAwarded,
        levelAchieved: reward.levelAchieved,
        metadata: safeJsonParse<Record<string, unknown>>(reward.metadata),
        unlockedAt: reward.unlockedAt.toISOString(),
      })),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Parâmetros inválidos",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    console.error("Erro ao buscar recompensas", error);
    return NextResponse.json({ message: "Erro interno ao buscar recompensas" }, { status: 500 });
  }
}
