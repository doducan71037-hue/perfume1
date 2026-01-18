import { getSessionToken, verifyAuthSession } from "./session";
import { prisma } from "@/lib/db";

export interface UserInfo {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
}

/**
 * 获取当前登录用户信息
 * 从 cookie 读取会话并验证
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  const token = await getSessionToken();
  if (!token) {
    return null;
  }

  const userId = await verifyAuthSession(token);
  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      status: true,
    },
  });

  return user;
}

/**
 * 检查用户是否为管理员
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}
