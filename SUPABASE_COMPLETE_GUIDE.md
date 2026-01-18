# Supabase 完整设置指南

## 重要说明

### ✅ 这个项目只需要什么？

**只需要 `DATABASE_URL`**，不需要 Supabase API 密钥！

这个项目使用 **Prisma ORM** 直接连接 PostgreSQL 数据库，不使用 Supabase 的客户端 SDK，所以：
- ❌ **不需要** `SUPABASE_URL`
- ❌ **不需要** `SUPABASE_ANON_KEY`
- ❌ **不需要** `SUPABASE_SERVICE_ROLE_KEY`
- ✅ **只需要** `DATABASE_URL`（PostgreSQL 连接字符串）

---

## 完整设置步骤

### 步骤 1：创建 Supabase 项目

1. 访问 https://supabase.com
2. 注册/登录账号
3. 点击 "New Project"
4. 填写信息：
   - **Project Name**: `perfume`（或任意名称）
   - **Database Password**: 设置强密码（**务必保存！**）
   - **Region**: 选择最近的区域
5. 点击 "Create new project"
6. 等待 1-2 分钟创建完成

### 步骤 2：获取数据库连接字符串

1. 在 Supabase Dashboard
2. 点击左侧 **Settings**（齿轮图标）→ **Database**
3. 滚动到 **Connection string** 部分
4. 选择 **URI** 标签（不是 Session mode 或 Transaction）
5. 你会看到类似这样的字符串：
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   或者：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

6. **重要**：将 `[YOUR-PASSWORD]` 替换为你创建项目时设置的密码

7. **推荐格式**（添加 SSL 参数）：
   ```
   postgresql://postgres:你的密码@db.xxxxx.supabase.co:5432/postgres?sslmode=require
   ```

### 步骤 3：更新 .env 文件

在项目根目录的 `.env` 文件中，添加或更新：

```bash
DATABASE_URL="postgresql://postgres:你的密码@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
```

**注意**：
- 将 `你的密码` 替换为实际密码
- 将 `db.xxxxx.supabase.co` 替换为你的实际数据库地址
- 如果密码包含特殊字符（如 `@`, `#`, `%` 等），需要进行 URL 编码：
  - `@` → `%40`
  - `#` → `%23`
  - `%` → `%25`
  - `&` → `%26`
  - 等等

### 步骤 4：验证连接字符串

运行检查脚本：

```bash
node check-env.js
```

应该看到所有检查项都是 ✅

### 步骤 5：执行初始化 SQL（可选）

1. 在 Supabase Dashboard，点击左侧 **SQL Editor**
2. 点击 "New query"
3. 复制 `supabase/init.sql` 文件的内容
4. 粘贴到 SQL Editor
5. 点击 "Run" 执行

**注意**：这一步是可选的，主要是为了启用 pgvector 扩展（当前项目未使用，但可以预先启用）。

### 步骤 6：运行数据库迁移

```bash
npm run db:migrate
```

这会自动创建所有数据库表。

### 步骤 7：导入种子数据

```bash
npm run db:seed
```

这会导入基础的 Notes、Accords 和示例香水数据。

### 步骤 8：回填 searchName

```bash
npm run backfill:searchName
```

---

## 常见问题

### Q: 为什么不需要 Supabase API 密钥？

A: 这个项目使用 Prisma ORM 直接连接 PostgreSQL，不依赖 Supabase 的客户端 SDK。只需要标准的 PostgreSQL 连接字符串即可。

### Q: 如果我想使用 Supabase 的其他功能（如 Auth、Storage）怎么办？

A: 如果将来需要使用 Supabase 的其他功能，可以：
1. 安装 `@supabase/supabase-js`
2. 在 `.env` 中添加 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
3. 在代码中使用 Supabase 客户端

但当前项目不需要这些。

### Q: 连接字符串格式不对怎么办？

A: 确保：
1. 以 `postgresql://` 开头
2. 包含用户名（通常是 `postgres`）
3. 包含密码（替换 `[YOUR-PASSWORD]`）
4. 包含主机地址（`db.xxxxx.supabase.co`）
5. 包含端口（`:5432` 或 `:6543`）
6. 包含数据库名（通常是 `/postgres`）

### Q: 密码包含特殊字符怎么办？

A: 使用 URL 编码：
- 在线工具：https://www.urlencoder.org/
- 或者使用 Node.js：
  ```javascript
  encodeURIComponent('你的密码')
  ```

### Q: 如何查看数据库中的数据？

A: 在 Supabase Dashboard → **Table Editor** 可以查看和编辑数据。

---

## 完成检查清单

- [ ] Supabase 项目已创建
- [ ] 获取了数据库连接字符串
- [ ] 更新了 `.env` 文件中的 `DATABASE_URL`
- [ ] 运行 `node check-env.js` 验证通过
- [ ] （可选）在 SQL Editor 中执行了 `supabase/init.sql`
- [ ] 运行 `npm run db:migrate` 成功
- [ ] 运行 `npm run db:seed` 成功
- [ ] 运行 `npm run backfill:searchName` 成功

完成以上步骤后，数据库就设置好了！🎉
