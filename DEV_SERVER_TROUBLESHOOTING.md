# 开发服务器问题排查

## 问题：`npm run dev` 没反应

### 常见原因

1. **端口被占用**（最常见）
   - 端口 3000 已被其他进程占用
   - 之前的服务器还在运行

2. **服务器已经在运行**
   - 检查浏览器是否能访问 `http://localhost:3000`
   - 如果能访问，说明服务器已经在运行

3. **终端卡住**
   - 命令正在执行但没有输出
   - 等待几秒钟看是否有输出

### 解决方案

#### 方案 1：检查服务器是否已运行

```bash
# 检查端口 3000 是否被占用
lsof -ti:3000

# 如果返回进程 ID，说明端口被占用
# 在浏览器访问 http://localhost:3000 看是否能正常访问
```

#### 方案 2：停止旧进程并重启

```bash
# 停止占用 3000 端口的进程
lsof -ti:3000 | xargs kill -9

# 或者手动停止（替换 PID 为实际进程 ID）
kill -9 <PID>

# 然后重新启动
npm run dev
```

#### 方案 3：使用不同端口

```bash
# 使用 3001 端口启动
PORT=3001 npm run dev

# 或者修改 package.json 中的 dev 脚本
# "dev": "next dev -p 3001"
```

#### 方案 4：检查是否有编译错误

```bash
# 查看详细输出
npm run dev -- --verbose

# 或者检查是否有 TypeScript 错误
npm run lint
```

### 快速诊断命令

```bash
# 1. 检查端口占用
lsof -ti:3000

# 2. 检查 Node.js 进程
ps aux | grep -i "next\|node" | grep -v grep

# 3. 检查 package.json 脚本
cat package.json | grep -A 2 '"dev"'

# 4. 检查依赖是否安装
npm list next
```

### 如果还是没反应

1. **检查终端输出**
   - 查看是否有错误信息
   - 查看是否有编译警告

2. **检查 Next.js 版本**
   ```bash
   npm list next
   ```

3. **清除缓存重新安装**
   ```bash
   rm -rf .next node_modules package-lock.json
   npm install
   npm run dev
   ```

4. **检查环境变量**
   - 确保 `.env` 文件存在且配置正确
   - 检查 `DATABASE_URL` 等必需变量

### 正常启动的标志

服务器正常启动时，你应该看到类似输出：

```
▲ Next.js 14.2.35
- Local:        http://localhost:3000
- Ready in 2.3s
```

如果看到这个输出，说明服务器已成功启动！
