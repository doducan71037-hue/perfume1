/**
 * 添加20个大牌香水到数据库
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

// 20个大牌香水数据
const perfumes = [
  {
    brand: "Creed",
    name: "Aventus",
    year: 2010,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "经典的现代男香，以菠萝和黑醋栗为前调，中调是茉莉和玫瑰，基调是麝香和橡苔",
    profileText: "Creed Aventus是一款现代经典的奢华香水，以明亮清新的菠萝和黑醋栗开篇，带来活力和果香。中调融合了优雅的茉莉和玫瑰花香，增添层次感。基调是温暖性感的麝香、橡苔和广藿香，营造出自信、成功的氛围。适合正式场合和日常使用，留香持久。",
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Black Currant", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Rose", position: "middle" },
      { name: "Musk", position: "base" },
      { name: "Patchouli", position: "base" },
    ],
    accords: ["Woody", "Fresh"],
  },
  {
    brand: "Tom Ford",
    name: "Oud Wood",
    year: 2007,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "深沉优雅的乌木调，以沉香和檀香为主",
    profileText: "Tom Ford Oud Wood是一款深沉优雅的乌木调香水。前调是粉红胡椒和小豆蔻，带来辛辣感。中调是沉香和檀香，充满东方神秘感。基调是香根草、琥珀和香草，营造出温暖、奢华的氛围。适合秋冬季节和正式场合。",
    notes: [
      { name: "Cardamom", position: "top" },
      { name: "Oud", position: "middle" },
      { name: "Sandalwood", position: "middle" },
      { name: "Vetiver", position: "base" },
      { name: "Amber", position: "base" },
      { name: "Vanilla", position: "base" },
    ],
    accords: ["Woody", "Oriental"],
  },
  {
    brand: "Chanel",
    name: "Bleu de Chanel",
    year: 2010,
    concentration: "EDT",
    gender: "male" as const,
    priceRange: "luxury" as const,
    description: "清新优雅的现代男香",
    profileText: "Chanel Bleu de Chanel是一款清新优雅的现代男香。前调是柠檬、粉红胡椒和葡萄柚，带来清新活力。中调是生姜、茉莉和肉豆蔻，增添层次感。基调是香根草、广藿香和乳香，营造出自信、优雅的氛围。适合日常和正式场合。",
    notes: [
      { name: "Lemon", position: "top" },
      { name: "Grapefruit", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Vetiver", position: "base" },
      { name: "Patchouli", position: "base" },
    ],
    accords: ["Fresh", "Woody"],
  },
  {
    brand: "Dior",
    name: "Sauvage",
    year: 2015,
    concentration: "EDT",
    gender: "male" as const,
    priceRange: "mid" as const,
    description: "清新辛辣的现代男香，以卡拉布里亚佛手柑和胡椒为主",
    profileText: "Dior Sauvage是一款清新辛辣的现代男香。前调是明亮的卡拉布里亚佛手柑，带来清新活力。中调是四川胡椒和粉红胡椒，增添辛辣感。基调是温暖的琥珀和麝香，营造出自由、野性的氛围。适合日常使用，留香中等。",
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Pepper", position: "middle" },
      { name: "Amber", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Fresh", "Spicy"],
  },
  {
    brand: "Yves Saint Laurent",
    name: "Black Opium",
    year: 2014,
    concentration: "EDP",
    gender: "female" as const,
    priceRange: "mid" as const,
    description: "甜美的咖啡花香调，以咖啡和香草为主",
    profileText: "YSL Black Opium是一款甜美性感的咖啡花香调香水。前调是粉红胡椒和橙花，带来清新果香。中调是咖啡、茉莉和杏仁，充满美食感。基调是香草、广藿香和雪松，营造出温暖、性感的氛围。适合夜晚和约会。",
    notes: [
      { name: "Orange", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Cedar", position: "base" },
      { name: "Patchouli", position: "base" },
    ],
    accords: ["Gourmand", "Oriental"],
  },
  {
    brand: "Hermès",
    name: "Terre d'Hermès",
    year: 2006,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "大地感的柑橘木质调",
    profileText: "Hermès Terre d'Hermès是一款大地感的柑橘木质调香水。前调是橙子和葡萄柚，带来清新果香。中调是玫瑰和天竺葵，增添层次感。基调是香根草、广藿香和安息香，营造出温暖、大地的氛围。适合日常和正式场合。",
    notes: [
      { name: "Orange", position: "top" },
      { name: "Grapefruit", position: "top" },
      { name: "Rose", position: "middle" },
      { name: "Vetiver", position: "base" },
      { name: "Patchouli", position: "base" },
    ],
    accords: ["Woody", "Fresh"],
  },
  {
    brand: "Le Labo",
    name: "Santal 33",
    year: 2011,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "标志性的檀香调",
    profileText: "Le Labo Santal 33是一款标志性的檀香调香水。前调是紫罗兰和鸢尾，带来粉感。中调是檀香和雪松，充满木质温暖。基调是皮革和麝香，营造出独特、现代的檀香氛围。适合日常和正式场合。",
    notes: [
      { name: "Iris", position: "top" },
      { name: "Sandalwood", position: "middle" },
      { name: "Cedar", position: "middle" },
      { name: "Leather", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Woody", "Powdery"],
  },
  {
    brand: "Tom Ford",
    name: "Black Orchid",
    year: 2006,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "奢华性感的东方花香调，以黑兰花和黑醋栗为主",
    profileText: "Tom Ford Black Orchid是一款奢华性感的东方花香调香水。前调是黑醋栗和佛手柑，带来果香和清新。中调是浓郁的黑兰花和茉莉，充满神秘感。基调是温暖的香草、广藿香和檀香，营造出性感、神秘的氛围。适合夜晚和特殊场合。",
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Patchouli", position: "base" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Oriental", "Floral"],
  },
  {
    brand: "Chanel",
    name: "No. 5",
    year: 1921,
    concentration: "EDP",
    gender: "female" as const,
    priceRange: "luxury" as const,
    description: "经典的花香醛调香水，以茉莉、玫瑰和醛为主",
    profileText: "Chanel No.5是香水史上的经典之作。前调是明亮的醛和柠檬，带来现代感。中调是优雅的茉莉、玫瑰和依兰依兰，充满女性魅力。基调是温暖的香草、琥珀和麝香，营造出永恒、优雅的氛围。适合正式场合和成熟女性。",
    notes: [
      { name: "Lemon", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Rose", position: "middle" },
      { name: "Ylang-Ylang", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Amber", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Powdery"],
  },
  {
    brand: "Byredo",
    name: "Gypsy Water",
    year: 2008,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "自由浪漫的木质调",
    profileText: "Byredo Gypsy Water是一款自由浪漫的木质调香水。前调是佛手柑和杜松，带来清新。中调是香草和焚香，充满神秘感。基调是檀香和琥珀，营造出自由、浪漫的吉普赛氛围。适合日常和特殊场合。",
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Vanilla", position: "middle" },
      { name: "Incense", position: "middle" },
      { name: "Sandalwood", position: "base" },
      { name: "Amber", position: "base" },
    ],
    accords: ["Woody", "Oriental"],
  },
  {
    brand: "Maison Margiela",
    name: "REPLICA Jazz Club",
    year: 2013,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "温暖性感的烟草调",
    profileText: "Maison Margiela REPLICA Jazz Club是一款温暖性感的烟草调香水。前调是粉红胡椒和柠檬，带来清新。中调是朗姆酒和香草，充满美食感。基调是烟草和雪松，营造出温暖、性感的爵士俱乐部氛围。适合秋冬季节和夜晚。",
    notes: [
      { name: "Lemon", position: "top" },
      { name: "Vanilla", position: "middle" },
      { name: "Tobacco", position: "base" },
      { name: "Cedar", position: "base" },
    ],
    accords: ["Oriental", "Gourmand"],
  },
  {
    brand: "Diptyque",
    name: "Philosykos",
    year: 1996,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "清新绿调的无花果香",
    profileText: "Diptyque Philosykos是一款清新绿调的无花果香。前调是无花果叶，带来绿意清新。中调是无花果和椰子，充满果香。基调是雪松和木质，营造出清新、自然的无花果树氛围。适合春夏季节和日常使用。",
    notes: [
      { name: "Green", position: "top" },
      { name: "Coconut", position: "middle" },
      { name: "Cedar", position: "base" },
    ],
    accords: ["Green", "Fresh"],
  },
  {
    brand: "Tom Ford",
    name: "Tobacco Vanille",
    year: 2007,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "温暖甜美的烟草调",
    profileText: "Tom Ford Tobacco Vanille是一款温暖甜美的美食调香水。前调是烟草叶和香料，带来温暖感。中调是香草、可可和干果，充满美食感。基调是甜烟草和香草，营造出温暖、舒适的冬季氛围。适合秋冬季节和夜晚。",
    notes: [
      { name: "Tobacco", position: "top" },
      { name: "Vanilla", position: "middle" },
      { name: "Cinnamon", position: "middle" },
      { name: "Tobacco", position: "base" },
      { name: "Vanilla", position: "base" },
    ],
    accords: ["Gourmand", "Oriental"],
  },
  {
    brand: "Creed",
    name: "Silver Mountain Water",
    year: 1995,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "清新水润的茶香调，以绿茶和黑醋栗为主",
    profileText: "Creed Silver Mountain Water是一款清新优雅的茶香调香水。前调是黑醋栗和佛手柑，带来果香和清新。中调是淡雅的绿茶和茶叶，充满东方韵味。基调是麝香和檀香，营造出干净、高雅的氛围。适合春夏季节和日常使用。",
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Tea", position: "middle" },
      { name: "Musk", position: "base" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Fresh", "Aquatic"],
  },
  {
    brand: "Yves Saint Laurent",
    name: "Libre",
    year: 2019,
    concentration: "EDP",
    gender: "female" as const,
    priceRange: "luxury" as const,
    description: "现代自由的花香调",
    profileText: "YSL Libre是一款现代自由的花香调香水。前调是黑醋栗和佛手柑，带来清新果香。中调是薰衣草和橙花，充满现代感。基调是香草和麝香，营造出自由、自信的氛围。适合日常和正式场合。",
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Lavender", position: "middle" },
      { name: "Orange", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Fresh"],
  },
  {
    brand: "Hermès",
    name: "Twilly d'Hermès",
    year: 2017,
    concentration: "EDP",
    gender: "female" as const,
    priceRange: "luxury" as const,
    description: "甜美辛辣的花香调",
    profileText: "Hermès Twilly d'Hermès是一款甜美辛辣的花香调香水。前调是生姜，带来辛辣感。中调是晚香玉和茉莉，充满女性魅力。基调是檀香，营造出温暖、甜美的氛围。适合日常和约会。",
    notes: [
      { name: "Ginger", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Floral", "Oriental"],
  },
  {
    brand: "Le Labo",
    name: "Rose 31",
    year: 2006,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "现代感的玫瑰调",
    profileText: "Le Labo Rose 31是一款现代感的玫瑰调香水。前调是玫瑰和孜然，带来独特花香。中调是香根草和雪松，增添木质感。基调是麝香和琥珀，营造出现代、性感的玫瑰氛围。适合日常和夜晚。",
    notes: [
      { name: "Rose", position: "top" },
      { name: "Vetiver", position: "middle" },
      { name: "Cedar", position: "middle" },
      { name: "Musk", position: "base" },
      { name: "Amber", position: "base" },
    ],
    accords: ["Floral", "Woody"],
  },
  {
    brand: "Maison Francis Kurkdjian",
    name: "Baccarat Rouge 540",
    year: 2015,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "奢华甜美的琥珀调",
    profileText: "Maison Francis Kurkdjian Baccarat Rouge 540是一款奢华甜美的琥珀调香水。前调是茉莉和藏红花，带来独特花香。中调是琥珀和雪松，充满温暖感。基调是麝香和木质，营造出奢华、甜美的水晶氛围。适合正式场合和夜晚。",
    notes: [
      { name: "Jasmine", position: "top" },
      { name: "Amber", position: "middle" },
      { name: "Cedar", position: "middle" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Oriental", "Gourmand"],
  },
  {
    brand: "Dior",
    name: "Miss Dior",
    year: 1947,
    concentration: "EDP",
    gender: "female" as const,
    priceRange: "luxury" as const,
    description: "经典优雅的花香调",
    profileText: "Dior Miss Dior是一款经典优雅的花香调香水。前调是卡拉布里亚佛手柑，带来清新。中调是格拉斯玫瑰和茉莉，充满女性魅力。基调是广藿香和麝香，营造出优雅、浪漫的氛围。适合日常和约会场合。",
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Rose", position: "middle" },
      { name: "Jasmine", position: "middle" },
      { name: "Patchouli", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Powdery"],
  },
  {
    brand: "Byredo",
    name: "Mojave Ghost",
    year: 2014,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury" as const,
    description: "清新空灵的木质调",
    profileText: "Byredo Mojave Ghost是一款清新空灵的木质调香水。前调是黄葵和人参果，带来独特果香。中调是紫罗兰和檀香，充满空灵感。基调是雪松和麝香，营造出清新、空灵的沙漠氛围。适合日常和春夏季节。",
    notes: [
      { name: "Sandalwood", position: "middle" },
      { name: "Cedar", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Woody", "Fresh"],
  },
];

async function main() {
  console.log("开始添加20个大牌香水...");

  // 获取所有 notes 和 accords
  const allNotes = await prisma.note.findMany();
  const allAccords = await prisma.accord.findMany();

  const noteMap = new Map(allNotes.map((n) => [n.name, n]));
  const accordMap = new Map(allAccords.map((a) => [a.name, a]));

  let added = 0;
  let skipped = 0;

  for (const perfumeData of perfumes) {
    // 检查是否已存在
    const existing = await prisma.perfume.findFirst({
      where: {
        brand: perfumeData.brand,
        name: perfumeData.name,
      },
    });

    if (existing) {
      console.log(`已存在: ${perfumeData.brand} ${perfumeData.name}`);
      skipped++;
      continue;
    }

    // 创建香水
    const searchName = normalizeSearchName(
      `${perfumeData.brand} ${perfumeData.name}`
    );
    const perfume = await prisma.perfume.create({
      data: {
        brand: perfumeData.brand,
        name: perfumeData.name,
        year: perfumeData.year,
        concentration: perfumeData.concentration,
        gender: perfumeData.gender,
        priceRange: perfumeData.priceRange,
        description: perfumeData.description,
        profileText: perfumeData.profileText,
        imageUrl: null,
        imageSource: "NONE",
        source: "SEED",
        sourceId: `seed-${searchName}`,
        searchName,
        popularityScore: 0.7 + Math.random() * 0.3, // 0.7-1.0
      },
    });

    // 添加 notes
    for (const noteData of perfumeData.notes) {
      const note = noteMap.get(noteData.name);
      if (note) {
        await prisma.perfumeNote.create({
          data: {
            perfumeId: perfume.id,
            noteId: note.id,
            position: noteData.position as "top" | "middle" | "base",
            weight: 0.8 + Math.random() * 0.2,
          },
        });
      }
    }

    // 添加 accords
    for (const accordName of perfumeData.accords) {
      const accord = accordMap.get(accordName);
      if (accord) {
        await prisma.perfumeAccord.create({
          data: {
            perfumeId: perfume.id,
            accordId: accord.id,
          },
        });
      }
    }

    added++;
    console.log(`✓ 已添加: ${perfumeData.brand} ${perfumeData.name}`);
  }

  console.log(`\n完成！添加了 ${added} 个香水，跳过了 ${skipped} 个已存在的香水。`);
}

main()
  .catch((e) => {
    console.error("错误:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
