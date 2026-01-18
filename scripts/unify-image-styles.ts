/**
 * 方案：使用CDN统一处理现有图片样式
 * 通过图片处理服务（如 Imgix、Cloudinary）统一处理所有图片
 * 实现视觉统一：统一尺寸、背景、滤镜等
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * 使用 Imgix 处理图片
 * 优点：无需上传，直接代理处理
 */
function processWithImgix(originalUrl: string): string {
  const imgixDomain = process.env.IMGIX_DOMAIN;
  if (!imgixDomain) {
    console.warn("⚠️  IMGIX_DOMAIN 未设置，返回原始URL");
    return originalUrl;
  }

  // 统一处理参数
  const params = new URLSearchParams({
    w: "800",           // 宽度
    h: "1000",          // 高度
    fit: "crop",        // 裁剪模式
    crop: "faces,entropy", // 智能裁剪
    auto: "format,compress", // 自动格式和压缩
    q: "85",            // 质量
    sat: "-10",         // 降低饱和度（更统一）
    bri: "5",           // 稍微提亮
    con: "10",          // 增加对比度
    sharp: "10",        // 锐化
  });

  // 如果原图是外部URL，需要先编码
  const encodedUrl = encodeURIComponent(originalUrl);
  return `https://${imgixDomain}/${encodedUrl}?${params.toString()}`;
}

/**
 * 使用 Cloudinary 处理图片
 * 需要先上传图片到 Cloudinary
 */
function processWithCloudinary(originalUrl: string): string {
  const cloudinaryUrl = process.env.CLOUDINARY_URL;
  if (!cloudinaryUrl) {
    return originalUrl;
  }

  // Cloudinary URL格式: cloudinary://api_key:api_secret@cloud_name
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (!match) {
    return originalUrl;
  }

  const [, , , cloudName] = match;
  
  // 使用 fetch API 上传并转换
  // 注意：这需要先上传图片，这里只是示例URL格式
  const transformation = "w_800,h_1000,c_fill,g_auto,q_auto,f_auto";
  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transformation}/${encodeURIComponent(originalUrl)}`;
}

/**
 * 统一处理所有图片URL
 */
async function main() {
  const cdnType = process.env.IMAGE_CDN_TYPE || "imgix"; // "imgix" | "cloudinary"

  console.log(`\n🎨 开始统一处理图片样式...\n`);
  console.log(`使用CDN: ${cdnType}\n`);

  const perfumes = await prisma.perfume.findMany({
    where: {
      imageUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      brand: true,
      name: true,
      imageUrl: true,
    },
  });

  console.log(`找到 ${perfumes.length} 条有图片的香水\n`);

  let updated = 0;
  let skipped = 0;

  for (const perfume of perfumes) {
    if (!perfume.imageUrl) continue;

    let processedUrl: string;
    
    if (cdnType === "imgix") {
      processedUrl = processWithImgix(perfume.imageUrl);
    } else if (cdnType === "cloudinary") {
      processedUrl = processWithCloudinary(perfume.imageUrl);
    } else {
      console.log(`⚠️  未知的CDN类型: ${cdnType}`);
      skipped++;
      continue;
    }

    // 如果处理后的URL和原URL相同，跳过
    if (processedUrl === perfume.imageUrl) {
      skipped++;
      continue;
    }

    try {
      await prisma.perfume.update({
        where: { id: perfume.id },
        data: {
          imageUrl: processedUrl,
          imageSource: "USER",
          imageAttribution: perfume.imageUrl + " (通过CDN处理)",
        },
      });

      console.log(`✅ ${perfume.brand} ${perfume.name}`);
      console.log(`   原图: ${perfume.imageUrl.substring(0, 60)}...`);
      console.log(`   处理后: ${processedUrl.substring(0, 60)}...`);
      updated++;
    } catch (error: any) {
      console.error(`❌ 更新失败 ${perfume.brand} ${perfume.name}:`, error.message);
    }
  }

  console.log(`\n✅ 完成！`);
  console.log(`  更新了 ${updated} 条图片URL`);
  if (skipped > 0) {
    console.log(`  跳过了 ${skipped} 条`);
  }
  console.log(`\n💡 提示：`);
  console.log(`  - 确保CDN服务已正确配置`);
  console.log(`  - 访问网站查看图片效果`);
  console.log(`  - 如需调整样式，修改脚本中的处理参数`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
