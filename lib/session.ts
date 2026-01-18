import { cookies } from "next/headers";
import { prisma } from "./db";
import { randomBytes } from "crypto";

/**
 * 获取或创建匿名会话ID（基于cookie）
 * 返回 Session 的 id（用于外键关联），而不是 anonymousId
 */
export async function getOrCreateSession(): Promise<string> {
  const cookieStore = await cookies();
  let anonymousId = cookieStore.get("session_id")?.value;

  if (!anonymousId) {
    // 生成新的匿名ID
    anonymousId = `anon_${randomBytes(16).toString("hex")}`;
    
    // 创建session记录，并获取返回的 id
    const session = await prisma.session.create({
      data: {
        anonymousId: anonymousId,
      },
    });

    // 设置cookie（30天过期）
    cookieStore.set("session_id", anonymousId, {
      maxAge: 30 * 24 * 60 * 60, // 30天
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return session.id;
  } else {
    // 检查session是否存在，如果不存在则创建
    let session = await prisma.session.findUnique({
      where: { anonymousId: anonymousId },
    });

    if (!session) {
      // Cookie中有anonymousId但数据库中没有，创建新记录
      session = await prisma.session.create({
        data: {
          anonymousId: anonymousId,
        },
      });
    } else {
      // 更新最后活跃时间
      await prisma.session.update({
        where: { anonymousId: anonymousId },
        data: { lastActiveAt: new Date() },
      });
    }

    return session.id;
  }
}