/**
 * 从 perfume_images_pack/perfume_images.csv 导入图片
 * CSV格式：index,product_name,image_url,source,notes
 * 需要解析 product_name 为 brand 和 name
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
    // 处理CSV中的引号和逗号
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || "").replace(/^"|"$/g, "");
    });
    return row;
  });
}

/**
 * 解析 product_name 为 brand 和 name
 * 例如："Chanel No. 5" -> { brand: "Chanel", name: "No. 5" }
 */
function parseProductName(productName: string): { brand: string; name: string } | null {
  const trimmed = productName.trim();
  if (!trimmed) return null;

  // 尝试按第一个空格分割
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) {
    // 如果只有一个词，可能是品牌名或香水名
    // 这种情况下，我们假设第一个词是品牌
    return { brand: trimmed, name: "" };
  }

  // 常见品牌列表（多词品牌名）
  const multiWordBrands = [
    "Acqua di Parma",
    "Yves Saint Laurent",
    "Maison Francis Kurkdjian",
    "Maison Margiela",
    "L'Artisan Parfumeur",
    "Le Labo",
  ];

  // 检查是否是多词品牌
  for (const brand of multiWordBrands) {
    if (trimmed.startsWith(brand + " ")) {
      const name = trimmed.substring(brand.length).trim();
      return { brand, name };
    }
  }

  // 默认：第一个词是品牌，剩余是名称
  const brand = parts[0];
  const name = parts.slice(1).join(" ");
  return { brand, name };
}

async function main() {
  const csvPath = path.resolve("perfume_images_pack/perfume_images.csv");

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV not found: ${csvPath}`);
  }

  console.log(`\n📖 读取CSV文件: ${csvPath}\n`);

  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);

  console.log(`找到 ${rows.length} 条记录\n`);

  // 获取所有香水，构建映射
  const allPerfumes = await prisma.perfume.findMany({
    select: {
      id: true,
      brand: true,
      name: true,
      searchName: true,
    },
  });

  // 构建映射：normalized(brand+name) -> [perfumes]
  const perfumeMap = new Map<string, typeof allPerfumes>();
  for (const perfume of allPerfumes) {
    const normalized = normalizeSearchName(`${perfume.brand} ${perfume.name}`);
    if (!perfumeMap.has(normalized)) {
      perfumeMap.set(normalized, []);
    }
    perfumeMap.get(normalized)!.push(perfume);
  }

  let updated = 0;
  let notFound = 0;
  let skipped = 0;

  for (const row of rows) {
    const productName = row.product_name?.trim();
    const imageUrl = row.image_url?.trim();
    const source = row.source?.trim() || "USER";
    const notes = row.notes?.trim() || "";

    if (!productName || !imageUrl) {
      skipped++;
      continue;
    }

    // 解析品牌和名称
    const parsed = parseProductName(productName);
    if (!parsed) {
      skipped++;
      console.log(`⚠️  无法解析: ${productName}`);
      continue;
    }

    const { brand, name } = parsed;
    const normalized = normalizeSearchName(`${brand} ${name}`);

    // 查找匹配的香水
    const matches = perfumeMap.get(normalized) || [];
    if (matches.length === 0) {
      notFound++;
      console.log(`❌ 未找到: ${brand} ${name} (normalized: ${normalized})`);
      continue;
    }

    // 更新所有匹配的记录（如果有重复，都更新）
    for (const perfume of matches) {
      await prisma.perfume.update({
        where: { id: perfume.id },
        data: {
          imageUrl,
          imageSource: "USER",
          imageAttribution: notes || `来源: ${source}`,
        },
      });
      updated++;
      console.log(`✅ 已更新: ${perfume.brand} ${perfume.name} -> ${imageUrl.substring(0, 60)}...`);
    }
  }

  console.log(`\n✅ 完成！`);
  console.log(`  更新了 ${updated} 条香水图片`);
  if (notFound > 0) {
    console.log(`  ${notFound} 条未找到匹配`);
  }
  if (skipped > 0) {
    console.log(`  ${skipped} 条跳过（格式问题）`);
  }
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
