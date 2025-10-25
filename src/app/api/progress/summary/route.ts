import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getProgressSummary } from "@/lib/progress";
import { progressSummaryQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = progressSummaryQuerySchema.parse({
      userId: searchParams.get("userId") ?? undefined,
    });

    const summary = await getProgressSummary(query.userId);

    return NextResponse.json({ summary });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Parâmetros inválidos para consultar progresso",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Usuário não encontrado")) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    console.error("Erro ao gerar resumo de progresso", error);
    return NextResponse.json(
      { message: "Erro interno ao gerar resumo de progresso" },
      { status: 500 }
    );
  }
}
