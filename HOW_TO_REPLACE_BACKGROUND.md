# 如何替换首页背景图片

## 快速替换方法

### 步骤 1：准备图片文件

1. **准备你的背景图片**（支持格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.svg`）

2. **重命名图片文件为 `background.jpg`**（或保持你想要的名称）

### 步骤 2：替换图片文件

**方法A：直接替换（推荐）**

```bash
# 将你的图片复制到 public 目录，命名为 background.jpg
cp /path/to/your/image.jpg /Users/ivan/Desktop/perfume/public/background.jpg
```

或者在文件管理器中：
- 找到你的图片文件
- 复制它
- 粘贴到项目目录：`/Users/ivan/Desktop/perfume/public/`
- 重命名为 `background.jpg`（如果原本不是这个名字）

**方法B：使用其他文件名**

如果你不想重命名，可以修改代码中的文件名（见步骤3）

### 步骤 3：检查/修改代码（如果需要）

打开文件：`app/page.tsx`

找到这一行（大约在第11行）：
```typescript
backgroundImage: "url('/background.jpg')",
```

如果：
- ✅ 你使用了 `background.jpg` 作为文件名 → **无需修改**，直接使用
- ⚠️ 你使用了其他文件名（如 `my-image.png`） → 修改为：
```typescript
backgroundImage: "url('/my-image.png')",
```

**支持的图片格式：**
- `background.jpg` / `background.jpeg`
- `background.png`
- `background.webp`
- `background.svg`

### 步骤 4：刷新页面

1. 保存文件后，刷新浏览器页面
2. 如果看不到变化，强制刷新：
   - **Windows/Linux**: `Ctrl + Shift + R` 或 `Ctrl + F5`
   - **Mac**: `Cmd + Shift + R`

---

## 详细说明

### 图片文件位置

```
perfume/
└── public/           ← 静态资源目录（Next.js会自动提供这些文件）
    └── background.jpg  ← 背景图片放在这里
```

**重要：**
- ✅ 图片必须放在 `public/` 目录下
- ✅ 在代码中使用时，路径以 `/` 开头（如 `/background.jpg`）
- ✅ Next.js会自动提供 `public/` 目录下的文件

### 代码位置

文件：`app/page.tsx`

相关代码片段：
```typescript
<section className="relative h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-b from-white to-black">
  <div
    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
    style={{
      backgroundImage: "url('/background.jpg')",  // ← 这里指定图片路径
    }}
  ></div>
  ...
</section>
```

### 图片样式选项

如果你想调整背景图片的显示效果，可以修改以下CSS类：

**当前样式：**
```typescript
className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
```

**可选样式：**
- `bg-cover` - 覆盖整个容器（可能裁剪）
- `bg-contain` - 完整显示图片（可能有空白）
- `bg-center` - 居中显示
- `bg-top` - 顶部对齐
- `bg-bottom` - 底部对齐
- `bg-no-repeat` - 不重复
- `bg-repeat` - 重复填充

**示例：**
```typescript
// 如果想完整显示图片（不裁剪）
className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat"

// 如果想图片重复填充
className="absolute inset-0 z-0 bg-repeat bg-center"
```

---

## 使用 Next.js Image 组件（可选）

如果你想要更好的图片优化（自动压缩、懒加载等），可以使用 Next.js 的 Image 组件：

### 修改代码

在 `app/page.tsx` 顶部添加：
```typescript
import Image from "next/image";
```

然后将背景div改为：
```typescript
<Image
  src="/background.jpg"
  alt="Background"
  fill
  className="object-cover opacity-80"
  priority
/>
```

**注意：** 使用 Image 组件时需要调整布局方式。

---

## 常见问题

### Q1: 图片不显示？
- ✅ 检查文件是否在 `public/` 目录下
- ✅ 检查文件名是否匹配（区分大小写）
- ✅ 检查路径是否正确（应该是 `/background.jpg`，不是 `./background.jpg`）
- ✅ 强制刷新浏览器缓存

### Q2: 图片太大，加载慢？
- 建议压缩图片（使用工具如 [TinyPNG](https://tinypng.com/)）
- 建议图片大小：1920x1080 或更小，文件大小 < 500KB

### Q3: 想用不同的图片格式？
- 可以，只需修改代码中的文件扩展名
- 推荐格式：`.jpg`（文件小）、`.webp`（质量好）

### Q4: 想同时支持多种尺寸？
可以使用 CSS 媒体查询：
```typescript
style={{
  backgroundImage: "url('/background.jpg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
}}
```

---

## 快速命令参考

```bash
# 查看当前背景图片
ls -lh /Users/ivan/Desktop/perfume/public/background.*

# 替换背景图片
cp /path/to/new-image.jpg /Users/ivan/Desktop/perfume/public/background.jpg

# 如果使用其他文件名，需要修改代码
# 编辑 app/page.tsx，修改 backgroundImage 的值
```

---

**提示：** 图片替换后无需重启开发服务器，直接刷新浏览器即可看到效果。
