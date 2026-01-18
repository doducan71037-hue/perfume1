/**
 * 从多个高质量来源查找香水产品图
 * 方案1: Unsplash API (免费，高质量，但可能没有具体产品图)
 * 方案2: Google Custom Search API (需要API key，但能找到准确的产品图)
 * 方案3: 多个来源聚合搜索，选择最佳图片
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ImageCandidate {
  url: string;
  source: string;
  width?: number;
  height?: number;
  thumbnail?: string;
  description?: string;
  score: number; // 0-1，质量评分
}

/**
 * 方案1: Unsplash API 搜索
 * 优点：免费、高质量、视觉统一
 * 缺点：可能没有具体的香水产品图，更多是概念图
 */
async function searchUnsplash(query: string): Promise<ImageCandidate[]> {
  const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!unsplashAccessKey) {
    console.warn("⚠️  UNSPLASH_ACCESS_KEY 未设置，跳过 Unsplash 搜索");
    return [];
  }

  try {
    const searchQuery = `${query} perfume bottle product photography`;
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=portrait`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.results || []).map((photo: any) => ({
      url: photo.urls.regular,
      source: "UNSPLASH",
      width: photo.width,
      height: photo.height,
      thumbnail: photo.urls.thumb,
      description: photo.description || photo.alt_description,
      score: 0.8, // Unsplash 图片质量高
    }));
  } catch (error) {
    console.warn(`Unsplash search error: ${error}`);
    return [];
  }
}

/**
 * 方案2: Google Custom Search API
 * 优点：能找到准确的产品图
 * 缺点：需要API key，有配额限制
 */
async function searchGoogleImages(query: string): Promise<ImageCandidate[]> {
  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCx = process.env.GOOGLE_CX; // Custom Search Engine ID
  
  if (!googleApiKey || !googleCx) {
    console.warn("⚠️  GOOGLE_API_KEY 或 GOOGLE_CX 未设置，跳过 Google 搜索");
    return [];
  }

  try {
    const searchQuery = `${query} perfume bottle official product photo`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCx}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=5&imgSize=large&imgType=photo`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => ({
      url: item.link,
      source: "GOOGLE",
      width: item.image?.width,
      height: item.image?.height,
      thumbnail: item.image?.thumbnailLink,
      description: item.title,
      score: 0.7, // Google 图片质量中等，但匹配度高
    }));
  } catch (error) {
    console.warn(`Google search error: ${error}`);
    return [];
  }
}

/**
 * 方案3: Pexels API (免费，高质量)
 */
async function searchPexels(query: string): Promise<ImageCandidate[]> {
  const pexelsApiKey = process.env.PEXELS_API_KEY;
  if (!pexelsApiKey) {
    return [];
  }

  try {
    const searchQuery = `${query} perfume bottle`;
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=portrait`;
    
    const response = await fetch(url, {
      headers: {
        Authorization: pexelsApiKey,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return (data.photos || []).map((photo: any) => ({
      url: photo.src.large,
      source: "PEXELS",
      width: photo.width,
      height: photo.height,
      thumbnail: photo.src.medium,
      description: photo.photographer,
      score: 0.75,
    }));
  } catch (error) {
    return [];
  }
}

/**
 * 方案4: 使用图片处理服务统一处理现有图片
 * 使用 Cloudinary 或 Imgix 等CDN服务，统一处理图片样式
 */
function processImageWithCDN(originalUrl: string, cdn: "cloudinary" | "imgix" = "cloudinary"): string {
  // Cloudinary 示例
  if (cdn === "cloudinary") {
    // 需要先上传到 Cloudinary，然后可以统一处理
    // 这里只是示例URL格式
    return originalUrl; // 实际需要先上传
  }
  
  // Imgix 示例
  if (cdn === "imgix") {
    const imgixDomain = process.env.IMGIX_DOMAIN;
    if (!imgixDomain) return originalUrl;
    // 使用 Imgix 代理和优化
    return `https://${imgixDomain}/${encodeURIComponent(originalUrl)}?w=800&h=1000&fit=crop&auto=format&q=80`;
  }
  
  return originalUrl;
}

/**
 * 综合搜索：从多个来源搜索，选择最佳图片
 */
async function findBestImage(brand: string, name: string): Promise<ImageCandidate | null> {
  const query = `${brand} ${name}`;
  const candidates: ImageCandidate[] = [];

  // 并行搜索多个来源
  const [unsplashResults, googleResults, pexelsResults] = await Promise.all([
    searchUnsplash(query),
    searchGoogleImages(query),
    searchPexels(query),
  ]);

  candidates.push(...unsplashResults, ...googleResults, ...pexelsResults);

  if (candidates.length === 0) {
    return null;
  }

  // 评分排序：优先选择高质量、匹配度高的图片
  candidates.sort((a, b) => {
    // 优先选择尺寸合适的（接近3:4比例）
    const aRatio = a.width && a.height ? a.width / a.height : 0;
    const bRatio = b.width && b.height ? b.width / b.height : 0;
    const targetRatio = 3 / 4;
    const aRatioScore = Math.abs(aRatio - targetRatio);
    const bRatioScore = Math.abs(bRatio - targetRatio);

    // 综合评分：质量分 - 比例偏差
    const aScore = a.score - aRatioScore * 0.1;
    const bScore = b.score - bRatioScore * 0.1;

    return bScore - aScore;
  });

  return candidates[0];
}

async function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.replace("--limit=", ""), 10) : 10;

  console.log("\n🔍 从高质量来源查找图片...\n");
  console.log("支持的来源：");
  console.log("  - Unsplash (需要 UNSPLASH_ACCESS_KEY)");
  console.log("  - Google Custom Search (需要 GOOGLE_API_KEY 和 GOOGLE_CX)");
  console.log("  - Pexels (需要 PEXELS_API_KEY)");
  console.log();

  const perfumes = await prisma.perfume.findMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: "" }],
    },
    select: {
      id: true,
      brand: true,
      name: true,
      imageUrl: true,
    },
    take: limit,
  });

  console.log(`找到 ${perfumes.length} 条需要图片的香水\n`);

  for (const perfume of perfumes) {
    console.log(`🔍 搜索: ${perfume.brand} ${perfume.name}`);
    const bestImage = await findBestImage(perfume.brand, perfume.name);

    if (bestImage) {
      console.log(`  ✅ 找到: ${bestImage.source} - ${bestImage.url.substring(0, 60)}...`);
      console.log(`     评分: ${(bestImage.score * 100).toFixed(0)}%`);
      
      // 保存到候选表，等待审核
      try {
        await prisma.perfumeImageCandidate.create({
          data: {
            perfumeId: perfume.id,
            imageUrl: bestImage.url,
            source: bestImage.source,
            license: "需要确认",
            creator: bestImage.description || null,
            confidence: bestImage.score,
            status: "PENDING",
          },
        });
      } catch (error: any) {
        if (error.code !== "P2002") {
          console.error(`  ❌ 保存失败: ${error.message}`);
        }
      }
    } else {
      console.log(`  ⚠️  未找到合适图片`);
    }

    // 延迟避免API限流
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\n✅ 完成！请访问 /admin/images 审核候选图片`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
