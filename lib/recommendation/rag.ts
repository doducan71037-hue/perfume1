/**
 * RAG推荐系统
 * 基于检索增强生成（Retrieval-Augmented Generation）的香水推荐
 */

import { prisma } from "@/lib/db";
import { generateEmbedding } from "@/lib/embeddings";
import { UserProfile } from "@/lib/chat/questionnaire";

export interface RecommendationResult {
  perfumeId: string;
  brand: string;
  name: string;
  similarityScore: number;
  popularityScore: number;
  finalScore: number;
  rationale?: string;
}

/**
 * 基于向量相似度和结构化过滤召回候选香水
 */
export async function retrieveCandidates(
  userProfile: UserProfile,
  limit: number = 20
): Promise<RecommendationResult[]> {
  // 1. 结构化过滤（预算、季节、性别等）
  const where: Record<string, unknown> = {};

  if (userProfile.budget) {
    where.priceRange = userProfile.budget;
  }

  if (userProfile.gender) {
    where.gender = userProfile.gender;
  }

  // 排除不喜欢的notes
  if (userProfile.avoidNotes && userProfile.avoidNotes.length > 0) {
    const avoidNoteIds = await prisma.note.findMany({
      where: { name: { in: userProfile.avoidNotes } },
      select: { id: true },
    });

    where.NOT = {
      notes: {
        some: {
          noteId: { in: avoidNoteIds.map((n) => n.id) },
        },
      },
    };
  }

  // 先做基础过滤
  // 如果没有过滤条件，直接返回所有香水
  const hasFilters = Object.keys(where).length > 0;
  where.isHidden = false; // 过滤掉隐藏的香水
  const filteredPerfumes = await prisma.perfume.findMany({
    where,
    select: {
      id: true,
      brand: true,
      name: true,
      popularityScore: true,
      profileText: true,
    },
    take: 100, // 先取100条做向量搜索
  });

  // 如果过滤后没有结果，放宽条件重新查询
  if (filteredPerfumes.length === 0 && hasFilters) {
    console.log("过滤条件太严格，放宽条件重新查询...");
    const relaxedPerfumes = await prisma.perfume.findMany({
      where: {
        isHidden: false, // 仍然过滤掉隐藏的香水
      },
      select: {
        id: true,
        brand: true,
        name: true,
        popularityScore: true,
        profileText: true,
      },
      take: 100,
    });
    return relaxedPerfumes.slice(0, limit).map((p) => ({
      perfumeId: p.id,
      brand: p.brand,
      name: p.name,
      similarityScore: 0.5,
      popularityScore: p.popularityScore,
      finalScore: p.popularityScore,
    }));
  }

  // 2. 向量相似度搜索（如果有用户描述）
  if (userProfile.naturalLanguage) {
    try {
      await generateEmbedding(userProfile.naturalLanguage);

      // 计算相似度（简化实现：在应用层计算）
      // 注意：实际应该在数据库层面使用pgvector，但Prisma不支持
      // 这里先用简化实现，后续可以通过原生SQL查询优化

      // 为每个香水计算相似度
      const perfumeScores = await Promise.all(
        filteredPerfumes.map(async (perfume) => {
          // 注意：这里需要从数据库获取embedding向量
          // 由于Prisma不支持vector字段，我们需要用原生SQL查询
          // 简化实现：先用profileText做简单的文本匹配评分

          const similarityScore = calculateTextSimilarity(
            userProfile.naturalLanguage || "",
            perfume.profileText
          );

          return {
            perfumeId: perfume.id,
            brand: perfume.brand,
            name: perfume.name,
            similarityScore,
            popularityScore: perfume.popularityScore,
            finalScore: 0.6 * similarityScore + 0.4 * perfume.popularityScore,
          };
        })
      );

      // 排序并取Top N
      perfumeScores.sort((a, b) => b.finalScore - a.finalScore);
      return perfumeScores.slice(0, limit);
    } catch (error) {
      console.error("Error in vector search:", error);
      // 降级到基础排序
    }
  }

  // 降级：按热度排序
  filteredPerfumes.sort((a, b) => b.popularityScore - a.popularityScore);
  return filteredPerfumes.slice(0, limit).map((p) => ({
    perfumeId: p.id,
    brand: p.brand,
    name: p.name,
    similarityScore: 0.5,
    popularityScore: p.popularityScore,
    finalScore: p.popularityScore,
  }));
}

/**
 * 简单的文本相似度计算（基于关键词匹配）
 * 实际应该使用向量相似度
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  const commonWords = words1.filter((w) => words2.includes(w));
  return commonWords.length / Math.max(words1.length, words2.length);
}