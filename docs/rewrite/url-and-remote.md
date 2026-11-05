---
description: 使用 URL Rewrite 透明改写、返回重定向或拒绝请求，用 Map Remote 切换上游并选择是否保留 Host。
---

# URL Rewrite 与 Map Remote

两者都能改变请求目标，但需要先判断：你希望客户端看到重定向，还是让 B-box 在转发时替换目标。

## URL Rewrite

规则放在 `experimental.http_rewrite.url_rewrite`，仅首条匹配生效。

| `action` | 行为 |
| --- | --- |
| `header` | 透明改写目标 URL 并更新 Host，客户端不需要跟随 3xx |
| `302` | 返回临时重定向 |
| `307` | 返回临时重定向，客户端按 HTTP 语义保留方法和正文 |
| `reject` | 返回 403 |

### 返回 307

```json
{
  "experimental": {
    "http_rewrite": {
      "enabled": true,
      "url_rewrite": [
        {
          "name": "Move old API",
          "pattern": "^https://api\\.example\\.test/old$",
          "action": "307",
          "replacement": "https://api.example.test/new"
        }
      ]
    }
  }
}
```

预期客户端先收到 307 与 `Location`，是否继续请求由客户端决定。没有包含查询参数的模式不会匹配 `/old?x=1`；需要保留参数时，在模式中捕获并写入替换模板。

### 透明替换路径

下面是一条 `url_rewrite` 规则：

```json
{
  "pattern": "^https://api\\.example\\.test/v1/(.*)$",
  "action": "header",
  "replacement": "https://api.example.test/v2/$1"
}
```

`$1` 使用捕获组内容。替换后必须是合法的绝对 HTTP(S) URL；这里的 `(.*)` 也会捕获后面的查询字符串。

`header` 还支持 `ws://` 目标，保留已有 Upgrade 头，通过 HTTP 传输建立 WebSocket。升级后连接透传，只处理和记录 HTTP 握手，不改写 WebSocket 帧。

### 拒绝匹配请求

```json
{
  "pattern": "^https://api\\.example\\.test/telemetry/",
  "action": "reject"
}
```

当前支持的 URL 动作为上表四种，不能直接照搬其他工具中的 `reject-200` 等动作名。

## Map Remote

规则放在 `experimental.http_rewrite.map_remote`，首条匹配生效。适合把某组接口送往测试服务器。

```json
{
  "experimental": {
    "http_rewrite": {
      "enabled": true,
      "map_remote": [
        {
          "name": "Use staging backend",
          "pattern": "^https://api\\.example\\.test/(.*)$",
          "replacement": "https://staging.example.test/$1",
          "preserve_host": false
        }
      ]
    }
  }
}
```

默认更新 Host 为新目标。只有新上游明确要求原 Host 时，才设置 `preserve_host: true`。它保留的是 HTTP Host，并不把新目的地变回原服务器。

当 URL `header` 与 Map Remote 同时命中时，Map Remote 在后执行，决定最终目标。匹配候选仍按[统一 URL 匹配规则](./overview.md#url-匹配什么)处理。

## 路由与 TLS

同 origin 请求保留原出站与网络选项。跨 origin 时重新进入当前核心路由，保留原入站、来源和应用归属，并防止递归改写；失败不会回退设备直连。

请求记录中的出站、路由字段属于原连接。不要只根据该字段判断映射后的新目标实际使用了哪个出站。

## 网关模板

302/307 的 `replacement` 支持 `{{{GATEWAY_ADDRESS}}}`，用于运行中核心的默认接口网关，IPv6 会加方括号。没有可用网关时跳过该规则。

这是重定向模板的特定能力，不是任意 JSON 字段都支持的变量系统。
