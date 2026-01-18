# Google AI Studio 前端设计 Prompt

请使用这个 prompt 在 Google AI Studio (Build) 中设计前端界面。

---

## 项目概述

设计一个**AI香水导购平台**的前端界面，包含以下页面和功能。要求使用现代、优雅的设计风格，注重用户体验和视觉美感。

**技术栈要求：**
- Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- React Hooks

---

## 页面列表

### 1. 首页 (`/`)
**功能：**
- 品牌标题："AI 香水导购"
- 一句话价值主张
- "开始问诊" 和 "搜索香水" 两个主要CTA按钮
- 三个特性卡片：对话问诊、可追溯解释、相似推荐
- 底部免责声明链接

**设计要求：**
- 优雅的渐变背景
- 清晰的视觉层次
- 吸引人的CTA按钮
- 响应式设计（移动端友好）

---

### 2. 问诊页面 (`/consultation`)
**功能：**
- 聊天界面（消息气泡）
- 用户输入框（底部固定）
- 加载状态提示
- 问诊进度显示（可选）

**交互流程：**
1. 初始状态显示"开始问诊"按钮
2. 点击后调用 `POST /api/chat/start` 启动对话
3. 显示AI助手的第一条消息
4. 用户输入回答，发送到 `POST /api/chat/message`
5. 显示AI的下一个问题或最终报告链接

**API接口：**

**POST /api/chat/start**
```json
// 请求：空body
// 响应：
{
  "conversationId": "clxxx",
  "firstQuestion": "欢迎使用AI香水导购！...",
  "remaining": 10
}
```

**POST /api/chat/message**
```json
// 请求：
{
  "conversationId": "clxxx",
  "answer": "我想要清新的木质调"
}
// 响应：
{
  "type": "question" | "report",
  "content": "...",
  "profile": {...} // 如果type是question
}
// 如果type是"report"，前端应该跳转到 /report/{conversationId}
```

**设计要求：**
- 类似聊天应用的界面
- 助手消息在左侧（浅色背景）
- 用户消息在右侧（深色/主色调背景）
- 平滑的消息动画
- 输入框支持回车发送
- 加载状态（打字动画或加载提示）

---

### 3. 报告展示页 (`/report/[conversationId]`)
**功能：**
- 显示推荐报告（Top 3推荐 + 5个备选）
- 每个推荐包含：品牌名、香水名、描述、香调结构、踩雷点、适合场景等
- "喜欢/不喜欢"反馈按钮
- 查看详情链接

**API接口：**

**GET /api/recommendations/[conversationId]**
```json
// 响应：
{
  "report": {
    "topRecommendations": [
      {
        "perfumeId": "clxxx",
        "perfumeName": "Aventus",
        "brand": "Creed",
        "whatItSmellsLike": "...",
        "whatItDoesNotSmellLike": "...",
        "notesBreakdown": {
          "top": ["Bergamot", "Lemon"],
          "middle": ["Rose", "Jasmine"],
          "base": ["Musk", "Sandalwood"]
        },
        "accords": ["Fresh", "Woody"],
        "potentialIssues": "...",
        "suitableScenes": "...",
        "uncertaintyHints": "...",
        "rationale": {
          "sources": ["Bergamot", "Rose", "user_feedback"]
        }
      }
    ],
    "alternatives": [...],
    "summary": "..."
  }
}
```

**设计要求：**
- 卡片式布局
- Top 3 推荐突出显示（大卡片）
- 备选推荐紧凑展示（小卡片）
- 香调结构可视化（前中后调分层）
- 反馈按钮醒目
- 分享链接功能（复制到剪贴板）

---

### 4. 香水详情页 (`/perfume/[id]`)
**功能：**
- 香水基本信息（品牌、名称、年份、浓度、价位）
- 描述文本
- 香调结构（前中后调，带颜色区分）
- 香调组合（Accords）标签
- 用户反馈摘要（喜欢/不喜欢统计）
- 购买链接列表（多个平台）
- 相似香水推荐

**API接口：**

**GET /api/perfumes/[id]**
```json
// 响应：
{
  "perfume": {
    "id": "clxxx",
    "brand": "Creed",
    "name": "Aventus",
    "year": 2010,
    "concentration": "EDP",
    "gender": "unisex",
    "priceRange": "luxury",
    "description": "...",
    "notes": [
      {
        "id": "...",
        "name": "Bergamot",
        "nameCn": "佛手柑",
        "position": "top",
        "weight": 0.8
      }
    ],
    "accords": [...],
    "affiliateLinks": [
      {
        "id": "...",
        "platform": "taobao",
        "url": "https://...",
        "price": 1500,
        "isAffiliate": true
      }
    ]
  },
  "similarPerfumes": [...],
  "feedbackSummary": {
    "likeCount": 10,
    "dislikeCount": 2,
    "totalCount": 12,
    "reasonCounts": {"woody": 5, "fresh": 3}
  }
}
```

