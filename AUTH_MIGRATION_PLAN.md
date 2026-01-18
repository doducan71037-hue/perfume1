# 认证系统迁移计划 (PLAN)

## 一、项目概述

**目标**：将当前"伪登录"系统改为标准账号体系（注册→登录→会话保持→退出），并实现管理员后台权限控制。

**技术选型**：方案 B - 自建最小认证系统
- 理由：简单可控、无需引入 NextAuth 复杂性、项目已有 zod/prisma 基础
- 会话管理：httpOnly cookie + 数据库 Session 表
- 密码哈希：bcrypt（成熟稳定）

---

## 二、分步骤实施计划

### 阶段 1：数据库模型设计 (Prisma Schema)

**任务清单**：
1. 修改 `prisma/schema.prisma`：
   - 新增 `User` 模型（email, passwordHash, role, status, displayName）
   - 新增 `AuthSession` 模型（用于用户认证会话，区别于匿名 Session）
   - 修改 `Session` 模型：添加 `userId` 可选字段（用于绑定匿名会话到用户）
   - 修改 `Event` 模型：添加 `userId` 可选字段
   - 修改 `Conversation` 模型：添加 `userId` 可选字段
   - 修改 `Feedback` 模型：添加 `userId` 可选字段

**文件**：
- `prisma/schema.prisma`

**索引要求**：
- User.email: unique index
- User.role: index
- User.status: index
- AuthSession.token: unique index
- AuthSession.userId: index
- AuthSession.expiresAt: index
- Session.userId: index（用于查询用户的所有会话）

**风险点**：
- 现有 `Session` 表已有数据，需要兼容迁移
- `userId` 字段设为可选，避免破坏现有匿名会话

---

### 阶段 2：依赖安装与工具函数

**任务清单**：
1. 安装依赖：`bcrypt` + `@types/bcrypt`
2. 创建认证工具函数：
   - `lib/auth/password.ts`：密码哈希与验证
   - `lib/auth/session.ts`：会话创建/验证/删除
   - `lib/auth/user.ts`：获取当前用户（从 cookie）

**文件**：
- `package.json`（更新依赖）
- `lib/auth/password.ts`（新建）
- `lib/auth/session.ts`（新建）
- `lib/auth/user.ts`（新建）

**风险点**：
- bcrypt 在服务端运行，确保 Node.js 版本兼容

---

### 阶段 3：API 路由实现

**任务清单**：
1. `/api/auth/register`：注册接口
   - 校验：邮箱格式、密码强度（>=8，含数字+字母）、重复邮箱
   - 密码哈希存储
   - 自动登录（创建会话）
   - Rate limit：IP 维度，每分钟 3 次

2. `/api/auth/login`：登录接口
   - 校验：邮箱存在、密码正确
   - 错误提示：统一为"邮箱或密码错误"（避免用户枚举）
   - 创建会话
   - Rate limit：IP+email 维度，每分钟 5 次

3. `/api/auth/logout`：登出接口
   - 删除会话 cookie 和数据库记录

4. `/api/auth/me`：获取当前用户信息
   - 从 cookie 读取会话，返回用户信息

**文件**：
- `app/api/auth/register/route.ts`（新建）
- `app/api/auth/login/route.ts`（新建）
- `app/api/auth/logout/route.ts`（新建）
- `app/api/auth/me/route.ts`（新建）

**Rate Limit 实现**：
- 使用内存 Map 或 Redis（MVP 用内存即可）
- 创建 `lib/auth/rate-limit.ts`

**风险点**：
- 密码不要出现在日志
- 错误信息不要暴露用户是否存在

---

### 阶段 4：前端页面与 Context 更新

**任务清单**：
1. 创建 `/app/register/page.tsx`：注册页面
   - 表单：email, password, confirmPassword, displayName（可选）
   - 前端校验（zod schema）
   - 提交后调用 `/api/auth/register`
   - 成功后跳转首页或登录页

2. 修改 `/app/login/page.tsx`：
   - 调用真实 `/api/auth/login`
   - 错误提示显示

3. 修改 `context/AuthContext.tsx`：
   - 移除 localStorage（改用 httpOnly cookie）
   - `login` 调用 `/api/auth/login`
   - `logout` 调用 `/api/auth/logout`
   - 初始化时调用 `/api/auth/me` 获取用户

4. 更新 `app/layout.tsx`：
   - 确保 AuthProvider 包裹所有页面

