# 管理员账号设置指南

## 管理员登录信息

**默认管理员账号：**
- 邮箱：`admin@scentai.com`
- 密码：`Admin@ScentAI2024`（或通过环境变量 `ADMIN_DEFAULT_PASSWORD` 自定义）

> **注意**：如果 Google Chrome 显示"密码泄露"警告，这是正常的浏览器安全检查。Chrome 会检查密码是否在已知的数据泄露数据库中出现过。即使我们的站点没有泄露，如果密码过于简单（如 `admin`），也会触发警告。这不影响登录功能，但建议使用强密码以提高安全性。

## 设置步骤

### 1. 确保数据库已迁移

首先确保数据库表已创建：

```bash
npx prisma migrate dev
```

或者如果使用生产环境：

```bash
npx prisma migrate deploy
```

### 2. 创建管理员账号

运行以下命令创建管理员账号：

```bash
npx tsx scripts/create-admin.ts
```

如果账号已存在，脚本会自动更新密码和角色。

### 3. 登录管理后台

访问以下页面并使用管理员账号登录：

- **香水管理**：`/admin/perfumes`
- **图片审核**：`/admin/images`
- **数据看板**：`/admin/dashboard`

## 登录方式

系统支持两种登录方式：

1. **邮箱+密码登录**（推荐）
   - 使用 `admin@scentai.com` 和密码 `admin` 登录
   - 登录后会创建会话，后续请求自动验证

2. **简单密码验证**（向后兼容）
   - 如果用户表不存在或未创建管理员账号，可以使用环境变量 `ADMIN_PASSWORD` 设置的密码
   - 默认密码：`admin123`

## 修改管理员密码

如果需要修改管理员密码，可以使用专门的脚本：

```bash
npx tsx scripts/change-admin-password.ts <新密码>
```

**示例：**
```bash
# 将密码改为 MySecure@Pass123
npx tsx scripts/change-admin-password.ts MySecure@Pass123
```

**安全建议：**
- 使用至少12位字符的强密码
- 包含大小写字母、数字和特殊字符
- 避免使用常见密码（如 `admin`、`password` 等）
- 定期更换密码

**其他方式：**
1. 重新运行创建脚本（会重置为默认密码）：
   ```bash
   npx tsx scripts/create-admin.ts
   ```

2. 或手动更新数据库（需要先对密码进行 bcrypt 哈希）

## 创建其他管理员账号

可以通过数据库直接创建，或修改 `scripts/create-admin.ts` 脚本创建其他管理员账号。

管理员账号需要满足：
- `role = 'ADMIN'`
- `status = 'ACTIVE'`

## 故障排查

### 问题：无法登录

1. **检查数据库表是否存在**
   ```bash
   npx prisma studio
   ```
   查看 `users` 表是否存在，以及是否有管理员账号

2. **检查账号状态**
   - 确保 `role = 'ADMIN'`
   - 确保 `status = 'ACTIVE'`

3. **检查密码哈希**
   - 如果手动创建账号，确保密码已正确哈希（使用 bcrypt）

### 问题：登录后仍然提示未授权

1. 检查浏览器 cookie 是否被阻止
2. 检查 `auth_session` cookie 是否已设置
3. 查看服务器日志中的错误信息

## 安全建议

1. **生产环境**：请修改默认密码
2. **定期更新**：定期更换管理员密码
3. **限制访问**：在生产环境中限制 `/admin/*` 路径的访问（如使用 IP 白名单）
