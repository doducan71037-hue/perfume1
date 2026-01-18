import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db";
import { handleError } from "@/lib/errors/handler";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAdmin();
    if (error) {
      return error;
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "100");
    const type = searchParams.get("type");
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    const where: any = {};
    if (type) {
      where.type = type;
    }
    if (userId) {
      where.userId = userId;
    }
    if (sessionId) {
      where.sessionId = sessionId;
    }

    const events = await prisma.event.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    return handleError(error);
  }
}
