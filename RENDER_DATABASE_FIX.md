# Render 数据库连接修复指南

## ✅ 问题已修复

我已经修复了本地数据库连接问题。现在你需要在 **Render** 上也更新 `DATABASE_URL` 环境变量。

---

## 🔧 修复内容

### 问题原因：
1. **密码中的特殊字符未编码**：密码中的 `&` 字符需要 URL 编码为 `%26`
2. **缺少 SSL 参数**：需要添加 `?sslmode=prefer` 来处理 SSL 连接

### 已修复的配置：

**正确的 DATABASE_URL 值**（请复制这个到 Render）：

```
postgresql://postgres:QwctPDT3P%26b35Y3@db.ajxrtsmkthesvlaoydzk.supabase.co:5432/postgres?sslmode=prefer
```

**重要说明**：
- 密码中的 `&` 已编码为 `%26`
- 添加了 `?sslmode=prefer` 参数

---

## 📋 在 Render 中更新 DATABASE_URL

### 步骤 1：登录 Render Dashboard
1. 访问 https://dashboard.render.com
2. 登录你的账号

### 步骤 2：找到你的 Web Service
1. 在 Dashboard 中找到你的服务（项目名称）
2. 点击进入服务详情页

### 步骤 3：进入 Environment 设置
1. 点击左侧菜单的 **"Environment"** 标签
2. 或者点击 **"Settings"** → **"Environment"**

### 步骤 4：更新 DATABASE_URL
1. 找到 `DATABASE_URL` 环境变量
2. 点击编辑（铅笔图标）或删除后重新添加
3. **Key**: `DATABASE_URL`
4. **Value**: 粘贴以下值：

```
postgresql://postgres:QwctPDT3P%26b35Y3@db.ajxrtsmkthesvlaoydzk.supabase.co:5432/postgres?sslmode=prefer
```

5. 点击 **"Save"** 保存

### 步骤 5：重启服务
1. 在服务详情页，点击 **"Manual Deploy"**
2. 选择 **"Clear build cache & deploy"**（推荐）
3. 等待部署完成

---

## ✅ 验证修复

部署完成后：

1. **检查日志**：
   - 在 Render Dashboard → Logs
   - 应该看不到数据库连接错误

2. **测试功能**：
   - 访问你的网站
   - 尝试注册新账号
   - 应该不再出现 `Invalid prisma.user.findUnique()` 错误

3. **测试搜索**：
   - 访问搜索页面
   - 应该能看到香水列表

---

## 🔍 如果还有问题

### 检查清单：
- [ ] DATABASE_URL 值完全正确（包括 `%26` 和 `?sslmode=prefer`）
- [ ] 已重启服务
- [ ] 查看 Render Logs 中的具体错误信息

### 常见问题：

**Q: 还是显示连接错误？**
- 检查 DATABASE_URL 是否完全复制（包括所有字符）
- 确认密码中的 `&` 已编码为 `%26`
- 确认末尾有 `?sslmode=prefer`

**Q: 如何确认环境变量已更新？**
- 在 Render Environment 页面，应该能看到更新后的值
- 或者查看 Logs，在启动日志中会显示环境变量（部分隐藏）

**Q: 需要重新部署吗？**
- 是的，更新环境变量后必须重启服务才能生效

---

## 📝 技术细节

### 修复的代码文件：
- `lib/db.ts` - 添加了 IPv4 强制和 SSL 配置
- `.env` - 更新了 DATABASE_URL（本地）

### 关键修复点：
1. **IPv4 强制**：`family: 4` - 避免 IPv6 连接问题
2. **SSL 配置**：`ssl: { rejectUnauthorized: false }` - 处理自签名证书
3. **密码编码**：`&` → `%26` - URL 编码特殊字符

---

完成以上步骤后，数据库连接问题应该就解决了！如果还有问题，请告诉我具体的错误信息。