**设计要求：**
- 清晰的层次结构
- 香调结构用颜色区分（前调、中调、基调不同颜色）
- 购买链接卡片式展示
- 相似香水推荐在底部
- 反馈摘要可视化（进度条或统计数字）

---

### 5. 搜索页面 (`/search`)
**功能：**
- 搜索输入框
- 搜索结果列表（香水卡片）
- 加载状态
- 空状态提示

**API接口：**

**GET /api/perfumes/search?q=关键词**
```json
// 响应：
{
  "perfumes": [
    {
      "id": "clxxx",
      "brand": "Creed",
      "name": "Aventus",
      "description": "...",
      "notes": ["Bergamot", "Lemon"],
      "accords": ["Fresh"]
    }
  ]
}
```

**设计要求：**
- 搜索框顶部居中
- 结果卡片简洁清晰
- 点击卡片跳转到详情页

---

### 6. 词典页 (`/glossary`)
**功能：**
- 香料/香调词典列表
- 分类筛选（柑橘类、花香类、木质类等）
- 每个词条显示：名称（中英文）、描述、同义词

**设计要求：**
- 分类筛选按钮
- 卡片式词条展示
- 清晰的分类标识

---

### 7. 免责声明页 (`/disclaimer`)
**功能：**
- 纯文本展示页面
- 包含多个section：气味主观性、皮肤化学差异、仅供参考、AI生成内容、购买链接

**设计要求：**
- 清晰的章节分隔
- 易读的排版

---

### 8. 隐私政策页 (`/privacy`)
**功能：**
- 纯文本展示页面
- 包含多个section：数据收集、数据使用、数据存储、数据安全、第三方服务

**设计要求：**
- 清晰的章节分隔
- 易读的排版

---

## 通用组件需求

### 导航栏（可选）
- 首页链接
- 搜索链接
- 词典链接

### 按钮组件
- 主按钮（primary）
- 次要按钮（outline）
- 链接按钮（ghost）

### 卡片组件
- 香水卡片
- 推荐卡片
- 信息卡片

### 加载状态
- 骨架屏或加载动画
- 错误状态提示

---

## 设计风格要求

1. **色彩方案：**
   - 主色调：优雅的紫色/粉色渐变（与香水主题相关）
   - 或：简洁的黑白灰 + 少量强调色
   - 香调颜色区分：前调（清新绿/蓝）、中调（粉色/紫色）、基调（棕色/金色）

2. **字体：**
   - 标题：粗体、较大字号
   - 正文：易读的字体大小（14-16px）
   - 中文友好

3. **间距：**
   - 充足的留白
   - 卡片间距一致

4. **动画：**
   - 平滑的过渡效果
   - 消息出现动画
   - 按钮hover效果

5. **响应式：**
   - 移动端优先
   - 平板和桌面端适配

---

## 技术实现提示

1. 使用 Next.js `use client` 标记所有需要交互的组件
2. 使用 `fetch` API 调用后端接口
3. 错误处理：显示友好的错误提示
4. 加载状态：在所有API调用时显示加载提示
5. 路由跳转：使用 Next.js `useRouter` 和 `Link` 组件

---

## 输出要求

请生成完整的 Next.js 前端代码，包含：
1. 所有页面的 TypeScript + React 组件
2. 必要的样式文件（Tailwind CSS）
3. 组件拆分合理（可复用组件单独文件）
4. 代码注释清晰

---

## 文件结构

```
app/
├── page.tsx                 # 首页
├── consultation/
│   └── page.tsx            # 问诊页
├── report/
│   └── [conversationId]/
│       └── page.tsx        # 报告页
├── perfume/
│   └── [id]/
│       └── page.tsx        # 香水详情页
├── search/
│   └── page.tsx            # 搜索页
├── glossary/
│   └── page.tsx            # 词典页
├── disclaimer/
│   └── page.tsx            # 免责声明页
└── privacy/
    └── page.tsx            # 隐私政策页

components/
└── ui/                     # 通用UI组件（如果需要）
```

---

**重要提示：**
- 所有API调用需要使用相对路径（如 `/api/chat/start`）
- 所有内部链接使用 Next.js `Link` 组件
- 保持代码风格一致
- 确保响应式设计
- 注重用户体验细节
