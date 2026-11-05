---
description: 用正则或 jq 改写请求和响应正文，理解 JSON 转义、压缩解码、流式跳过与正文大小限制。
---

# Body Rewrite 与 jq

正文规则放在 `experimental.http_rewrite.body_rewrite`，可处理请求或响应。每条规则选择 **`regex` + `replacement`** 或 **`jq`**，不能混用；多条匹配规则按数组顺序执行。

## 修改 JSON 字段

```json
{
  "experimental": {
    "http_rewrite": {
      "enabled": true,
      "body_rewrite": [
        {
          "name": "Enable debug field",
          "pattern": "^https://api\\.example\\.test/profile(?:\\?.*)?$",
          "phase": "response",
          "jq": ".debug = true | .source = \"B-box\""
        }
      ]
    }
  }
}
```

HTTPS 需要配置独立 MITM。上游返回 `{"debug":false}` 时，预期客户端得到包含 `"debug":true` 和 `"source":"B-box"` 的 JSON。

### 常用 jq 表达式

| 操作 | 表达式 |
| --- | --- |
| 设置字段 | `.debug = true` |
| 修改嵌套字段 | `.data.mode = "test"` |
| 删除字段 | `del(.debug)` |
| 修改数组项 | `.items \|= map(.enabled = true)` |
| 组合多步 | `del(.debug) \| .source = "B-box"` |

jq 接收完整 JSON 值，支持对象、数组和其他 JSON 类型，并保留大整数。多个输出用换行连接；`empty` 等无输出表达式保持原文，不会把正文变为空字符串。

非法 JSON、jq 表达式错误、运行失败、超时或超限会跳过该规则并告警。底层使用 gojq；不提供外部模块、文件、环境变量或外部输入加载。

## 替换普通文本

下面是一条 `body_rewrite` 规则对象：

```json
{
  "name": "Replace response text",
  "pattern": "^https?://api\\.example\\.test/message$",
  "phase": "response",
  "regex": "old-value",
  "replacement": "new-value"
}
```

`pattern` 匹配 URL，`regex` 匹配正文，两个字段不要写反。要处理上传内容，把 `phase` 改成 `request`。

## 正则与转义

普通表达式使用 RE2，扩展语法回退到带限额的回溯引擎。支持前后查找及正则内部数字/命名反向引用，替换模板支持 `$1`、`${name}` 和 `$$`。

例如正文正则 `(?<=token=)([a-z]+)-\1(?=&|$)` 可以匹配 `token=abc-abc&` 中的 `abc-abc`。在 JSON 中需要写成：

```json
{
  "pattern": "/message$",
  "phase": "response",
  "regex": "(?<=token=)([a-z]+)-\\1(?=&|$)",
  "replacement": "checked"
}
```

正文 `^` / `$` 按行匹配。复杂回溯有时间与工作预算限制，不支持从右向左模式。正则执行错误与 jq 跳过规则的行为不同，可能产生 502。

## 哪些正文会跳过

流式或不适合整体缓冲的内容会跳过正文处理：SSE、gRPC/grpc-web、NDJSON、JSON sequence、multipart/x-mixed-replace、协议升级、HEAD 和 206 响应。无需正文的规则仍可执行。

支持 identity、gzip/x-gzip、deflate、br、zstd，最多三层编码。不支持/无效编码或非 UTF-8 文本保留原文。需要处理二进制时，查看脚本的[二进制正文模式](../scripts/http.md#二进制正文)。

## 正文限额

| 字段 | 默认 | 最大 |
| --- | --- | --- |
| `max_request_body_bytes` | 32 MiB | 32 MiB |
| `max_response_body_bytes` | 1 MiB | 10 MiB |

字段放在 `http_rewrite` 对象中，不放进单条正文规则。压缩前后及输出均受限；请求超过处理上限返回 413，响应超限回放已读部分并继续转发。

改写成功后引擎移除旧压缩、摘要、ETag、范围和 trailer 元数据，并重算 Content-Length。无需手动补长度头。

如果后面还有脚本，脚本读到的是这些正文规则处理后的结果。见[完整执行顺序](./overview.md#完整处理顺序)。
