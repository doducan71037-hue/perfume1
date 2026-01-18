import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/lib/errors/handler";
import { prisma } from "@/lib/db";
import { getOrCreateSession } from "@/lib/session";

const feedbackSchema = z.object({
  conversationId: z.string().optional(),
  perfumeId: z.string(),
  like: z.boolean().optional(),
  reasons: z.array(z.string()).optional(),
  text: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    // 1. 获取sessionId
    const sessionId = await getOrCreateSession();

    // 2. 创建Feedback记录
    const feedback = await prisma.feedback.create({
      data: {
        conversationId: data.conversationId,
        perfumeId: data.perfumeId,
        like: data.like,
        reasons: data.reasons || [],
        text: data.text,
        sessionId,
      },
    });

    // 3. 记录事件
    await prisma.event.create({
      data: {
        type: "feedback_submit",
        sessionId,
        payload: {
          feedbackId: feedback.id,
          perfumeId: data.perfumeId,
          like: data.like,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "反馈已记录",
      feedbackId: feedback.id,
    });
  } catch (error) {
    return handleError(error);
  }
}