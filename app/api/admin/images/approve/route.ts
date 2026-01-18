import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { verifyAdmin } from "@/lib/auth/admin-auth";

const approveSchema = z.object({
  action: z.enum(["approve", "reject"]),
  candidateIds: z.array(z.string()),
});

/**
 * POST /api/admin/images/approve
 * 批量通过/拒绝图片候选
 */
export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, candidateIds } = approveSchema.parse(body);

    if (candidateIds.length === 0) {
      return NextResponse.json(
        { error: "candidateIds cannot be empty" },
        { status: 400 }
      );
    }

    const status = action === "approve" ? "APPROVED" : "REJECTED";

    const result = await prisma.perfumeImageCandidate.updateMany({
      where: {
        id: {
          in: candidateIds,
        },
        status: "PENDING", // 只更新 PENDING 状态的
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating image candidates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
