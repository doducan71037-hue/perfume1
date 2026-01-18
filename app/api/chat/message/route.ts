import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleError } from "@/lib/errors/handler";
import { prisma } from "@/lib/db";
import { chatGPT35 } from "@/lib/openai/client";
import {
  extractProfileFromMessages,
  isQuestionnaireComplete,
  UserProfile,
} from "@/lib/chat/questionnaire";
import { retrieveCandidates, RecommendationResult } from "@/lib/recommendation/rag";
import { rankRecommendations } from "@/lib/recommendation/scoring";
import { generateReport, generateQuickTextSummary, generateQuickReport } from "@/lib/recommendation/report";

const messageSchema = z.object({
  conversationId: z.string(),
  answer: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, answer } = messageSchema.parse(body);

    // 1. 获取conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "对话不存在" },
        { status: 404 }
      );
    }

    // 2. 更新消息列表
    const messages = conversation.messages as Array<{ role: string; content: string }>;
    messages.push({
      role: "user",
      content: answer,
    });

    // 3. 提取用户画像
    const profile: UserProfile = extractProfileFromMessages(messages);

    if (answer.trim().length > 10) {
      // 如果用户输入较长，可能是自由描述
      profile.naturalLanguage = answer;
    }

    // 4. 判断是否完成问诊
    const isComplete = isQuestionnaireComplete(messages, profile);

    if (isComplete) {
      // 5. 生成报告（优化：先快速返回简单说明，再生成详细报告）
      // 召回候选香水
      const candidates = await retrieveCandidates(profile, 20);
      
      // 排序取Top 8
      const topCandidates = rankRecommendations(candidates, 8);

      // 获取Top 3香水名称（用于快速生成说明）
      const topPerfumeIds = topCandidates.slice(0, 3).map((r) => r.perfumeId);
      const topPerfumes = await prisma.perfume.findMany({
        where: { id: { in: topPerfumeIds } },
        select: { id: true, brand: true, name: true },
      });
      const topPerfumeNames = topPerfumes.map((p) => `${p.brand} ${p.name}`);

      // 快速生成简单文字说明（1-2秒内完成）
      const quickSummary = await generateQuickTextSummary(profile, topPerfumeNames);

      // 生成基础报告（使用降级版本，快速返回）
      const quickReport = await generateQuickReport(profile, topCandidates, quickSummary);

      // 保存基础报告到数据库
      const recommendation = await prisma.recommendation.create({
        data: {
          conversationId,
          rationaleJSON: JSON.parse(JSON.stringify(quickReport)),
        },
      });

      // 创建推荐-香水关联
      const allRecommendations = [
        ...quickReport.topRecommendations,
        ...quickReport.alternatives,
      ];
      for (let i = 0; i < allRecommendations.length; i++) {
        await prisma.recommendationPerfume.create({
          data: {
            recommendationId: recommendation.id,
            perfumeId: allRecommendations[i].perfumeId,
            rank: i + 1,
            similarityScore: candidates.find(
              (c) => c.perfumeId === allRecommendations[i].perfumeId
            )?.similarityScore || 0.5,
            rationale: allRecommendations[i].whatItSmellsLike,
          },
        });
      }

      // 更新conversation状态
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messages,
          summaryProfile: JSON.parse(JSON.stringify(profile)),
          status: "completed",
        },
      });

      // 记录事件
      await prisma.event.create({
        data: {
          type: "questionnaire_complete",
          sessionId: conversation.sessionId,
          payload: { conversationId, recommendationId: recommendation.id },
        },
      });

      // 异步生成详细报告（不阻塞响应）
      generateDetailedReportAsync(profile, topCandidates, recommendation.id, quickSummary).catch(
        (error) => {
          console.error("Error generating detailed report:", error);
        }
      );

      return NextResponse.json({
        type: "report",
        conversationId,
        recommendationId: recommendation.id,
        report: quickReport,
      });
    } else {
      // 6. 生成下一问（使用GPT-3.5，优化prompt以加快响应）
      // 优化：使用更简洁的prompt，减少等待时间
      const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content || "";
      
      const nextQuestion = await chatGPT35([
        {
          role: "system",
          content: `你是专业的香水导购师。根据用户回答，简洁地提出下一个问题（不超过20字）。可选：场景、季节、预算、甜度、清新度、讨厌的香调。`,
        },
        {
          role: "user",
          content: `用户：${lastUserMessage}\n\n请提出下一个问题。`,
        },
      ]);

      // 更新conversation
      messages.push({
        role: "assistant",
        content: nextQuestion,
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          messages,
          summaryProfile: profile,
        },
      });

      return NextResponse.json({
        type: "question",
        content: nextQuestion,
        profile: profile, // 返回当前画像（前端可用于显示进度）
      });
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * 异步生成详细报告并更新数据库
 */
async function generateDetailedReportAsync(
  profile: UserProfile,
  topCandidates: RecommendationResult[],
  recommendationId: string,
  quickSummary: string
) {
  try {
    // 生成详细报告（使用GPT-4）
    const detailedReport = await generateReport(profile, topCandidates, quickSummary);

    // 更新数据库中的报告
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: {
        rationaleJSON: JSON.parse(JSON.stringify(detailedReport)),
      },
    });

    // 更新推荐-香水关联的详细描述
    const allRecommendations = [
      ...detailedReport.topRecommendations,
      ...detailedReport.alternatives,
    ];
    for (let i = 0; i < allRecommendations.length; i++) {
      await prisma.recommendationPerfume.updateMany({
        where: {
          recommendationId,
          perfumeId: allRecommendations[i].perfumeId,
        },
        data: {
          rationale: allRecommendations[i].whatItSmellsLike,
        },
      });
    }

    console.log(`Detailed report generated for recommendation ${recommendationId}`);
  } catch (error) {
    console.error("Error in generateDetailedReportAsync:", error);
    // 不抛出错误，避免影响主流程
  }
}