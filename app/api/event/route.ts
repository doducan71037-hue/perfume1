import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/lib/errors/handler";
import { prisma } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";

const eventSchema = z.object({
  type: z.enum([
    "conversation_start",
    "questionnaire_complete",
    "recommendation_view",
    "affiliate_click",
    "feedback_submit",
    "favorite_add",
  ]),
  payload: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, payload } = eventSchema.parse(body);

    // 1. 获取sessionId（从cookie）
    const sessionId = await getOrCreateSession();

    // 2. 创建Event记录
    await prisma.event.create({
      data: {
        type,
        payload: payload || {},
        sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "事件已记录",
    });
  } catch (error) {
    return handleError(error);
  }
}