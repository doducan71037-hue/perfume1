# 高质量香水产品图解决方案

## 问题分析

当前图片来源（NoseTime/Fragrantica）的问题：
- 图片质量参差不齐
- 视觉风格不统一
- 部分图片不够清晰

## 推荐方案

### 方案1: Google Custom Search API ⭐⭐⭐⭐⭐（最推荐）

**优点**：
- 能找到准确的产品图
- 可以筛选官方产品图
- 图片质量通常较高

**缺点**：
- 需要 Google API Key（免费配额：每天100次）
- 需要创建 Custom Search Engine

**实施步骤**：

1. **获取 Google API Key**：
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建项目
   - 启用 "Custom Search API"
   - 创建 API Key

2. **创建 Custom Search Engine**：
   - 访问 [Google Custom Search](https://programmablesearchengine.google.com/)
   - 创建搜索引擎，设置搜索范围（如：只搜索特定网站）
   - 获取 Search Engine ID (CX)

3. **配置环境变量**：
   ```bash
   GOOGLE_API_KEY=your_api_key
   GOOGLE_CX=your_search_engine_id
   ```

4. **运行脚本**：
   ```bash
   npm run find:high-quality-images -- --limit=48
   ```

### 方案2: Unsplash API ⭐⭐⭐⭐

**优点**：
- 完全免费
- 图片质量极高
- 视觉风格统一
- 无需配额限制

**缺点**：
- 可能没有具体的香水产品图
- 更多是概念图、生活方式图

**实施步骤**：

1. **获取 Unsplash API Key**：
   - 访问 [Unsplash Developers](https://unsplash.com/developers)
   - 注册应用
   - 获取 Access Key

2. **配置环境变量**：
   ```bash
   UNSPLASH_ACCESS_KEY=your_access_key
   ```

3. **运行脚本**：
   ```bash
   npm run find:high-quality-images -- --limit=48
   ```

### 方案3: Pexels API ⭐⭐⭐⭐

**优点**：
- 免费
- 高质量图片
- 商业友好

**缺点**：
- 可能没有具体产品图

**实施步骤**：

1. **获取 Pexels API Key**：
   - 访问 [Pexels API](https://www.pexels.com/api/)
   - 注册账号
   - 获取 API Key

2. **配置环境变量**：
   ```bash
   PEXELS_API_KEY=your_api_key
   ```

### 方案4: 图片CDN统一处理 ⭐⭐⭐

**思路**：使用现有图片，通过CDN服务统一处理样式

**优点**：
- 不需要重新找图
- 可以统一裁剪、滤镜、尺寸
- 视觉风格统一

**缺点**：
- 需要付费CDN服务
- 原始图片质量限制了最终效果

**推荐服务**：
- **Cloudinary**：功能强大，有免费额度
- **Imgix**：专业图片处理
- **ImageKit**：性价比高

**实施示例**（使用 Imgix）：
```typescript
// 统一处理图片样式
const processedUrl = `https://your-domain.imgix.net/${encodeURIComponent(originalUrl)}?w=800&h=1000&fit=crop&auto=format&q=80&sat=-10&bri=5`;
```

### 方案5: 品牌官网爬取 ⭐⭐

**优点**：
- 图片最准确
- 通常是官方高质量图

**缺点**：
- 可能涉及法律风险
- 需要处理反爬虫
- 每个品牌网站结构不同

**不推荐**：除非有明确授权

## 综合推荐方案

### 最佳实践（组合方案）

1. **主要来源**：Google Custom Search API
   - 用于找到准确的产品图
   - 设置搜索范围：品牌官网、官方电商

2. **备用来源**：Unsplash/Pexels
   - 如果 Google 找不到，使用高质量概念图

3. **统一处理**：CDN服务
   - 所有图片通过 CDN 统一处理
   - 统一尺寸、滤镜、质量

## 实施步骤

### 第一步：选择并配置API

推荐使用 **Google Custom Search API**，因为：
- 能找到准确的产品图
- 可以筛选官方来源
- 图片质量通常较好

### 第二步：运行搜索脚本

```bash
# 安装依赖（如果需要）
npm install

# 配置环境变量
# 在 .env 中添加：
# GOOGLE_API_KEY=your_key
# GOOGLE_CX=your_cx

# 运行脚本
npm run find:high-quality-images -- --limit=48
```

### 第三步：审核候选图片

访问 `/admin/images` 审核找到的候选图片

### 第四步：应用图片

```bash
npm run apply:images
```

## 环境变量配置

在 `.env` 文件中添加：

```bash
# Google Custom Search (推荐)
GOOGLE_API_KEY=your_google_api_key
GOOGLE_CX=your_search_engine_id

# Unsplash (备用)
UNSPLASH_ACCESS_KEY=your_unsplash_key

# Pexels (备用)
PEXELS_API_KEY=your_pexels_key

# 图片CDN (可选)
IMGIX_DOMAIN=your_domain.imgix.net
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

## 成本估算

- **Google Custom Search**：免费配额 100次/天，超出后 $5/1000次
- **Unsplash**：完全免费
- **Pexels**：完全免费
- **CDN服务**：通常有免费额度，超出后按流量计费

## 注意事项

1. **版权问题**：
   - 确保使用的图片有商业使用许可
   - Unsplash/Pexels 通常允许商业使用
   - Google 搜索结果需要检查具体图片的许可

2. **API配额**：
   - Google API 有每日配额限制
   - 建议分批处理，避免超出配额

3. **图片质量**：
   - 优先选择高分辨率图片（至少 800x1000）
   - 统一图片比例（3:4）
   - 统一图片风格（背景、光线等）

## 快速开始

1. 选择方案（推荐 Google Custom Search）
2. 获取 API Key
3. 配置环境变量
4. 运行脚本
5. 审核并应用

需要我帮您实施哪个方案？
