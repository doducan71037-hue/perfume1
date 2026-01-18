# 图片自动补充功能 - 快速启动指南

## 🚀 3 步快速开始

### 第一步：运行数据库迁移

```bash
# 生成 Prisma Client（包含新表）
npm run db:generate

# 创建数据库迁移（会自动检测 schema 变化）
npm run db:migrate
```

**验证**：
```sql
-- 检查新表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'perfume_image_candidates';
```

### 第二步：查找图片候选

```bash
# 为前 20 条没有图片的香水查找候选
npm run find:images -- --limit=20
```

**预期输出**：
```
📸 开始查找图片候选（限制: 20 条）

找到 20 条需要图片的香水

🔍 查找: Chanel No. 5
  ✅ Wikidata: https://commons.wikimedia.org/wiki/Special:FilePath/...

✅ 完成！
  处理了 20 条香水
  创建了 15 个候选图片

下一步：访问 /admin/images 审核候选图片
```

### 第三步：审核并应用

1. **访问审核页面**：
   ```bash
   npm run dev
   ```
   打开浏览器访问：`http://localhost:3000/admin/images`

2. **登录**：
   - 默认密码：`admin123`（可通过环境变量 `ADMIN_PASSWORD` 配置）

3. **审核候选**：
   - 查看图片预览和来源信息
   - 点击"通过"或"拒绝"按钮
   - 支持批量操作（勾选多个，点击批量通过/拒绝）

4. **应用已审核的图片**：
   ```bash
   npm run apply:images
   ```

5. **验证结果**：
   - 访问香水详情页，查看图片是否正确显示
   - 或访问 `/search` 页面，查看列表中的图片

## 📋 完整工作流程

```
1. 运行迁移          npm run db:migrate
           ↓
2. 查找候选          npm run find:images -- --limit=20
           ↓
3. 打开审核页面      http://localhost:3000/admin/images
           ↓
4. 审核候选          [通过/拒绝]
           ↓
5. 应用图片          npm run apply:images
           ↓
6. 验证前端显示      [查看香水详情页/搜索页]
```

## ⚙️ 环境变量配置

在 `.env` 文件中添加（可选）：

```bash
# 管理后台密码（默认：admin123）
ADMIN_PASSWORD=your-secure-password
```

## 🔍 验证检查点

### 1. 数据库验证

```sql
-- 查看候选记录
SELECT 
  pic.id,
  p.brand || ' ' || p.name as perfume_name,
  pic.source,
  pic.status,
  pic.confidence
FROM perfume_image_candidates pic
JOIN perfumes p ON p.id = pic.perfumeId
WHERE pic.status = 'PENDING'
ORDER BY pic.createdAt DESC;
```

### 2. 前端验证

访问以下页面，确保图片正确显示：

- ✅ `/search` - 搜索页面
- ✅ `/perfume/[id]` - 香水详情页
- ✅ `/report/[conversationId]` - 推荐报告页

**检查点**：
- 有图片的香水显示真实图片
- 无图片的香水显示占位图（基于 ID 的确定性占位图）
- 无任何乱配图的情况

## 🐛 常见问题

### Q: 迁移失败，提示表已存在？

**A**: 可能是之前已创建过表。可以手动检查：
```sql
-- 查看表结构
\d perfume_image_candidates
```

如果表结构正确，可以跳过迁移。如果需要重置，先删除表：
```sql
DROP TABLE IF EXISTS perfume_image_candidates;
```

### Q: 找图脚本运行很慢？

**A**: 这是正常的。每个香水需要调用外部 API（Wikidata/Openverse），脚本已添加 1 秒延迟避免限流。

**优化建议**：
- 分批运行（`--limit=10`）
- 在网络稳定的环境下运行
- 避免同时运行多个实例

### Q: 找不到图片？

**A**: 可能原因：
1. 该香水在 Wikidata/Openverse 中确实没有图片
2. 搜索关键词不匹配

**解决方案**：
- 检查 Wikidata 网站：搜索 `{brand} {name}`
- 检查 Openverse 网站：搜索 `{brand} {name} perfume bottle`
- 如果确认有图片但脚本找不到，可能需要优化搜索策略

### Q: 审核页面无法访问？

**A**: 检查：
1. 开发服务器是否运行：`npm run dev`
2. 数据库连接是否正常
3. 浏览器控制台是否有错误信息

### Q: 应用脚本没有更新图片？

**A**: 检查：
1. 候选状态是否为 `APPROVED`：
   ```sql
   SELECT status, COUNT(*) 
   FROM perfume_image_candidates 
   GROUP BY status;
   ```

2. 香水是否已有图片（脚本会跳过已有图片的香水）

## 📊 使用统计

查看图片补充进度：

```sql
-- 统计图片状态
SELECT 
  CASE 
    WHEN imageUrl IS NULL OR imageUrl = '' THEN '无图片'
    ELSE imageSource
  END as status,
  COUNT(*) as count
FROM perfumes
GROUP BY status;

-- 统计候选状态
SELECT status, COUNT(*) 
FROM perfume_image_candidates 
GROUP BY status;
```

## 🎯 下一步

- ✅ 已完成：基本功能实现
- 📝 可选优化：
  - 添加图片质量评分（尺寸、清晰度等）
  - 支持图片替换（已有图片但想更换）
  - 批量重新查找（重置 PENDING 状态的候选）
  - 自动清理旧候选记录

## 📚 相关文档

- `IMAGE_AUTO_FILL_PLAN.md` - 详细实施计划
- `IMAGE_AUTO_FILL_VERIFICATION.md` - 完整验证步骤
- `README.md` - 项目主文档
