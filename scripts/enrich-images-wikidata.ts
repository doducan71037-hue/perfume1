/**
 * 使用 Wikidata (P18) 补充香水图片
 * 使用方式：npm run enrich:images -- --limit=100
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { normalizeSearchName } from "../lib/normalize";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseArgs() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 50;
  return { limit };
}

function buildCommonsUrl(fileName: string) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    fileName
  )}?width=1200`;
}

async function fetchWikidataImage(query: string, expected: string) {
  const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
    query
  )}&language=en&format=json&limit=5`;

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) return null;

  const searchData = await searchResponse.json();
  const results = searchData.search || [];

  const normalizedExpected = normalizeSearchName(expected);

  const candidate = results.find((item: any) => {
    const label = item.label || "";
    const normalizedLabel = normalizeSearchName(label);
    return (
      normalizedLabel === normalizedExpected ||
      (item.match?.type === "label" && (item.match?.text || "") !== "")
    );
  });

  if (!candidate || typeof candidate.score !== "number" || candidate.score < 90) {
    return null;
  }

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${candidate.id}.json`;
  const entityResponse = await fetch(entityUrl);
  if (!entityResponse.ok) return null;

  const entityData = await entityResponse.json();
  const entity = entityData.entities?.[candidate.id];
  const imageClaim = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;

  if (!imageClaim) return null;

  return buildCommonsUrl(imageClaim as string);
}

async function main() {
  const { limit } = parseArgs();
  const perfumes = await prisma.perfume.findMany({
    where: { imageUrl: null },
    orderBy: { popularityScore: "desc" },
    take: limit,
    select: { id: true, brand: true, name: true },
  });

  let updated = 0;

  for (const perfume of perfumes) {
    const query = `${perfume.brand} ${perfume.name}`;
    const imageUrl = await fetchWikidataImage(query, query);

    if (!imageUrl) {
      continue;
    }

    await prisma.perfume.update({
      where: { id: perfume.id },
      data: {
        imageUrl,
        imageSource: "WIKIMEDIA",
        imageAttribution: "Wikimedia Commons",
      },
    });

    updated += 1;
  }

  console.log(`Wikidata images updated: ${updated}`);
}

main()
  .catch((error) => {
    console.error("Enrichment failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
