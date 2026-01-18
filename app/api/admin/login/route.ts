import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "密码不能为空"),
});

/**
 * POST /api/admin/login
 * 管理员登录（支持邮箱+密码）
 * 同时兼容旧的简单密码验证（向后兼容）
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 尝试解析为邮箱+密码格式
    const emailPasswordResult = loginSchema.safeParse(body);
    
    if (emailPasswordResult.success) {
      // 邮箱+密码登录方式
      const { email, password } = emailPasswordResult.data;
      
      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) {
        return NextResponse.json(
          { error: "邮箱或密码错误" },
          { status: 401 }
        );
      }
      
      // 检查是否为管理员
      if (user.role !== "ADMIN") {
        return NextResponse.json(
          { error: "无管理员权限" },
          { status: 403 }
        );
      }
      
      // 检查用户状态
      if (user.status !== "ACTIVE") {
        return NextResponse.json(
          { error: "账户已被禁用" },
          { status: 403 }
        );
      }
      
      // 验证密码
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: "邮箱或密码错误" },
          { status: 401 }
        );
      }
      
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      });
    }
    
    // 向后兼容：支持简单密码方式（从 authorization header）
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
      
      if (token === adminPassword) {
        return NextResponse.json({
          success: true,
          legacy: true, // 标记为旧版认证方式
        });
      }
    }
    
    return NextResponse.json(
      { error: "邮箱或密码错误" },
      { status: 401 }
    );
  } catch (error: unknown) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "登录失败，请重试" },
      { status: 500 }
    );
  }
}
