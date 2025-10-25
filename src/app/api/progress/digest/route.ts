import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getEducatorDigest } from "@/lib/progress";
import { progressSummaryQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = progressSummaryQuerySchema.parse({
      userId: searchParams.get("userId") ?? undefined,
    });

    const digest = await getEducatorDigest(query.userId);

    return NextResponse.json({ digest });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Parâmetros inválidos para consultar digest de progresso",
          issues: error.flatten(),
        },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes("Usuário não encontrado")) {
      return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });
    }

    console.error("Erro ao gerar digest de progresso", error);
    return NextResponse.json(
      { message: "Erro interno ao gerar digest de progresso" },
      { status: 500 }
    );
  }
}
