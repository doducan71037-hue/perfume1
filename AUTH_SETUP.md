# 认证系统设置指南

本文档说明如何设置和运行新的认证系统。

## 一、数据库迁移

### 1. 备份数据库（重要！）

在运行迁移之前，请先备份数据库：

```bash
# 如果使用 PostgreSQL，可以使用 pg_dump
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. 运行迁移

```bash
# 生成 Prisma Client
npm run db:generate

# 运行数据库迁移
npm run db:migrate
```

迁移会创建以下新表：
- `users` - 用户表
- `auth_sessions` - 认证会话表
- 更新现有表添加 `userId` 字段（可选，兼容匿名用户）

### 3. 验证迁移

检查数据库表是否创建成功：

```bash
# 如果使用 psql
psql $DATABASE_URL -c "\dt"
```

应该能看到 `users` 和 `auth_sessions` 表。

## 二、安装依赖

```bash
npm install
```

新增依赖：
- `bcrypt` - 密码哈希
- `@types/bcrypt` - TypeScript 类型定义

## 三、环境变量配置

在 `.env` 文件中添加（可选）：

```env
# 管理员邮箱列表（逗号分隔）
# 注册时，如果邮箱在此列表中，会自动设置为 ADMIN 角色
ADMIN_EMAILS=admin@example.com,another@example.com
```

## 四、创建初始管理员账号

有两种方式：

### 方式 1：使用脚本（推荐）

```bash
npm run create-admin
```

按提示输入：
- 邮箱
- 密码（至少8位，包含数字和字母）
- 显示名称（可选）

### 方式 2：通过注册页面

1. 在 `.env` 中设置 `ADMIN_EMAILS=your-email@example.com`
2. 访问 `/register` 注册账号
3. 该邮箱会自动获得 ADMIN 角色

### 方式 3：手动更新现有用户

如果已有用户，可以通过数据库或管理后台将其角色改为 ADMIN：

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

## 五、启动应用

```bash
npm run dev
```

## 六、测试认证系统

### 1. 测试注册

1. 访问 `http://localhost:3000/register`
2. 填写表单：
   - 邮箱：`test@example.com`
   - 密码：`test1234`（至少8位，包含数字和字母）
   - 确认密码：`test1234`
   - 显示名称（可选）
3. 提交后应自动登录并跳转到首页

### 2. 测试登录

1. 访问 `http://localhost:3000/login`
2. 使用注册的邮箱和密码登录
3. 登录成功后应跳转到首页
4. 刷新页面，应保持登录状态

### 3. 测试退出

1. 点击退出按钮（如果页面有）
2. 或访问 `http://localhost:3000/api/auth/logout`（POST）
3. 刷新页面，应显示未登录状态

### 4. 测试管理员后台

1. 使用管理员账号登录
2. 访问 `http://localhost:3000/admin`
3. 应能看到统计概览和管理菜单
4. 访问 `http://localhost:3000/admin/users` 查看用户列表
5. 访问 `http://localhost:3000/admin/events` 查看事件列表

### 5. 测试权限保护

1. 使用普通用户（非 ADMIN）登录
2. 尝试访问 `http://localhost:3000/admin`
3. 应被重定向到登录页或显示 403 错误

### 6. 测试 Rate Limit

1. 快速连续提交登录请求（5次以上）
2. 应收到 "请求过于频繁" 的错误提示

## 七、常见问题

### Q: 迁移失败怎么办？

A: 
1. 检查数据库连接是否正常
2. 检查 Prisma schema 语法是否正确
3. 如果表已存在，可能需要手动删除后重新迁移
4. 恢复备份数据库

### Q: 登录后刷新页面又变成未登录？

A: 
1. 检查 cookie 是否设置成功（浏览器开发者工具 -> Application -> Cookies）
2. 检查 `auth_session` cookie 是否存在
3. 检查服务端 `/api/auth/me` 是否正常返回用户信息

### Q: 管理员后台无法访问？

A: 
1. 确认用户角色为 `ADMIN`（检查数据库 `users` 表）
2. 确认已登录（检查 cookie）
3. 检查中间件是否正常工作

### Q: 密码忘记怎么办？

A: 目前 MVP 版本不支持密码重置，需要：
1. 通过数据库手动更新密码哈希
2. 或删除用户后重新注册
3. 后续版本可添加密码重置功能

## 八、安全注意事项

1. **生产环境**：
   - 确保 `NODE_ENV=production`
   - 会话 cookie 会自动设置为 `secure`（HTTPS only）
   - 定期清理过期会话

2. **密码安全**：
   - 密码以 bcrypt 哈希存储，不会出现在日志中
   - 密码强度要求：至少8位，包含数字和字母

3. **Rate Limit**：
   - 注册：IP 维度，3次/分钟
   - 登录：IP+email 维度，5次/分钟
   - 生产环境建议使用 Redis 替代内存存储

4. **会话管理**：
   - 会话有效期：7天
   - 使用 httpOnly cookie，防止 XSS 攻击
   - 使用 sameSite: 'lax'，防止 CSRF 攻击

## 九、后续优化建议

- [ ] 邮箱验证
- [ ] 密码重置功能
- [ ] 记住我（延长会话）
- [ ] 多设备登录管理
- [ ] 登录历史记录
- [ ] 2FA（双因素认证）
- [ ] OAuth 登录（Google/GitHub）
- [ ] 使用 Redis 实现 Rate Limit
- [ ] 会话管理界面（查看/撤销活跃会话）

## 十、数据库结构

### User 表
- `id` - 用户ID
- `email` - 邮箱（唯一）
- `passwordHash` - 密码哈希
- `displayName` - 显示名称（可选）
- `role` - 角色：USER | ADMIN
- `status` - 状态：ACTIVE | DISABLED
- `createdAt` - 创建时间
- `updatedAt` - 更新时间

### AuthSession 表
- `id` - 会话ID
- `userId` - 用户ID（外键）
- `token` - 会话token（唯一）
- `expiresAt` - 过期时间
- `createdAt` - 创建时间

### 现有表更新
- `Session` - 添加 `userId` 字段（可选）
- `Conversation` - 添加 `userId` 字段（可选）
- `Event` - 添加 `userId` 字段（可选）
- `Feedback` - 添加 `userId` 字段（可选）

所有 `userId` 字段都是可选的，确保兼容现有匿名用户数据。
