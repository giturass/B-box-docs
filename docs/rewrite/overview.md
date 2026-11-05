---
description: 选择 B-box HTTP 改写类型，理解请求与响应阶段、首条匹配、范围和失败行为。
---

# 处理顺序与规则选择

HTTP 改写位于 `experimental.http_rewrite`。它适合可以声明清楚的变更：添加头部、替换 URL、修改正文、切换目标服务或直接返回本地内容。

HTTPS 请求需要先命中独立的 [MITM 配置](../mitm/overview.md)。只开启改写不会解密 HTTPS。

## 选择哪种规则

| 目标 | 使用能力 | 命中方式 |
| --- | --- | --- |
| 增删或替换头部 | [Header Rewrite](./headers.md) | 匹配规则按顺序执行 |
| 改 URL、返回 302/307、拒绝请求 | [URL Rewrite](./url-and-remote.md) | 首条匹配规则 |
| 让上游换成另一个地址 | [Map Remote](./url-and-remote.md#map-remote) | 首条匹配规则 |
| 文本替换或修改 JSON 字段 | [Body Rewrite / jq](./body.md) | 匹配规则按顺序执行 |
| 返回固定内容、文件或小图片 | [Map Local](./map-local.md) | 首条匹配规则 |
| 分支判断、主动联网、共享数据 | [JavaScript](../scripts/overview.md) | 每个方向只执行首条匹配脚本 |

## 完整处理顺序

| 阶段 | 按顺序执行 |
| --- | --- |
| 请求 | Header → URL → Map Remote → Body / jq → 请求脚本 → Map Local |
| 上游 | 没有提前生成响应时，向最终目标发出请求 |
| 响应 | Header → Body / jq → 响应脚本 |

由重定向、拒绝、请求脚本 Mock 或 Map Local 生成的本地响应，仍会进入响应处理阶段。例如，Map Local 返回 JSON 后，可以继续由响应 jq 和响应脚本处理。

请求脚本生成 Mock 会提前结束请求阶段，后面的 Map Local 不再执行。URL `header` 与 Map Remote 同时匹配时，Map Remote 决定最终目标。

## 最小结构

```json
{
  "experimental": {
    "http_rewrite": {
      "enabled": true,
      "header_rewrite": [
        {
          "name": "Add a response marker",
          "pattern": "^http://demo\\.bbox\\.test/",
          "phase": "response",
          "operation": "add",
          "header": "X-Rewritten",
          "value": "B-box"
        }
      ]
    }
  }
}
```

这是片段。已有 `http_rewrite` 时，把规则追加到其数组中，保留其他规则；不要覆盖[入门演示](../guide/quick-start.md)中的 Map Local。

## URL 匹配什么

规则的 `pattern` 是正则表达式，匹配完整 URL，包含协议、路径和查询参数。依次尝试：

1. 原始完整 URL。
2. 替换为可见 Host 的 URL。
3. 替换为底层连接域名的 URL。

任一候选命中即可，请求与响应阶段使用同一组候选。URL 替换使用实际命中的候选；脚本中的 `$request.url` 则是前序规则处理后的值。

例如 `/profile$` 不匹配 `/profile?page=1`。需要允许查询参数时，可以用 `/profile(?:\?.*)?$`，放进 JSON 则写成 `/profile(?:\\?.*)?$`。

## 范围与开关

`ports` 默认是 `80`、`443`、`8080`、`8443`，按**原始目的端口**判断；`packages` 为空表示不限制应用。范围与 MITM、脚本、记录分别设置。

规则可添加 `name` 便于日志识别，`disabled: true` 表示停用。所有新建页面示例默认禁用，确认改好后再启用。

## 出错时会发生什么

| 情况 | 行为 |
| --- | --- |
| jq 执行/输入错误、超时、无输出或超限 | 保留该规则执行前的正文；错误会告警，无输出保持原文 |
| 脚本未捕获异常、超时或源码加载失败 | 保留前序处理后的报文，记录告警；不改跑下一条脚本 |
| 非法 `$done`、分帧错误、正则处理错误、上游失败 | 返回 502 |
| 需要处理的请求正文超过上限 | 返回 413 |
| 响应正文超过处理上限 | 回放已读前缀并继续转发，跳过正文处理 |

处理不改变正常的核心路由语义。跨 origin 改写会重新进入同一核心进行路由选择，保留来源与应用归属，没有设备直连回退。

规则组合示例见[可下载示例](../examples/index.md)。
