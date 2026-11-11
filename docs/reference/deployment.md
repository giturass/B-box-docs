---
description: 将 B-box 中文指南部署到 GitHub Pages 或 Vercel，配置站点路径、自定义域名与预览部署。
---

# 部署文档站

本站使用 VitePress 1.6.4，支持 GitHub Pages 和 Vercel。中文搜索随静态站点生成，无需外部搜索服务。

## Vercel

1. 在 Vercel 新建项目，导入 [B-box-docs 仓库](https://github.com/giturass/B-box-docs)或自己的 fork。
2. Root Directory 保持仓库根目录，Node.js 选择 **22.x**。保留“Enable access to System Environment Variables”。
3. 使用仓库的 [`vercel.json`](https://github.com/giturass/B-box-docs/blob/main/vercel.json)设置，开始部署。
4. 部署完成后访问首页，再直接打开 `scripts/api.html` 等深层页面，检查导航、搜索和示例下载。

项目配置已提供：

| 设置 | 值 |
| --- | --- |
| Framework Preset | VitePress |
| Install Command | `npm ci --no-audit --no-fund` |
| Build Command | `npm run docs:build` |
| Output Directory | `docs/.vitepress/dist` |
| 站点 base | `/`，由 `VERCEL=1` 自动选择 |

保留 `.html` 页面地址，不开启 `cleanUrls`，不添加将所有路径转到 `index.html` 的单页应用重写。VitePress 为每个页面生成独立 HTML；静态资源、页面与示例按各自路径提供。

### 自定义域名

在 Vercel 绑定域名后，可设置 `DOCS_SITE_URL` 为站点根地址，例如 `https://docs.example.com`，再重新部署。将示例域名换成实际域名，不填写路径、查询参数或片段。

未设置时依次使用 `VERCEL_PROJECT_PRODUCTION_URL`、`VERCEL_URL`，自动补上 HTTPS。canonical、Open Graph URL 和生产站点 sitemap 使用同一地址，页面链接仍使用当前部署的根路径。

Vercel Preview 构建带 `noindex, nofollow` 且不生成 sitemap，便于审阅分支内容。要作为正式站点索引，应使用 Production 部署。

## GitHub Pages

1. 在 GitHub 仓库 Settings → Pages 中，将 Source 设为 **GitHub Actions**。
2. 推送到 `main`，等待 Docs checks and Pages 工作流完成。
3. 访问 `https://giturass.github.io/B-box-docs/`。

Pages 构建默认使用 `/B-box-docs/`。Pull request 和非 `main` 分支的手动工作流只执行检查，不部署 Pages；`main` 检查通过后上传并部署站点。

## 维护与验证

内容位于 `docs/`，下载示例位于 `docs/public/examples/`，主题位于 `docs/.vitepress/`。Vue 组件里的站内链接使用 `withBase`，Markdown 保持相对链接或站点根路径链接，不手动写死部署前缀。

`python3 tools/check_docs.py` 检查 Markdown 链接、JSON 与示例引用，`git diff --check` 检查补丁格式。GitHub Actions 分别构建两种 base，检查生成链接、锚点、资源和站点元数据，再用 Playwright 检查桌面、手机、中文搜索、深层页刷新、下载和深色模式。截图保存在工作流产物中。

GitHub Actions 中的 Vercel 路径检查使用静态预览服务；Vercel 云端的项目绑定、域名和部署结果仍以 Vercel 控制台为准。

## 官方依据

- [VitePress 1.6.4 部署说明](https://github.com/vuejs/vitepress/blob/v1.6.4/docs/en/guide/deploy.md)。
- [Vercel 项目配置](https://vercel.com/docs/project-configuration)与[配置 schema](https://openapi.vercel.sh/vercel.json)。
- [Vercel 系统环境变量](https://vercel.com/docs/environment-variables/system-environment-variables)。
- [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
