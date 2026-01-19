import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/lib/errors/handler";
import { prisma } from "@/lib/db";
import { normalizeSearchName } from "@/lib/normalize";

export const dynamic = "force-dynamic";

const searchSchema = z.object({
  q: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { q } = searchSchema.parse({
      q: searchParams.get("q"),
    });

    if (!q || q.trim().length === 0) {
      return NextResponse.json({
        perfumes: [],
      });
    }

    const normalizedQuery = normalizeSearchName(q);
    if (!normalizedQuery) {
      return NextResponse.json({
        perfumes: [],
      });
    }

    // 查询所有匹配的结果（限制在合理范围内，避免内存问题），只返回有图片且未隐藏的产品
    const allResults = await prisma.perfume.findMany({
      where: {
        searchName: {
          contains: normalizedQuery,
        },
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
        searchName: true,
        popularityScore: true,
      },
      take: 100, // 先取100条，然后排序取前20
    });

    // 排序逻辑：
    // 1. startsWith 优先于 contains
    // 2. 同优先级按品牌+名称长度排序（更短更靠前）
    // 3. 最后按 popularityScore 降序
    const sorted = allResults.sort((a, b) => {
      const aStartsWith = a.searchName.startsWith(normalizedQuery);
      const bStartsWith = b.searchName.startsWith(normalizedQuery);

      // startsWith 优先
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // 同优先级，按品牌+名称长度排序（更短更靠前）
      const aLength = a.brand.length + a.name.length;
      const bLength = b.brand.length + b.name.length;
      if (aLength !== bLength) {
        return aLength - bLength;
      }

      // 最后按 popularityScore 降序
      return b.popularityScore - a.popularityScore;
    });

    // 只返回前20条，并移除 searchName 和 popularityScore（不需要返回给前端）
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const textResults = sorted.slice(0, 20).map(({ searchName, popularityScore, ...rest }) => rest);

    return NextResponse.json({
      perfumes: textResults,
    });
  } catch (error) {
    return handleError(error);
  }
}
