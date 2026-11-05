---
description: 为 B-box 请求和响应添加、删除、替换 Header，正确处理重复字段、Host 和分帧头。
---

# Header Rewrite

在 `experimental.http_rewrite.header_rewrite` 中设置头部规则。`phase` 为 `request` 或 `response`，匹配规则按数组顺序执行。

## 添加一个请求头

```json
{
  "experimental": {
    "http_rewrite": {
      "enabled": true,
      "header_rewrite": [
        {
          "name": "Mark debug traffic",
          "pattern": "^https://api\\.example\\.test/",
          "phase": "request",
          "operation": "add",
          "header": "X-Debug",
          "value": "B-box"
        }
      ]
    }
  }
}
```

将域名换成目标服务，并配置该域名的 MITM。预期发给上游的请求包含 `X-Debug: B-box`。想修改返回客户端的响应，就把 `phase` 改为 `response`。

## 四种操作

| `operation` | 字段 | 效果 |
| --- | --- | --- |
| `add` | `header`、`value` | 追加一项，保留重复字段 |
| `delete` | `header` | 删除该字段 |
| `replace` | `header`、`value` | 只替换已存在字段，不自动新增 |
| `replace_regex` | `header`、`regex`、`replacement` | 按正则替换已有字段值 |

**覆盖或新增一个普通字段**，可以先 `delete` 再 `add`，避免重复头。只用 `replace`，字段原本不存在时不会出现新值。

## 删除后设置确定的值

下面是 `header_rewrite` 数组中的两条规则，依次执行：

```json
[
  {
    "pattern": "^https?://api\\.example\\.test/",
    "phase": "response",
    "operation": "delete",
    "header": "Cache-Control"
  },
  {
    "pattern": "^https?://api\\.example\\.test/",
    "phase": "response",
    "operation": "add",
    "header": "Cache-Control",
    "value": "no-store"
  }
]
```

预期响应只使用新设定的 `Cache-Control` 值。缓存策略还可能受客户端自身行为影响。

## 正则替换字段值

下面是一条规则对象，放入 `header_rewrite` 数组：

```json
{
  "pattern": "^https?://api\\.example\\.test/",
  "phase": "request",
  "operation": "replace_regex",
  "header": "User-Agent",
  "regex": "DemoApp/[0-9.]+",
  "replacement": "DemoApp/2.0"
}
```

## Host 与受保护的字段

请求 `Host` 只允许 `replace` / `replace_regex`。要改变实际请求目的地，通常使用 [URL Rewrite 或 Map Remote](./url-and-remote.md)；单独修改 Host 不能等同于切换网络目标。

以下分帧与升级字段由引擎管理，不允许手动改写：`Content-Length`、`Transfer-Encoding`、`Trailer`、`Connection`、`Proxy-Connection`、`Upgrade`。改变正文后，引擎会重算相应长度和元数据。

重复响应头由 HTTP 转发保留。脚本需要处理重复头时，可开启 [`full_headers`](../scripts/http.md#保留重复头)。
