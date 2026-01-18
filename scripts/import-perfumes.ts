/**
 * 导入可授权/开源香水基础库（结构化字段）
 * 使用方式：npm run import:perfumes -- --source=hf --limit=26000
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { normalizeSearchName } from "../lib/normalize";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type Source = "hf" | "wikidata";

type RawPerfume = {
  id?: string | number;
  sourceId?: string | number;
  brand?: string;
  name?: string;
  year?: number | string | null;
  gender?: string | null;
  imageUrl?: string | null;
};

function parseArgs() {
  const args = process.argv.slice(2);
  const sourceArg = args.find((arg) => arg.startsWith("--source="));
  const limitArg = args.find((arg) => arg.startsWith("--limit="));

  const source = (sourceArg?.split("=")[1] || "hf") as Source;
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : undefined;

  return { source, limit };
}

function getDatasetPath(source: Source) {
  return path.resolve("data", `${source}-perfumes.json`);
}

function toSourceId(record: RawPerfume) {
  if (record.sourceId != null) return String(record.sourceId);
  if (record.id != null) return String(record.id);
  const base = `${record.brand || ""}|${record.name || ""}`.trim();
  return crypto.createHash("sha1").update(base).digest("hex");
}

function mapGender(value?: string | null) {
  if (!value) return null;
  const normalized = value.toLowerCase();
  if (normalized.includes("female") || normalized.includes("woman")) return "female";
  if (normalized.includes("male") || normalized.includes("man")) return "male";
  if (normalized.includes("unisex")) return "unisex";
  return null;
}

async function main() {
  const { source, limit } = parseArgs();
  const datasetPath = getDatasetPath(source);

  // 如果 source=hf 且文件不存在，自动下载
  if (source === "hf" && !fs.existsSync(datasetPath)) {
    console.log("数据文件不存在，正在自动下载...");
    const limitArg = limit ? `--limit=${limit}` : "";
    try {
      execSync(`tsx scripts/fetch-hf-perfumes.ts ${limitArg}`, {
        stdio: "inherit",
        cwd: process.cwd(),
      });
      console.log("下载完成！");
    } catch (error) {
      throw new Error(`自动下载失败: ${error}`);
    }
  }

  if (!fs.existsSync(datasetPath)) {
    throw new Error(`Dataset not found: ${datasetPath}`);
  }

  const raw = JSON.parse(fs.readFileSync(datasetPath, "utf-8")) as RawPerfume[];
  // 如果已经通过 fetch 脚本限制了数量，这里就不需要再限制
  // 但如果用户指定了更小的 limit，则应用它
  const rows = limit && limit < raw.length ? raw.slice(0, limit) : raw;

  let processed = 0;

  while (processed < rows.length) {
    const chunk = rows.slice(processed, processed + 1000);
    const data = chunk
      .filter((record) => record.brand && record.name)
      .map((record) => {
        const brand = record.brand?.trim() || "";
        const name = record.name?.trim() || "";
        const searchName = normalizeSearchName(`${brand} ${name}`);
        const sourceId = toSourceId(record);
        const year = record.year ? Number(record.year) : undefined;
        const imageUrl =
          source === "wikidata" ? record.imageUrl || null : null;

        return {
          brand,
          name,
          year,
          gender: mapGender(record.gender),
          description: null,
          profileText: `${brand} ${name}`.trim(),
          imageUrl,
          imageSource: imageUrl ? "WIKIMEDIA" : "NONE",
          imageAttribution: imageUrl ? "Wikimedia Commons" : null,
          source: source.toUpperCase(),
          sourceId,
          searchName,
        };
      });

    if (data.length > 0) {
      await prisma.perfume.createMany({
        data,
        skipDuplicates: true,
      });
    }

    processed += chunk.length;
    console.log(`Imported ${Math.min(processed, rows.length)} / ${rows.length}`);
  }
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
