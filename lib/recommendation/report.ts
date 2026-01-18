/**
 * 报告生成逻辑
 * 使用GPT-4生成可追溯的香味解释报告
 */

import { chatGPT4, generateQuickSummary } from "@/lib/openai/client";
import { prisma } from "@/lib/db";
import { UserProfile } from "@/lib/chat/questionnaire";
import { RecommendationResult } from "./rag";

export interface ReportSection {
  perfumeId: string;
  perfumeName: string;
  brand: string;
  whatItSmellsLike: string; // 像什么
  whatItDoesNotSmellLike: string; // 不是什么
  notesBreakdown: {
    top: string[];
    middle: string[];
    base: string[];
  };
  accords: string[];
  potentialIssues: string; // 踩雷点
  suitableScenes: string; // 适合场景
  uncertaintyHints: string; // 不确定性提示
  rationale: {
    sources: string[]; // 依据（notes/accords/用户反馈）
  };
}

export interface GeneratedReport {
  topRecommendations: ReportSection[]; // Top 3
  alternatives: ReportSection[]; // 5个备选
  summary: string; // 总结
  textSummary?: string; // 简单文字说明，讲解用户适合什么味道
}

/**
 * 快速生成简单文字说明（讲解用户适合什么味道）
 */
export async function generateQuickTextSummary(
  userProfile: UserProfile,
  topPerfumeNames: string[]
): Promise<string> {
  try {
    const profileText = `
用户需求：
- 场景：${userProfile.scene || "未指定"}
- 季节：${userProfile.season || "未指定"}
- 甜度偏好：${userProfile.sweetness !== undefined ? userProfile.sweetness : "未指定"}
- 清新度偏好：${userProfile.freshness !== undefined ? userProfile.freshness : "未指定"}
- 自然语言描述：${userProfile.naturalLanguage || "无"}
- 推荐香水：${topPerfumeNames.slice(0, 3).join("、")}

请用100字以内简洁地说明：根据用户需求，他们适合什么类型的香水味道？为什么推荐这些香水？
`;

    const summary = await generateQuickSummary([
      {
        role: "system",
        content: "你是专业的香水导购师。根据用户需求，简洁地说明他们适合什么类型的香水味道。",
      },
      {
        role: "user",
        content: profileText,
      },
    ]);

    return summary.trim();
  } catch (error) {
    console.error("Error generating quick summary:", error);
    // 降级：使用模板生成
    return generateTemplateSummary(userProfile, topPerfumeNames);
  }
}

/**
 * 模板生成简单说明（降级方案）
 */
function generateTemplateSummary(
  userProfile: UserProfile,
  topPerfumeNames: string[]
): string {
  const parts: string[] = [];

  if (userProfile.sweetness !== undefined) {
    if (userProfile.sweetness > 0.6) {
      parts.push("您偏好甜美的香调");
    } else if (userProfile.sweetness < 0.4) {
      parts.push("您偏好不甜的香调");
    }
  }

  if (userProfile.freshness !== undefined && userProfile.freshness > 0.6) {
    parts.push("清新感是您的重要偏好");
  }

  if (userProfile.scene) {
    const sceneMap: Record<string, string> = {
      daily: "日常使用",
      date: "约会聚会",
      formal: "正式场合",
      night: "夜晚",
    };
    parts.push(`适合${sceneMap[userProfile.scene] || userProfile.scene}场景`);
  }

  if (userProfile.naturalLanguage) {
    parts.push(`您描述的需求是"${userProfile.naturalLanguage.substring(0, 20)}"`);
  }

  const baseText = parts.length > 0 
    ? `根据您的偏好，${parts.join("，")}。我们为您推荐了${topPerfumeNames.slice(0, 3).join("、")}等香水，这些香水能够很好地匹配您的需求。`
    : `根据您的需求，我们为您推荐了${topPerfumeNames.slice(0, 3).join("、")}等香水。每支香水都有其独特的香调特征，建议您查看详细描述后选择。`;

  return baseText;
}

/**
 * 生成推荐报告（使用GPT-4）
 */
