# AI 香水导购平台 MVP

一个基于对话的AI香水导购网站，通过问诊理解用户需求，基于RAG（检索增强生成）输出可追溯的香味解释报告。

## 技术栈

- **前端**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **数据库**: PostgreSQL + Prisma ORM + pgvector（向量检索）
- **AI服务**: Gemini API（可替换）
  - gemini-1.5-flash（问诊对话）
  - gemini-1.5-pro（报告生成）
- **部署**: Vercel（前端）+ Neon/Render（数据库）

## 快速开始

### 前置要求

- Node.js 18+ 
- PostgreSQL 数据库（支持pgvector扩展）
- Gemini API Key

### 安装步骤

1. **克隆项目并安装依赖**

```bash
npm install
```

2. **配置环境变量**

复制 `.env.example` 为 `.env` 并填写：

```bash
# 数据库连接（需支持pgvector）
DATABASE_URL="postgresql://user:password@localhost:5432/perfume?schema=public"

# Gemini API Key
GEMINI_API_KEY="your-gemini-api-key"

# 可选配置
ADMIN_PASSWORD="your-admin-password"
MAX_CONVERSATIONS_PER_DAY=10

# 认证系统配置（可选）
ADMIN_EMAILS="admin@example.com,another@example.com"  # 管理员邮箱列表（逗号分隔）
```

3. **初始化数据库**

```bash
# 生成Prisma Client
npm run db:generate

# 创建数据库迁移（包含用户认证系统）
npm run db:migrate

# 导入种子数据（用于初始化 Notes/Accords/演示香水）
npm run db:seed
```

4. **创建初始管理员账号**

```bash
# 使用交互式脚本创建管理员
npm run create-admin
```

或者通过注册页面注册，如果邮箱在 `ADMIN_EMAILS` 环境变量中，会自动获得管理员权限。

> **注意**: 详细设置步骤请参考 [AUTH_SETUP.md](./AUTH_SETUP.md)

> **注意**: pgvector扩展需要在数据库中启用：
> ```sql
> CREATE EXTENSION IF NOT EXISTS vector;
> ```

4. **启动开发服务器**

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
perfume/
├── app/                    # Next.js App Router
│   ├── api/               # API路由
│   │   ├── chat/         # 问诊API
│   │   ├── perfumes/     # 香水搜索/详情API
│   │   ├── feedback/     # 反馈API
│   │   ├── event/        # 埋点API
│   │   └── admin/        # 管理后台API
│   ├── consultation/      # 问诊页面
│   ├── report/            # 报告展示页
│   ├── perfume/           # 香水详情页
│   ├── admin/             # 管理后台
│   │   └── images/       # 图片审核页面
│   └── ...
├── components/            # React组件
│   ├── chat/             # 聊天UI组件
│   ├── report/           # 报告展示组件
│   ├── perfume/          # 香水相关组件
│   └── ui/               # shadcn/ui组件
├── lib/                   # 工具函数
│   ├── db.ts             # Prisma Client
│   ├── embeddings.ts     # Embedding 生成
│   ├── chat/             # 问诊逻辑
│   ├── recommendation/   # RAG推荐系统
│   └── ...
├── prisma/
│   ├── schema.prisma     # 数据库schema
│   └── migrations/       # 数据库迁移
└── scripts/
    ├── seed.ts           # 种子数据脚本
    ├── fetch-hf-perfumes.ts # 从 Hugging Face 下载香水数据
    ├── import-perfumes.ts # 导入开源香水库
    ├── backfill-searchName.ts # 回填 searchName
    ├── update-perfume-images.ts # 导入图片CSV
    ├── find-image-candidates.ts # 自动查找图片候选（Wikidata + Openverse）
    └── apply-approved-images.ts # 应用已审核的图片

## 数据导入

### 导入 Hugging Face 香水库（推荐）

项目支持从 Hugging Face 数据集 `doevent/perfume`（MIT 许可证）自动下载并导入香水数据。

**一键导入（自动下载）**：

```bash
# 导入 20 条测试数据
npm run import:perfumes -- --source=hf --limit=20

# 导入全部数据（约 26,000 条）
npm run import:perfumes -- --source=hf --limit=26000
```

**说明**：
- 如果 `data/hf-perfumes.json` 不存在，脚本会自动从 Hugging Face 下载
- 数据会自动清洗：去重、字段映射（`name_perfume` → `name`, `years` → `year`）、验证
- 只导入结构化字段：`brand`, `name`, `year`, `gender`（不包含第三方香评文本）
- 导入时会自动生成 `searchName` 用于搜索优化

**手动下载**（可选）：

```bash
# 单独下载数据到 data/hf-perfumes.json
tsx scripts/fetch-hf-perfumes.ts --limit=26000
```

### 导入其他数据源

如果需要导入其他数据源（如 Wikidata），将数据放入 `data/wikidata-perfumes.json`，格式示例：

