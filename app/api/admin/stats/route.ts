import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db";
import { handleError } from "@/lib/errors/handler";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return error;
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // 用户统计
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { status: "ACTIVE" },
    });

    // 对话统计
    const totalConversations = await prisma.conversation.count();
    const todayConversations = await prisma.conversation.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // 搜索次数（从 Event 表统计）
    const totalSearches = await prisma.event.count({
      where: {
        type: {
          in: ["conversation_start", "recommendation_view"],
        },
      },
    });
    const todaySearches = await prisma.event.count({
      where: {
        type: {
          in: ["conversation_start", "recommendation_view"],
        },
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // 点击购买次数
    const totalClicks = await prisma.event.count({
      where: {
        type: "affiliate_click",
      },
    });
    const todayClicks = await prisma.event.count({
      where: {
        type: "affiliate_click",
        createdAt: {
          gte: todayStart,
        },
      },
    });

    // 反馈数
    const totalFeedbacks = await prisma.feedback.count();
    const todayFeedbacks = await prisma.feedback.count({
      where: {
        createdAt: {
          gte: todayStart,
        },
      },
    });

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      conversations: {
        total: totalConversations,
        today: todayConversations,
      },
      searches: {
        total: totalSearches,
        today: todaySearches,
      },
      clicks: {
        total: totalClicks,
        today: todayClicks,
      },
      feedbacks: {
        total: totalFeedbacks,
        today: todayFeedbacks,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
