import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleError } from "@/lib/errors/handler";
import { getOrCreateSession } from "@/lib/session";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    // 1. 获取或创建session（基于cookie）
    const sessionId = await getOrCreateSession();

    // 2. 检查速率限制
    const rateLimit = await checkRateLimit(sessionId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "您已达到每日问诊次数限制（10次），请明天再试",
          code: "RATE_LIMIT_EXCEEDED",
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // 3. 创建conversation
    const conversation = await prisma.conversation.create({
      data: {
        sessionId,
        messages: [
          {
            role: "assistant",
            content: "欢迎使用AI香水导购！请用一句话描述您想要寻找的香水类型（如：雨后森林、干净皂感、奶甜但不腻），或者我们可以通过几个问题来了解您的需求。",
          },
        ],
        summaryProfile: {},
        status: "active",
      },
    });

    // 4. 记录事件
    await prisma.event.create({
      data: {
        type: "conversation_start",
        sessionId,
        payload: { conversationId: conversation.id },
      },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      firstQuestion: "欢迎使用AI香水导购！请用一句话描述您想要寻找的香水类型（如：雨后森林、干净皂感、奶甜但不腻），或者我们可以通过几个问题来了解您的需求。",
      remaining: rateLimit.remaining,
    });
  } catch (error) {
    return handleError(error);
  }
}