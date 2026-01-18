# Supabase 设置指南

## 步骤 1：创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写项目信息：
   - **Project Name**: `perfume`（或任意名称）
   - **Database Password**: 设置一个强密码（**请务必保存！**）
   - **Region**: 选择离你最近的区域（如 `Southeast Asia (Singapore)`）
5. 点击 "Create new project"
6. 等待 1-2 分钟，项目创建完成

## 步骤 2：获取数据库连接字符串

1. 在 Supabase Dashboard
2. 点击左侧 **Settings** → **Database**
3. 找到 **Connection string** 部分
4. 选择 **URI** 标签
5. 复制连接字符串，格式类似：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
6. **重要**：将 `[YOUR-PASSWORD]` 替换为你创建项目时设置的密码

## 步骤 3：更新 .env 文件

在项目根目录的 `.env` 文件中，更新 `DATABASE_URL`：

```bash
DATABASE_URL="postgresql://postgres:你的密码@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

**注意**：
- 将 `你的密码` 替换为实际密码
- 将 `db.xxxxx.supabase.co` 替换为你的实际数据库地址
- 添加 `?sslmode=require` 以确保安全连接

## 步骤 4：测试连接

运行以下命令测试数据库连接：

```bash
npm run db:generate
node test-db.js
```

如果看到 "✓ Database connected"，说明连接成功！

## 步骤 5：运行数据库迁移

```bash
npm run db:migrate
```

## 步骤 6：导入种子数据

```bash
npm run db:seed
```

## 步骤 7：回填 searchName

```bash
npm run backfill:searchName
```

## 完成！

现在你的数据库已经设置完成，可以继续导入数据了。

## 常见问题

### Q: 连接失败怎么办？
A: 检查：
1. 密码是否正确（注意特殊字符需要 URL 编码）
2. 连接字符串格式是否正确
3. Supabase 项目是否已完全创建完成

### Q: 需要启用 pgvector 扩展吗？
A: 当前项目代码未使用 pgvector 向量字段，所以不需要。如果将来需要使用，可以在 Supabase SQL Editor 中运行：
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Q: 如何查看数据库数据？
A: 在 Supabase Dashboard 中，点击左侧 **Table Editor** 可以查看和编辑数据。
