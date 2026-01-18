# 快速修复指南

## 问题：bcrypt 模块找不到

### 解决方案

1. **安装依赖**（必须执行）：

```bash
npm install
```

这会安装 `bcrypt` 和 `@types/bcrypt`。

2. **如果安装失败**（在某些系统上 bcrypt 需要编译原生代码）：

可以尝试：

```bash
# 清除缓存后重新安装
rm -rf node_modules package-lock.json
npm install

# 或者使用 yarn
yarn install
```

3. **如果仍然失败**（macOS/Linux 可能需要编译工具）：

```bash
# macOS
xcode-select --install

# 或者使用预编译版本
npm install bcrypt --build-from-source=false
```

4. **验证安装**：

```bash
npm list bcrypt
```

应该看到 `bcrypt@^5.1.1`。

5. **重启开发服务器**：

```bash
npm run dev
```

### 已修复的配置

所有使用 bcrypt 的 API 路由已添加 `export const runtime = "nodejs"`，确保使用 Node.js runtime 而不是 Edge Runtime。

### 如果问题仍然存在

如果 bcrypt 在你的系统上无法正常工作，可以考虑使用 `bcryptjs`（纯 JavaScript 实现，不需要编译）：

```bash
npm uninstall bcrypt @types/bcrypt
npm install bcryptjs @types/bcryptjs
```

然后修改 `lib/auth/password.ts`：

```typescript
import bcrypt from "bcryptjs";  // 改为 bcryptjs
```

`bcryptjs` 的 API 与 `bcrypt` 完全兼容，不需要修改其他代码。
