# 木辛雨雯的博客

用 **Hexo 8** + **自建主题 kpmark** 搭的静态博客，托管在 GitHub Pages。

- 站点：https://alexander-ap.github.io/
- 后台（写文章）：https://alexander-ap.github.io/admin/
- 仓库：https://github.com/Alexander-ap/Alexander-ap.github.io

---

## 在博客后台写（推荐）

打开 https://alexander-ap.github.io/admin/ （Sveltia CMS），首次需要登录一次：

1. 点 **Sign In with Token**
2. 按弹窗里的链接生成一个 **Fine-grained token**，权限给 `Contents: Read and write`，仓库选 `Alexander-ap.github.io`
3. 把令牌粘回弹窗 → 登录成功

令牌只存在浏览器 localStorage 里，不会上传到任何地方。之后：**New 文章 → 填标题/日期/标签/正文 → Publish**，保存后约 1 分钟自动发布。

> 想换机器或撤销授权，在浏览器里清掉本站 localStorage，并到 GitHub 设置里删掉那个 token 即可。

## 写作方式二：GitHub 网页，备用

手机上也能写：

1. 打开 https://github.com/Alexander-ap/Alexander-ap.github.io/tree/main/source/_posts
2. 右上角 **Add file → Create new file**
3. 文件名填 `文章名.md`（例如 `first-post.md`）
4. 按下面的模板写内容，拉到底 **Commit changes**
5. 等 1～2 分钟，Actions 自动编译并发布

### 文章模板

```markdown
---
title: 文章标题
date: 2026-11-05 20:00:00
tags:
  - 随笔
categories:
  - 生活
---

正文用 Markdown 写。

## 二级标题

- 列表项
- 另一个
```

必填字段只有 `title` 和 `date`；`tags` / `categories` 留空则归入「未分类」。

## 写作方式三：本地

```bash
npm install
npm run server     # 预览 http://localhost:4000
npm run build      # 编译到 public/
npm run clean      # 清理缓存和 public/
```

本地写完 commit & push 到 `main`，同样会触发 Actions 发布。

---

## 目录说明

| 路径 | 作用 |
|---|---|
| `_config.yml` | 站点配置（标题、url、permalink、分页、搜索） |
| `themes/kpmark/_config.yml` | **主题配置**（站名标语、导航、社交图标、城市） |
| `themes/kpmark/layout/` | 主题模板（EJS）：`index` / `post` / `page` / `archive` / `category` / `tag` |
| `themes/kpmark/source/css/theme.css` | 主题全部样式，单文件约 740 行 |
| `source/_posts/` | 文章，Markdown + front-matter |
| `source/tags/`、`source/categories/` | 标签页、分类页的入口页 |
| `source/about/index.md` | 「关于我」页面，用 HTML + 主题内置的 `info-grid` 类 |
| `source/admin/` | CMS 后台页面与 `config.yml`，构建时按原样拷过去（`skip_render`） |
| `scaffolds/` | `hexo new` 使用的模板 |
| `.github/workflows/pages.yml` | 自动构建并部署到 Pages |
| `public/` | 编译产物，**不进仓库** |
| `_probe/` | 早期排障用的一次性脚本，已被 git 忽略，与站点无关，可随时删除 |

## 主题配置要点

改站名标语、导航、社交链接都在 `themes/kpmark/_config.yml`：

```yaml
tagline: 笔记、杂谈和碎碎念   # 站名下的斜体小字
nav:                        # 顶部药丸导航
  - label: 文章
    url: /
social:                     # 留空则不显示该项
  github: https://github.com/Alexander-ap
  mail: ""
city: 大连                  # 文章末尾「写于 2026.11.01 · 大连」
```

站名本身在 `_config.yml` 的 `title`，头像圆里取站名首字（可用 `avatar_initial` 覆盖）。

改了 `theme.css` 或 `theme.js` 之后，把 `asset_version` 加 1。GitHub Pages 走 CDN 缓存，不换版本号访客可能还看到旧样式。

## 已实现的功能

- **站内搜索**：点导航「搜索」，或按 `/`、`Ctrl/Cmd + K`。支持 ↑↓ 选择、Enter 打开、Esc 关闭
- **文章目录**：正文上方，随滚动高亮当前小节
- **代码块**：语言标签 + 复制按钮，带语法配色
- **图片灯箱**：点击正文图片放大，Esc 关闭
- **阅读进度**：顶部彩线随滚动填充
- **相关文章**：按共享标签与分类推荐 3 篇，无相关则不显示
- **首页标签筛选**：点标签直接搜全站同名文章，能跨分页
- **SEO**：meta description、Open Graph、canonical、JSON-LD、sitemap.xml、robots.txt

全部为原生实现，主题只加载一个约 14KB 的 `js/theme.js`，没有第三方库。

字数口径统一为「去标签去空白、代码块不计」，阅读时长按 400 字/分钟。首页列表和文章页用的是同一套 helper（`themes/kpmark/scripts/helpers.js`），不会再出现两处数字不一致。

## 开启评论（giscus）

评论区默认关闭，需要你在 GitHub 侧做四步：

1. 仓库 Settings → General → Features → 勾选 **Discussions**
2. 安装 [giscus App](https://github.com/apps/giscus)，只授权这个仓库
3. 仓库 Discussions 新建分类 `Comments`，类型选 **Announcements**（只有维护者能开新帖，防垃圾）
4. 打开 [giscus.app](https://giscus.app)，仓库填 `Alexander-ap/Alexander-ap.github.io`，映射选 **pathname**，分类选 `Comments`，页面下方会给出 `data-repo-id` 与 `data-category-id`

把这两个 id 填进 `themes/kpmark/_config.yml`：

```yaml
giscus:
  repo_id: R_kgDOxxxxxxx
  category_id: DIC_kwDOxxxxxxx
```

> `repo_id` 为空时评论区整块不渲染，没配好也不会出现空框；评论脚本是滚动到附近才加载的，不影响首屏速度。
>
> 永久链接含日期，改文章文件名会换 URL，已有评论会失联。如果打算在后台改标题或文件名，把 `giscus.mapping` 换成 `og:title`。
>
> 评论区的暖纸配色来自 `themes/kpmark/source/css/giscus-paper.css`（覆盖 GitHub Primer 变量），想调色改这里。

## 发布流程

```
commit / CMS 保存 → GitHub Actions（npm ci + hexo generate）→ 上传 artifact → Pages 部署
```

构建日志在仓库的 **Actions** 标签页；如果构建报错，站点会保持上一版，不会变白页。线上产物里带 `build-sha.txt`，可以核对当前部署的是哪个 commit。

## 两个容易踩的坑

> 1. `package.json` 必须保留 `"hexo": { "version": "..." }` 字段，否则 Hexo 8 会跳过配置与插件加载，**静默生成 0 字节页面**，本地和 CI 都会中招。
> 2. Pages 的 Source 必须保持为 **GitHub Actions**。若改回「Deploy from a branch」，因为 `public/` 不进仓库，站点会直接变空。

改依赖后记得让 `package-lock.json` 一起提交 —— CI 用的是 `npm ci`，lock 与 `package.json` 不一致会直接失败。
