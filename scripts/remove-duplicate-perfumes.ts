/**
 * 删除数据库中重复的香水记录
 * 保留第一条，删除后续重复的（基于 brand + name 匹配）
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { normalizeSearchName } from "../lib/normalize";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("\n🔍 开始查找重复的香水记录...\n");

  // 获取所有香水
  const allPerfumes = await prisma.perfume.findMany({
    select: {
      id: true,
      brand: true,
      name: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc", // 保留最早创建的
    },
  });

  // 按 normalized(brand + name) 分组
  const groups = new Map<string, typeof allPerfumes>();
  for (const perfume of allPerfumes) {
    const key = normalizeSearchName(`${perfume.brand} ${perfume.name}`);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(perfume);
  }

  // 找出重复的记录
  const duplicates: Array<{ keep: typeof allPerfumes[0]; remove: typeof allPerfumes }> = [];
  for (const [key, perfumes] of groups.entries()) {
    if (perfumes.length > 1) {
      duplicates.push({
        keep: perfumes[0], // 保留第一条
        remove: perfumes.slice(1), // 删除其余的
      });
    }
  }

  if (duplicates.length === 0) {
    console.log("✅ 没有发现重复的香水记录！");
    return;
  }

  console.log(`找到 ${duplicates.length} 组重复记录：\n`);

  let totalToRemove = 0;
  for (const { keep, remove } of duplicates) {
    console.log(`📦 ${keep.brand} ${keep.name}`);
    console.log(`   保留: ${keep.id} (创建于: ${keep.createdAt.toISOString()})`);
    console.log(`   删除: ${remove.length} 条重复记录`);
    for (const p of remove) {
      console.log(`     - ${p.id}`);
    }
    console.log();
    totalToRemove += remove.length;
  }

  console.log(`\n总计：将删除 ${totalToRemove} 条重复记录`);

  // 确认删除
  const idsToRemove = duplicates.flatMap(({ remove }) => remove.map((p) => p.id));

  console.log(`\n🗑️  开始删除...`);

  // 删除重复的记录（Prisma会自动处理关联数据的级联删除）
  const result = await prisma.perfume.deleteMany({
    where: {
      id: {
        in: idsToRemove,
      },
    },
  });

  console.log(`\n✅ 完成！删除了 ${result.count} 条重复的香水记录。`);
  console.log(`   保留了 ${duplicates.length} 条唯一记录。`);
}

main()
  .catch((error) => {
    console.error("❌ 错误:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
