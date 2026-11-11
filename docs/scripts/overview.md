---
description: 创建 B-box JavaScript 脚本，了解独立开关、HTTP 与 Cron、代码来源和执行结束规则。
---

# 第一条脚本

JavaScript 用于表达声明式规则难以完成的逻辑，例如按请求内容分支、动态 Mock、主动请求接口或保存数据。脚本位于独立的 `experimental.scripts` 中。

脚本不依赖 `http_rewrite.enabled`，也不依赖请求记录开关。处理 HTTPS 时仍需要另行启用并匹配 MITM。

## 一个最小动态响应

把以下片段合并进配置，将域名换成实际目标。HTTP 明文可以直接处理；HTTPS 先[准备 MITM](../mitm/overview.md)。

```json
{
  "experimental": {
    "scripts": {
      "enabled": true,
      "http": [
        {
          "name": "Hello from script",
          "pattern": "^https?://api\\.example\\.test/hello$",
          "phase": "request",
          "timeout_ms": 5000,
          "source": "$done({response:{status:200,headers:{'Content-Type':'application/json'},body:JSON.stringify({ok:true,method:$request.method})}});"
        }
      ]
    }
  }
}
```

命中 GET 请求后，预期返回 `{"ok":true,"method":"GET"}`。这里生成的是新响应，不需要读取上传正文，所以不必开启 `requires_body`。

想接着[入门演示](../guide/quick-start.md)试用，可以把模式改为 `^http://demo\\.bbox\\.test(?::80)?/hello$`（JSON 字符串中的写法）。请求脚本会先于 Map Local 返回，响应来源随之改变。

## HTTP 与 Cron

| 类型 | 触发时机 | 可用上下文 |
| --- | --- | --- |
| `http` + `phase: request` | 匹配的 HTTP 请求阶段 | `$request` |
| `http` + `phase: response` | 匹配的 HTTP 响应阶段 | `$request`、`$response` |
| `cron` | 本地服务运行期间，日历表达式到期 | `$cronexp`、`$script`，没有请求/响应对象 |

同一个请求方向只执行 **首条匹配脚本**。把特殊规则放在宽泛规则前面；第一条失败不会尝试第二条。

## 三种代码来源

| 字段 | 用法 |
| --- | --- |
| `source` | 内联 JavaScript 字符串 |
| `resource` | 引用 `scripts.resources` 字典中的源码资源 |
| `script_path` | 相对实际配置目录的文件路径，或 HTTP(S) URL |

每条脚本只选一种，源码不设固定容量上限。较长脚本可以通过资源页导入文件或使用 URL，详见[文件与远程资源](../reference/resources.md)。

## 每次都要调用 `$done`

`$done()` / `$done({})` 保留当前报文并结束执行；`$done({...})` 提交变更并结束。即使只输出日志、只读存储或只做网络请求，也需要在所有完成路径调用它。

`$done` 会终止本次执行，并取消在途网络和定时器。不要在它之后安排需要完成的工作。异步网络应在回调中结束脚本，不能在发起请求后立即 `$done()`。

## 默认执行条件

每次执行使用独立 Goja JavaScript 环境，不设固定解释器数量配额。`timeout_ms` 缺省或为 `0` 时，总时限为 5000 毫秒；正整数设置毫秒期限，`-1` 不增加期限。资源加载、网络、定时器和执行共享该期限及服务取消。

拦截正文与输出默认不设大小上限，可通过 `scripts.max_body_bytes` 或单条 HTTP 规则的同名字段设置；主动 HTTP 使用独立限额。见[默认值与限制](../reference/limits.md)。

没有 Node.js、DOM、通知或完整 Surge 环境。标准 JavaScript 语法可以使用，但外部脚本依赖的宿主 API 必须逐项核对[脚本 API](./api.md)。

下一步：[请求、响应与动态 Mock](./http.md) · [Cron 定时任务](./cron.md)。
