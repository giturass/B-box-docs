# B-box 使用指南

[阅读指南](https://giturass.github.io/B-box-docs/) · [B-box 项目](https://github.com/giturass/B-box) · [反馈文档问题](https://github.com/giturass/B-box-docs/issues)

B-box 的独立中文文档站，重点介绍 HTTPS MITM、请求记录、HTTP 改写、Map Local / Map Remote、JavaScript 与 Cron。包含可下载示例、字段说明、执行顺序和排错路径；sing-box 内核与 FlClash 界面在入门部分简要介绍。

文档依据 B-box `1006e00e2b24bd369b8c3f5ab08f057c192d8aae`（2026-11-11）核对。当前源码与已发布 APK 可能不同，参见[资料来源与版本](https://giturass.github.io/B-box-docs/reference/sources.html)。

## 维护

- 内容：`docs/`；示例：`docs/public/examples/`；主题：`docs/.vitepress/`。
- 修改 Markdown 并推送 `main`，GitHub Actions 自动检查示例，为 GitHub Pages 和 Vercel 分别构建并运行手机/桌面浏览器检查，再部署 GitHub Pages。
- Pull request 执行同样的构建和浏览器检查，不发布。
- 静态检查：`python3 tools/check_docs.py` 和 `git diff --check`；构建与浏览器验收由 GitHub Actions 完成。
- 站内中文搜索在浏览器运行，无需外部搜索服务。站点不加载统计脚本或外部字体。

依赖由 `package-lock.json` 固定，工作流使用 `npm ci` 安装。升级依赖时同步更新锁文件，并通过远端检查。

## Vercel 部署

在 Vercel 导入本仓库，Root Directory 保持仓库根目录，使用 Node.js 22.x。仓库的 `vercel.json` 已配置 VitePress、安装命令、构建命令和输出目录，无需修改页面链接。

保持 Vercel 的系统环境变量可用：Vercel 自动使用 `/`，GitHub Pages 使用 `/B-box-docs/`。自定义域名可设置 `DOCS_SITE_URL=https://docs.example.com`（替换为实际域名，不带子路径）；未设置时使用 Vercel 提供的生产域名。预览部署标记为不索引。

配置项与验收方式见[部署文档站](docs/reference/deployment.md)。

## 来源与许可

本文档针对 [B-box](https://github.com/giturass/B-box)，不代表 sing-box、sing-box-for-android、FlClash 或 Surge 的官方文档。第三方项目的名称与许可归其各自权利人；配置语义、例子及引用见[来源页](docs/reference/sources.md)。本仓库按 [GPL-3.0-or-later](LICENSE) 发布，保留 B-box 示例的来源。
