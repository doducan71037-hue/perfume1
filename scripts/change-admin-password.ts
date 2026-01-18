/**
 * 修改管理员密码
 * 用法: npx tsx scripts/change-admin-password.ts <新密码>
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
  const newPassword = process.argv[2];

  if (!newPassword) {
    console.error("❌ 错误: 请提供新密码");
    console.log("\n用法: npx tsx scripts/change-admin-password.ts <新密码>");
    console.log("\n示例:");
    console.log("  npx tsx scripts/change-admin-password.ts MySecure@Pass123");
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error("❌ 错误: 密码长度至少需要8位字符");
    process.exit(1);
  }

  const email = "admin@scentai.com";

  try {
    // 检查管理员是否存在
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (!existing) {
      console.error(`❌ 错误: 管理员账号 ${email} 不存在`);
      console.log("   请先运行: npx tsx scripts/create-admin.ts");
      process.exit(1);
    }

    // 更新密码
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
      },
    });

    console.log(`✓ 管理员密码已更新`);
    console.log(`\n管理员账号信息：`);
    console.log(`  邮箱: ${email}`);
    console.log(`  新密码: ${newPassword}`);
    console.log(`\n提示: 请保存好新密码，建议使用密码管理器。`);
  } catch (error: any) {
    console.error("❌ 更新密码失败:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
