import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

/**
 * 验证管理员权限
 * 支持两种方式：
 * 1. 通过用户会话验证（推荐）
 * 2. 通过简单密码验证（向后兼容）
 */
export async function verifyAdmin(request: NextRequest): Promise<{
  authorized: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    // 方式1: 尝试通过用户会话验证
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("auth_session")?.value;

    if (sessionToken) {
      const session = await prisma.authSession.findUnique({
        where: { token: sessionToken },
        include: { user: true },
      });

      if (session && session.user.role === "ADMIN" && session.user.status === "ACTIVE") {
        // 检查会话是否过期
        if (session.expiresAt > new Date()) {
          return {
            authorized: true,
            userId: session.userId,
          };
        }
      }
    }

    // 方式2: 向后兼容 - 简单密码验证
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const password = authHeader.substring(7);
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

      if (password === adminPassword) {
        return { authorized: true };
      }
    }

    return {
      authorized: false,
      error: "Unauthorized",
    };
  } catch (error: unknown) {
    console.error("Admin auth error:", error);
    return {
      authorized: false,
      error: "Internal server error",
    };
  }
}
