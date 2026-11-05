---
description: 用 B-box HTTP 脚本修改请求、响应和 JSON，处理重复 Header、二进制正文与动态 Mock。
---

# 请求、响应与动态 Mock

脚本配置决定能读取哪一阶段的数据；返回给 `$done` 的对象决定提交哪些变更。直接修改上下文对象后，仍应通过 `$done` 返回需要提交的字段。

## 修改响应 JSON

下面脚本适用于 `phase: response`、`requires_body: true` 的 HTTP 规则。它只改写 JSON 对象，解析失败或返回数组、基本值时保持原文。

<<< @/public/examples/response.js

对应的完整脚本配置片段可以直接下载，源码已内嵌在 `resources` 中，不需要另放文件：

[下载 HTTP 脚本配置](/examples/http-scripts.json)

<<< @/public/examples/http-scripts.json

把 `api.example.test` 替换为实际域名，确认当前服务启用脚本；HTTPS 同时启用独立 MITM。命中 `/profile` 后，预期响应 JSON 包含 `debug: true` 和 `source: "B-box"`。

JavaScript 的 `JSON.parse` 使用 JS 数值，超出安全整数范围时可能丢精度。需要保留大整数的 JSON 变更，可以优先使用 [jq](../rewrite/body.md)。

## 修改请求 JSON

规则需要 `phase: request` 和 `requires_body: true`。下面代码作为 `source`、资源内容或脚本文件使用：

```js
const body = JSON.parse($request.body);
body.debug = true;
$done({ body: JSON.stringify(body) });
```

这一简化例子假设请求正文是 JSON 对象。输入不满足时会产生异常，脚本不提交修改并记录告警；需要自定义兜底时像响应示例一样捕获解析错误。

## 动态 Mock

请求阶段可以通过 `response` 直接生成新响应：

<<< @/public/examples/dynamic-mock.js

生成 `response.body` 不要求读取请求正文，因此无需 `requires_body`。若返回的是顶层 `body`，它表示替换当前请求正文，必须开启 `requires_body`。

Mock 生成后仍会经过响应 Header、Body/jq 和首条匹配响应脚本。后续 Map Local 与上游请求不会继续执行。

## 保留重复头

默认 `headers` 是对象，每个字段只提供第一个值。需要保留多条 `Set-Cookie` 等字段时，在规则上设置 `full_headers: true`，使用 `{field,value}` 数组：

```js
const headers = $response.headers;
headers.push({ field: "X-Script", value: "B-box" });
$done({ headers });
```

这段代码对应响应脚本；不读正文时可不设 `requires_body`。返回头接受对象或完整头数组，但不能改动分帧/升级字段。

注意：脚本数组使用 `field`；声明式 Map Local 的头数组使用 `name`，两者写法不同。

## 二进制正文

设置 `binary_body: true` 后，拦截正文以 `Uint8Array` 提供。需要读取或替换它仍要 `requires_body: true`，返回相应字节数组。

脚本主动 HTTP 请求的二进制选项名是 **`binary-mode`**，它控制网络回调的 `data`；不是配置字段 `binary_body`。两者作用范围不同。

SSE、gRPC、升级连接等[跳过正文处理的场景](../rewrite/body.md#哪些正文会跳过)不会因为启用二进制模式就变成可整体改写的正文。

## 可返回字段

| 阶段 | `$done` 接受的字段 |
| --- | --- |
| 请求 | `url`、`method`、`headers`、`body`、`response`、`abort` |
| 响应 | `status`、`headers`、`body`、`abort` |
| 请求 Mock 的 `response` | `status`、`headers`、`body` |

`abort: true` 当前通过 502 结束处理，不表示静默丢弃。Mock 状态码支持 200～999；分帧错误、非法结果或不允许的字段会失败。不能人为生成 101 升级或为 HEAD/204/205/304 发送不允许的正文。

## 从哪里排错

先核对 `enabled`、`disabled`、原始端口、应用、URL 模式和脚本顺序，再看服务日志。请求记录里的正文可能只是预览前缀；正文超过脚本限额时，不应将预览可见误判成整段正文可用于脚本。

超时或未捕获异常会保留 **前序规则已经处理后的报文**，不会回滚前面完成的 Header、Body 或 jq。详细行为见[处理顺序](../rewrite/overview.md)。
