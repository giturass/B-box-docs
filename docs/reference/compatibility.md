---
description: B-box 与 sing-box、FlClash、Surge 脚本及 Android 信任模型的兼容范围。
---

# 兼容性说明

B-box 使用 sing-box JSON，并在自己的核心中扩展 MITM、HTTP 改写与脚本。很多处理语义参考 Surge，但配置格式、运行环境和资源限额需要按 B-box 说明使用。

## 与其他项目的关系

| 来源 | 可沿用的知识 | 需要调整的部分 |
| --- | --- | --- |
| sing-box | JSON 配置、协议、路由、入站与出站 | 本站三个 `experimental` 扩展属于 B-box，原版客户端不一定接受 |
| FlClash | 界面导航、共享组件的交互风格 | B-box 使用 sing-box 后端，不接受 Clash YAML 或 Mihomo 覆写 |
| Surge HTTP 处理 | Header/URL/Body、Map Local、MITM 等概念 | 不导入 Surge INI 配置或模块，需改写为 B-box JSON |
| Surge JavaScript | 部分 `$request`、`$response`、`$done`、HTTP 与存储约定 | 宿主 API、限额、路径、联网策略逐项核对 |
| Node.js / 浏览器 | JavaScript 语言基础 | 不提供 Node.js 模块、DOM、浏览器 fetch 等完整宿主环境 |

## 移植脚本前检查

1. 触发类型是否是 B-box 支持的 HTTP 请求、HTTP 响应或 Cron。
2. 是否只依赖[现有 API](../scripts/api.md)，包含所有异步完成路径的 `$done`。
3. 是否需要正文、二进制或完整重复头，对应设置 `requires_body`、`binary_body`、`full_headers`。
4. 是否依赖 `policy`；该值必须替换成当前核心真实的 outbound tag。
5. 文件路径、允许 origin、超时、存储空间和配置格式是否已调整。

`policy-descriptor`、通知、其他工具的 `$task.fetch` / `$prefs` 等不能直接使用。脚本输出的 `headers` 数组采用 `{field,value}`，声明式 Map Local 用 `{name,value}`。

## 协议范围

| 协议或内容 | 当前行为 |
| --- | --- |
| 明文 HTTP | 可记录、改写和执行 HTTP 脚本 |
| TLS 1.2/1.3 中的 HTTP/1.1 | 命中 MITM 且客户端信任时可处理 |
| HTTP/2 | `h2: true` 时可 MITM，两端分别协商版本 |
| 直接建立 TLS 的非 HTTP TCP | `tcp: true` 时转发和记录解密字节，不执行 HTTP 规则 |
| WebSocket | 处理 HTTP 握手，升级后透传，不改写帧 |
| SSE / gRPC 等流式内容 | 跳过正文处理，无需正文的规则仍可执行 |
| HTTP/3 / QUIC | 不解密；仅可尝试对命中流促使 TCP 回退 |
| STARTTLS、真实 ECH、客户端证书认证、嵌套 CONNECT | 不在当前解密范围 |

## Android 信任边界

Android 用户 CA、系统 CA 和目标 App 自身的信任不是同一件事。证书页面显示已安装，只能说明当前进程看到相应证书；pinning、自有证书库和工作资料仍可能导致目标连接拒绝。

当前 B-box 已移除旧 Root/eBPF 抓取和 Xposed/LSPosed 路径。MITM 使用设备 Keystore CA；系统证书模块通过 Magisk、KernelSU 或 APatch 安装，不自动注入。

## 版本边界

本站描述[固定提交](./sources.md)中的实现。已有 Release、其他分支或上游相同核心版本号，不保证包含这里的扩展与界面。

如果某字段在安装包中不被识别，先核对版本，再检查 JSON 结构；不要为了通过校验随意删除关键条件。
