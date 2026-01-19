import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/handler";
import { prisma } from "@/lib/db";

type RelatedNote = {
  position: string;
  weight: number;
  note: { id: string; name: string; nameCn: string | null };
};

type RelatedAccord = {
  accord: { id: string; name: string; nameCn: string | null };
};

type RelatedTag = {
  tag: { name: string };
};

type RelatedAffiliateLink = {
  id: string;
  platform: string;
  url: string;
  price: number | null;
  isAffiliate: boolean;
};

type RelatedData = [RelatedNote[], RelatedAccord[], RelatedTag[], RelatedAffiliateLink[]];

type SimilarPerfumeRow = {
  similarityScore: number;
  similarPerfume: { id: string; brand: string; name: string };
};

type FeedbackSummary = {
  likeCount: number;
  dislikeCount: number;
  totalCount: number;
  reasonCounts: Record<string, number>;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. 获取香水基本信息（优化：先获取基本信息，其他数据延迟加载）
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
        popularityScore: true,
        isHidden: true,
      },
    });

    if (!perfume) {
      return NextResponse.json(
        { error: "香水不存在" },
        { status: 404 }
      );
    }

    // 检查是否隐藏
    if (perfume.isHidden) {
      return NextResponse.json(
        { error: "香水不存在" },
        { status: 404 }
      );
    }

    // 2. 并行获取关联数据（使用超时，确保快速响应）
    // 设置500ms超时，如果超时就返回空数组，不阻塞主响应
    const getRelatedData = async (): Promise<RelatedData> => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 500); // 500ms超时
        });

        const dataPromise = Promise.all([
          prisma.perfumeNote.findMany({
            where: { perfumeId: id },
            select: {
              position: true,
              weight: true,
              note: {
                select: { id: true, name: true, nameCn: true },
              },
            },
            take: 10, // 减少数量
          }),
          prisma.perfumeAccord.findMany({
            where: { perfumeId: id },
            select: {
              accord: {
                select: { id: true, name: true, nameCn: true },
              },
            },
            take: 5,
          }),
          prisma.perfumeTag.findMany({
            where: { perfumeId: id },
            select: {
              tag: {
                select: { name: true },
              },
            },
            take: 5,
          }),
          prisma.affiliateLink.findMany({
            where: { perfumeId: id, isActive: true },
            select: {
              id: true,
              platform: true,
              url: true,
              price: true,
              isAffiliate: true,
            },
            take: 3,
          }),
        ]);

        return (await Promise.race([dataPromise, timeoutPromise])) as RelatedData;
      } catch {
        // 超时或错误时返回空数组，不阻塞主响应
        return [[], [], [], []];
      }
    };

    const [notes, accords, tags, affiliateLinks] = await getRelatedData();

    // 3. 获取相似香水和反馈（使用超时，确保不阻塞主响应）
    // 设置500ms超时，如果超时就返回空数据
    const getSecondaryData = async (): Promise<[SimilarPerfumeRow[], FeedbackSummary]> => {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Timeout")), 500);
        });

        const dataPromise = Promise.all([
          prisma.similarPerfume.findMany({
            where: { perfumeId: id },
            select: {
              similarityScore: true,
              similarPerfume: {
                select: {
                  id: true,
                  brand: true,
                  name: true,
                },
              },
            },
            orderBy: { similarityScore: "desc" },
            take: 5,
          }),
          prisma.feedback.count({
            where: { perfumeId: id },
          }).then(async (count) => {
            if (count === 0) {
              return { likeCount: 0, dislikeCount: 0, totalCount: 0, reasonCounts: {} };
            }
            
            const feedbackStats = await prisma.feedback.groupBy({
              by: ["like"],
              where: { perfumeId: id },
              _count: true,
            });

            const likeCount = feedbackStats.find((f) => f.like === true)?._count || 0;
            const dislikeCount = feedbackStats.find((f) => f.like === false)?._count || 0;

            // 简化：只获取前5个反馈的原因
            const allFeedbacks = await prisma.feedback.findMany({
              where: { perfumeId: id },
              select: { reasons: true },
              take: 5,
            });

            const reasonCounts: Record<string, number> = {};
            allFeedbacks.forEach((f) => {
              f.reasons.forEach((reason) => {
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
              });
            });

            return {
              likeCount,
              dislikeCount,
              totalCount: likeCount + dislikeCount,
              reasonCounts,
            };
          }),
        ]);

        return (await Promise.race([dataPromise, timeoutPromise])) as [SimilarPerfumeRow[], FeedbackSummary];
      } catch {
        // 超时或错误时返回空数据，不阻塞主响应
        return [[], { likeCount: 0, dislikeCount: 0, totalCount: 0, reasonCounts: {} }];
      }
    };

    const [similarPerfumes, feedbackSummary] = await getSecondaryData();

    return NextResponse.json({
      perfume: {
        ...perfume,
        notes: notes.map((n) => ({
          id: n.note.id,
          name: n.note.name,
          nameCn: n.note.nameCn,
          position: n.position,
          weight: n.weight,
        })),
        accords: accords.map((a) => ({
          id: a.accord.id,
          name: a.accord.name,
          nameCn: a.accord.nameCn,
        })),
        tags: tags.map((t) => t.tag.name),
        affiliateLinks,
      },
      similarPerfumes: similarPerfumes.map((sp) => ({
        id: sp.similarPerfume.id,
        brand: sp.similarPerfume.brand,
        name: sp.similarPerfume.name,
        similarityScore: sp.similarityScore,
      })),
      feedbackSummary,
    });
  } catch (error) {
    return handleError(error);
  }
}
