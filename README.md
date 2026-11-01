# Alexander 的博客

用 **Hexo 8 + NexT 8** 搭的静态博客，托管在 GitHub Pages。

- 站点：https://alexander-ap.github.io/
- 后台（写文章）：https://alexander-ap.github.io/admin/
- 仓库：https://github.com/Alexander-ap/Alexander-ap.github.io

## 在博客后台写（推荐）

打开 https://alexander-ap.github.io/admin/ ，首次需要登录一次：

1. 点 **Sign In with Token**
2. 按弹窗里的链接生成一个 **Fine-grained token**，权限给 `Contents: Read and write`，仓库选 `Alexander-ap.github.io`
3. 把令牌粘回弹窗 → 登录成功

令牌只存在你的浏览器 localStorage 里，不会上传。之后：**New 文章 → 写标题/日期/标签/正文 → Publish**，保存后约 1 分钟自动发布。

> 令牌是给 CMS 提交内容用的；想换机器或清除，在浏览器里清掉本站 localStorage 即可。

## 写作方式（GitHub 网页，备用）

全部在 GitHub 网页上完成，手机也行：

1. 打开 https://github.com/Alexander-ap/Alexander-ap.github.io/tree/main/source/_posts
2. 右上角 **Add file → Create new file**
3. 文件名填 `文章名.md`（例如 `first-post.md`），内容按下面的模板写
4. 拉到底点 **Commit changes**
5. 等 1～2 分钟，GitHub Actions 自动编译并发布，刷新博客即可看到

修改已有文章同理：点开文件 → 右上角铅笔图标 → 改 → Commit。

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

```bash
# 代码块支持语法高亮
echo "hello"
```
```

必填字段只有 `title` 和 `date`，`tags` / `categories` 可留空（留空则归到「未分类」）。

### 发布流程

```
你 commit → GitHub Actions（npm ci + hexo generate）→ 上传 artifact → Pages 部署
```

构建日志在仓库的 **Actions** 标签页；如果构建报错，站点会保持上一版，不会变白页。

## 目录说明

| 路径 | 作用 |
|---|---|
| `_config.yml` | 站点配置（标题、url、分页） |
| `_config.next.yml` | NexT 主题配置（配色、菜单、代码块、搜索） |
| `source/_posts/` | 文章，Markdown + front-matter |
| `source/tags/`、`source/categories/` | 标签页、分类页 |
| `scaffolds/` | `hexo new` 使用的模板 |
| `.github/workflows/pages.yml` | 自动构建并部署到 Pages |
| `public/` | 编译产物（构建时生成，**不进仓库**） |

## 本地开发（可选）

```powershell
npm install
node .\node_modules\hexo\bin\hexo server    # 预览 http://localhost:4000
node .\node_modules\hexo\bin\hexo generate  # 只编译，输出到 public/
```

> 两个容易踩的坑，已经在这份配置里处理好了：
> 1. `package.json` 必须有 `"hexo": { "version": "..." }` 字段，否则 Hexo 8 会跳过配置与插件加载，**静默生成 0 字节页面**。
> 2. 不要安装 `hexo-renderer-nunjucks`，它会抢注 `.njk` 渲染器并导致 NexT 的 `template not found: _layout.njk`。

## 备注

- 仓库里还有一个 `source` 分支，是早期手工部署时留下的源码副本，已不再使用，可以删除。
- 站点通过 GitHub Actions 部署，Pages 的 Source 必须保持为 `GitHub Actions`；若改回「Deploy from a branch」，需要把编译产物放回仓库才能正常显示。
