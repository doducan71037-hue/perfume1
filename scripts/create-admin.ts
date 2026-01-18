/**
 * 创建默认管理员账号
 * 用法: npx tsx scripts/create-admin.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  const email = "admin@scentai.com";
  // 默认密码：如果环境变量未设置，使用更安全的密码
  // 提示：Google Chrome可能会警告弱密码，这是正常的浏览器安全检查
  const password = process.env.ADMIN_DEFAULT_PASSWORD || "Admin@ScentAI2024";

  // 检查环境变量
  if (!process.env.DATABASE_URL) {
    console.error("❌ 错误: DATABASE_URL 环境变量未设置");
    console.error("   请确保 .env 文件存在且包含 DATABASE_URL");
    process.exit(1);
  }

  try {
    // 检查管理员是否已存在
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // 更新为管理员角色并重置密码
      const passwordHash = await hashPassword(password);
      await prisma.user.update({
        where: { email },
        data: {
          role: "ADMIN",
          status: "ACTIVE",
          passwordHash,
        },
      });
      console.log(`✓ 管理员账号 ${email} 已更新`);
      console.log(`  密码: ${password}`);
    } else {
      // 创建新管理员账号
      const passwordHash = await hashPassword(password);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          role: "ADMIN",
          status: "ACTIVE",
          displayName: "管理员",
        },
      });
      console.log(`✓ 管理员账号 ${email} 已创建`);
      console.log(`  密码: ${password}`);
    }

    console.log("\n管理员账号信息：");
    console.log(`  邮箱: ${email}`);
    console.log(`  密码: ${password}`);
    console.log(`  角色: ADMIN`);
  } catch (error: any) {
    console.error("❌ 创建管理员账号失败:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
