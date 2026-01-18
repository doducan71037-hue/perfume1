import OpenAI from "openai";

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

async function getGeminiEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const model = process.env.GEMINI_MODEL_EMBED || "text-embedding-004";
  
  // 使用代理 API 地址或默认的 Google API 地址
  const baseUrl = process.env.GEMINI_API_BASE_URL || "https://api2.qiandao.mom/v1";
  
  // 构建 API URL - 代理通常使用 /v1/models/ 而不是 /v1beta/models/
  const isProxy = baseUrl.includes('qiandao.mom') || baseUrl !== "https://generativelanguage.googleapis.com/v1beta";
  const apiUrl = isProxy 
    ? `${baseUrl}/models/${model}:embedContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`;

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

  const response = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini embedding error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data?.embedding?.values || [];
}

/**
 * 生成文本的embedding向量
 * @param text 要向量化的文本
 * @returns embedding向量数组（1536维）
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getOpenAI();
    if (client) {
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });

      return response.data[0].embedding;
    }

    return await getGeminiEmbedding(text);
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

/**
 * 批量生成embedding（用于种子数据导入）
 * @param texts 文本数组
 * @returns embedding向量数组
 */
export async function generateEmbeddingsBatch(
  texts: string[]
): Promise<number[][]> {
  try {
    const client = getOpenAI();
    if (client) {
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    }

    if (process.env.GEMINI_API_KEY) {
      const results: number[][] = [];
      for (const text of texts) {
        results.push(await getGeminiEmbedding(text));
      }
      return results;
    }

    return texts.map(() => []);
  } catch (error) {
    console.error("Error generating embeddings batch:", error);
    return texts.map(() => []);
  }
}
