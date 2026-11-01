# 我的博客（Hexo 8 + NexT 8）

本地已经能跑通：`hexo generate` 产出 55 个文件，`hexo server` 预览正常。

## 本地常用命令

```powershell
# 预览（http://localhost:4000）
node .\node_modules\hexo\bin\hexo server

# 编译到 public/
node .\node_modules\hexo\bin\hexo generate

# 清理
node .\node_modules\hexo\bin\hexo clean
```

> 直接用 `hexo` 命令也行，前提是 `package.json` 里有 `"hexo": { "version": "8.1.2" }`
> 这个字段——Hexo 8 靠它才会加载 `_config.yml`、主题和插件，缺了会静默生成空文件。

## 目录说明

| 路径 | 作用 |
|---|---|
| `_config.yml` | 站点配置（标题、url、分页、部署） |
| `_config.next.yml` | NexT 主题配置（scheme、菜单、代码块、搜索等） |
| `source/_posts/` | 文章，Markdown + front-matter |
| `source/tags/index.md` | 标签页（`type: tags`） |
| `source/categories/index.md` | 分类页（`type: categories`） |
| `scaffolds/` | `hexo new` 用的模板 |
| `public/` | 编译产物，已被 .gitignore 排除 |

## 发布到 GitHub Pages 还差三步

1. **建仓库**：名称必须是 `<你的用户名>.github.io`
2. **认证**：配置 `GITHUB_TOKEN` 或 SSH key（当前机器两者都没有）
3. **部署**：把 `_config.yml` 里的 `deploy` 打开

```yaml
# _config.yml
url: https://<你的用户名>.github.io
deploy:
  type: git
  repo: git@github.com:<你的用户名>/<你的用户名>.github.io.git
  branch: main
```

然后：

```powershell
node .\node_modules\hexo\bin\hexo clean
node .\node_modules\hexo\bin\hexo generate
node .\node_modules\hexo\bin\hexo deploy
```

首次部署后在仓库 Settings → Pages 里把 Source 设为 `main` 分支根目录。

## 已知环境问题（部署前必须先解决）

- `C:\Windows\System32\drivers\etc\hosts` 里有 26 条 github 相关域名指向 `127.0.0.1`，
  导致 github.com / api.github.com / *.githubusercontent.com 全部不可达。
  npm registry 不受影响。
- 本机没有任何 GitHub 凭据（无 `gh`、无 token、`~/.ssh` 里只有其他服务器的 key）。
