# 密码问题排查

## 正确密码

**默认密码**：`admin123`

## 如果输入 admin123 仍然报错，请尝试：

### 方法 1：清除浏览器缓存
1. 打开浏览器开发者工具（F12）
2. 切换到 "Application" 或 "存储" 标签
3. 找到 "Session Storage"
4. 删除 `admin_authenticated` 和 `admin_password` 键
5. 刷新页面，重新登录

### 方法 2：重启开发服务器
```bash
# 停止当前服务器（Ctrl+C），然后重新启动
npm run dev
```

### 方法 3：手动设置环境变量（如果需要自定义密码）
在 `.env` 文件中添加：
```bash
ADMIN_PASSWORD=admin123
```
然后重启开发服务器。

### 方法 4：检查控制台错误
打开浏览器开发者工具（F12）→ Console 标签，查看是否有错误信息。
