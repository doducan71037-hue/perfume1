# 手动上传图片指南

## 第一步：查看香水列表

已为您生成两个列表文件：

1. **文本格式**：`data/perfumes-list.txt`
   - 纯文本，方便复制和查看
   
2. **CSV格式**：`data/perfumes-list.csv`
   - 包含ID、品牌、名称等完整信息
   - 可以用Excel或Google Sheets打开

## 第二步：准备图片CSV文件

找到图片后，创建一个CSV文件（例如：`data/manual-perfume-images.csv`），格式如下：

```csv
brand,name,imageUrl,imageSource,imageAttribution
"Chanel","No. 5","https://example.com/image.jpg","USER","手动上传"
"Tom Ford","Black Orchid","https://example.com/black-orchid.jpg","USER","手动上传"
```

### CSV格式说明：

- **brand**: 品牌名称（必须与列表中的完全一致）
- **name**: 香水名称（必须与列表中的完全一致）
- **imageUrl**: 图片URL（可以是：
  - 外部URL（如 CDN、图床）
  - 本地路径（如 `/images/chanel-no5.jpg`，需要先上传到 `public/images/` 目录）
- **imageSource**: 固定填写 `"USER"`
- **imageAttribution**: 可选，填写图片来源说明

### 示例：

```csv
brand,name,imageUrl,imageSource,imageAttribution
"Chanel","No. 5","https://i.imgur.com/example.jpg","USER","手动上传"
"Dior","Sauvage","/images/dior-sauvage.jpg","USER","手动上传"
"Tom Ford","Black Orchid","https://cdn.example.com/tf-black-orchid.jpg","USER","手动上传"
```

## 第三步：导入图片

准备好CSV文件后，运行导入命令：

```bash
npm run import:perfume-images -- --file=data/manual-perfume-images.csv
```

## 本地图片上传（可选）

如果图片是本地文件，需要先上传到项目的 `public/images/` 目录：

### 方法1：使用文件管理器
1. 将图片文件放到 `public/images/` 目录
2. 在CSV中使用相对路径：`/images/filename.jpg`

### 方法2：使用命令行
```bash
# 创建图片目录
mkdir -p public/images

# 复制图片文件（示例）
cp ~/Downloads/chanel-no5.jpg public/images/
# 然后在CSV中使用: /images/chanel-no5.jpg
```

## 图片URL来源建议

### 推荐方式：
1. **图床服务**：
   - Imgur
   - Cloudinary
   - 其他CDN服务

2. **本地存储**：
   - 上传到 `public/images/` 目录
   - 使用相对路径：`/images/filename.jpg`

3. **外部URL**：
   - 确保URL稳定可访问
   - 建议使用HTTPS

### 不推荐：
- 临时链接（可能过期）
- 需要登录才能访问的链接
- 可能侵犯版权的链接

## 批量导入示例

假设您有60条香水的图片，CSV文件如下：

```csv
brand,name,imageUrl,imageSource,imageAttribution
"Chanel","No. 5","https://example.com/chanel-no5.jpg","USER","手动上传"
"Tom Ford","Black Orchid","https://example.com/tf-black-orchid.jpg","USER","手动上传"
...（其他58条）
```

运行导入：
```bash
npm run import:perfume-images -- --file=data/manual-perfume-images.csv
```

## 注意事项

1. **品牌和名称必须完全匹配**：
   - 脚本使用 `normalize` 函数匹配（不区分大小写和空格）
   - 但建议完全一致，避免匹配错误

2. **检查重复**：
   - 如果香水有多个记录（相同品牌+名称），只会更新第一个匹配的
   - CSV中列出所有需要更新的记录即可

3. **图片格式**：
   - 支持：JPG, PNG, WebP 等常见格式
   - 建议尺寸：至少 800x1000 像素（3:4比例）

4. **导入后验证**：
   - 访问香水详情页检查图片是否正确显示
   - 或运行查询脚本检查状态

## 验证导入结果

导入完成后，可以运行：

```bash
# 检查图片统计
npx tsx scripts/check-empty-images.ts
```

## 需要帮助？

如果CSV文件准备好了，告诉我文件路径，我可以帮您：
1. 检查CSV格式是否正确
2. 运行导入命令
3. 验证导入结果
