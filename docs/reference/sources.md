---
description: B-box 指南的固定源码版本、功能依据、上游官方资料与文档站维护说明。
---

# 资料来源与版本

本站面向 B-box 用户，依据实际实现整理操作说明。它不是 sing-box、FlClash 或 Surge 的官方文档。

## 本轮内容基线

| 项目 | 核对版本 |
| --- | --- |
| B-box | [`4aba1933bbfea72bca42ee760a53de068c8fbeae`](https://github.com/giturass/B-box/tree/4aba1933bbfea72bca42ee760a53de068c8fbeae) |
| 核对日期 | 2026-11-05 |
| 文档所用分支 | 当时的 `newui` |
| sing-box 核心基线 | `v1.15.0-alpha.13`，以该提交的 version.properties 为准 |
| FlClash 界面参考 | v0.9.3；不作为核心版本号 |

**当前源码不等同于已发布 APK。** 入口、字段和功能支持以安装包所含提交为准；项目的旧构建成功记录也不能证明新提交已完成全部设备验证。

更新本文时应同时核对相关实现与示例，不能只刷新日期或替换版本号。

## 功能依据

以下链接固定到上述 B-box 提交，便于复查：

| 文档内容 | 依据 |
| --- | --- |
| 项目定位与安装范围 | [README](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/README.md) |
| 核心扩展、默认值、执行顺序和限制 | [libbox.md](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox.md) |
| 证书、Android 信任与配置生命周期 | [app.md](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/app.md) |
| 高级配置与请求页入口 | [flclash.md](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/flclash.md) |
| MITM 字段与域名规则 | [mitm_config.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/mitm_config.go)、[mitm_hosts.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/mitm_hosts.go) |
| 改写字段与实现 | [rewrite_config.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/rewrite_config.go)、[rewrite.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/rewrite.go) |
| 脚本字段与返回值 | [script_config.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/script_config.go)、[script.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/script.go) |
| HTTP 客户端 | [script_http.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/script_http.go) |
| Cron、存储与定时器 | [script_cron.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/script_cron.go)、[script_storage.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/script_storage.go)、[script_timers.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/script_timers.go) |
| 外部资源 | [processing_resources.go](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/libbox/httpdebug/processing_resources.go) |
| 示例参考 | [B-box examples](https://github.com/giturass/B-box/tree/4aba1933bbfea72bca42ee760a53de068c8fbeae/examples) |

本站示例按这些字段和行为编写，使用测试域名。原仓库提供的 Android/Go 验证记录见固定版本 [app.md](https://github.com/giturass/B-box/blob/4aba1933bbfea72bca42ee760a53de068c8fbeae/app.md)；文档站构建通过不替代 App 实机验证。

## 官方参考资料

- [sing-box 配置文档](https://sing-box.sagernet.org/configuration/)与 [mixed 入站](https://sing-box.sagernet.org/configuration/inbound/mixed/)。
- [sing-box-for-android](https://github.com/SagerNet/sing-box-for-android)。
- [FlClash v0.9.3 参考提交](https://github.com/chen08209/FlClash/tree/be84736605527034689c95bf27828ff27d912c5e)。
- Surge [HTTP Processing](https://manual.nssurge.com/http/overview.html)、[MITM](https://manual.nssurge.com/http/mitm.html)、[Host List](https://manual.nssurge.com/profile/host-list.html)、[JavaScript API](https://manual.nssurge.com/scripting/api.html)。这些资料用于理解参考语义，不能替代 B-box 的字段说明。
- [Android Network Security Configuration](https://developer.android.com/privacy-and-security/security-config)，理解用户 CA 与应用信任。
- [Magisk 模块指南](https://topjohnwu.github.io/Magisk/guides.html)、[KernelSU 模块指南](https://kernelsu.org/guide/module.html)。

## 文档站维护

源码仓库：[giturass/B-box-docs](https://github.com/giturass/B-box-docs)。本站用 VitePress 1.6.4，中文搜索在浏览器本地运行。

推送 `main` 后，GitHub Actions 检查 Markdown/示例引用、构建站点，并通过手机与桌面浏览器检查后部署 GitHub Pages；构建不在 Termux 本机执行。

部署方式参考 [VitePress 1.6.4 部署说明](https://github.com/vuejs/vitepress/blob/v1.6.4/docs/en/guide/deploy.md)与 [GitHub Pages 自定义工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

页面底部的“文档更新”表示该页在文档仓库的编辑时间，不能据此推断 App 功能刚刚被验证。内容基线始终以上方表格为准。
