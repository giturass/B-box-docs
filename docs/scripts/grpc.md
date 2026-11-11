---
description: 为已知的一元 gRPC 与 gRPC-Web 方法配置 B-box 二进制脚本，处理单消息帧、压缩和 trailers。
---

# 一元 gRPC 正文脚本

B-box 可以对**已知的一元 RPC 方法**启用正文脚本。一元调用只有一个请求消息和一个响应消息；流式 RPC 可能持续发送消息，不能套用这个模式。

## 启用条件

在 `scripts.http` 的单条规则中同时设置：

```json
{
  "requires_body": true,
  "binary_body": true,
  "grpc_mode": "unary"
}
```

这是规则字段片段，仍需配置精确的 URL `pattern`、请求或响应 `phase`，以及一种源码来源。HTTPS 需要独立 MITM 与客户端信任；原生 gRPC 通常使用 HTTP/2，保持 `h2: true`。

Content-Type 不包含一元/流式调用信息，需要根据目标服务的接口定义确定范围。默认 gRPC 正文透传，普通 Body Rewrite/jq 不直接处理消息分帧。

## 脚本拿到的是什么

脚本的 `body` 是 `Uint8Array`，包含**完整单消息帧**：

| 字节位置 | 含义 |
| --- | --- |
| 第 0 字节 | 压缩标记：0 为未压缩，1 为压缩消息 |
| 第 1～4 字节 | 大端序消息长度 |
| 第 5 字节起 | Protobuf 或其他消息内容 |

不能直接把整个帧当作 Protobuf 消息。`grpc-encoding: gzip/deflate` 的压缩消息会经过完整性与限额检查，但消息解析仍由脚本负责。gzip 消息可对 `frame.subarray(5)` 使用 [`$utils.ungzip`](./api.md#gzip-解压工具)；其他消息解码器需由脚本提供。

替换正文时同样返回完整消息帧，并更新长度和压缩标记。输出未压缩消息时将第 0 字节设为 0。HTTP `Content-Encoding` 与消息 `grpc-encoding` 是不同层次。

## 一个最小响应改写

假设受控测试服务的 `example.Settings/Get` 是一元方法，响应消息定义为：

```proto
message Reply {
  bool enabled = 1;
}
```

下面脚本用 `enabled: true` 替换响应消息，字节 `08 01` 是该字段的 Protobuf 编码。这个演示会替换整条消息，只适用于上述测试结构：

<<< @/public/examples/grpc-unary.js

[下载 gRPC 配置片段](/examples/grpc-scripts.json)，内嵌了同一脚本，无需额外放置文件：

<<< @/public/examples/grpc-scripts.json

将 `grpc.example.test` 和方法路径改为实际测试接口，合并进已有 `experimental`，准备 CA 后应用。示例为该规则选择了 1 MiB 正文限额与 5000 ms 执行期限，不代表全局默认值。

## gRPC-Web 与状态信息

支持原生 `application/grpc` / `application/grpc+*`、二进制 `application/grpc-web[+*]` 和 `application/grpc-web-text[+*]`。

gRPC-Web 的尾部状态帧由传输层保留；text 形式在进入脚本前解码 Base64，返回后恢复编码并追加原尾帧。脚本仍只处理上面的单消息帧格式。

改写保留真实的 HTTP trailers 和 gRPC-Web 尾帧，包括 `grpc-status`、`grpc-message` 及状态详情。改正文不会自动把失败 RPC 变成成功，示例也不伪造成功状态。

## 跳过与失败

无消息、多消息、损坏分帧、不支持的压缩或响应超过用户限额时，跳过脚本并保留原文，日志会记录原因。请求正文或解压消息超过用户限额仍返回 413；非法输出会被拒绝转发。

`$done()`、异常等没有提供替换正文时，保留原有压缩和传输字节。该模式必须等完整正文后才能处理，误用于流式调用会等待流结束；不要按整个域名泛化启用。

协议和实现依据见[资料来源与版本](../reference/sources.md)。
