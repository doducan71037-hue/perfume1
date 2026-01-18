import { getCurrentUser } from "./user";
import { NextResponse } from "next/server";

/**
 * 要求用户已登录
 * 在 API 路由中使用
 */
export async function requireAuth(): Promise<{
  user: Awaited<ReturnType<typeof getCurrentUser>>;
  error?: NextResponse;
}> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "未登录" }, { status: 401 }),
    };
  }

  return { user, error: undefined };
}
