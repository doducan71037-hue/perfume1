/**
 * 将已审核通过的图片候选应用到香水记录
 * 用法: npm run apply:images
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 构建 attribution 文本
 */
function buildAttribution(candidate: {
  creator?: string | null;
  license?: string | null;
  sourcePageUrl?: string | null;
}): string | null {
  const parts: string[] = [];

  if (candidate.creator) {
    parts.push(candidate.creator);
  }

  if (candidate.license) {
    parts.push(`(${candidate.license})`);
  }

  if (candidate.sourcePageUrl) {
    parts.push(`Source: ${candidate.sourcePageUrl}`);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

async function main() {
  console.log("\n🔄 开始应用已审核的图片...\n");

  // 查找所有 APPROVED 状态的候选
  const approvedCandidates = await prisma.perfumeImageCandidate.findMany({
    where: {
      status: "APPROVED",
    },
    include: {
      perfume: {
        select: {
          id: true,
          brand: true,
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  console.log(`找到 ${approvedCandidates.length} 个已审核通过的候选\n`);

  if (approvedCandidates.length === 0) {
    console.log("✅ 没有需要应用的候选图片！");
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const candidate of approvedCandidates) {
    // 如果香水已经有图片，跳过（避免覆盖）
    if (candidate.perfume.imageUrl) {
      console.log(
        `⏭️  跳过 ${candidate.perfume.brand} ${candidate.perfume.name}（已有图片）`
      );
      skipped++;
      continue;
    }

    const attribution = buildAttribution(candidate);

    try {
      // 更新香水图片信息
      await prisma.perfume.update({
        where: { id: candidate.perfumeId },
        data: {
          imageUrl: candidate.imageUrl,
          imageSource: candidate.source as "WIKIMEDIA" | "OPENVERSE",
          imageAttribution: attribution,
        },
      });

      console.log(
        `✅ 已更新: ${candidate.perfume.brand} ${candidate.perfume.name}`
      );
      console.log(`   URL: ${candidate.imageUrl}`);
      console.log(`   来源: ${candidate.source}`);

      updated++;
    } catch (error: any) {
      console.error(
        `❌ 更新失败 ${candidate.perfume.brand} ${candidate.perfume.name}:`,
        error.message
      );
    }
  }

  console.log(`\n✅ 完成！`);
  console.log(`  更新了 ${updated} 条香水图片`);
  if (skipped > 0) {
    console.log(`  跳过了 ${skipped} 条（已有图片）`);
  }
  console.log(
    `\n注意：候选记录仍保留在数据库中，状态为 APPROVED。如需清理，可手动删除。`
  );
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
