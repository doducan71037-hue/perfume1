/**
 * 列出所有香水信息，用于手动找图
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const perfumes = await prisma.perfume.findMany({
    select: {
      id: true,
      brand: true,
      name: true,
      imageUrl: true,
    },
    orderBy: [
      { brand: "asc" },
      { name: "asc" },
    ],
  });

  console.log(`\n📋 总共 ${perfumes.length} 条香水记录\n`);

  // 输出到控制台
  console.log("=" .repeat(80));
  console.log("所有香水列表：");
  console.log("=" .repeat(80));
  
  perfumes.forEach((p, index) => {
    const hasImage = p.imageUrl ? "✅" : "❌";
    console.log(`${(index + 1).toString().padStart(3)}. ${hasImage} ${p.brand} - ${p.name}`);
  });

  // 生成 CSV 文件
  const csvLines = [
    "序号,品牌,名称,ID,已有图片URL",
    ...perfumes.map((p, index) => {
      const hasImage = p.imageUrl ? "是" : "否";
      const imageUrl = p.imageUrl || "";
      return `${index + 1},"${p.brand}","${p.name}","${p.id}","${imageUrl}"`;
    }),
  ];

  const csvPath = path.join(process.cwd(), "data", "perfumes-list.csv");
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf-8");
  console.log(`\n✅ CSV 文件已保存到: ${csvPath}`);

  // 生成纯文本列表（方便复制）
  const textLines = [
    "所有香水列表（用于找图）",
    "=" .repeat(80),
    "",
    ...perfumes.map((p, index) => `${index + 1}. ${p.brand} ${p.name}`),
    "",
    `总计: ${perfumes.length} 条香水`,
  ];

  const txtPath = path.join(process.cwd(), "data", "perfumes-list.txt");
  fs.writeFileSync(txtPath, textLines.join("\n"), "utf-8");
  console.log(`✅ 文本文件已保存到: ${txtPath}`);

  // 统计
  const withImage = perfumes.filter(p => p.imageUrl).length;
  const withoutImage = perfumes.length - withImage;
  console.log(`\n📊 统计：`);
  console.log(`  总数量: ${perfumes.length}`);
  console.log(`  已有图片: ${withImage}`);
  console.log(`  无图片: ${withoutImage}`);

  console.log(`\n💡 提示：`);
  console.log(`  1. 查看 CSV 文件: ${csvPath}`);
  console.log(`  2. 查看文本文件: ${txtPath}`);
  console.log(`  3. 找到图片后，准备一个 CSV 文件，格式如下：`);
  console.log(`     brand,name,imageUrl,imageSource,imageAttribution`);
  console.log(`     "Chanel","No. 5","https://example.com/image.jpg","USER","来源说明"`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
