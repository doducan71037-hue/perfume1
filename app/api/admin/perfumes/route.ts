import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth/admin-auth";

/**
 * GET /api/admin/perfumes
 * 获取香水列表（支持搜索和分页）
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // 构建搜索条件
    const where: any = {};
    if (search) {
      where.OR = [
        { brand: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { searchName: { contains: search, mode: "insensitive" } },
      ];
    }

    // 获取总数
    const total = await prisma.perfume.count({ where });

    // 获取列表
    const perfumes = await prisma.perfume.findMany({
      where,
      select: {
        id: true,
        brand: true,
        name: true,
        year: true,
        concentration: true,
        gender: true,
        priceRange: true,
        description: true,
        imageUrl: true,
        imageSource: true,
        imageAttribution: true,
        popularityScore: true,
        isHidden: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: limit,
    });

    return NextResponse.json({
      perfumes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching perfumes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
