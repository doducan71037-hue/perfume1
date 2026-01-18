import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/handler";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;

    // 获取最新的推荐记录
    const recommendation = await prisma.recommendation.findFirst({
      where: { conversationId },
      include: {
        perfumes: {
          include: {
            perfume: {
              include: {
                notes: { include: { note: true } },
                accords: { include: { accord: true } },
              },
            },
          },
          orderBy: { rank: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: "推荐记录未找到" },
        { status: 404 }
      );
    }

    // 返回报告数据
    const report = recommendation.rationaleJSON as Record<string, unknown>;
    
    // 构建 perfumeId -> imageUrl 映射，用于前端显示
    const perfumeImageMap = recommendation.perfumes.reduce(
      (acc, item) => {
        acc[item.perfumeId] = item.perfume.imageUrl || null;
        return acc;
      },
      {} as Record<string, string | null>
    );

    // 将 imageUrl 直接添加到 report 的每个香水对象中，确保图片与产品一致
    if (report.topRecommendations && Array.isArray(report.topRecommendations)) {
      report.topRecommendations = (report.topRecommendations as Array<Record<string, unknown>>).map((perfume) => ({
        ...perfume,
        imageUrl: perfumeImageMap[perfume.perfumeId] || null,
      }));
    }
    if (report.alternatives && Array.isArray(report.alternatives)) {
      report.alternatives = (report.alternatives as Array<Record<string, unknown>>).map((perfume) => ({
        ...perfume,
        imageUrl: perfumeImageMap[perfume.perfumeId] || null,
      }));
    }

    return NextResponse.json({
      report,
      recommendationId: recommendation.id,
    });
  } catch (error) {
    return handleError(error);
  }
}
