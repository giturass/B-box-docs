# 文档站维护

- 先遵守上级 AGENTS.md；本机是 Android Termux，不在本机编译或构建。构建和浏览器验收使用 GitHub Actions，本机可做文本、JSON 和链接的静态检查。
- 这是 B-box 的独立中文指南仓库。sing-box 与 FlClash 只作必要介绍，主要维护 MITM、HTTP 改写、JavaScript 和 Cron 教程。
- 功能说明以 `docs/reference/sources.md` 固定的 B-box 提交和实际源码为依据。不能将 Surge、Mihomo、浏览器或 Node.js 的接口直接当作 B-box 能力。
- 新示例使用保留测试域名、明确合并位置；完整演示配置与配置片段分开说明。不得加入真实订阅、凭据、私钥或用户请求记录。
- 修改功能说明时同步更新相关示例和引用；不能仅更新核对日期。可下载示例放在 `docs/public/examples/`，通过 Markdown 代码导入展示，避免两份内容漂移。
- 站点部署在 `/B-box-docs/`。Vue 组件中的站内链接用 `withBase`，保持深层页面、搜索和手机导航可用。
- 本机可执行 `python3 tools/check_docs.py`、`git diff --check`；`npm run docs:build` 和 Playwright 只在远端运行。
