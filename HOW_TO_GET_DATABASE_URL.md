# 如何获取 Supabase 数据库连接字符串

## ⚠️ 重要区别

- ❌ **项目 URL**（你当前存储的）：
  ```
  https://ajxrtsmkthesvlaoydzk.supabase.co
  ```
  这是 Supabase 项目的网页地址，**不是**数据库连接字符串！

- ✅ **数据库连接字符串**（你需要获取的）：
  ```
  postgresql://postgres:你的密码@db.ajxrtsmkthesvlaoydzk.supabase.co:5432/postgres?sslmode=require
  ```
  这是用于连接 PostgreSQL 数据库的字符串。

---

## 📋 详细步骤（带截图说明位置）

### 步骤 1：打开 Supabase Dashboard

1. 访问 https://supabase.com
2. 登录你的账号
3. 选择你的项目（项目名可能是 `perfume` 或其他名称）

### 步骤 2：进入数据库设置

1. 在左侧边栏，找到并点击 **Settings**（⚙️ 齿轮图标）
2. 在 Settings 菜单中，点击 **Database**

### 步骤 3：找到连接字符串

1. 在 Database 页面中，向下滚动
2. 找到 **"Connection string"** 部分（通常在页面中间或下方）
3. 你会看到几个标签页：
   - **URI** ← 选择这个！
   - Session mode
   - Transaction
   - 等等

### 步骤 4：复制连接字符串

1. 点击 **URI** 标签
2. 你会看到类似这样的字符串：
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   或者：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. **重要**：这个字符串中包含 `[YOUR-PASSWORD]`，你需要：
   - 将 `[YOUR-PASSWORD]` 替换为你创建项目时设置的数据库密码
   - 如果密码包含特殊字符，需要进行 URL 编码

### 步骤 5：构建最终连接字符串

根据你的项目 ID `ajxrtsmkthesvlaoydzk`，连接字符串应该是：

```
postgresql://postgres:你的密码@db.ajxrtsmkthesvlaoydzk.supabase.co:5432/postgres?sslmode=require
```

**替换说明**：
- `你的密码` → 替换为你创建项目时设置的数据库密码
- 如果使用连接池（pooler），端口可能是 `6543` 而不是 `5432`
- `?sslmode=require` 是推荐的 SSL 参数

### 步骤 6：更新 .env 文件

1. 打开项目根目录的 `.env` 文件
2. 找到 `DATABASE_URL` 这一行
3. 将值替换为完整的数据库连接字符串：

```bash
DATABASE_URL="postgresql://postgres:你的密码@db.ajxrtsmkthesvlaoydzk.supabase.co:5432/postgres?sslmode=require"
```

**注意**：
- 确保用双引号 `"` 包裹整个字符串
- 密码中的特殊字符需要 URL 编码（见下方）

### 步骤 7：验证

运行验证脚本：

```bash
node fix-database-url.js
```

如果看到 "✅ DATABASE_URL 格式看起来正确！"，说明设置成功！

---

## 🔐 密码 URL 编码

如果密码包含特殊字符，需要进行 URL 编码：

| 字符 | 编码后 |
|------|--------|
| `@` | `%40` |
| `#` | `%23` |
| `%` | `%25` |
| `&` | `%26` |
| `+` | `%2B` |
| `=` | `%3D` |
| `?` | `%3F` |
| `/` | `%2F` |
| ` ` (空格) | `%20` |

**示例**：
- 密码：`MyP@ss#123`
- 编码后：`MyP%40ss%23123`
- 完整连接字符串：
  ```
  postgresql://postgres:MyP%40ss%23123@db.ajxrtsmkthesvlaoydzk.supabase.co:5432/postgres?sslmode=require
  ```

**在线编码工具**：https://www.urlencoder.org/

---

## 🎯 快速检查清单

- [ ] 在 Supabase Dashboard → Settings → Database
- [ ] 找到 "Connection string" 部分
- [ ] 选择 "URI" 标签
- [ ] 复制连接字符串
- [ ] 将 `[YOUR-PASSWORD]` 替换为实际密码
- [ ] 如果密码有特殊字符，进行 URL 编码
- [ ] 更新 `.env` 文件中的 `DATABASE_URL`
- [ ] 运行 `node fix-database-url.js` 验证

---

## ❓ 常见问题

### Q: 我找不到 "Connection string" 部分？

A: 确保你在 **Settings → Database** 页面，而不是其他页面。连接字符串通常在页面中间或下方。

### Q: 有多个连接字符串，应该用哪个？

A: 选择 **URI** 标签下的连接字符串。如果看到两个 URI（一个带 `pooler`，一个不带），通常使用不带 `pooler` 的（端口 5432）。

### Q: 我忘记了数据库密码怎么办？

A: 在 Supabase Dashboard → Settings → Database，可以重置数据库密码。

### Q: 连接字符串格式还是不对？

A: 确保：
1. 以 `postgresql://` 开头（不是 `https://`）
2. 包含 `@` 符号（分隔用户名密码和主机）
3. 包含端口号（`:5432` 或 `:6543`）
4. 包含数据库名（通常是 `/postgres`）

---

完成以上步骤后，告诉我，我会继续执行数据库迁移和后续步骤！
