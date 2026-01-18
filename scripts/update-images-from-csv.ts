/**
 * 根据CSV文件更新香水图片
 * CSV格式：index,product_name,image_url,source,notes,brand_domain,suggested_search_url,status
 * product_name格式：例如 "Acqua di Parma Colonia"
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

  // 处理CSV中可能包含引号和逗号的情况
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // 双引号转义
        current += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // 字段分隔符
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim()); // 最后一个字段

  return values;
}

function resolveImageSource(imageUrl: string, source?: string): string {
  if (source) {
    // 根据source字段判断
    if (source.includes("acquadiparma") || source.includes("chanel") || 
        source.includes("amouage") || source.includes("hermes")) {
      return "USER"; // 官方网站图片
    }
    if (source.includes("byredo") || source.includes("fimgs")) {
      return "USER"; // 第三方图片源
    }
    if (source.includes("sephora")) {
      return "USER"; // 零售商图片
    }
  }
  return "USER";
}

async function main() {
  const csvPathArg = process.argv.find((arg) => arg.startsWith("--file="));
  const csvPath = csvPathArg
    ? csvPathArg.replace("--file=", "")
    : "perfume_images_links_no_xssd_pack111/perfume_images_links_no_xssd.csv";

  const resolvedPath = path.resolve(csvPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`CSV not found: ${resolvedPath}`);
  }

  console.log(`📖 读取CSV文件: ${resolvedPath}\n`);

  const content = fs.readFileSync(resolvedPath, "utf-8");
  const rows = parseCsv(content);

  console.log(`找到 ${rows.length} 条记录\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  // 先获取所有香水，构建 normalized searchName 映射
  const allPerfumes = await prisma.perfume.findMany({
    select: {
      id: true,
      brand: true,
      name: true,
      searchName: true,
      imageUrl: true,
    },
  });

  console.log(`数据库中总共有 ${allPerfumes.length} 条香水记录\n`);

  // 构建映射：normalized(brand+name) -> perfume
  const perfumeMap = new Map<string, typeof allPerfumes[0]>();
  for (const perfume of allPerfumes) {
    // 使用 searchName 或生成 normalized key
    const normalized = normalizeSearchName(`${perfume.brand} ${perfume.name}`);
    const key = perfume.searchName || normalized;
    
    // 如果同一个key有多个产品，只保留第一个（通常是最早创建的）
    if (!perfumeMap.has(key)) {
      perfumeMap.set(key, perfume);
    }
  }

  // 处理每一行
  for (const row of rows) {
    const productName = row.product_name?.trim();
    const imageUrl = row.image_url?.trim();
    const status = row.status?.trim();

    // 如果没有图片URL或状态是needs_link，跳过
    if (!imageUrl || !productName || status === "needs_link") {
      skipped++;
      continue;
    }

    // 使用 product_name 直接匹配（normalize后）
    const normalized = normalizeSearchName(productName);
    const perfume = perfumeMap.get(normalized);

    if (!perfume) {
      notFound++;
      console.log(`❌ 未找到: ${productName} (normalized: ${normalized})`);
      continue;
    }

    // 更新图片
    await prisma.perfume.update({
      where: { id: perfume.id },
      data: {
        imageUrl,
        imageSource: resolveImageSource(imageUrl, row.source),
        imageAttribution: row.notes || null,
      },
    });

    updated++;
    console.log(`✅ 已更新: ${perfume.brand} ${perfume.name}`);
    console.log(`   URL: ${imageUrl.substring(0, 80)}...`);
  }

  console.log(`\n✅ 完成！`);
  console.log(`  更新了 ${updated} 条香水图片`);
  console.log(`  跳过了 ${skipped} 条（无图片或needs_link状态）`);
  console.log(`  未找到匹配: ${notFound} 条`);
}

main()
  .catch((error) => {
    console.error("❌ 错误:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });