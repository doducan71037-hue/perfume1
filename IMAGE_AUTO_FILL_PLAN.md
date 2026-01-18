# 香水图片自动补充功能 - 详细实施计划

## 一、需求概述

为现有香水自动补充对应产品图并更新到网站，要求：
- ✅ 合规：只使用允许复用的来源（Wikidata/Wikimedia Commons、Openverse）
- ✅ 不乱配：彻底移除任何随机/固定映射图片逻辑
- ✅ 可审核：支持人工审核流程

## 二、文件清单

### A. 数据库 Schema 更新
1. **prisma/schema.prisma**
   - 更新 `Perfume.imageSource` 枚举值（WIKIMEDIA | OPENVERSE | USER | NONE）
   - 新增 `PerfumeImageCandidate` 模型

### B. 脚本文件
2. **scripts/find-image-candidates.ts** - 自动找图脚本
3. **scripts/apply-approved-images.ts** - 应用已审核图片脚本

### C. 后台管理页面
4. **app/admin/images/page.tsx** - 图片审核页面（主页面）
5. **app/api/admin/images/route.ts** - 获取候选列表 API
6. **app/api/admin/images/approve/route.ts** - 批量通过/拒绝 API

### D. 前端修复（确保只使用 imageUrl 或占位图）
7. **app/perfume/[id]/page.tsx** - 已正确，无需修改
8. **app/search/page.tsx** - 已正确，无需修改
9. **app/report/[conversationId]/page.tsx** - 已正确，无需修改

### E. 文档
10. **README.md** - 更新命令说明

## 三、数据库 Schema 设计

### Perfume 表（已有字段，需更新枚举）
```prisma
imageUrl String? @db.Text
imageSource String @default("NONE") // "WIKIMEDIA" | "OPENVERSE" | "USER" | "NONE"
imageAttribution String? @db.Text
```

### PerfumeImageCandidate 表（新增）
```prisma
model PerfumeImageCandidate {
  id            String   @id @default(cuid())
  perfumeId     String
  imageUrl      String   @db.Text
  source        String   // "WIKIMEDIA" | "OPENVERSE"
  license       String?  // 许可证信息
  creator       String?  // 创作者
  sourcePageUrl String?  @db.Text // 来源页面URL
  confidence    Float    @default(0.5) // 0.0-1.0
  status        String   @default("PENDING") // "PENDING" | "APPROVED" | "REJECTED"
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  perfume       Perfume  @relation(fields: [perfumeId], references: [id], onDelete: Cascade)

  @@unique([perfumeId, imageUrl])
  @@index([perfumeId])
  @@index([status])
  @@index([createdAt])
  @@map("perfume_image_candidates")
}
```

## 四、API 接口设计

### GET /api/admin/images
获取待审核的候选图片列表

**响应**:
```json
{
  "candidates": [
    {
      "id": "xxx",
      "perfumeId": "xxx",
      "perfumeBrand": "Chanel",
      "perfumeName": "No. 5",
      "imageUrl": "https://...",
      "source": "WIKIMEDIA",
      "license": "CC BY-SA 4.0",
      "creator": "User:Example",
      "sourcePageUrl": "https://...",
      "confidence": 0.9,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/admin/images/approve
批量通过/拒绝候选

**请求**:
```json
{
  "action": "approve" | "reject",
  "candidateIds": ["id1", "id2", ...]
}
```

**响应**:
```json
{
  "success": true,
  "updated": 2
}
```

## 五、脚本命令

### 1. find-image-candidates.ts
```bash
npm run find:images -- --limit=20
```

**功能**:
- 读取 `imageUrl` 为空的 Perfume（默认 limit=50）
- 对每条 perfume：
  1. **Wikidata 搜索**：
     - 使用 `wbsearchentities` 搜索 `{brand} {name}`
     - 取 top 3 候选实体
     - 读取 P18（image）属性
     - 将 Commons 文件名转为可访问 URL
     - 生成 candidate（confidence=0.9）
  2. **Openverse 搜索**（Wikidata 无结果时）：
     - 调用 Openverse API `/v1/images/`
     - 查询参数：`q={brand} {name} perfume bottle&license=cc0,by,by-sa&image_type=photo`
     - 取前 1-3 张
     - 生成 candidate（confidence=0.7）
- 写入 `PerfumeImageCandidate`（status=PENDING）
- 避免重复（perfumeId+imageUrl unique）

### 2. apply-approved-images.ts
```bash
npm run apply:images
```

**功能**:
- 查找所有 `status=APPROVED` 的 candidate
- 对每个 candidate：
  - 更新 `Perfume.imageUrl = candidate.imageUrl`
  - 更新 `Perfume.imageSource = candidate.source`
  - 更新 `Perfume.imageAttribution = {creator} + {license} + {sourcePageUrl}`
- 可选：删除已应用的 candidate 或保留（默认保留，标记为已应用）

## 六、审核页面设计

### /admin/images

**功能**:
- 列表展示所有 PENDING 状态的 candidate
- 每行显示：
  - 香水信息（brand + name）
  - 候选图预览（缩略图）
  - 来源信息（source + license + creator）
  - 置信度（confidence）
  - 操作按钮（通过/拒绝）
- 支持批量操作：
  - 全选/取消全选
  - 批量通过
  - 批量拒绝
- 简单密码保护（使用环境变量 `ADMIN_PASSWORD`）

**UX 优化**:
- 一页显示所有候选（20条以内）
- 图片懒加载
- 快速操作（点击即生效，无需确认）

## 七、前端展示统一修复

### 检查点（已确认正确）:
1. ✅ `app/perfume/[id]/page.tsx` - 使用 `perfume.imageUrl || buildPlaceholderUrl(...)`
2. ✅ `app/search/page.tsx` - 使用 `perfume.imageUrl || buildPlaceholderUrl(...)`
3. ✅ `app/report/[conversationId]/page.tsx` - 使用 `perfume.imageUrl || buildPlaceholderUrl(...)`

### 占位图机制（已实现）:
- `/api/placeholder` 根据 `id` 生成确定性 SVG
- 同一 `id` 永远生成相同的颜色和首字母
- 无需修改

## 八、验收标准

### 功能验收
- [ ] 运行 `npm run find:images -- --limit=20` 成功生成候选
- [ ] 访问 `/admin/images` 能看到候选列表
- [ ] 可以单独通过/拒绝候选
- [ ] 可以批量通过/拒绝候选
- [ ] 运行 `npm run apply:images` 成功更新 Perfume 图片
- [ ] 前端页面只显示 `perfume.imageUrl` 或占位图，无乱配图

### 合规验收
- [ ] 所有图片来源都是 Wikidata/Wikimedia Commons 或 Openverse
- [ ] 图片 URL 可访问且稳定
- [ ] Attribution 信息正确记录

### 性能验收
- [ ] 找图脚本在 20 条数据下 < 2 分钟完成
- [ ] 审核页面加载 < 1 秒
- [ ] 批量操作响应 < 500ms

## 九、实施顺序

1. ✅ 更新 Prisma schema 并生成 migration
2. ✅ 实现 `find-image-candidates.ts` 脚本
3. ✅ 实现 `apply-approved-images.ts` 脚本
4. ✅ 实现审核页面 `/admin/images`
5. ✅ 实现审核 API 路由
6. ✅ 更新 `package.json` 添加 npm scripts
7. ✅ 更新 README.md
8. ✅ 测试完整流程

## 十、技术细节

### Wikidata API 使用
- 搜索端点：`https://www.wikidata.org/w/api.php?action=wbsearchentities&search={query}&language=en&format=json`
- 实体查询：`https://www.wikidata.org/w/api.php?action=wbgetentities&ids={id}&props=claims&format=json`
- P18 属性：`claims.P18[0].mainsnak.datavalue.value`（Commons 文件名）
- Commons URL 转换：`https://commons.wikimedia.org/wiki/Special:FilePath/{filename}`

### Openverse API 使用
- 端点：`https://api.openverse.engineering/v1/images/`
- 查询参数：
  - `q={brand} {name} perfume bottle`
  - `license=cc0,by,by-sa`
  - `image_type=photo`
  - `page_size=3`
- 响应字段：
  - `results[].url` - 图片 URL
  - `results[].license` - 许可证
  - `results[].creator` - 创作者
  - `results[].foreign_landing_url` - 来源页面

### 错误处理
- Wikidata/Openverse API 失败时跳过该 perfume，继续处理下一个
- 记录错误日志，不中断整个流程
- 网络超时设置 10 秒
