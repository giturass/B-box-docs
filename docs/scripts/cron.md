---
description: 在 B-box 本地服务运行期间执行 Cron 定时 JavaScript，配置时区、超时和主动 HTTP 请求。
---

# Cron 定时任务

Cron 按日历表达式触发 JavaScript。它属于 `experimental.scripts.cron`，可以只开脚本，不开 MITM、HTTP 改写或请求记录。

调度仅在 **本地服务成功启动后** 运行。它不是 Android 系统闹钟：停止服务后不执行，设备休眠错过的时间不补跑，也不申请系统唤醒。

## 先验证调度

这个片段每分钟向服务日志写一条消息，无需访问网络：

```json
{
  "experimental": {
    "scripts": {
      "enabled": true,
      "cron": [
        {
          "name": "Cron heartbeat",
          "cron": "* * * * *",
          "timezone": "Asia/Shanghai",
          "timeout_ms": 5000,
          "http_client": { "allowed_origins": [] },
          "source": "console.log('Cron is running'); $done();"
        }
      ]
    }
  }
}
```

成功应用后，保持服务运行，等待下一个分钟边界，在允许 info 等级的服务日志中查找消息。配置保存时不会立即试跑任务。

## 表达式写法

支持五段或六段：

```text
五段：      分 时 日 月 周
六段：   秒 分 时 日 月 周
```

| 表达式 | 含义 |
| --- | --- |
| `0 2 * * *` | 每天 02:00 |
| `*/30 * * * *` | 每小时第 0、30 分钟 |
| `0 9 * * MON-FRI` | 周一到周五 09:00 |
| `*/10 * * * * *` | 每 10 秒，适合短期测试 |

支持范围、列表、步长以及月份/星期名称。填写 IANA 时区，例如 `Asia/Shanghai`。省略时区则使用服务启动时的 Android 时区。

## 主动请求并缓存

下面代码从规则的 `argument` 获取 URL，成功后保存正文。把代码作为 Cron 的 `source`、资源或脚本文件使用。

<<< @/public/examples/cron-cache.js

`$httpClient` 的 `timeout` 是秒，规则 `timeout_ms` 是毫秒。回调、网络和执行共享脚本总时限，不要在发出异步请求后立即 `$done()`。

[下载 Cron 与 HTTP 共享缓存示例](/examples/cron-cache.json)。这个片段每半小时获取测试 API，并让匹配 `/cached` 的请求脚本返回缓存。使用前替换域名、`argument` 和 `allowed_origins`，并配置相应 HTTPS MITM。

## 队列与重复到期

Cron 使用两个 worker，任务按配置顺序进入有界 FIFO。同一个任务已经排队或运行时，重复到期会跳过并记录日志，不会无限叠加。

排队期间不占用执行时限，出队才开始计时。服务重载或停止会取消在途任务、丢弃队列，并等待 worker 退出。启停请求记录不会重置 Cron。

## 容易漏掉的条件

- 页面新建任务默认 `disabled: true`，需要改成 false。
- 外部脚本加载也计入执行时限；首次下载可能比缓存命中慢。
- 脚本各条路径都必须 `$done()`，只写日志也不例外。
- `allowed_origins: []` 会禁止主动联网；这是示例心跳任务的刻意设置。
- Cron 没有 `$request` 或 `$response`，用 `$argument` 和存储传递数据。

继续：[持久存储与共享数据](./storage.md)。
