import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { createAuthSession } from "@/lib/auth/session";
import { bindAnonymousSessionToUser } from "@/lib/auth/bind-session";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { handleError } from "@/lib/errors/handler";

// 确保使用 Node.js runtime（bcrypt 需要）
export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    // Rate limit: IP+email 维度，每分钟 5 次
    const ip = getClientIp(request);
    const rateLimitKey = `login:${ip}:${data.email}`;
    const rateLimit = checkRateLimit(rateLimitKey, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // 统一错误提示，避免用户枚举
    if (!user) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 检查用户状态
    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "账户已被禁用，请联系管理员" },
        { status: 403 }
      );
    }

    // 验证密码
    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "邮箱或密码错误" },
        { status: 401 }
      );
    }

    // 创建会话
    await createAuthSession(user.id);

    // 绑定匿名会话到用户
    await bindAnonymousSessionToUser(user.id);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
