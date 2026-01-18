# 安装依赖说明

## 问题：bcrypt 模块找不到

已切换到 `bcryptjs`（纯 JavaScript 实现，不需要编译原生代码，更可靠）。

## 安装步骤

1. **删除旧的 node_modules（如果存在）**：
```bash
rm -rf node_modules package-lock.json
```

2. **安装依赖**：
```bash
npm install
```

3. **验证安装**：
```bash
npm list bcryptjs
```

应该看到 `bcryptjs@^2.4.3`。

4. **重启开发服务器**：
```bash
npm run dev
```

## 为什么使用 bcryptjs？

- ✅ 纯 JavaScript 实现，不需要编译原生代码
- ✅ 在 Next.js 中更可靠，兼容性更好
- ✅ API 与 bcrypt 完全兼容，无需修改其他代码
- ✅ 跨平台支持更好（Windows/macOS/Linux）

## 性能说明

`bcryptjs` 比原生 `bcrypt` 稍慢，但对于认证场景完全足够。如果未来需要更高性能，可以再切换回 `bcrypt`。
