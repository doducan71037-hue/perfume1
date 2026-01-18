// 直接测试 Gemini API 调用
require('dotenv').config({ path: '.env' });

async function testGeminiAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GEMINI_API_BASE_URL || "https://api2.qiandao.mom/v1";
  const model = process.env.GEMINI_MODEL_CHAT || "gemini-2.5-pro-preview-p";
  
  const isProxy = baseUrl.includes('qiandao.mom') || baseUrl !== "https://generativelanguage.googleapis.com/v1beta";
  const apiUrl = isProxy 
    ? `${baseUrl}/models/${model}:generateContent`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // 构建 payload - 不包含 thinking_budget
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: "你好，请简单回复一句话" }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 200,
      // 不添加 thinking_budget 参数
    }
  };

  const headers = {
    "Content-Type": "application/json",
  };

  if (isProxy) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  console.log("=".repeat(60));
  console.log("测试 Gemini API");
  console.log("=".repeat(60));
  console.log("Model:", model);
  console.log("API URL:", apiUrl);
  console.log("Is Proxy:", isProxy);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("=".repeat(60));

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log("Response Status:", response.status);
    console.log("Response Body:", responseText);

    if (!response.ok) {
      console.error("❌ API 调用失败");
      return false;
    }

    const data = JSON.parse(responseText);
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("") || "";

    console.log("✅ API 调用成功");
    console.log("回复内容:", text);
    return true;
  } catch (error) {
    console.error("❌ 请求失败:", error.message);
    return false;
  }
}

testGeminiAPI().then(success => {
  process.exit(success ? 0 : 1);
});
