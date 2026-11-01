---
title: Hello World
date: 2026-11-01 16:40:00
tags:
  - 随笔
categories:
  - 开始
---

欢迎来到我的博客。

这是用 **Hexo 8** + **NexT 8** 搭建、准备部署到 GitHub Pages 的第一篇文章。

## 常用命令

```bash
hexo new "文章标题"     # 新建文章
hexo generate           # 编译成静态文件到 public/
hexo server             # 本地预览 http://localhost:4000
hexo clean              # 清理缓存和 public/
hexo deploy             # 部署（配置好 git 之后可用）
```

## 接下来

- 在 `_config.yml` 里把 `url` 改成自己的 GitHub Pages 地址
- 把首页占位文字换成自己的介绍
- 想加公式就装 `hexo-renderer-markdown-it` + katex，并在文章 front-matter 写 `mathjax: true`