**文件**：
- `app/register/page.tsx`（新建）
- `app/login/page.tsx`（修改）
- `context/AuthContext.tsx`（修改）
- `app/layout.tsx`（检查）

**风险点**：
- 客户端状态与服务端会话同步
- 首次加载时从服务端获取用户状态

---

### 阶段 5：中间件与权限保护

**任务清单**：
1. 创建 `middleware.ts`：
   - 拦截 `/admin/**` 路由
   - 验证用户会话
   - 检查角色是否为 ADMIN
   - 非 ADMIN 返回 403 或跳转登录

2. 创建服务端工具函数：
   - `lib/auth/require-auth.ts`：在 API 路由中要求认证
   - `lib/auth/require-admin.ts`：在 API 路由中要求 ADMIN

**文件**：
- `middleware.ts`（新建）
- `lib/auth/require-auth.ts`（新建）
- `lib/auth/require-admin.ts`（新建）

**风险点**：
- Next.js 14 中间件在 Edge Runtime，不能直接使用 Prisma
- 需要从 cookie 读取 token，调用 API 验证（或使用 JWT）

**解决方案**：
- 在中间件中读取 cookie，调用内部 API 验证（或使用 JWT token）
- 或者：中间件只检查 cookie 存在，在页面/API 中再次验证

---

### 阶段 6：管理员后台实现

**任务清单**：
1. `/admin` 首页：统计概览
   - 用户数（总数、活跃数）
   - 对话数（总数、今日）
   - 搜索次数（总数、今日）
   - 点击购买次数（总数、今日）
   - 反馈数（总数、今日）

2. `/admin/users`：用户管理
   - 列表：email, displayName, role, status, createdAt
   - 操作：禁用/启用、设置角色（USER/ADMIN）
   - 搜索/分页

3. `/admin/events`：事件列表
   - 最近 100 条事件
   - 筛选：type, userId, sessionId, 时间范围

4. `/admin/perfumes`：香水管理（已有，添加权限保护）

**文件**：
- `app/admin/page.tsx`（修改：添加统计）
- `app/admin/users/page.tsx`（新建）
- `app/admin/events/page.tsx`（新建）
- `app/api/admin/stats/route.ts`（新建：统计 API）
- `app/api/admin/users/route.ts`（新建：用户管理 API）
- `app/api/admin/events/route.ts`（新建：事件列表 API）

**风险点**：
- 统计查询性能（需要索引）
- 分页实现

---

### 阶段 7：匿名会话绑定（可选）

**任务清单**：
1. 登录成功后，将当前匿名 sessionId 关联到 userId
2. 更新相关表：Session, Event, Conversation, Feedback

**文件**：
- `lib/auth/bind-session.ts`（新建）
- `app/api/auth/login/route.ts`（修改：登录后调用绑定）

**风险点**：
- 数据一致性
- 如果用户已有多个匿名会话，只绑定当前 cookie 的会话

---

### 阶段 8：初始化脚本与文档

**任务清单**：
1. 创建 `scripts/create-admin.ts`：创建初始 ADMIN 账号
2. 更新 `README.md`：添加认证系统说明
3. 创建 `AUTH_SETUP.md`：本地设置步骤

**文件**：
- `scripts/create-admin.ts`（新建）
- `README.md`（更新）
- `AUTH_SETUP.md`（新建）

---

## 三、文件清单

### 新建文件（18个）
1. `lib/auth/password.ts`
2. `lib/auth/session.ts`
3. `lib/auth/user.ts`
4. `lib/auth/rate-limit.ts`
5. `lib/auth/require-auth.ts`
6. `lib/auth/require-admin.ts`
7. `lib/auth/bind-session.ts`
8. `app/api/auth/register/route.ts`
9. `app/api/auth/login/route.ts`
10. `app/api/auth/logout/route.ts`
11. `app/api/auth/me/route.ts`
12. `app/register/page.tsx`
13. `app/admin/users/page.tsx`
14. `app/admin/events/page.tsx`
15. `app/api/admin/stats/route.ts`
16. `app/api/admin/users/route.ts`
17. `app/api/admin/events/route.ts`
18. `scripts/create-admin.ts`
19. `middleware.ts`
20. `AUTH_SETUP.md`

### 修改文件（8个）
1. `prisma/schema.prisma`
2. `package.json`
3. `app/login/page.tsx`
4. `context/AuthContext.tsx`
5. `app/admin/page.tsx`
6. `README.md`
7. `app/layout.tsx`（检查）
8. `app/api/admin/**`（添加权限保护）

