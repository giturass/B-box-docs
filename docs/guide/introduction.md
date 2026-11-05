---
description: 简要了解 B-box、sing-box 内核、FlClash 界面，以及 MITM、HTTP 改写和脚本之间的关系。
---

# 认识 B-box

B-box 是基于 sing-box-for-android 的非官方 Android 客户端，使用 FlClash 与 prism_ui 的 Flutter 界面组件。它保留 sing-box 的连接、代理与路由能力，并加入 MITM、HTTP 改写和 JavaScript 请求处理。

本指南主要讲如何观察和处理请求。代理协议与路由的完整说明，请查阅 [sing-box 官方文档](https://sing-box.sagernet.org/configuration/)。

## 三个项目的关系

| 名称 | 在 B-box 中负责什么 |
| --- | --- |
| sing-box / libbox | 协议、入站、出站、DNS、路由与服务运行 |
| sing-box-for-android | Android 应用后端、VPN、配置和平台能力的基础 |
| FlClash / prism_ui | Flutter 界面与共享交互组件，参考 FlClash v0.9.3 |

B-box 的配置格式是 **sing-box JSON**。FlClash 风格的界面不改变配置格式；Clash YAML、Mihomo 提供者和覆写脚本不能直接使用。

## 先记住四个入口

| 你想做什么 | 入口 | 控制对象 |
| --- | --- | --- |
| 解密指定 HTTPS 域名 | 配置 → 编辑 → 高级配置 → MITM | `experimental.mitm` |
| 修改 Header、URL、正文或 Mock | 配置 → 编辑 → 高级配置 → HTTP 改写 | `experimental.http_rewrite` |
| 编写请求、响应脚本或 Cron | 配置 → 编辑 → 高级配置 → 脚本 | `experimental.scripts` |
| 保存和查看请求 | 工具 → 请求 | 本机请求记录 |

这四项独立控制。停止请求记录后，已启用的解密、改写和脚本仍随本地服务运行。关闭 HTTP 改写，也不会关闭独立的 MITM 或脚本。

## 界面只需了解这些

- **仪表盘**：启动与停止本地服务，查看流量、连接等状态。
- **代理**：显示当前核心提供的代理组和节点。自动组由核心选择。
- **配置**：导入或新建 sing-box JSON，选择配置，进入原始与高级编辑器。
- **工具**：进入请求、日志和网络诊断等页面。

本指南的 MITM、证书和请求记录操作针对 **本地服务**。远程会话不能管理本机证书或读取本机请求记录。

## 获取应用与核对版本

从 [B-box 项目](https://github.com/giturass/B-box) 的 [Releases](https://github.com/giturass/B-box/releases) 查看可用 APK 与发布说明。项目声明的安装范围为 Android 7.0+、ARM64；具体以下载产物为准。

本文档依据 2026-11-05 的 B-box 源码整理。源码功能可能领先于已安装 APK。若页面入口或字段不同，先看[资料来源与版本](../reference/sources.md)，再核对安装包对应的提交。

继续：[跑通第一条请求](./quick-start.md)。