export async function generateReport(
  userProfile: UserProfile,
  recommendations: RecommendationResult[],
  quickSummary?: string // 可选的快速生成的文字说明
): Promise<GeneratedReport> {
  // 1. 获取Top 8个推荐的详细信息（包含notes、accords）
  const topPerfumeIds = recommendations.slice(0, 8).map((r) => r.perfumeId);
  const perfumes = await prisma.perfume.findMany({
    where: { id: { in: topPerfumeIds } },
    include: {
      notes: {
        include: { note: true },
      },
      accords: {
        include: { accord: true },
      },
    },
  });

  // 2. 构建prompt
  const perfumeDetails = perfumes.map((p) => {
    const topNotes = p.notes.filter((n) => n.position === "top").map((n) => n.note.name);
    const middleNotes = p.notes.filter((n) => n.position === "middle").map((n) => n.note.name);
    const baseNotes = p.notes.filter((n) => n.position === "base").map((n) => n.note.name);
    const accordNames = p.accords.map((a) => a.accord.name);

    return {
      id: p.id,
      brand: p.brand,
      name: p.name,
      description: p.description,
      profileText: p.profileText,
      topNotes,
      middleNotes,
      baseNotes,
      accords: accordNames,
    };
  });

  const prompt = buildReportPrompt(userProfile, perfumeDetails);

  // 3. 调用GPT-4生成报告（设置超时和错误处理）
  // 优化：如果候选香水少于3个，直接使用降级报告，避免AI调用
  if (perfumes.length < 3) {
    console.log("候选香水太少，使用降级报告");
    return generateFallbackReport(perfumes, quickSummary);
  }

  let gptResponse: string;
  try {
    // 使用 Promise.race 设置超时（20秒，减少等待时间）
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Report generation timeout")), 20000);
    });

    const gptPromise = chatGPT4([
      {
        role: "system",
        content: `你是一位专业的香水导购师。请根据用户需求和香水信息，生成简洁的香味解释报告。
要求：
1. 每段描述必须引用来源（具体指出是哪个note或accord）
2. 包含"像什么/不是什么/前中后调/踩雷点/适合场景"
3. 加入不确定性提示（如"在不同皮肤上可能更甜"）
4. 禁止绝对化承诺（如"保证不晕香"）
5. 必须包含免责声明：气味主观、皮肤化学差异、仅供参考
6. 输出必须是有效的JSON格式，不要包含任何markdown代码块标记
7. 描述要简洁，每段不超过100字`,
      },
      {
        role: "user",
        content: prompt,
      },
    ]);

    gptResponse = await Promise.race([gptPromise, timeoutPromise]) as string;
  } catch (error) {
    console.error("Error calling GPT for report generation:", error);
    // 降级：使用简化报告
    return generateFallbackReport(perfumes, quickSummary);
  }

  // 4. 解析GPT响应（JSON格式）
  try {
    // 清理可能的markdown代码块标记
    let cleanedResponse = gptResponse.trim();
    if (cleanedResponse.startsWith("```json")) {
      cleanedResponse = cleanedResponse.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.replace(/^```\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(cleanedResponse) as GeneratedReport;
    
    // 5. 验证并补充信息
    const validated = validateAndEnrichReport(parsed, perfumes);
    
    // 6. 添加快速生成的文字说明（如果提供了）
    if (quickSummary) {
      validated.textSummary = quickSummary;
    }
    
    return validated;
  } catch (error) {
    console.error("Error parsing GPT response:", error, "Response:", gptResponse.substring(0, 200));
    // 降级：使用简化报告
    return generateFallbackReport(perfumes, quickSummary);
  }
}

/**
 * 构建报告生成的prompt
 */
function buildReportPrompt(userProfile: UserProfile, perfumeDetails: any[]): string {
  // 优化：只发送前8个香水，减少prompt长度
  const limitedPerfumes = perfumeDetails.slice(0, 8);
  
  return `
用户需求：
${JSON.stringify(userProfile, null, 2)}

候选香水（Top ${limitedPerfumes.length}）：
${JSON.stringify(limitedPerfumes, null, 2)}

请生成简洁的香味解释报告，包含：
1. Top 3推荐：每个包含"像什么/不是什么/前中后调/踩雷点/适合场景/不确定性提示/依据"（每段不超过100字）
2. ${Math.min(5, limitedPerfumes.length - 3)}个备选：简化版本（每段不超过50字）
3. 总结（不超过100字）

输出JSON格式（必须有效JSON，不要markdown代码块）：
{
  "topRecommendations": [
    {
      "perfumeId": "...",
      "perfumeName": "...",
      "brand": "...",
      "whatItSmellsLike": "...",
      "whatItDoesNotSmellLike": "...",
      "notesBreakdown": {"top": [...], "middle": [...], "base": [...]},
      "accords": [...],
      "potentialIssues": "...",
      "suitableScenes": "...",
      "uncertaintyHints": "...",
      "rationale": {"sources": [...]}
    }
  ],
  "alternatives": [...],
  "summary": "..."
}
`;
}

/**
 * 验证并丰富报告内容
 */
function validateAndEnrichReport(report: GeneratedReport, perfumes: any[]): GeneratedReport {
  // 确保每个推荐都包含必需字段
  report.topRecommendations = report.topRecommendations.map((rec) => {
    const perfume = perfumes.find((p) => p.id === rec.perfumeId);
    if (!perfume) return rec;

    // 确保包含免责声明
    if (!rec.uncertaintyHints.includes("仅供参考")) {
      rec.uncertaintyHints += " 注意：气味主观、皮肤化学差异、仅供参考。";
    }

    return rec;
  });

  return report;
}

/**
 * 快速生成基础报告（不调用GPT-4，立即返回）
 */
export async function generateQuickReport(
  userProfile: UserProfile,
  recommendations: RecommendationResult[],
  textSummary: string
): Promise<GeneratedReport> {
  // 获取Top 8个推荐的详细信息（包含notes、accords）
  const topPerfumeIds = recommendations.slice(0, 8).map((r) => r.perfumeId);
  const perfumes = await prisma.perfume.findMany({
    where: { id: { in: topPerfumeIds } },
    include: {
      notes: {
        include: { note: true },
      },
      accords: {
        include: { accord: true },
      },
    },
  });

  const top3 = perfumes.slice(0, 3);
  const alternatives = perfumes.slice(3, 8);

  return {
    textSummary,
    topRecommendations: top3.map((p) => ({
      perfumeId: p.id,
      perfumeName: p.name,
      brand: p.brand,
      whatItSmellsLike: p.description || "请查看详情了解这款香水的香调特征",
      whatItDoesNotSmellLike: "需要进一步了解",
      notesBreakdown: {
        top: p.notes.filter((n: any) => n.position === "top").map((n: any) => n.note.name),
        middle: p.notes.filter((n: any) => n.position === "middle").map((n: any) => n.note.name),
        base: p.notes.filter((n: any) => n.position === "base").map((n: any) => n.note.name),
      },
      accords: p.accords.map((a: any) => a.accord.name),
      potentialIssues: "因人而异，建议试用后再决定",
      suitableScenes: userProfile.scene ? `适合${userProfile.scene}场景` : "日常使用",
      uncertaintyHints: "注意：气味主观、皮肤化学差异、仅供参考。",
      rationale: {
        sources: p.notes.map((n: any) => n.note.name).slice(0, 3),
      },
    })),
    alternatives: alternatives.map((p) => ({
      perfumeId: p.id,
      perfumeName: p.name,
      brand: p.brand,
      whatItSmellsLike: p.description || "请查看详情",
      whatItDoesNotSmellLike: "需要进一步了解",
      notesBreakdown: {
        top: p.notes.filter((n: any) => n.position === "top").map((n: any) => n.note.name),
        middle: p.notes.filter((n: any) => n.position === "middle").map((n: any) => n.note.name),
        base: p.notes.filter((n: any) => n.position === "base").map((n: any) => n.note.name),
      },
      accords: p.accords.map((a: any) => a.accord.name),
      potentialIssues: "因人而异",
      suitableScenes: "日常使用",
      uncertaintyHints: "注意：气味主观、皮肤化学差异、仅供参考。",
      rationale: {
        sources: p.notes.map((n: any) => n.note.name).slice(0, 3),
      },
    })),
    summary: textSummary,
  };
}

/**
 * 降级报告生成（如果GPT失败）
 */
function generateFallbackReport(perfumes: any[], textSummary?: string): GeneratedReport {
  const top3 = perfumes.slice(0, 3);
  const alternatives = perfumes.slice(3, 8);

  return {
    textSummary: textSummary || `基于您的需求，我们为您推荐了${top3.length}支香水和${alternatives.length}个备选。每支香水都有其独特的香调特征，建议试用后再做决定。`,
    topRecommendations: top3.map((p) => ({
      perfumeId: p.id,
      perfumeName: p.name,
      brand: p.brand,
      whatItSmellsLike: p.description || "请查看详情",
      whatItDoesNotSmellLike: "需要进一步了解",
      notesBreakdown: {
        top: p.notes.filter((n: any) => n.position === "top").map((n: any) => n.note.name),
        middle: p.notes.filter((n: any) => n.position === "middle").map((n: any) => n.note.name),
        base: p.notes.filter((n: any) => n.position === "base").map((n: any) => n.note.name),
      },
      accords: p.accords.map((a: any) => a.accord.name),
      potentialIssues: "因人而异，请试用后再决定",
      suitableScenes: "日常使用",
      uncertaintyHints: "注意：气味主观、皮肤化学差异、仅供参考。",
      rationale: {
        sources: p.notes.map((n: any) => n.note.name).slice(0, 3),
      },
    })),
    alternatives: alternatives.map((p) => ({
      perfumeId: p.id,
      perfumeName: p.name,
      brand: p.brand,
      whatItSmellsLike: p.description || "请查看详情",
      whatItDoesNotSmellLike: "需要进一步了解",
      notesBreakdown: {
        top: p.notes.filter((n: any) => n.position === "top").map((n: any) => n.note.name),
        middle: p.notes.filter((n: any) => n.position === "middle").map((n: any) => n.note.name),
        base: p.notes.filter((n: any) => n.position === "base").map((n: any) => n.note.name),
      },
      accords: p.accords.map((a: any) => a.accord.name),
      potentialIssues: "因人而异",
      suitableScenes: "日常使用",
      uncertaintyHints: "注意：气味主观、皮肤化学差异、仅供参考。",
      rationale: {
        sources: p.notes.map((n: any) => n.note.name).slice(0, 3),
      },
    })),
    summary: textSummary || `基于您的需求，我们为您推荐了${top3.length}支香水和${alternatives.length}个备选。每支香水都有其独特的香调特征，建议试用后再做决定。`,
  };
}