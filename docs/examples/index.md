---
description: 下载 B-box 的 HTTP Mock、MITM、改写、JavaScript 和 Cron 示例，并正确合并进 sing-box JSON。
---

# 可下载示例

这些示例使用保留测试域名，没有真实订阅、账户或凭据。除第一项外，均为**配置片段**，需要合并进已有 sing-box JSON。

## 配置下载

| 示例 | 类型 | 用途 |
| --- | --- | --- |
| [http-lab.json](/examples/http-lab.json) | 完整演示配置 | 本机 2080 代理，HTTP Map Local；无需 CA、DNS 或上游服务器 |
| [mitm.json](/examples/mitm.json) | `experimental.mitm` 片段 | 开启一个 HTTPS 域名的解密 |
| [rewrite.json](/examples/rewrite.json) | `experimental.http_rewrite` 片段 | Header、URL、Map Remote、jq 和 Map Local |
| [http-scripts.json](/examples/http-scripts.json) | `experimental.scripts` 片段 | 动态 Mock 与响应 JSON 改写；内嵌源码 |
| [cron-cache.json](/examples/cron-cache.json) | `experimental.scripts` 片段 | Cron 获取响应，HTTP 脚本读取同一缓存 |

浏览器可能直接显示 JSON，可使用浏览器保存或复制内容。

## JavaScript 文件

| 文件 | 使用条件 |
| --- | --- |
| [response.js](/examples/response.js) | 响应阶段，`requires_body: true` |
| [dynamic-mock.js](/examples/dynamic-mock.js) | 请求阶段，直接返回 Mock |
| [cron-cache.js](/examples/cron-cache.js) | Cron，配置 `argument` 和存储命名空间 |

这些文件是对应 JSON 内嵌源码的可读版本。使用 `http-scripts.json` 不需要额外下载 JavaScript 文件；要改成 `script_path`，遵守[资源路径规则](../reference/resources.md)。

## 合并时检查四项

1. 顶层只保留一个 `experimental`，MITM、HTTP 改写、脚本保持平级。
2. 已有同名规则数组时合并内容，保留顺序；不要直接覆盖订阅的入站、出站和路由。
3. 替换域名、映射地址、`argument` 与 `allowed_origins`；HTTPS 单独准备 CA 和 MITM 范围。
4. 成功保存并应用到正在运行的本地服务，再发出新请求验证。

下载示例的开关已按演示目的开启。应用内通过“新增”创建的样例则默认禁用，需要编辑 `disabled`。两种来源不要混淆。

## 查看规则组合

下面是 `rewrite.json` 的实际下载内容：

<<< @/public/examples/rewrite.json

## 查看 Cron 共享缓存

Cron 每小时第 0、30 分钟尝试刷新。未获取缓存前，HTTP 脚本会继续请求路径，不伪造“缓存成功”。首次运行不会立即触发 Cron。

<<< @/public/examples/cron-cache.json

示例的 JSON 语法与站内引用由文档站检查。具体 App 运行依赖 B-box 版本、核心路由、证书和目标服务，建议从[第一条请求](../guide/quick-start.md)逐步验证。
