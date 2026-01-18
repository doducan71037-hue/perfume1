/**
 * 列出所有待审核的候选图片
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
  const candidates = await prisma.perfumeImageCandidate.findMany({
    where: { status: "PENDING" },
    include: {
      perfume: {
        select: {
          brand: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log(`\n📋 待审核候选图片：${candidates.length} 个\n`);

  // 按香水分组，去除重复
  const uniqueMap = new Map<string, typeof candidates[0]>();
  for (const c of candidates) {
    const key = `${c.perfume.brand}|${c.perfume.name}`;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, c);
    }
  }

  console.log(`去重后：${uniqueMap.size} 个唯一香水\n`);

  for (const candidate of uniqueMap.values()) {
    console.log(`🔸 ${candidate.perfume.brand} ${candidate.perfume.name}`);
    console.log(`   来源: ${candidate.source}`);
    console.log(`   置信度: ${(candidate.confidence * 100).toFixed(0)}%`);
    console.log(`   URL: ${candidate.imageUrl.substring(0, 80)}...`);
    console.log();
  }

  console.log(`\n下一步操作：`);
  console.log(`1. 访问 http://localhost:3000/admin/images 查看和审核候选`);
  console.log(`2. 审核通过后，运行: npm run apply:images`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
