import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { verifyAdmin } from "@/lib/auth/admin-auth";

const updatePerfumeSchema = z.object({
  brand: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  year: z.number().int().positive().nullable().optional(),
  concentration: z.enum(["EDT", "EDP", "Parfum", "Extrait"]).nullable().optional(),
  gender: z.enum(["unisex", "male", "female"]).nullable().optional(),
  priceRange: z.enum(["budget", "mid", "luxury"]).optional(),
  description: z.string().nullable().optional(),
  profileText: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  imageSource: z.enum(["WIKIMEDIA", "OPENVERSE", "USER", "NONE"]).optional(),
  imageAttribution: z.string().nullable().optional(),
  isHidden: z.boolean().optional(),
});

/**
 * GET /api/admin/perfumes/[id]
 * 获取单个香水的详细信息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const perfume = await prisma.perfume.findUnique({
      where: { id },
      select: {
        id: true,
        brand: true,
        name: true,
        year: true,
        concentration: true,
        gender: true,
        priceRange: true,
        description: true,
        profileText: true,
        imageUrl: true,
        imageSource: true,
        imageAttribution: true,
        popularityScore: true,
        isHidden: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!perfume) {
      return NextResponse.json(
        { error: "香水不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({ perfume });
  } catch (error: any) {
    console.error("Error fetching perfume:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/perfumes/[id]
 * 更新香水信息
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证管理员权限
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // 验证数据
    const validatedData = updatePerfumeSchema.parse(body);

    // 检查香水是否存在
    const existing = await prisma.perfume.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "香水不存在" },
        { status: 404 }
      );
    }

    // 更新香水
    const updated = await prisma.perfume.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        brand: true,
        name: true,
        year: true,
        concentration: true,
        gender: true,
        priceRange: true,
        description: true,
        profileText: true,
        imageUrl: true,
        imageSource: true,
        imageAttribution: true,
        isHidden: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      perfume: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating perfume:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
