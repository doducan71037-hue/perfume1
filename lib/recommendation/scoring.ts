/**
 * 推荐评分系统
 * 综合相似度分数和热度/口碑分数
 */

import { RecommendationResult } from "./rag";

/**
 * 计算综合评分
 * finalScore = 0.6 * similarityScore + 0.4 * popularityScore
 */
export function calculateFinalScore(
  similarityScore: number,
  popularityScore: number,
  weights: { similarity: number; popularity: number } = {
    similarity: 0.6,
    popularity: 0.4,
  }
): number {
  return weights.similarity * similarityScore + weights.popularity * popularityScore;
}

/**
 * 对候选香水排序并返回Top N
 */
export function rankRecommendations(
  candidates: RecommendationResult[],
  topN: number = 8
): RecommendationResult[] {
  return candidates
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, topN);
}