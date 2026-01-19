import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdmin } from "@/lib/auth/admin-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/images
 * 获取待审核的图片候选列表
 */
export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const candidates = await prisma.perfumeImageCandidate.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        perfume: {
          select: {
            id: true,
            brand: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      candidates: candidates.map((c) => ({
        id: c.id,
        perfumeId: c.perfumeId,
        perfumeBrand: c.perfume.brand,
        perfumeName: c.perfume.name,
        imageUrl: c.imageUrl,
        source: c.source,
        license: c.license,
        creator: c.creator,
        sourcePageUrl: c.sourcePageUrl,
        confidence: c.confidence,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error: unknown) {
    console.error("Error fetching image candidates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
