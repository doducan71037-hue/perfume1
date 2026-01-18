/**
 * 回填 searchName（brand + name 归一化）
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

async function main() {
  const perfumes = await prisma.perfume.findMany({
    select: { id: true, brand: true, name: true, searchName: true },
  });

  let updated = 0;

  for (const perfume of perfumes) {
    const searchName = normalizeSearchName(`${perfume.brand} ${perfume.name}`);
    if (perfume.searchName === searchName) {
      continue;
    }

    await prisma.perfume.update({
      where: { id: perfume.id },
      data: { searchName },
    });
    updated += 1;
  }

  console.log(`Backfilled searchName for ${updated} perfumes.`);
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
