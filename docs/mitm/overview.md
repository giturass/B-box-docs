---
description: 在 B-box 开启 HTTPS MITM，理解证书、域名匹配、HTTP/2、TCP 解密与 QUIC 回退的条件。
---

# 开启 HTTPS 解密

MITM 让 B-box 在指定连接上终止客户端 TLS，再按配置连接上游。HTTP 改写和 HTTP 脚本处理 HTTPS 之前，需要先经过这一步。

## 启用前的三个条件

1. 目标请求经过 B-box **本地服务**，并进入可处理的 TCP/TLS 连接。
2. 已生成有效 CA，且目标客户端信任它。
3. `experimental.mitm.enabled` 为 `true`，实际域名命中 `hosts` 以及可选端口、应用筛选。

如果只需要明文 HTTP 改写或 Cron 主动请求，不需要开启 MITM。

## 最小配置

先完成[证书准备](./certificate.md)，再将以下片段合并进自己的 sing-box 配置。把 `api.example.test` 换成目标域名。

[下载 MITM 配置片段](/examples/mitm.json)

<<< @/public/examples/mitm.json

保存并确认配置应用成功，让目标客户端重新建立连接。需要查看结果时，再到 **工具 → 请求** 开始记录并发出新请求。

## 页面选项和 JSON 对应关系

| 选项 | 字段 | 默认 | 使用说明 |
| --- | --- | --- | --- |
| 解密 HTTPS | `enabled` | `false` | MITM 总开关 |
| 解密域名 | `hosts` | 空列表 | 空列表不解密；支持有序排除与通配符 |
| HTTP/2 MITM | `h2` | `false` | 开启后两端分别协商 HTTP 版本；可能一端 h2、一端 HTTP/1.1 |
| 跳过服务器证书校验 | `skip_server_cert_verify` | `false` | 只影响 B-box 对上游的校验，不能让目标 App 信任 B-box CA |
| 解密非 HTTP TLS/TCP | `tcp` | `false` | 允许转发并记录解密后的非 HTTP TLS 字节流 |
| QUIC 请求 TCP 回退 | `block_quic` | `true` | 对命中范围且能观察到名称的 QUIC 尝试促使客户端改用 TCP |

`ports` 和 `packages` 可在 JSON 中追加，分别限制原始目的端口和应用；它们与 `hosts` 取交集。见[域名与范围匹配](./hosts.md)。

## TCP 解密不是 HTTP 改写

开启 `tcp` 后，确定为非 HTTP 的 TLS 内容按字节流转发，记录标为 `TLS/TCP`，可查看两个方向的有界正文前缀。这类流没有 HTTP 状态码、Header 或 Cookie，不执行 HTTP 改写和 HTTP 脚本，也不能导出 HAR/cURL。

没有 ALPN 时，开启 TCP 解密会先识别完整 HTTP/1.x 请求行；识别为 HTTP 的流仍可进入正常 HTTP 处理。

## HTTP/3 与 QUIC

B-box 不解密 HTTP/3。`block_quic` 只在 MITM 已启用、域名/端口/应用匹配且能恢复名称时拒绝对应 QUIC，尝试让客户端回退 TCP。它不阻断所有 UDP，也不保证客户端一定回退。

记录列表出现“仅域名”不代表解密成功；提取域名与 MITM 是独立能力。

## 支持边界

支持 TLS 1.2/1.3、HTTP/1.1 和可选 HTTP/2。任意私有加密协议、STARTTLS、真实 ECH、客户端证书认证和嵌套 CONNECT 不在当前解密范围内。

有证书固定校验或自有信任库的 App 可能拒绝连接。此时可将域名排除，或在目标客户端的受控测试环境中配置对应信任；安装系统 CA 也不等于所有 App 都会接受。

下一步：[域名与范围匹配](./hosts.md) · [记录、详情与导出](./capture.md)。
