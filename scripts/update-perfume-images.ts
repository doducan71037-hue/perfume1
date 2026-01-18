/**
 * 根据用户提供的CSV更新香水图片
 * CSV列：brand,name,imageUrl,imageSource?,imageAttribution?
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { normalizeSearchName } from "../lib/normalize";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function resolveImageSource(imageUrl: string, provided?: string) {
  if (provided) return provided;
  if (imageUrl.startsWith("/images/")) return "LOCAL";
  return "USER_CDN";
}

async function main() {
  const csvPathArg = process.argv.find((arg) => arg.startsWith("--file="));
  const csvPath = csvPathArg
    ? csvPathArg.replace("--file=", "")
    : "data/perfume-images.csv";

  const resolvedPath = path.resolve(csvPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`CSV not found: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, "utf-8");
  const rows = parseCsv(content);

  let updated = 0;
  let notFound = 0;

  // 先获取所有香水，构建 normalized searchName 映射
  const allPerfumes = await prisma.perfume.findMany({
    select: {
      id: true,
      brand: true,
      name: true,
      searchName: true,
    },
  });

  // 构建映射：normalized(brand+name) -> perfume
  const perfumeMap = new Map<string, typeof allPerfumes[0]>();
  for (const perfume of allPerfumes) {
    const normalized = normalizeSearchName(`${perfume.brand} ${perfume.name}`);
    // 如果 searchName 已存在，优先使用它（更准确）
    const key = perfume.searchName || normalized;
    if (!perfumeMap.has(key)) {
      perfumeMap.set(key, perfume);
    }
  }

  for (const row of rows) {
    const brand = row.brand?.trim();
    const name = row.name?.trim();
    const imageUrl = row.imageUrl?.trim();
    if (!brand || !name || !imageUrl) {
      continue;
    }

    // 使用 normalize 匹配
    const normalized = normalizeSearchName(`${brand} ${name}`);
    const perfume = perfumeMap.get(normalized);

    if (!perfume) {
      notFound += 1;
      console.log(`Not found: ${brand} ${name} (normalized: ${normalized})`);
      continue;
    }

    await prisma.perfume.update({
      where: { id: perfume.id },
      data: {
        imageUrl,
        imageSource: resolveImageSource(imageUrl, row.imageSource),
        imageAttribution: row.imageAttribution || null,
      },
    });

    updated += 1;
    console.log(`Updated: ${perfume.brand} ${perfume.name} -> ${imageUrl}`);
  }

  console.log(`\n✅ 完成！更新了 ${updated} 条香水图片，${notFound} 条未找到匹配。`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