```json
[
  {
    "id": "123",
    "brand": "Acme",
    "name": "No. 1",
    "year": 2020,
    "gender": "unisex",
    "imageUrl": "https://example.com/image.jpg"
  }
]
```

然后运行：

```bash
npm run import:perfumes -- --source=wikidata
```

如果需要回填 searchName：

```bash
npm run backfill:searchName
```

### 图片策略

**核心原则：图片与产品必须一致**

- ✅ **有图片时**：使用 `perfume.imageUrl` 显示真实图片
- ✅ **无图片时**：使用确定性占位图（基于香水 ID 哈希，同一香水永远一致）
- ❌ **禁止**：使用随机图片、固定映射图片、或其他香水的图片

**占位图实现**：
- 基于香水 ID 的哈希值生成颜色
- 显示品牌和名称的首字母
- 保证同一香水每次显示相同的占位图

**导入图片 CSV**：

准备 `data/perfume-images.csv`（格式：`brand,name,imageUrl,imageSource?,imageAttribution?`）：

```csv
brand,name,imageUrl,imageSource,imageAttribution
Chanel,No. 5,https://example.com/chanel-no5.jpg,USER_CDN,Example Attribution
```

运行导入（使用 normalize 匹配，不区分大小写和空格）：

```bash
npm run import:perfume-images -- --file=data/perfume-images.csv
```

**自动找图（推荐，合规来源）**：

系统支持从合规来源自动查找图片，并支持人工审核：

1. **生成候选图片**：
   ```bash
   # 为 imageUrl 为空的香水查找图片候选（默认 limit=50）
   npm run find:images -- --limit=20
   ```
   
   脚本会：
   - 优先从 **Wikidata/Wikimedia Commons** 搜索（通过 P18 属性获取 Commons 图片）
   - 若未找到，则从 **Openverse API** 搜索（CC0/CC BY/CC BY-SA 许可的图片）
   - 所有候选保存到 `PerfumeImageCandidate` 表，状态为 `PENDING`

2. **审核候选图片**：
   - 访问 `/admin/images` 页面（需要管理员密码，通过环境变量 `ADMIN_PASSWORD` 配置）
   - 查看候选列表：显示香水信息、图片预览、来源、许可证、置信度
   - 支持单独或批量通过/拒绝候选

3. **应用已审核的图片**：
   ```bash
   # 将状态为 APPROVED 的候选应用到香水记录
   npm run apply:images
   ```

**合规说明**：
- ✅ 只使用允许复用的来源：Wikidata/Wikimedia Commons、Openverse（CC0/CC BY/CC BY-SA）
- ✅ 所有图片记录来源、许可证、创作者信息
- ✅ 严禁抓取 Fragrantica/Parfumo/电商详情页等有版权风险的图片
- ✅ 人工审核确保图片与产品匹配

**可选：使用 Wikidata 补全热门香水图片**（旧方法，仍可用）：

```bash
npm run enrich:images -- --limit=100
```

## 核心功能

### 1. 问诊流程

用户通过3-6轮引导问题描述需求：
- 场景（日常/约会/正式场合）
- 季节偏好
- 甜度、清新度、木质度等维度
- 预算范围
- 喜欢/讨厌的香调

### 2. RAG推荐系统

- **候选召回**: 基于结构化过滤 + 向量相似度搜索
- **综合排序**: 相似度分数 + 热度/口碑分数
- **报告生成**: GPT-4生成结构化报告（Top 3 + 5备选）

### 3. 可追溯的解释

每段描述都引用来源（notes/accords/用户反馈摘要），确保可追溯。

### 4. 反馈闭环

收集用户反馈（like/dislike + 原因标签），用于优化推荐。

## API文档

### POST /api/chat/start

初始化对话会话。

**响应**:
```json
{
  "conversationId": "clxxx",
  "firstQuestion": "欢迎使用AI香水导购！请问您今天想寻找什么类型的香水？"
}
```

### POST /api/chat/message

处理用户回答，返回下一问或最终报告。

**请求**:
```json
{
  "conversationId": "clxxx",
  "answer": "我想要清新的木质调"
}
```

**响应**:
```json
{
  "type": "question" | "report",
  "content": "..."
}
```

### GET /api/perfumes/search?q=

搜索香水（文本 + 向量搜索）。

### GET /api/perfumes/:id

获取香水详情（包含notes、accords、相似香、购买链接等）。

### POST /api/feedback

提交反馈。

**请求**:
```json
{
  "conversationId": "clxxx",
  "perfumeId": "clxxx",
  "like": true,
  "reasons": ["woody", "fresh"],
  "text": "很喜欢这支香"
}
```

### POST /api/event

记录埋点事件。

## 认证系统

项目已实现完整的用户认证系统：

