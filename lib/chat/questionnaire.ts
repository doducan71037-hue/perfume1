/**
 * 问诊流程逻辑
 * 定义引导问题和对用户画像的提取
 */

export interface UserProfile {
  scene?: string; // "daily" | "date" | "formal" | "night"
  season?: string; // "spring" | "summer" | "autumn" | "winter" | "all"
  gender?: string; // "unisex" | "male" | "female"
  sweetness?: number; // 0-1 甜度偏好
  freshness?: number; // 0-1 清新度偏好
  woodiness?: number; // 0-1 木质度偏好
  powderTolerance?: number; // 0-1 粉感容忍度
  budget?: string; // "budget" | "mid" | "luxury"
  avoidNotes?: string[]; // 避免的notes
  preferNotes?: string[]; // 偏好的notes
  likedPerfumes?: string[]; // 喜欢过的香水（名称）
  naturalLanguage?: string; // 用户自由描述
}

export interface Question {
  id: string;
  type: "single" | "multiple" | "text" | "slider";
  question: string;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export const QUESTIONNAIRE_QUESTIONS: Question[] = [
  {
    id: "natural_language",
    type: "text",
    question: "请用一句话描述您想要寻找的香水类型（如：雨后森林、干净皂感、奶甜但不腻）",
    required: false,
  },
  {
    id: "scene",
    type: "single",
    question: "您希望在什么场景使用？",
    options: [
      { label: "日常使用", value: "daily" },
      { label: "约会/聚会", value: "date" },
      { label: "正式场合", value: "formal" },
      { label: "夜晚", value: "night" },
    ],
    required: false,
  },
  {
    id: "season",
    type: "single",
    question: "您更偏向哪个季节使用？",
    options: [
      { label: "春季", value: "spring" },
      { label: "夏季", value: "summer" },
      { label: "秋季", value: "autumn" },
      { label: "冬季", value: "winter" },
      { label: "四季皆宜", value: "all" },
    ],
    required: false,
  },
  {
    id: "sweetness",
    type: "slider",
    question: "您对甜度的偏好（0=不喜欢甜，1=非常喜欢甜）",
    required: false,
  },
  {
    id: "freshness",
    type: "slider",
    question: "您对清新度的偏好（0=不喜欢清新，1=非常喜欢清新）",
    required: false,
  },
  {
    id: "budget",
    type: "single",
    question: "您的预算范围？",
    options: [
      { label: "平价（< 500元）", value: "budget" },
      { label: "中等（500-1500元）", value: "mid" },
      { label: "奢华（> 1500元）", value: "luxury" },
    ],
    required: false,
  },
];

/**
 * 从对话历史中提取用户画像
 * @param messages 可以是消息数组或已连接的字符串
 */
export function extractProfileFromMessages(messages: Array<{ role?: string; content?: string }> | string): UserProfile {
  const profile: UserProfile = {};

  // 简化实现：从最后几条消息中提取关键词
  // 如果传入的是字符串，直接使用；如果是数组，取最后5条并连接
  const lastMessages = typeof messages === "string" 
    ? messages 
    : Array.isArray(messages) 
      ? messages.slice(-5).map((m) => typeof m === "string" ? m : m.content || "").join(" ")
      : "";

  // 场景识别
  if (lastMessages.includes("日常") || lastMessages.includes("平时")) {
    profile.scene = "daily";
  } else if (lastMessages.includes("约会") || lastMessages.includes("聚会")) {
    profile.scene = "date";
  } else if (lastMessages.includes("正式") || lastMessages.includes("商务")) {
    profile.scene = "formal";
  } else if (lastMessages.includes("夜晚") || lastMessages.includes("夜")) {
    profile.scene = "night";
  }

  // 季节识别
  if (lastMessages.includes("春")) profile.season = "spring";
  else if (lastMessages.includes("夏")) profile.season = "summer";
  else if (lastMessages.includes("秋")) profile.season = "autumn";
  else if (lastMessages.includes("冬")) profile.season = "winter";

  // 预算识别
  if (lastMessages.includes("平价") || lastMessages.includes("便宜")) {
    profile.budget = "budget";
  } else if (lastMessages.includes("中等") || lastMessages.includes("中档")) {
    profile.budget = "mid";
  } else if (lastMessages.includes("奢华") || lastMessages.includes("高端")) {
    profile.budget = "luxury";
  }

  return profile;
}

/**
 * 判断是否完成问诊（简单实现：至少3轮对话）
 */
export function isQuestionnaireComplete(
  messages: Array<{ role?: string; content?: string }>,
  profile: UserProfile
): boolean {
  const hasEnoughInfo =
    messages.length >= 4 && // 至少3轮问答 + 初始消息
    (profile.naturalLanguage || profile.scene || profile.season);

  return hasEnoughInfo;
}