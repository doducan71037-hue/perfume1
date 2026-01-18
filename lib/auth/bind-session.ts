import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

/**
 * 将当前匿名会话绑定到用户
 * 登录后调用，将匿名会话的数据关联到用户
 */
export async function bindAnonymousSessionToUser(
  userId: string
): Promise<void> {
  const cookieStore = await cookies();
  const anonymousId = cookieStore.get("session_id")?.value;

  if (!anonymousId) {
    return; // 没有匿名会话，无需绑定
  }

  // 查找匿名会话
  const session = await prisma.session.findUnique({
    where: { anonymousId },
  });

  if (!session || session.userId) {
    return; // 会话不存在或已绑定
  }

  // 更新会话关联到用户
  await prisma.session.update({
    where: { id: session.id },
    data: { userId },
  });

  // 更新相关数据：Event, Conversation, Feedback
  // 这些表的 userId 字段会在后续查询时自动关联，这里可以选择批量更新
  // 但为了性能，我们采用延迟关联策略：只在查询时关联 session.userId

  // 可选：批量更新 Event
  await prisma.event.updateMany({
    where: {
      sessionId: session.id,
      userId: null,
    },
    data: {
      userId,
    },
  });

  // 可选：批量更新 Conversation
  await prisma.conversation.updateMany({
    where: {
      sessionId: session.id,
      userId: null,
    },
    data: {
      userId,
    },
  });

  // 可选：批量更新 Feedback
  await prisma.feedback.updateMany({
    where: {
      sessionId: session.id,
      userId: null,
    },
    data: {
      userId,
    },
  });
}
