import { prisma } from "./db";

/**
 * 速率限制：检查用户是否超过每日限制
 * @param sessionId 会话ID
 * @param maxRequests 最大请求数（默认10次）
 * @returns 是否允许请求
 */
export async function checkRateLimit(
  sessionId: string,
  maxRequests: number = 10
): Promise<{ allowed: boolean; remaining: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 统计今天该session的对话数量
  const count = await prisma.conversation.count({
    where: {
      sessionId,
      createdAt: {
        gte: today,
      },
    },
  });

  const remaining = Math.max(0, maxRequests - count);
  return {
    allowed: remaining > 0,
    remaining,
  };
}