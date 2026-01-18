/**
 * 自动为香水查找图片候选（Wikidata/Wikimedia Commons + Openverse）
 * 用法: npm run find:images -- --limit=20
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface WikidataSearchResult {
  search: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
}

interface WikidataEntity {
  entities: Record<
    string,
    {
      claims?: {
        P18?: Array<{
          mainsnak: {
            datavalue: {
              value: string; // Commons filename
            };
          };
        }>;
      };
    }
  >;
}

interface OpenverseResult {
  results: Array<{
    id: string;
    url: string;
    license: string;
    license_version?: string;
    creator?: string;
    creator_url?: string;
    foreign_landing_url?: string;
    title?: string;
  }>;
}

/**
 * 搜索 Wikidata 实体
 */
async function searchWikidata(query: string): Promise<string[]> {
  try {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbsearchentities");
    url.searchParams.set("search", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "3");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Wikidata search failed for "${query}": ${response.statusText}`);
      return [];
    }

    const data: WikidataSearchResult = await response.json();
    return data.search?.map((item) => item.id) || [];
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn(`Wikidata search timeout for "${query}"`);
    } else {
      console.warn(`Wikidata search error for "${query}":`, error.message);
    }
    return [];
  }
}

/**
 * 获取 Wikidata 实体的图片（P18 属性）
 */
async function getWikidataImage(entityId: string): Promise<string | null> {
  try {
    const url = new URL("https://www.wikidata.org/w/api.php");
    url.searchParams.set("action", "wbgetentities");
    url.searchParams.set("ids", entityId);
    url.searchParams.set("props", "claims");
    url.searchParams.set("format", "json");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data: WikidataEntity = await response.json();
    const entity = data.entities[entityId];

    if (!entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value) {
      return null;
    }

    const filename = entity.claims.P18[0].mainsnak.datavalue.value;
    // 将 Commons 文件名转为可访问 URL
    // 使用 Special:FilePath 获取直接图片链接
    const encodedFilename = encodeURIComponent(filename.replace(/ /g, "_"));
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodedFilename}`;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn(`Wikidata entity fetch timeout for "${entityId}"`);
    } else {
      console.warn(`Wikidata entity fetch error for "${entityId}":`, error.message);
    }
    return null;
  }
}

/**
 * 从 Openverse 搜索图片
 */
async function searchOpenverse(query: string): Promise<OpenverseResult["results"]> {
  try {
    const url = new URL("https://api.openverse.engineering/v1/images/");
    url.searchParams.set("q", `${query} perfume bottle`);
    url.searchParams.set("license", "cc0,by,by-sa");
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("page_size", "3");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`Openverse search failed for "${query}": ${response.statusText}`);
      return [];
    }

    const data: OpenverseResult = await response.json();
    return data.results || [];
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn(`Openverse search timeout for "${query}"`);
    } else {
      console.warn(`Openverse search error for "${query}":`, error.message);
    }
    return [];
  }
}

/**
 * 为单个香水查找图片候选
 */
async function findCandidatesForPerfume(perfume: {
  id: string;
  brand: string;
  name: string;
}): Promise<number> {
  const query = `${perfume.brand} ${perfume.name}`;
  let candidatesCreated = 0;

  console.log(`\n🔍 查找: ${perfume.brand} ${perfume.name}`);

  // 1. 尝试 Wikidata
  const entityIds = await searchWikidata(query);
  let foundInWikidata = false;

  for (const entityId of entityIds) {
    const imageUrl = await getWikidataImage(entityId);
    if (imageUrl) {
      foundInWikidata = true;
      try {
        await prisma.perfumeImageCandidate.upsert({
          where: {
            perfumeId_imageUrl: {
              perfumeId: perfume.id,
              imageUrl,
            },
          },
          create: {
            perfumeId: perfume.id,
            imageUrl,
            source: "WIKIMEDIA",
            license: "Various (Wikimedia Commons)",
            confidence: 0.9,
            status: "PENDING",
          },
          update: {
            // 如果已存在，更新状态为 PENDING（如果之前被拒绝，可以重新审核）
            status: "PENDING",
          },
        });
        console.log(`  ✅ Wikidata: ${imageUrl}`);
        candidatesCreated++;
        break; // 只取第一个找到的图片
      } catch (error: any) {
        if (error.code === "P2002") {
          // 唯一约束冲突，已存在
          console.log(`  ⏭️  已存在: ${imageUrl}`);
        } else {
          console.error(`  ❌ 保存失败:`, error.message);
        }
      }
    }
  }

  // 2. 如果 Wikidata 没找到，尝试 Openverse
  if (!foundInWikidata) {
    const openverseResults = await searchOpenverse(query);
    for (const result of openverseResults.slice(0, 1)) {
      // 只取第一个结果
      try {
        const licenseText = result.license_version
          ? `${result.license} ${result.license_version}`
          : result.license;
        const attribution = result.creator
          ? `${result.creator} (${licenseText})`
          : licenseText;

        await prisma.perfumeImageCandidate.upsert({
          where: {
            perfumeId_imageUrl: {
              perfumeId: perfume.id,
              imageUrl: result.url,
            },
          },
          create: {
            perfumeId: perfume.id,
            imageUrl: result.url,
            source: "OPENVERSE",
            license: licenseText,
            creator: result.creator || null,
            sourcePageUrl: result.foreign_landing_url || null,
            confidence: 0.7,
            status: "PENDING",
          },
          update: {
            status: "PENDING",
          },
        });
        console.log(`  ✅ Openverse: ${result.url}`);
        candidatesCreated++;
        break;
      } catch (error: any) {
        if (error.code === "P2002") {
          console.log(`  ⏭️  已存在: ${result.url}`);
        } else {
          console.error(`  ❌ 保存失败:`, error.message);
        }
      }
    }

    if (openverseResults.length === 0) {
      console.log(`  ⚠️  未找到图片`);
    }
  }

  return candidatesCreated;
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.replace("--limit=", ""), 10) : 50;

  console.log(`\n📸 开始查找图片候选（限制: ${limit} 条）\n`);

  // 查找 imageUrl 为空的香水
  const perfumes = await prisma.perfume.findMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: {
      id: true,
      brand: true,
      name: true,
    },
    take: limit,
  });

  console.log(`找到 ${perfumes.length} 条需要图片的香水\n`);

  if (perfumes.length === 0) {
    console.log("✅ 所有香水都已配置图片！");
    return;
  }

  let totalCandidates = 0;
  let processed = 0;

  for (const perfume of perfumes) {
    const count = await findCandidatesForPerfume(perfume);
    totalCandidates += count;
    processed++;

    // 添加延迟，避免 API 限流
    if (processed < perfumes.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`\n✅ 完成！`);
  console.log(`  处理了 ${processed} 条香水`);
  console.log(`  创建了 ${totalCandidates} 个候选图片`);
  console.log(`\n下一步：访问 /admin/images 审核候选图片`);
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
