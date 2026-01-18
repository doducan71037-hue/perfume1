type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function buildGeminiPayload(messages: ChatMessage[], temperature: number, maxTokens: number, isProxy: boolean) {
  const systemInstruction = messages
    .filter((message) => message.role === "system")
    .map((message) => message.content)
    .join("\n");

  const contents = messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

  // 关键发现：代理 API 在收到 generationConfig 时会自动添加无效的 thinking_budget
  // 解决方案：对于代理 API，完全不发送 generationConfig，让 API 使用默认值
  const payload: Record<string, unknown> = {
    contents,
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  // 仅对官方 API 添加 generationConfig
  if (!isProxy) {
    const model = process.env.GEMINI_MODEL_CHAT || process.env.GEMINI_MODEL_REPORT || "";
    const needsThinkingBudget = model.includes("2.5-pro") || model.includes("2.5-flash");
    
    payload.generationConfig = {
      temperature,
      maxOutputTokens: maxTokens,
    };

    if (needsThinkingBudget) {
      // 官方 API 使用驼峰格式
      payload.generationConfig.thinkingConfig = {
        thinkingBudget: 1024,
      };
    }
  }
  // 对于代理 API，不添加 generationConfig，使用 API 的默认值

  return payload;
}

async function callGemini(
  model: string,
  messages: ChatMessage[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  // 使用代理 API 地址或默认的 Google API 地址
  const baseUrl = process.env.GEMINI_API_BASE_URL || "https://api2.qiandao.mom/v1";
  
  // 构建 API URL - 代理通常使用 /v1/models/ 而不是 /v1beta/models/
  const isProxy = baseUrl.includes('qiandao.mom') || baseUrl !== "https://generativelanguage.googleapis.com/v1beta";
  const apiUrl = isProxy 
    ? `${baseUrl}/models/${model}:generateContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // 如果使用代理，API key 通过 header 传递（尝试多种常见格式）
  if (isProxy) {
    // 优先使用 Authorization Bearer，如果代理需要其他格式可以调整
    headers["Authorization"] = `Bearer ${apiKey}`;
    // 某些代理可能使用 x-api-key，如果需要可以取消注释：
    // headers["x-api-key"] = apiKey;
  }

  const payload = buildGeminiPayload(messages, temperature, maxTokens, isProxy);
  
  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("") || "";

  return text;
}

/**
 * Gemini用于问诊对话
 */
export async function chatGPT35(messages: ChatMessage[]): Promise<string> {
  const model = process.env.GEMINI_MODEL_CHAT || "gemini-2.5-pro-preview-p";
  // 减少 maxTokens 以加快响应速度（从500降到200）
  return callGemini(model, messages, 0.7, 200);
}

/**
 * Gemini用于报告生成
 */
export async function chatGPT4(messages: ChatMessage[]): Promise<string> {
  const model = process.env.GEMINI_MODEL_REPORT || "gemini-2.5-pro-preview-p";
  // 减少maxTokens以加快响应速度（从1500降到1000）
  return callGemini(model, messages, 0.7, 1000);
}

/**
 * 快速生成简单文字说明（用于快速响应）
 */
export async function generateQuickSummary(messages: ChatMessage[]): Promise<string> {
  const model = process.env.GEMINI_MODEL_CHAT || "gemini-2.5-pro-preview-p";
  // 使用更少的 tokens 快速生成
  return callGemini(model, messages, 0.7, 150);
}