---

## 四、风险点与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| 现有匿名会话数据丢失 | 高 | userId 设为可选，兼容现有数据 |
| 中间件不能直接使用 Prisma | 中 | 使用 JWT 或内部 API 验证 |
| Rate limit 内存泄漏 | 中 | 定期清理过期记录，或使用 Redis |
| 密码出现在日志 | 高 | 严格禁止在日志中输出密码字段 |
| 用户枚举攻击 | 中 | 统一错误提示"邮箱或密码错误" |
| 会话劫持 | 中 | httpOnly + secure + sameSite |
| 数据库迁移失败 | 高 | 先备份，测试迁移脚本 |

---

## 五、验收 Checklist

### 功能验收
- [ ] 未注册邮箱登录失败，提示"邮箱或密码错误"
- [ ] 注册成功后可立即登录
- [ ] 登录后刷新页面仍保持登录状态
- [ ] 退出登录后无法访问受保护页面
- [ ] `/admin` 非 ADMIN 用户访问返回 403
- [ ] ADMIN 用户可访问所有管理页面
- [ ] 注册时重复邮箱被拦截
- [ ] 密码强度校验生效（<8 或纯数字/纯字母被拒绝）
- [ ] Rate limit 生效（频繁请求被限制）

### 安全验收
- [ ] 密码以哈希形式存储（数据库中看不到明文）
- [ ] 会话 cookie 为 httpOnly
- [ ] 生产环境会话 cookie 为 secure
- [ ] 错误提示不暴露用户是否存在
- [ ] 密码不出现在日志中

### 数据验收
- [ ] 数据库迁移成功
- [ ] 现有匿名会话数据未丢失
- [ ] 统计数据准确（用户数、对话数等）
- [ ] 用户管理功能正常（禁用/启用、角色设置）

### 兼容性验收
- [ ] 匿名用户仍可使用核心功能（可选）
- [ ] 登录后匿名会话正确绑定到用户（可选）

---

## 六、数据库迁移策略

1. **备份数据库**（重要！）
2. 运行 `prisma migrate dev --name add_user_auth`
3. 验证迁移结果
4. 运行 `scripts/create-admin.ts` 创建初始管理员

---

## 七、测试账号初始化

**方式 1**：环境变量 `ADMIN_EMAILS`（逗号分隔）
- 注册时检查，如果在列表中则自动设为 ADMIN

**方式 2**：运行脚本 `npm run create-admin`
- 交互式创建 ADMIN 账号

**推荐**：方式 1 + 方式 2 都提供

---

## 八、实施顺序建议

1. ✅ 阶段 1：数据库模型（必须先做）
2. ✅ 阶段 2：工具函数（依赖阶段 1）
3. ✅ 阶段 3：API 路由（依赖阶段 2）
4. ✅ 阶段 4：前端页面（依赖阶段 3）
5. ✅ 阶段 5：中间件（依赖阶段 3）
6. ✅ 阶段 6：管理员后台（依赖阶段 5）
7. ✅ 阶段 7：匿名会话绑定（可选，依赖阶段 3）
8. ✅ 阶段 8：文档与脚本（最后）

---

## 九、技术细节

### 密码哈希
- 使用 `bcrypt.hash(password, 10)`（10 rounds）
- 验证：`bcrypt.compare(password, hash)`

### 会话 Token
- 生成：`randomBytes(32).toString('hex')`
- 存储：httpOnly cookie，名称 `auth_session`
- 过期：7 天（可配置）

### Rate Limit
- 内存 Map：`Map<key, {count, resetAt}>`
- 清理：每次检查时清理过期记录
- 限制：
  - 注册：IP 维度，3 次/分钟
  - 登录：IP+email 维度，5 次/分钟

### 中间件实现
- 读取 `auth_session` cookie
- 调用 `lib/auth/user.ts` 验证（内部使用 Prisma）
- 检查 role === 'ADMIN'
- 非 ADMIN 返回 `NextResponse.redirect('/login')` 或 403

---

## 十、后续优化（非 MVP）

- [ ] 邮箱验证
- [ ] 密码重置
- [ ] 记住我（延长会话）
- [ ] 多设备登录管理
- [ ] 登录历史记录
- [ ] 2FA（双因素认证）
- [ ] OAuth 登录（Google/GitHub）

---

**计划完成时间估算**：4-6 小时（包含测试）

**下一步**：开始实施阶段 1（数据库模型设计）
