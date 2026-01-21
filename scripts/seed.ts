/**
 * 种子数据脚本
 * 用于初始化数据库：创建香水、Notes、Accords等数据
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { generateEmbeddingsBatch } from "../lib/embeddings";
import { normalizeSearchName } from "../lib/normalize";

const connectionString = process.env.DATABASE_URL!;
const url = new URL(connectionString);
const sslMode = url.searchParams.get("sslmode") || "prefer";
const allowSelfSigned = sslMode === "require" || sslMode === "prefer";
if (!url.searchParams.has("sslmode")) {
  url.searchParams.set("sslmode", sslMode);
}
if (allowSelfSigned) {
  url.searchParams.delete("sslmode");
}
const poolConfig: Record<string, unknown> = {
  connectionString: url.toString(),
  ssl: allowSelfSigned ? { rejectUnauthorized: false } : false,
};
const pool = new Pool(poolConfig as ConstructorParameters<typeof Pool>[0]);
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

// Note glossary数据（至少30条）
const notes = [
  // 柑橘类
  { name: "Bergamot", nameCn: "佛手柑", category: "citrus", description: "清新的柑橘香，带有微妙的苦味和花香", synonyms: ["香柠檬"] },
  { name: "Lemon", nameCn: "柠檬", category: "citrus", description: "明亮清新的柠檬香气", synonyms: [] },
  { name: "Orange", nameCn: "橙子", category: "citrus", description: "甜美的橙子香气", synonyms: ["甜橙"] },
  { name: "Grapefruit", nameCn: "葡萄柚", category: "citrus", description: "清爽微苦的葡萄柚香气", synonyms: [] },
  
  // 花香类
  { name: "Rose", nameCn: "玫瑰", category: "floral", description: "优雅的玫瑰花香，经典而浪漫", synonyms: [] },
  { name: "Jasmine", nameCn: "茉莉", category: "floral", description: "浓郁甜美的茉莉花香，带有轻微的动物感", synonyms: [] },
  { name: "Lavender", nameCn: "薰衣草", category: "floral", description: "清新的薰衣草香气，具有舒缓作用", synonyms: [] },
  { name: "Iris", nameCn: "鸢尾", category: "floral", description: "粉感、优雅的鸢尾花香，带有根茎的泥土气息", synonyms: ["鸢尾根"] },
  { name: "Lily of the Valley", nameCn: "铃兰", category: "floral", description: "清新甜美的铃兰花香", synonyms: ["山谷百合"] },
  { name: "Ylang-Ylang", nameCn: "依兰依兰", category: "floral", description: "浓郁甜美的依兰花香，带有热带气息", synonyms: [] },
  
  // 木质类
  { name: "Sandalwood", nameCn: "檀香", category: "woody", description: "温暖、奶油质感的檀香木香", synonyms: [] },
  { name: "Cedar", nameCn: "雪松", category: "woody", description: "干燥、清新的雪松木香", synonyms: ["雪松木"] },
  { name: "Patchouli", nameCn: "广藿香", category: "woody", description: "浓郁的木质、泥土和薄荷混合香气", synonyms: [] },
  { name: "Oud", nameCn: "乌木", category: "woody", description: "深沉、复杂的乌木香，带有动物感和药感", synonyms: ["沉香"] },
  { name: "Vetiver", nameCn: "香根草", category: "woody", description: "泥土、烟熏的香根草香气", synonyms: [] },
  
  // 东方/香料类
  { name: "Vanilla", nameCn: "香草", category: "gourmand", description: "甜美、温暖的香草香气", synonyms: ["香子兰"] },
  { name: "Amber", nameCn: "琥珀", category: "oriental", description: "温暖、性感的琥珀香调", synonyms: [] },
  { name: "Incense", nameCn: "焚香", category: "spicy", description: "神秘的焚香香气，带有宗教感", synonyms: ["熏香"] },
  { name: "Cinnamon", nameCn: "肉桂", category: "spicy", description: "温暖辛辣的肉桂香气", synonyms: [] },
  { name: "Cardamom", nameCn: "小豆蔻", category: "spicy", description: "清新辛辣的小豆蔻香气", synonyms: [] },
  
  // 清新/水调类
  { name: "Aquatic", nameCn: "水调", category: "aquatic", description: "清新的水生调，模拟海洋或雨水", synonyms: ["海洋调"] },
  { name: "Mint", nameCn: "薄荷", category: "fresh", description: "清爽的薄荷香气", synonyms: [] },
  { name: "Tea", nameCn: "茶香", category: "fresh", description: "淡雅的茶香，多为绿茶或白茶", synonyms: ["茶叶"] },
  
  // 其他
  { name: "Musk", nameCn: "麝香", category: "oriental", description: "温暖、动物感的麝香，常带有粉感", synonyms: [] },
  { name: "Tonka Bean", nameCn: "零陵香豆", category: "gourmand", description: "甜美、杏仁和香草混合的香气", synonyms: [] },
  { name: "Tobacco", nameCn: "烟草", category: "spicy", description: "干燥、烟熏的烟草香气", synonyms: [] },
  { name: "Leather", nameCn: "皮革", category: "oriental", description: "浓郁的皮革香气，带有动物感", synonyms: [] },
  { name: "Honey", nameCn: "蜂蜜", category: "gourmand", description: "甜美、温暖的蜂蜜香气", synonyms: [] },
  { name: "Milk", nameCn: "奶香", category: "gourmand", description: "柔和甜美的奶香", synonyms: ["牛奶"] },
  { name: "Soapy", nameCn: "皂感", category: "fresh", description: "干净、清爽的皂感香气", synonyms: ["肥皂感"] },
];

// Accord数据
const accords = [
  { name: "Aquatic", nameCn: "水生调", description: "清新水润的海洋或雨水气息" },
  { name: "Floral", nameCn: "花香调", description: "以花香为主的调性" },
  { name: "Woody", nameCn: "木质调", description: "以木质香为主的调性" },
  { name: "Oriental", nameCn: "东方调", description: "温暖、性感的东方香料调性" },
  { name: "Gourmand", nameCn: "美食调", description: "甜美、可食用的香气调性" },
  { name: "Fresh", nameCn: "清新调", description: "清爽、干净的调性" },
  { name: "Powdery", nameCn: "粉感", description: "柔和粉感的调性" },
  { name: "Smoky", nameCn: "烟熏感", description: "烟熏、焚香感的调性" },
  { name: "Animalic", nameCn: "动物感", description: "带有动物感的调性" },
  { name: "Green", nameCn: "绿调", description: "清新绿叶的调性" },
];

const perfumeDetails: Record<
  string,
  {
    notes: { name: string; position: "top" | "middle" | "base" }[];
    accords: string[];
  }
> = {
  "Creed|Aventus": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Grapefruit", position: "top" },
      { name: "Rose", position: "middle" },
      { name: "Jasmine", position: "middle" },
      { name: "Musk", position: "base" },
      { name: "Patchouli", position: "base" },
    ],
    accords: ["Woody", "Smoky", "Fresh"],
  },
  "Creed|Silver Mountain Water": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Tea", position: "middle" },
      { name: "Musk", position: "base" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Fresh", "Aquatic", "Woody"],
  },
  "Creed|Virgin Island Water": {
    notes: [
      { name: "Lemon", position: "top" },
      { name: "Ylang-Ylang", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Fresh", "Gourmand", "Woody"],
  },
  "Creed|Green Irish Tweed": {
    notes: [
      { name: "Lemon", position: "top" },
      { name: "Iris", position: "middle" },
      { name: "Vetiver", position: "base" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Green", "Woody", "Fresh"],
  },
  "Tom Ford|Black Orchid": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Patchouli", position: "base" },
      { name: "Vanilla", position: "base" },
    ],
    accords: ["Oriental", "Floral", "Gourmand"],
  },
  "Tom Ford|Oud Wood": {
    notes: [
      { name: "Cardamom", position: "top" },
      { name: "Oud", position: "middle" },
      { name: "Sandalwood", position: "middle" },
      { name: "Amber", position: "base" },
    ],
    accords: ["Woody", "Smoky", "Oriental"],
  },
  "Tom Ford|Tobacco Vanille": {
    notes: [
      { name: "Tobacco", position: "top" },
      { name: "Cinnamon", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Tonka Bean", position: "base" },
    ],
    accords: ["Gourmand", "Smoky", "Oriental"],
  },
  "Tom Ford|Neroli Portofino": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Orange", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Fresh", "Floral", "Aquatic"],
  },
  "Tom Ford|Santal Blush": {
    notes: [
      { name: "Cinnamon", position: "top" },
      { name: "Sandalwood", position: "middle" },
      { name: "Amber", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Woody", "Oriental", "Powdery"],
  },
  "Chanel|No. 5": {
    notes: [
      { name: "Lemon", position: "top" },
      { name: "Rose", position: "middle" },
      { name: "Jasmine", position: "middle" },
      { name: "Musk", position: "base" },
      { name: "Vanilla", position: "base" },
    ],
    accords: ["Floral", "Powdery", "Oriental"],
  },
  "Chanel|Coco Mademoiselle": {
    notes: [
      { name: "Orange", position: "top" },
      { name: "Rose", position: "middle" },
      { name: "Jasmine", position: "middle" },
      { name: "Patchouli", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Oriental", "Fresh"],
  },
  "Chanel|Bleu de Chanel": {
    notes: [
      { name: "Grapefruit", position: "top" },
      { name: "Lavender", position: "middle" },
      { name: "Cedar", position: "base" },
      { name: "Incense", position: "base" },
    ],
    accords: ["Woody", "Fresh", "Smoky"],
  },
  "Chanel|Allure Homme Sport": {
    notes: [
      { name: "Orange", position: "top" },
      { name: "Aquatic", position: "middle" },
      { name: "Cedar", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Fresh", "Aquatic", "Woody"],
  },
  "Dior|Sauvage": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Cardamom", position: "middle" },
      { name: "Amber", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Fresh", "Woody", "Oriental"],
  },
  "Dior|Miss Dior": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Rose", position: "middle" },
      { name: "Jasmine", position: "middle" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Fresh", "Woody"],
  },
  "Dior|Homme": {
    notes: [
      { name: "Lavender", position: "top" },
      { name: "Iris", position: "middle" },
      { name: "Vetiver", position: "base" },
    ],
    accords: ["Woody", "Powdery", "Fresh"],
  },
  "Yves Saint Laurent|Black Opium": {
    notes: [
      { name: "Orange", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Patchouli", position: "base" },
    ],
    accords: ["Gourmand", "Oriental", "Floral"],
  },
  "Yves Saint Laurent|Libre": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Lavender", position: "middle" },
      { name: "Orange", position: "middle" },
      { name: "Vanilla", position: "base" },
    ],
    accords: ["Floral", "Fresh", "Gourmand"],
  },
  "Yves Saint Laurent|La Nuit de L'Homme": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Cedar", position: "middle" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Woody", "Oriental", "Fresh"],
  },
  "Hermès|Terre d'Hermès": {
    notes: [
      { name: "Orange", position: "top" },
      { name: "Vetiver", position: "base" },
      { name: "Patchouli", position: "base" },
    ],
    accords: ["Woody", "Green", "Fresh"],
  },
  "Hermès|Twilly d'Hermès": {
    notes: [
      { name: "Cardamom", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Floral", "Oriental", "Woody"],
  },
  "Hermès|Un Jardin sur le Nil": {
    notes: [
      { name: "Grapefruit", position: "top" },
      { name: "Lily of the Valley", position: "middle" },
      { name: "Cedar", position: "base" },
    ],
    accords: ["Green", "Fresh", "Woody"],
  },
  "Byredo|Gypsy Water": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Incense", position: "middle" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Woody", "Smoky", "Fresh"],
  },
  "Byredo|Bal d'Afrique": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Vetiver", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Woody", "Oriental"],
  },
  "Byredo|Mojave Ghost": {
    notes: [
      { name: "Iris", position: "top" },
      { name: "Sandalwood", position: "middle" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Woody", "Powdery", "Fresh"],
  },
  "Le Labo|Santal 33": {
    notes: [
      { name: "Iris", position: "top" },
      { name: "Sandalwood", position: "middle" },
      { name: "Cedar", position: "base" },
      { name: "Leather", position: "base" },
    ],
    accords: ["Woody", "Animalic", "Powdery"],
  },
  "Le Labo|Rose 31": {
    notes: [
      { name: "Rose", position: "middle" },
      { name: "Cedar", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Woody", "Oriental"],
  },
  "Le Labo|Bergamote 22": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Grapefruit", position: "top" },
      { name: "Vetiver", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Fresh", "Woody", "Aquatic"],
  },
  "Maison Margiela|REPLICA Jazz Club": {
    notes: [
      { name: "Cardamom", position: "top" },
      { name: "Tobacco", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Cedar", position: "base" },
    ],
    accords: ["Smoky", "Gourmand", "Woody"],
  },
  "Maison Margiela|REPLICA By the Fireplace": {
    notes: [
      { name: "Cardamom", position: "top" },
      { name: "Tonka Bean", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Incense", position: "base" },
    ],
    accords: ["Smoky", "Gourmand", "Woody"],
  },
  "Maison Margiela|REPLICA Beach Walk": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Ylang-Ylang", position: "middle" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Aquatic", "Fresh", "Floral"],
  },
  "Diptyque|Philosykos": {
    notes: [
      { name: "Tea", position: "top" },
      { name: "Milk", position: "middle" },
      { name: "Cedar", position: "base" },
    ],
    accords: ["Green", "Woody", "Fresh"],
  },
  "Diptyque|Tam Dao": {
    notes: [
      { name: "Rose", position: "top" },
      { name: "Sandalwood", position: "middle" },
      { name: "Cedar", position: "base" },
    ],
    accords: ["Woody", "Powdery", "Oriental"],
  },
  "Diptyque|Do Son": {
    notes: [
      { name: "Orange", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Floral", "Fresh", "Powdery"],
  },
  "Acqua di Parma|Colonia": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Lavender", position: "middle" },
      { name: "Vetiver", position: "base" },
    ],
    accords: ["Fresh", "Woody", "Aquatic"],
  },
  "Acqua di Parma|Fico di Amalfi": {
    notes: [
      { name: "Lemon", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Cedar", position: "base" },
    ],
    accords: ["Fresh", "Green", "Floral"],
  },
  "Amouage|Reflection Man": {
    notes: [
      { name: "Bergamot", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Iris", position: "middle" },
      { name: "Sandalwood", position: "base" },
    ],
    accords: ["Floral", "Woody", "Powdery"],
  },
  "Penhaligon's|Halfeti": {
    notes: [
      { name: "Grapefruit", position: "top" },
      { name: "Rose", position: "middle" },
      { name: "Oud", position: "base" },
      { name: "Amber", position: "base" },
    ],
    accords: ["Oriental", "Woody", "Smoky"],
  },
  "Kilian|Love, Don't Be Shy": {
    notes: [
      { name: "Orange", position: "top" },
      { name: "Jasmine", position: "middle" },
      { name: "Vanilla", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Gourmand", "Floral", "Powdery"],
  },
  "Maison Francis Kurkdjian|Baccarat Rouge 540": {
    notes: [
      { name: "Jasmine", position: "top" },
      { name: "Amber", position: "middle" },
      { name: "Cedar", position: "base" },
      { name: "Musk", position: "base" },
    ],
    accords: ["Oriental", "Woody", "Floral"],
  },
};

// 真实奢侈品香水数据
const perfumes = [
  // Creed 系列
  {
    brand: "Creed",
    name: "Aventus",
    year: 2010,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "经典的现代男香，以菠萝和黑醋栗为前调，中调是茉莉和玫瑰，基调是麝香和橡苔",
    profileText: "Creed Aventus是一款现代经典的奢华香水，以明亮清新的菠萝和黑醋栗开篇，带来活力和果香。中调融合了优雅的茉莉和玫瑰花香，增添层次感。基调是温暖性感的麝香、橡苔和广藿香，营造出自信、成功的氛围。适合正式场合和日常使用，留香持久。",
  },
  {
    brand: "Creed",
    name: "Silver Mountain Water",
    year: 1995,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新水润的茶香调，以绿茶和黑醋栗为主",
    profileText: "Creed Silver Mountain Water是一款清新优雅的茶香调香水。前调是黑醋栗和佛手柑，带来果香和清新。中调是淡雅的绿茶和茶叶，充满东方韵味。基调是麝香和檀香，营造出干净、高雅的氛围。适合春夏季节和日常使用。",
  },
  {
    brand: "Creed",
    name: "Virgin Island Water",
    year: 2007,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "热带度假风情的椰子朗姆酒调",
    profileText: "Creed Virgin Island Water是一款充满热带风情的度假香水。前调是青柠和佛手柑，带来清新活力。中调是椰子、茉莉和依兰依兰，充满热带岛屿的浪漫。基调是朗姆酒、香草和麝香，营造出轻松、愉悦的度假氛围。适合夏季和休闲场合。",
  },
  {
    brand: "Creed",
    name: "Green Irish Tweed",
    year: 1985,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新绿调的经典男香，以紫罗兰叶和鸢尾为主",
    profileText: "Creed Green Irish Tweed是一款经典清新的绿调香水。前调是柠檬和马鞭草，带来清新活力。中调是紫罗兰叶和鸢尾，充满绿意和粉感。基调是檀香和龙涎香，营造出优雅、绅士的氛围。适合正式场合和成熟男性。",
  },
  
  // Tom Ford 系列
  {
    brand: "Tom Ford",
    name: "Black Orchid",
    year: 2006,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "奢华性感的东方花香调，以黑兰花和黑醋栗为主",
    profileText: "Tom Ford Black Orchid是一款奢华性感的东方花香调香水。前调是黑醋栗和佛手柑，带来果香和清新。中调是浓郁的黑兰花和茉莉，充满神秘感。基调是温暖的香草、广藿香和檀香，营造出性感、神秘的氛围。适合夜晚和特殊场合。",
  },
  {
    brand: "Tom Ford",
    name: "Oud Wood",
    year: 2007,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "深沉优雅的乌木调，以沉香和檀香为主",
    profileText: "Tom Ford Oud Wood是一款深沉优雅的乌木调香水。前调是粉红胡椒和小豆蔻，带来辛辣感。中调是沉香和檀香，充满东方神秘感。基调是香根草、琥珀和香草，营造出温暖、奢华的氛围。适合秋冬季节和正式场合。",
  },
  {
    brand: "Tom Ford",
    name: "Tobacco Vanille",
    year: 2007,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "温暖甜美的烟草调",
    profileText: "Tom Ford Tobacco Vanille是一款温暖甜美的美食调香水。前调是烟草叶和香料，带来温暖感。中调是香草、可可和干果，充满美食感。基调是甜烟草和香草，营造出温暖、舒适的冬季氛围。适合秋冬季节和夜晚。",
  },
  {
    brand: "Tom Ford",
    name: "Neroli Portofino",
    year: 2011,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新地中海风格的橙花调",
    profileText: "Tom Ford Neroli Portofino是一款清新地中海风格的橙花调香水。前调是佛手柑、柠檬和橘子，带来明亮清新。中调是橙花、茉莉和薰衣草，充满地中海风情。基调是琥珀和麝香，营造出干净、优雅的度假氛围。适合春夏季节和日常使用。",
  },
  {
    brand: "Tom Ford",
    name: "Santal Blush",
    year: 2011,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "温暖性感的檀香调，带有粉感",
    profileText: "Tom Ford Santal Blush是一款温暖性感的檀香调香水。前调是肉桂和芫荽，带来温暖辛辣。中调是檀香、茉莉和依兰依兰，充满东方魅力。基调是香草、琥珀和麝香，营造出温暖、性感的氛围。适合秋冬季节和夜晚。",
  },
  
  // Chanel 系列
  {
    brand: "Chanel",
    name: "No. 5",
    year: 1921,
    concentration: "EDP",
    gender: "female",
    priceRange: "luxury",
    description: "经典的花香醛调香水，以茉莉、玫瑰和醛为主",
    profileText: "Chanel No.5是香水史上的经典之作。前调是明亮的醛和柠檬，带来现代感。中调是优雅的茉莉、玫瑰和依兰依兰，充满女性魅力。基调是温暖的香草、琥珀和麝香，营造出永恒、优雅的氛围。适合正式场合和成熟女性。",
  },
  {
    brand: "Chanel",
    name: "Coco Mademoiselle",
    year: 2001,
    concentration: "EDP",
    gender: "female",
    priceRange: "luxury",
    description: "现代优雅的东方花香调",
    profileText: "Chanel Coco Mademoiselle是一款现代优雅的东方花香调香水。前调是橙子、橘子和佛手柑，带来清新果香。中调是玫瑰、茉莉和依兰依兰，充满女性魅力。基调是广藿香、香草和麝香，营造出优雅、自信的氛围。适合日常和正式场合。",
  },
  {
    brand: "Chanel",
    name: "Bleu de Chanel",
    year: 2010,
    concentration: "EDT",
    gender: "male",
    priceRange: "luxury",
    description: "清新优雅的现代男香",
    profileText: "Chanel Bleu de Chanel是一款清新优雅的现代男香。前调是柠檬、粉红胡椒和葡萄柚，带来清新活力。中调是生姜、茉莉和肉豆蔻，增添层次感。基调是香根草、广藿香和乳香，营造出自信、优雅的氛围。适合日常和正式场合。",
  },
  {
    brand: "Chanel",
    name: "Allure Homme Sport",
    year: 2004,
    concentration: "EDT",
    gender: "male",
    priceRange: "luxury",
    description: "运动清新的现代男香",
    profileText: "Chanel Allure Homme Sport是一款运动清新的现代男香。前调是橙子、柠檬和海水，带来清新活力。中调是胡椒和雪松，增添运动感。基调是香根草、琥珀和麝香，营造出活力、运动的氛围。适合运动和日常使用。",
  },
  
  // Dior 系列
  {
    brand: "Dior",
    name: "Sauvage",
    year: 2015,
    concentration: "EDT",
    gender: "male",
    priceRange: "mid",
    description: "清新辛辣的现代男香，以卡拉布里亚佛手柑和胡椒为主",
    profileText: "Dior Sauvage是一款清新辛辣的现代男香。前调是明亮的卡拉布里亚佛手柑，带来清新活力。中调是四川胡椒和粉红胡椒，增添辛辣感。基调是温暖的琥珀和麝香，营造出自由、野性的氛围。适合日常使用，留香中等。",
  },
  {
    brand: "Dior",
    name: "Miss Dior",
    year: 1947,
    concentration: "EDP",
    gender: "female",
    priceRange: "luxury",
    description: "经典优雅的花香调",
    profileText: "Dior Miss Dior是一款经典优雅的花香调香水。前调是卡拉布里亚佛手柑，带来清新。中调是格拉斯玫瑰和茉莉，充满女性魅力。基调是广藿香和麝香，营造出优雅、浪漫的氛围。适合日常和约会场合。",
  },
  {
    brand: "Dior",
    name: "Homme",
    year: 2005,
    concentration: "EDT",
    gender: "male",
    priceRange: "luxury",
    description: "优雅的鸢尾调男香",
    profileText: "Dior Homme是一款优雅的鸢尾调男香。前调是薰衣草和佛手柑，带来清新。中调是鸢尾和可可，充满粉感和优雅。基调是香根草和广藿香，营造出优雅、绅士的氛围。适合正式场合和成熟男性。",
  },
  
  // Yves Saint Laurent 系列
  {
    brand: "Yves Saint Laurent",
    name: "Black Opium",
    year: 2014,
    concentration: "EDP",
    gender: "female",
    priceRange: "mid",
    description: "甜美的咖啡花香调，以咖啡和香草为主",
    profileText: "YSL Black Opium是一款甜美性感的咖啡花香调香水。前调是粉红胡椒和橙花，带来清新果香。中调是咖啡、茉莉和杏仁，充满美食感。基调是香草、广藿香和雪松，营造出温暖、性感的氛围。适合夜晚和约会。",
  },
  {
    brand: "Yves Saint Laurent",
    name: "Libre",
    year: 2019,
    concentration: "EDP",
    gender: "female",
    priceRange: "luxury",
    description: "现代自由的花香调",
    profileText: "YSL Libre是一款现代自由的花香调香水。前调是黑醋栗和佛手柑，带来清新果香。中调是薰衣草和橙花，充满现代感。基调是香草和麝香，营造出自由、自信的氛围。适合日常和正式场合。",
  },
  {
    brand: "Yves Saint Laurent",
    name: "La Nuit de L'Homme",
    year: 2009,
    concentration: "EDT",
    gender: "male",
    priceRange: "luxury",
    description: "性感神秘的夜晚男香",
    profileText: "YSL La Nuit de L'Homme是一款性感神秘的夜晚男香。前调是佛手柑和香柠檬，带来清新。中调是薰衣草和雪松，充满神秘感。基调是香根草和麝香，营造出性感、神秘的夜晚氛围。适合夜晚和约会。",
  },
  
  // Hermès 系列
  {
    brand: "Hermès",
    name: "Terre d'Hermès",
    year: 2006,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "大地感的柑橘木质调",
    profileText: "Hermès Terre d'Hermès是一款大地感的柑橘木质调香水。前调是橙子和葡萄柚，带来清新果香。中调是玫瑰和天竺葵，增添层次感。基调是香根草、广藿香和安息香，营造出温暖、大地的氛围。适合日常和正式场合。",
  },
  {
    brand: "Hermès",
    name: "Twilly d'Hermès",
    year: 2017,
    concentration: "EDP",
    gender: "female",
    priceRange: "luxury",
    description: "甜美辛辣的花香调",
    profileText: "Hermès Twilly d'Hermès是一款甜美辛辣的花香调香水。前调是生姜，带来辛辣感。中调是晚香玉和茉莉，充满女性魅力。基调是檀香，营造出温暖、甜美的氛围。适合日常和约会。",
  },
  {
    brand: "Hermès",
    name: "Un Jardin sur le Nil",
    year: 2005,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新绿调的花园香水",
    profileText: "Hermès Un Jardin sur le Nil是一款清新绿调的花园香水。前调是青芒果和胡萝卜，带来独特果香。中调是莲花和风信子，充满绿意。基调是麝香和雪松，营造出清新、自然的氛围。适合春夏季节和日常使用。",
  },
  
  // Byredo 系列
  {
    brand: "Byredo",
    name: "Gypsy Water",
    year: 2008,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "自由浪漫的木质调",
    profileText: "Byredo Gypsy Water是一款自由浪漫的木质调香水。前调是佛手柑和杜松，带来清新。中调是香草和焚香，充满神秘感。基调是檀香和琥珀，营造出自由、浪漫的吉普赛氛围。适合日常和特殊场合。",
  },
  {
    brand: "Byredo",
    name: "Bal d'Afrique",
    year: 2009,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "温暖甜美的东方调",
    profileText: "Byredo Bal d'Afrique是一款温暖甜美的东方调香水。前调是佛手柑和柠檬，带来清新。中调是紫罗兰和茉莉，充满花香。基调是香根草、琥珀和麝香，营造出温暖、甜美的非洲舞会氛围。适合秋冬季节和夜晚。",
  },
  {
    brand: "Byredo",
    name: "Mojave Ghost",
    year: 2014,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新空灵的木质调",
    profileText: "Byredo Mojave Ghost是一款清新空灵的木质调香水。前调是黄葵和人参果，带来独特果香。中调是紫罗兰和檀香，充满空灵感。基调是雪松和麝香，营造出清新、空灵的沙漠氛围。适合日常和春夏季节。",
  },
  
  // Le Labo 系列
  {
    brand: "Le Labo",
    name: "Santal 33",
    year: 2011,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "标志性的檀香调",
    profileText: "Le Labo Santal 33是一款标志性的檀香调香水。前调是紫罗兰和鸢尾，带来粉感。中调是檀香和雪松，充满木质温暖。基调是皮革和麝香，营造出独特、现代的檀香氛围。适合日常和正式场合。",
  },
  {
    brand: "Le Labo",
    name: "Rose 31",
    year: 2006,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "现代感的玫瑰调",
    profileText: "Le Labo Rose 31是一款现代感的玫瑰调香水。前调是玫瑰和孜然，带来独特花香。中调是香根草和雪松，增添木质感。基调是麝香和琥珀，营造出现代、性感的玫瑰氛围。适合日常和夜晚。",
  },
  {
    brand: "Le Labo",
    name: "Bergamote 22",
    year: 2006,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新明亮的佛手柑调",
    profileText: "Le Labo Bergamote 22是一款清新明亮的佛手柑调香水。前调是佛手柑和葡萄柚，带来明亮清新。中调是香根草和橙花，增添层次感。基调是麝香和琥珀，营造出干净、清新的氛围。适合春夏季节和日常使用。",
  },
  
  // Maison Margiela 系列
  {
    brand: "Maison Margiela",
    name: "REPLICA Jazz Club",
    year: 2013,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "温暖性感的烟草调",
    profileText: "Maison Margiela REPLICA Jazz Club是一款温暖性感的烟草调香水。前调是粉红胡椒和柠檬，带来清新。中调是朗姆酒和香草，充满美食感。基调是烟草和雪松，营造出温暖、性感的爵士俱乐部氛围。适合秋冬季节和夜晚。",
  },
  {
    brand: "Maison Margiela",
    name: "REPLICA By the Fireplace",
    year: 2015,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "温暖舒适的壁炉调",
    profileText: "Maison Margiela REPLICA By the Fireplace是一款温暖舒适的壁炉调香水。前调是粉红胡椒和橙花，带来清新。中调是栗子和愈创木，充满温暖感。基调是香草和麝香，营造出温暖、舒适的壁炉氛围。适合秋冬季节和夜晚。",
  },
  {
    brand: "Maison Margiela",
    name: "REPLICA Beach Walk",
    year: 2012,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新海边的度假调",
    profileText: "Maison Margiela REPLICA Beach Walk是一款清新海边的度假调香水。前调是香柠檬和粉红胡椒，带来清新。中调是依兰依兰和椰子，充满热带风情。基调是麝香和雪松，营造出清新、放松的海边氛围。适合春夏季节和度假。",
  },
  
  // Diptyque 系列
  {
    brand: "Diptyque",
    name: "Philosykos",
    year: 1996,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新绿调的无花果香",
    profileText: "Diptyque Philosykos是一款清新绿调的无花果香。前调是无花果叶，带来绿意清新。中调是无花果和椰子，充满果香。基调是雪松和木质，营造出清新、自然的无花果树氛围。适合春夏季节和日常使用。",
  },
  {
    brand: "Diptyque",
    name: "Tam Dao",
    year: 2003,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "纯净的檀香调",
    profileText: "Diptyque Tam Dao是一款纯净的檀香调香水。前调是玫瑰和桃金娘，带来清新。中调是檀香和雪松，充满木质温暖。基调是麝香和琥珀，营造出纯净、宁静的檀香氛围。适合日常和冥想时刻。",
  },
  {
    brand: "Diptyque",
    name: "Do Son",
    year: 2005,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "优雅的晚香玉调",
    profileText: "Diptyque Do Son是一款优雅的晚香玉调香水。前调是橙花和玫瑰，带来清新花香。中调是晚香玉和茉莉，充满女性魅力。基调是麝香和安息香，营造出优雅、浪漫的越南氛围。适合日常和约会。",
  },
  
  // Acqua di Parma 系列
  {
    brand: "Acqua di Parma",
    name: "Colonia",
    year: 1916,
    concentration: "EDC",
    gender: "unisex",
    priceRange: "luxury",
    description: "经典的地中海柑橘调",
    profileText: "Acqua di Parma Colonia是一款经典的地中海柑橘调香水。前调是卡拉布里亚佛手柑和柠檬，带来明亮清新。中调是薰衣草和玫瑰，增添层次感。基调是雪松和香根草，营造出经典、优雅的地中海氛围。适合春夏季节和日常使用。",
  },
  {
    brand: "Acqua di Parma",
    name: "Fico di Amalfi",
    year: 2006,
    concentration: "EDT",
    gender: "unisex",
    priceRange: "luxury",
    description: "清新甜美的无花果调",
    profileText: "Acqua di Parma Fico di Amalfi是一款清新甜美的无花果调香水。前调是柠檬和佛手柑，带来清新。中调是无花果和茉莉，充满果香花香。基调是雪松和安息香，营造出清新、甜美的阿马尔菲海岸氛围。适合春夏季节和度假。",
  },
  
  // 其他奢侈品品牌
  {
    brand: "Amouage",
    name: "Reflection Man",
    year: 2007,
    concentration: "EDP",
    gender: "male",
    priceRange: "luxury",
    description: "优雅的粉感花香调",
    profileText: "Amouage Reflection Man是一款优雅的粉感花香调香水。前调是佛手柑和粉红胡椒，带来清新辛辣。中调是鸢尾、茉莉和橙花，充满粉感和优雅。基调是檀香和麝香，营造出优雅、绅士的氛围。适合正式场合和成熟男性。",
  },
  {
    brand: "Penhaligon's",
    name: "Halfeti",
    year: 2015,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "神秘性感的东方调",
    profileText: "Penhaligon's Halfeti是一款神秘性感的东方调香水。前调是佛手柑和葡萄柚，带来清新。中调是玫瑰、茉莉和肉豆蔻，充满东方魅力。基调是沉香、檀香和麝香，营造出神秘、性感的土耳其氛围。适合秋冬季节和夜晚。",
  },
  {
    brand: "Kilian",
    name: "Love, Don't Be Shy",
    year: 2007,
    concentration: "EDP",
    gender: "female",
    priceRange: "luxury",
    description: "甜美性感的橙花调",
    profileText: "Kilian Love, Don't Be Shy是一款甜美性感的橙花调香水。前调是橙花和粉红胡椒，带来清新。中调是茉莉和晚香玉，充满女性魅力。基调是香草和麝香，营造出甜美、性感的氛围。适合日常和约会。",
  },
  {
    brand: "Maison Francis Kurkdjian",
    name: "Baccarat Rouge 540",
    year: 2015,
    concentration: "EDP",
    gender: "unisex",
    priceRange: "luxury",
    description: "奢华甜美的琥珀调",
    profileText: "Maison Francis Kurkdjian Baccarat Rouge 540是一款奢华甜美的琥珀调香水。前调是茉莉和藏红花，带来独特花香。中调是琥珀和雪松，充满温暖感。基调是麝香和木质，营造出奢华、甜美的水晶氛围。适合正式场合和夜晚。",
  },
];

async function main() {
  console.log("开始种子数据导入...");

  // 1. 创建Notes
  console.log("创建Notes...");
  for (const note of notes) {
    await prisma.note.upsert({
      where: { name: note.name },
      update: {},
      create: note,
    });
  }
  console.log(`已创建 ${notes.length} 条Notes`);

  // 2. 创建Accords
  console.log("创建Accords...");
  for (const accord of accords) {
    await prisma.accord.upsert({
      where: { name: accord.name },
      update: {},
      create: accord,
    });
  }
  console.log(`已创建 ${accords.length} 条Accords`);

  // 3. 创建香水（分批处理，避免内存溢出）
  console.log("创建香水数据...");
  const batchSize = 10;
  const noteMap = await prisma.note.findMany();
  const accordMap = await prisma.accord.findMany();

  const noteByName = new Map(noteMap.map((note) => [note.name, note.id]));
  const accordByName = new Map(accordMap.map((accord) => [accord.name, accord.id]));

  for (let i = 0; i < perfumes.length; i += batchSize) {
    const batch = perfumes.slice(i, i + batchSize);
    const profileTexts = batch.map((p) => p.profileText);

    // 批量生成embeddings（如果OPENAI_API_KEY存在）
    let embeddings: number[][] | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        embeddings = await generateEmbeddingsBatch(profileTexts);
      } catch (error) {
        console.warn("无法生成embeddings（可能需要配置OPENAI_API_KEY），将跳过向量字段");
      }
    }

    for (let j = 0; j < batch.length; j++) {
      const perfumeData = batch[j];
      const detailKey = `${perfumeData.brand}|${perfumeData.name}`;
      const detail = perfumeDetails[detailKey];

      if (!detail) {
        console.warn(`Missing perfume details for ${detailKey}`);
      }

      const existing = await prisma.perfume.findFirst({
        where: { brand: perfumeData.brand, name: perfumeData.name },
        select: { id: true },
      });

      const searchName = normalizeSearchName(
        `${perfumeData.brand} ${perfumeData.name}`
      );
      const sourceId = `seed-${searchName}`;

      const perfume = existing
        ? await prisma.perfume.update({
            where: { id: existing.id },
            data: {
              ...perfumeData,
              imageUrl: null,
              imageSource: "NONE",
              source: "SEED",
              sourceId,
              searchName,
            },
          })
        : await prisma.perfume.create({
            data: {
              ...perfumeData,
              imageUrl: null,
              imageSource: "NONE",
              source: "SEED",
              sourceId,
              searchName,
            },
          });

      await prisma.perfumeNote.deleteMany({ where: { perfumeId: perfume.id } });
      await prisma.perfumeAccord.deleteMany({ where: { perfumeId: perfume.id } });

      const noteDetails = detail?.notes || [];
      for (const noteInfo of noteDetails) {
        const noteId = noteByName.get(noteInfo.name);
        if (!noteId) {
          console.warn(`Missing note ${noteInfo.name} for ${detailKey}`);
          continue;
        }
        await prisma.perfumeNote.create({
          data: {
            perfumeId: perfume.id,
            noteId,
            position: noteInfo.position,
            weight: 1,
          },
        });
      }

      const accordDetails = detail?.accords || [];
      for (const accordName of accordDetails) {
        const accordId = accordByName.get(accordName);
        if (!accordId) {
          console.warn(`Missing accord ${accordName} for ${detailKey}`);
          continue;
        }
        await prisma.perfumeAccord.create({
          data: {
            perfumeId: perfume.id,
            accordId,
          },
        });
      }
    }
    console.log(`已创建香水 ${i + 1}-${Math.min(i + batchSize, perfumes.length)}/${perfumes.length}`);
  }

  console.log("种子数据导入完成！");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
