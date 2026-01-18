/**
 * 批量隐藏 CSV 中没有图片链接的产品
 * CSV格式：index,product_name,image_url,source,notes,brand_domain,suggested_search_url,status
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
    // 处理可能包含逗号的字段（用引号包裹的）
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
      row[header] = values[index] || "";
    });
    return row;
  });
}

/**
 * 从 product_name 中提取 brand 和 name
 * 例如: "Chanel No. 5" -> { brand: "Chanel", name: "No. 5" }
 * "Acqua di Parma Colonia" -> { brand: "Acqua di Parma", name: "Colonia" }
 */
function parseProductName(productName: string): { brand: string; name: string } | null {
  const trimmed = productName.trim();
  if (!trimmed) return null;

  // 常见的品牌名称（可能需要根据实际情况调整）
  const knownBrands = [
    "Acqua di Parma",
    "Amouage",
    "Byredo",
    "Calvin Klein",
    "Chanel",
    "Creed",
    "Dior",
    "Hermès",
    "Tom Ford",
    "Yves Saint Laurent",
  ];

  // 尝试匹配已知品牌
  for (const brand of knownBrands) {
    if (trimmed.startsWith(brand)) {
      const name = trimmed.substring(brand.length).trim();
      if (name) {
        return { brand, name };
      }
    }
  }

  // 如果没有匹配到，尝试按第一个空格分割（简单方法）
  const firstSpace = trimmed.indexOf(" ");
  if (firstSpace > 0) {
    return {
      brand: trimmed.substring(0, firstSpace),
      name: trimmed.substring(firstSpace + 1),
    };
  }

  return null;
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

  console.log(`📖 读取 CSV 文件: ${resolvedPath}`);
  const content = fs.readFileSync(resolvedPath, "utf-8");
  const rows = parseCsv(content);

  console.log(`📊 共 ${rows.length} 行数据`);

  // 找出没有图片链接的产品
  const productsWithoutImages = rows.filter((row) => {
    const imageUrl = row.image_url?.trim();
    return !imageUrl || imageUrl === "";
  });

  console.log(`\n🔍 找到 ${productsWithoutImages.length} 个没有图片链接的产品`);

  if (productsWithoutImages.length === 0) {
    console.log("✅ 所有产品都有图片链接，无需隐藏");
    return;
  }

  // 先获取所有香水，构建 normalized searchName 映射
  console.log("\n📦 加载数据库中的香水...");
  const allPerfumes = await prisma.perfume.findMany({
    select: {
      id: true,
      brand: true,
      name: true,
      searchName: true,
      isHidden: true,
    },
  });

  console.log(`📦 数据库中共有 ${allPerfumes.length} 个香水`);

  // 构建映射：normalized(brand+name) -> perfume
  const perfumeMap = new Map<string, typeof allPerfumes[0]>();
  for (const perfume of allPerfumes) {
    const normalized = normalizeSearchName(`${perfume.brand} ${perfume.name}`);
    const key = perfume.searchName || normalized;
    if (!perfumeMap.has(key)) {
      perfumeMap.set(key, perfume);
    }
  }

  let hidden = 0;
  let alreadyHidden = 0;
  let notFound = 0;
  const notFoundList: string[] = [];

  console.log("\n🔒 开始批量隐藏...\n");

  for (const row of productsWithoutImages) {
    const productName = row.product_name?.trim();
    if (!productName) {
      continue;
    }

    const parsed = parseProductName(productName);
    if (!parsed) {
      notFound += 1;
      notFoundList.push(productName);
      console.log(`❌ 无法解析产品名称: ${productName}`);
      continue;
    }

    const { brand, name } = parsed;
    const normalized = normalizeSearchName(`${brand} ${name}`);
    const perfume = perfumeMap.get(normalized);

    if (!perfume) {
      notFound += 1;
      notFoundList.push(`${brand} ${name} (normalized: ${normalized})`);
      console.log(`❌ 未找到: ${brand} ${name}`);
      continue;
    }

    if (perfume.isHidden) {
      alreadyHidden += 1;
      console.log(`⏭️  已隐藏: ${perfume.brand} ${perfume.name}`);
      continue;
    }

    await prisma.perfume.update({
      where: { id: perfume.id },
      data: {
        isHidden: true,
      },
    });

    hidden += 1;
    console.log(`✅ 已隐藏: ${perfume.brand} ${perfume.name}`);
  }

  console.log(`\n📊 处理结果:`);
  console.log(`   ✅ 新隐藏: ${hidden} 个`);
  console.log(`   ⏭️  已隐藏: ${alreadyHidden} 个`);
  console.log(`   ❌ 未找到: ${notFound} 个`);

  if (notFoundList.length > 0) {
    console.log(`\n⚠️  未找到的产品列表:`);
    notFoundList.slice(0, 20).forEach((item) => {
      console.log(`   - ${item}`);
    });
    if (notFoundList.length > 20) {
      console.log(`   ... 还有 ${notFoundList.length - 20} 个`);
    }
  }

  console.log(`\n✅ 完成！`);
}

main()
  .catch((error) => {
    console.error("❌ 错误:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
