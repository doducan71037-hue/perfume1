# 香水产品图链接（已移除 img.xssdcdn.com）

- `perfume_images_links_no_xssd.csv`：共 60 行，对应你提供的 60 个条目。
- 已把所有 `https://img.xssdcdn.com/...` 的链接从 CSV 中移除（避免继续使用）。

## 字段说明
- `image_url`：
  - `status=replaced/kept`：已给出可用的非 xssdcdn 图片链接（优先品牌官网；少数为授权零售商）。
  - `status=needs_link`：该条目原本是 xssdcdn，但目前先留空；请用 `suggested_search_url` 快速找到品牌官网/授权零售商的高清 packshot，再把最终图片链接填回 `image_url`。
- `brand_domain`：推荐优先检索的品牌官网域名。
- `suggested_search_url`：已生成的 Google 检索链接（带 `site:品牌域名` + `packshot official`），打开后通常能直接找到品牌官网/授权零售商的干净产品图。

> 如果你希望我把 `needs_link` 的 40 个也全部补齐为“直接图片链接”，需要逐个从品牌官网页面提取主图（很多站点是动态加载/多地区版本），我可以按品牌分批补齐并保证风格尽量统一。
