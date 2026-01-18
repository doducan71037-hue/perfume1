import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_COOKIE_NAME = "auth_session";
const SESSION_DURATION_DAYS = 7;

/**
 * 创建认证会话
 */
export async function createAuthSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.authSession.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return token;
}

/**
 * 验证会话 token 并返回用户ID
 */
export async function verifyAuthSession(
  token: string
): Promise<string | null> {
  const session = await prisma.authSession.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // 检查是否过期
  if (session.expiresAt < new Date()) {
    // 删除过期会话
    await prisma.authSession.delete({ where: { id: session.id } });
    return null;
  }

  // 检查用户状态
  if (session.user.status !== "ACTIVE") {
    return null;
  }

  return session.userId;
}

/**
 * 删除认证会话
 */
export async function deleteAuthSession(token: string): Promise<void> {
  await prisma.authSession.deleteMany({
    where: { token },
  });

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * 从 cookie 获取当前会话 token
 */
export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

/**
 * 清理过期会话（定期任务）
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.authSession.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  return result.count;
}
