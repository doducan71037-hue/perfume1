import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/handler";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 获取热门香水（用于搜索页面的默认展示）
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    // 获取热门香水（按popularityScore排序），只返回有图片且未隐藏的产品
    const perfumes = await prisma.perfume.findMany({
      where: {
        imageUrl: {
          not: null,
        },
        isHidden: false, // 过滤掉隐藏的香水
      },
      select: {
        id: true,
        brand: true,
        name: true,
        year: true,
        concentration: true,
        priceRange: true,
        description: true,
        imageUrl: true,
      },
      orderBy: { popularityScore: "desc" },
      take: limit,
    });

    return NextResponse.json({
      perfumes,
    });
  } catch (error) {
    return handleError(error);
  }
}
