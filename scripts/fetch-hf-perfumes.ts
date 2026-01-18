/**
 * 从 Hugging Face 下载香水数据集并转换为项目格式
 * 使用方式：tsx scripts/fetch-hf-perfumes.ts --limit=26000
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const HF_DATASET_URL =
  "https://huggingface.co/datasets/doevent/perfume/resolve/main/perfumes.json?download=true";

type RawPerfume = {
  id?: string | number;
  brand?: string;
  name?: string;
  name_perfume?: string;
  year?: number | string | null;
  years?: number | string | null;
  gender?: string | null;
  [key: string]: any; // 允许其他字段
};

type CleanedPerfume = {
  id: string;
  brand: string;
  name: string;
  year: number | null;
  gender: string | null;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const limitArg = args.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 26000;
  return { limit };
}

function generateId(record: RawPerfume): string {
  if (record.id != null) return String(record.id);
  const base = `${record.brand || ""}|${record.name || record.name_perfume || ""}`.trim();
  return crypto.createHash("sha1").update(base).digest("hex").slice(0, 16);
}

function parseYear(value: any): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return value > 1800 && value < 2100 ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // 尝试提取年份数字
    const match = trimmed.match(/\b(19|20)\d{2}\b/);
    if (match) {
      const year = parseInt(match[0], 10);
      return year > 1800 && year < 2100 ? year : null;
    }
    const num = parseInt(trimmed, 10);
    return num > 1800 && num < 2100 ? num : null;
  }
  return null;
}

function mapGender(value?: string | null): string | null {
  if (!value) return null;
  const normalized = value.toLowerCase().trim();
  if (normalized.includes("female") || normalized.includes("woman") || normalized === "f") {
    return "female";
  }
  if (normalized.includes("male") || normalized.includes("man") || normalized === "m") {
    return "male";
  }
  if (normalized.includes("unisex") || normalized === "u") {
    return "unisex";
  }
  return null;
}

function cleanPerfume(record: RawPerfume): CleanedPerfume | null {
  // 字段映射：优先使用 name_perfume，其次 name
  const name = (record.name_perfume || record.name || "").trim();
  const brand = (record.brand || "").trim();

  // brand 和 name 不能为空
  if (!brand || !name) {
    return null;
  }

  // year 字段映射：优先 years，其次 year
  const year = parseYear(record.years ?? record.year);

  // gender 映射
  const gender = mapGender(record.gender);

  // 生成 id
  const id = generateId(record);

  return {
    id,
    brand,
    name,
    year,
    gender,
  };
}

async function fetchDataset(): Promise<RawPerfume[]> {
  console.log("正在从 Hugging Face 下载数据集...");
  console.log(`URL: ${HF_DATASET_URL}`);
  
  // 使用 AbortController 设置更长的超时时间（60秒）
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(HF_DATASET_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PerfumeBot/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    const data = JSON.parse(text) as RawPerfume[];

    console.log(`下载完成，原始数据 ${data.length} 条`);
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('下载超时（60秒），请检查网络连接或稍后重试');
    }
    throw error;
  }
}

async function main() {
  const { limit } = parseArgs();
  const outputPath = path.resolve("data", "hf-perfumes.json");
  const outputDir = path.dirname(outputPath);

  // 确保 data 目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 下载数据
  const rawData = await fetchDataset();

  // 清洗和转换
  console.log("正在清洗数据...");
  const seen = new Set<string>();
  const cleaned: CleanedPerfume[] = [];

  for (const record of rawData) {
    const cleanedRecord = cleanPerfume(record);
    if (!cleanedRecord) continue;

    // 去重：基于 brand+name+year
    const key = `${cleanedRecord.brand.toLowerCase()}|${cleanedRecord.name.toLowerCase()}|${cleanedRecord.year || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);

    cleaned.push(cleanedRecord);

    if (cleaned.length >= limit) break;
  }

  // 写入文件
  fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2), "utf-8");

  console.log(`✅ 完成！已清洗并保存 ${cleaned.length} 条数据到 ${outputPath}`);
  console.log(`   去重前: ${rawData.length} 条`);
  console.log(`   去重后: ${cleaned.length} 条`);
}

main().catch((error) => {
  console.error("❌ 错误:", error);
  process.exit(1);
});
