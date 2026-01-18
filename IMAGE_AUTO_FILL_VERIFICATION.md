# 图片自动补充功能 - 验证步骤

## 一、数据库迁移

首先需要运行数据库迁移以创建新表：

```bash
# 生成 Prisma Client
npm run db:generate

# 创建迁移
npm run db:migrate
```

**验证**：
- 检查数据库中是否存在 `perfume_image_candidates` 表
- 检查 `perfumes` 表的 `imageSource` 字段注释已更新

## 二、测试找图脚本

### 1. 运行找图脚本

```bash
# 为前 20 条没有图片的香水查找候选
npm run find:images -- --limit=20
```

**预期结果**：
- 脚本成功运行，无错误
- 输出显示处理的香水数量和创建的候选数量
- 数据库中 `perfume_image_candidates` 表有新增记录，`status = 'PENDING'`

**检查点**：
```sql
-- 查看候选记录
SELECT 
  pic.id,
  p.brand,
  p.name,
  pic.imageUrl,
  pic.source,
  pic.confidence,
  pic.status
FROM perfume_image_candidates pic
JOIN perfumes p ON p.id = pic.perfumeId
WHERE pic.status = 'PENDING'
ORDER BY pic.createdAt DESC
LIMIT 20;
```

### 2. 验证图片来源

检查候选图片的 URL 是否来自合规来源：
- Wikidata/Wikimedia Commons: URL 应包含 `commons.wikimedia.org` 或 `wikimedia.org`
- Openverse: URL 应来自 Openverse API 返回的结果

## 三、测试审核页面

### 1. 访问审核页面

```bash
# 启动开发服务器
npm run dev
```

访问：`http://localhost:3000/admin/images`

### 2. 登录验证

- 输入管理员密码（环境变量 `ADMIN_PASSWORD`，默认 `admin123`）
- 成功登录后应看到候选列表

### 3. 功能测试

**单独操作**：
- 点击单个候选的"通过"按钮
- 检查数据库中该候选的 `status` 是否变为 `APPROVED`
- 点击"拒绝"按钮
- 检查数据库中该候选的 `status` 是否变为 `REJECTED`

**批量操作**：
- 勾选多个候选
- 点击"批量通过"
- 检查所有选中候选的 `status` 是否变为 `APPROVED`
- 同样测试"批量拒绝"

**UI 验证**：
- 图片预览正常显示
- 来源、许可证、创作者信息正确显示
- 置信度显示正确
- 响应式布局正常（移动端/桌面端）

## 四、测试应用脚本

### 1. 运行应用脚本

```bash
# 将已审核通过的候选应用到香水记录
npm run apply:images
```

**预期结果**：
- 脚本成功运行
- 输出显示更新的香水数量
- 数据库中 `perfumes` 表的 `imageUrl`、`imageSource`、`imageAttribution` 字段已更新

**检查点**：
```sql
-- 查看已应用图片的香水
SELECT 
  p.id,
  p.brand,
  p.name,
  p.imageUrl,
  p.imageSource,
  p.imageAttribution
FROM perfumes p
WHERE p.imageUrl IS NOT NULL 
  AND p.imageSource IN ('WIKIMEDIA', 'OPENVERSE')
ORDER BY p.updatedAt DESC
LIMIT 10;
```

### 2. 验证前端显示

访问以下页面，验证图片正确显示：

1. **搜索页面**：`http://localhost:3000/search`
   - 有图片的香水显示真实图片
   - 无图片的香水显示占位图（基于 ID 的确定性占位图）

2. **香水详情页**：`http://localhost:3000/perfume/{id}`
   - 有图片的香水显示真实图片
   - 无图片的香水显示占位图

3. **报告页面**：`http://localhost:3000/report/{conversationId}`
   - 推荐香水正确显示图片或占位图

