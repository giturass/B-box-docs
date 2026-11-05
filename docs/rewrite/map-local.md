---
description: 用 Map Local 返回固定 JSON、Base64、小图片、本地文件或远程缓存资源，创建 API Mock。
---

# Map Local / API Mock

Map Local 在命中后直接生成本地响应，适合固定 API 返回值、测试页面与静态资源。规则位于 `experimental.http_rewrite.map_local`，首条匹配生效。

## 返回一个 JSON

```json
{
  "experimental": {
    "http_rewrite": {
      "enabled": true,
      "map_local": [
        {
          "name": "Mock status API",
          "pattern": "^https?://api\\.example\\.test/status$",
          "status": 200,
          "headers": [
            { "name": "Content-Type", "value": "application/json" }
          ],
          "data_type": "text",
          "data": "{\"ok\":true,\"source\":\"Map Local\"}"
        }
      ]
    }
  }
}
```

预期返回指定 JSON，无需上游生成内容。`data` 是字符串，所以内层 JSON 引号必须转义。HTTPS 仍需要启用并匹配 MITM、准备好 CA。

## 字段速查

| 字段 | 说明 |
| --- | --- |
| `pattern` | 完整 URL 正则 |
| `status` | 默认 200，允许 200～999；日常使用标准 HTTP 状态码即可 |
| `headers` | `{name,value}` 数组，可保留重复字段 |
| `data_type` | `text`、`base64`、`tiny-gif`、`file`；省略按 text 兼容处理 |
| `data` | 文本、Base64，或 `file` 类型的路径/URL |
| `resource` | 引用同一 `http_rewrite.resources` 中的命名资源 |

`resource` 与 `data` / `data_type` 互斥。不要把两种内容来源写在同一规则里。

## 复用资源

```json
{
  "experimental": {
    "http_rewrite": {
      "enabled": true,
      "map_local": [
        {
          "pattern": "/status$",
          "resource": "status.json",
          "headers": [
            { "name": "Content-Type", "value": "application/json" }
          ]
        }
      ],
      "resources": {
        "status.json": {
          "data_type": "text",
          "data": "{\"ok\":true}"
        }
      }
    }
  }
}
```

这里 `/status$` 是简化路径匹配，会覆盖范围内所有以该路径结束的 URL。实际使用时建议加上明确域名。

## 图片与文件

返回内置透明小 GIF，可使用单条规则：

```json
{
  "pattern": "^https?://api\\.example\\.test/pixel$",
  "data_type": "tiny-gif"
}
```

读取文件或远程缓存，则将资源定义为：

```json
{
  "data_type": "file",
  "data": "https://resources.example.test/status.json",
  "update_interval": 86400
}
```

这是一条放进 `resources` 字典的资源对象。`file` 同时支持相对配置目录的文件路径和 HTTP(S) URL；更新间隔属于资源对象。路径、缓存和失败行为见[文件与远程资源](../reference/resources.md)。

## 和其他规则一起使用

请求 Header、URL、Map Remote、Body 和请求脚本都排在 Map Local 之前。请求脚本已经生成 Mock 时，不再运行 Map Local。

Map Local 生成的响应仍经过响应 Header、Body/jq 和响应脚本。因此在固定模板上做二次变更是可行的。

HTTP 离线 Mock 可以不连接上游。HTTPS 仅在确定按 HTTP 处理且启用 HTTP 规则时采用支持离线 Mock 的握手路径；纯 MITM、原始 TCP 和待识别的无 ALPN 流仍可能先连接上游，不能据此推断所有 TLS 流都能离线使用。

需要分支判断或根据请求生成内容时，使用[脚本动态 Mock](../scripts/http.md#动态-mock)。
