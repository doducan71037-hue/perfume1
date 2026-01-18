/**
 * 快速检查有多少香水没有图片
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const total = await prisma.perfume.count();
  const withoutImage = await prisma.perfume.count({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
  });

  console.log(`\n📊 图片状态统计：`);
  console.log(`  总香水数: ${total}`);
  console.log(`  无图片: ${withoutImage}`);
  console.log(`  已有图片: ${total - withoutImage}`);
  console.log(`\n`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