**验证点**：
- ✅ 所有页面只使用 `perfume.imageUrl` 或占位图
- ✅ 无图片时，占位图基于香水 ID 生成，同一香水永远一致
- ✅ 无任何随机图片或乱配图逻辑

## 五、合规性验证

### 1. 检查图片来源

```sql
-- 查看所有图片的来源分布
SELECT 
  imageSource,
  COUNT(*) as count
FROM perfumes
WHERE imageUrl IS NOT NULL
GROUP BY imageSource;
```

**预期**：
- 只包含 `WIKIMEDIA`、`OPENVERSE`、`USER`、`NONE`
- 无其他来源

### 2. 检查 Attribution 信息

```sql
-- 查看有 attribution 的图片
SELECT 
  brand,
  name,
  imageSource,
  imageAttribution
FROM perfumes
WHERE imageAttribution IS NOT NULL
LIMIT 10;
```

**验证**：
- Attribution 包含创作者、许可证、来源链接等信息
- 格式正确，便于后续展示

## 六、性能测试

### 1. 找图脚本性能

```bash
# 测试处理 50 条数据的时间
time npm run find:images -- --limit=50
```

**预期**：
- 50 条数据应在 2-3 分钟内完成
- 无超时错误

### 2. 审核页面性能

- 页面加载时间 < 1 秒（20 条候选）
- 批量操作响应时间 < 500ms

## 七、错误处理测试

### 1. 网络错误

- 模拟 Wikidata API 超时（断开网络）
- 脚本应跳过该香水，继续处理下一个
- 无崩溃，有错误日志

### 2. 数据库错误

- 模拟数据库连接失败
- 脚本应优雅退出，显示错误信息

### 3. 无效数据

- 测试空字符串、null 值
- 脚本应正确处理，不崩溃

## 八、完整流程测试

### 端到端流程

1. **初始状态**：数据库中有 20 条 `imageUrl` 为空的香水

2. **生成候选**：
   ```bash
   npm run find:images -- --limit=20
   ```
   - 验证：20 条候选创建成功

3. **审核候选**：
   - 访问 `/admin/images`
   - 通过 10 条，拒绝 10 条
   - 验证：数据库状态正确

4. **应用图片**：
   ```bash
   npm run apply:images
   ```
   - 验证：10 条香水的图片已更新

5. **前端验证**：
   - 访问香水详情页
   - 验证：10 条有图片的香水显示真实图片
   - 验证：10 条被拒绝的香水仍显示占位图

6. **再次运行找图**：
   ```bash
   npm run find:images -- --limit=20
   ```
   - 验证：已拒绝的候选不会重复创建（unique 约束）
   - 验证：已有图片的香水不会生成候选

## 九、已知限制和注意事项

1. **API 限流**：
   - Wikidata 和 Openverse API 可能有速率限制
   - 脚本已添加 1 秒延迟，避免触发限流

2. **图片可用性**：
   - Wikimedia Commons 图片 URL 可能随时间变化
   - 建议定期检查图片是否仍然可访问

3. **审核效率**：
   - 当前设计适合小批量审核（< 50 条）
   - 如需处理大量数据，可考虑分页或筛选功能

4. **安全性**：
   - 当前使用简单的密码认证
   - 生产环境建议升级为完整的认证系统

## 十、故障排查

### 问题：找图脚本找不到图片

**可能原因**：
- Wikidata/Openverse API 无该香水的图片
- 搜索关键词不匹配

**解决方案**：
- 检查搜索关键词是否正确
- 手动在 Wikidata/Openverse 网站搜索验证

### 问题：审核页面无法加载

**可能原因**：
- 数据库连接失败
- API 路由错误

**解决方案**：
- 检查数据库连接
- 查看浏览器控制台和服务器日志

### 问题：应用脚本未更新图片

**可能原因**：
- 候选状态不是 `APPROVED`
- 香水已有图片（脚本会跳过）

**解决方案**：
- 检查候选状态
- 检查香水是否已有图片
