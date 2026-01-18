import { requireAuth } from "./require-auth";
import { getCurrentUser } from "./user";
import { NextResponse } from "next/server";

/**
 * 要求用户是管理员
 * 在 API 路由中使用
 */
export async function requireAdmin(): Promise<{
  user: Awaited<ReturnType<typeof getCurrentUser>> | null;
  error?: NextResponse;
}> {
  const { user, error } = await requireAuth();

  if (error) {
    return { user: null, error };
  }

  if (user?.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json({ error: "需要管理员权限" }, { status: 403 }),
    };
  }

  return { user, error: undefined };
}