- **注册/登录**: 标准邮箱密码认证，支持密码强度校验
- **会话管理**: 使用 httpOnly cookie 存储会话，安全可靠
- **权限控制**: 支持 USER/ADMIN 角色，管理员可访问后台
- **Rate Limit**: 防止暴力破解和滥用
- **匿名兼容**: 匿名用户仍可使用核心功能，登录后可绑定历史数据

**主要功能**：
- `/register` - 注册页面
- `/login` - 登录页面
- `/admin` - 管理员后台（需要 ADMIN 角色）
  - 统计概览：用户数、对话数、搜索次数等
  - 用户管理：查看、禁用/启用、设置角色
  - 事件列表：查看最近的事件和埋点数据

详细设置和测试步骤请参考 [AUTH_SETUP.md](./AUTH_SETUP.md)

## 数据库Schema

主要模型：
- `User` - 用户表（新增）
- `AuthSession` - 认证会话表（新增）
- `Perfume` - 香水主表
- `Note` - 香调/香料表
- `Accord` - 香调组合表
- `Session` - 匿名会话表（已添加 userId 字段）
- `Conversation` - 对话表（已添加 userId 字段）
- `Recommendation` - 推荐表
- `Feedback` - 反馈表（已添加 userId 字段）
- `Event` - 事件埋点表（已添加 userId 字段）

详见 `prisma/schema.prisma`

## 部署

### Vercel部署

1. **推送代码到GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **在Vercel导入项目**
   - 访问 [Vercel](https://vercel.com)
   - 点击 "New Project" → "Import Git Repository"
   - 选择你的GitHub仓库

3. **配置环境变量**
   在Vercel项目设置中添加：
   - `DATABASE_URL` - 数据库连接字符串
   - `GEMINI_API_KEY` - Gemini API密钥
   - `ADMIN_PASSWORD` - 管理后台密码（可选）
   - `MAX_CONVERSATIONS_PER_DAY` - 每日对话限制（默认10）

4. **部署**
   - Vercel会自动检测Next.js项目并部署
   - 部署完成后访问项目URL

### 数据库部署（Neon）

1. **创建Neon PostgreSQL数据库**
   - 访问 [Neon](https://neon.tech)
   - 创建新项目
   - 复制连接字符串

2. **启用pgvector扩展**
   在Neon SQL Editor中执行：
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **更新 DATABASE_URL**
   在Vercel环境变量中设置正确的数据库URL

4. **运行迁移和种子数据**
   ```bash
   # 在本地或通过Vercel CLI运行
   npm run db:migrate
   npm run db:seed
   ```

   > **注意**: 如果通过Vercel部署，可以在本地运行迁移（连接到Neon数据库），或在Vercel项目设置中添加"Build Command"和"Output Directory"后手动运行。

### Docker本地开发（可选）

如果需要在本地使用PostgreSQL + pgvector，可以使用Docker Compose：

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: perfume
    ports:
      - "5432:5432"
```

然后运行：
```bash
docker-compose up -d
```

## 开发计划

- **里程碑1** (Week 1-2): 基础架构与数据层 ✅
- **里程碑2** (Week 3-6): 核心功能开发 🚧
- **里程碑3** (Week 7-12): 完善功能与优化

## 注意事项

1. **数据合规**: 使用占位数据，不爬取真实网站内容
2. **内容安全**: 所有GPT生成内容包含免责声明
3. **成本控制**: MVP阶段严格限流（每天10次问诊），监控API调用量
4. **向量字段**: Prisma不支持直接操作pgvector字段，需要在SQL迁移中手动添加
5. **pgvector设置**: 数据库必须启用pgvector扩展，否则向量搜索功能无法使用
6. **环境变量**: 确保所有必需的环境变量都已正确配置
7. **Gemini API**: 建议设置API使用限额和监控，避免意外高额费用

## 故障排除

### 数据库连接问题

- 检查 `DATABASE_URL` 是否正确
- 确认数据库服务是否运行
- 验证网络连接和防火墙设置

### pgvector扩展问题

如果遇到pgvector相关错误：
```sql
-- 在数据库中执行
CREATE EXTENSION IF NOT EXISTS vector;
```

### Gemini API问题

- 检查 `GEMINI_API_KEY` 是否正确
- 确认API配额是否充足
- 查看API调用日志确认错误信息

### 种子数据导入失败

- 检查数据库连接
- 确认GEMINI_API_KEY已设置（用于生成embedding或报告）
- 查看种子脚本的错误日志

## License

MIT

## 后续迭代

- [x] 用户账号系统（注册/登录/会话管理）✅
- [ ] 邮箱验证
- [ ] 密码重置
- [ ] OAuth 登录（Google/GitHub）
- [ ] 个性化推荐（基于历史反馈）
- [ ] 社交功能（评价、对比、心愿单）
- [ ] 移动端优化（PWA）
- [ ] 多语言支持
