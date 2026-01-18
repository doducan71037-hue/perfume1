import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@/lib/auth/password";
import { createAuthSession } from "@/lib/auth/session";
import { bindAnonymousSessionToUser } from "@/lib/auth/bind-session";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";
import { handleError } from "@/lib/errors/handler";

// 确保使用 Node.js runtime（bcrypt 需要）
export const runtime = "nodejs";

const registerSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
  confirmPassword: z.string().min(1, "确认密码不能为空"),
  displayName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: IP 维度，每分钟 3 次
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`register:${ip}`, 3, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const data = registerSchema.parse(body);

    // 验证密码强度
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // 验证密码匹配
    if (data.password !== data.confirmPassword) {
      return NextResponse.json({ error: "两次输入的密码不一致" }, { status: 400 });
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 哈希密码
    const passwordHash = await hashPassword(data.password);

    // 检查是否为管理员邮箱（从环境变量）
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    const role = adminEmails.includes(data.email) ? "ADMIN" : "USER";

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        displayName: data.displayName || null,
        role,
      },
    });

    // 创建会话（自动登录）
    await createAuthSession(user.id);

    // 绑定匿名会话到用户
    await bindAnonymousSessionToUser(user.id);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleError(error);
  }
}
