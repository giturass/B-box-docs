---
description: B-box 脚本宿主 API 参考，包括上下文、$done、$httpClient、$utils.ungzip、联网限制、定时器和日志。
---

# 脚本 API

本页列出当前 B-box 提供的宿主接口。脚本运行在 Goja 中，不能因语法像浏览器或 Surge 就默认存在同名 API。

## 上下文与结束执行

| 对象 / 接口 | 内容 |
| --- | --- |
| `$request` | `url`、`method`、`headers`、`id`；请求阶段、`requires_body: true` 且正文非空时才有 `body` |
| `$response` | 响应阶段的 `status`、`headers`；`requires_body: true` 且正文非空时才有 `body` |
| `$argument` | 非空的 `argument` 字符串；未配置或为空时不注入这个全局 |
| `$script` | `name`、`type`、`binaryBodyMode`、`startTime`、`sessionID`；时间单位为 Unix 秒，sessionID 每次执行独立生成 |
| `$cronexp` | Cron 原表达式，仅 Cron 可用 |
| `$done()` / `$done({})` | 保持当前报文并结束；带对象时提交相应结果 |

`$script.type` 为 `http-request`、`http-response` 或 `cron`。响应阶段的 `$request` 不包含上传正文；Cron 不提供 `$request` / `$response`，HTTP 与 Cron 都不注入 `$trigger`。可用 `typeof $argument === "undefined"` 检查缺省参数。

## `$httpClient`

支持 `get`、`post`、`put`、`patch`、`delete`、`head`、`options`，参数是 URL 字符串或选项对象，第二个参数是回调。

```js
$httpClient.get(
  { url: "https://api.example.test/status", timeout: 4 },
  function (error, response, data) {
    if (error) {
      console.warn(error);
      $done();
    }
    console.log("HTTP status:", response.status);
    $done();
  }
);
```

| 回调参数 | 成功 | 失败 |
| --- | --- | --- |
| `error` | `null` | 错误字符串 |
| `response` | 含 `status` / `headers` 的对象 | `null` |
| `data` | 默认 UTF-8 字符串 | `undefined` |

HTTP 4xx/5xx 是已收到的 HTTP 响应；需要脚本自己检查 `response.status`。网络、解码或大小限制错误才通过 `error` 返回。

### 请求选项

| 选项 | 默认与含义 |
| --- | --- |
| `url` | 必须是 HTTP(S) URL |
| `headers` | 对象或 `{field,value}` 数组 |
| `body` | 字符串、JSON 对象/数组或 TypedArray 子视图；对象自动序列化，并在缺少时设置 JSON Content-Type |
| `timeout` | 秒，默认 5；接受可表示为 duration 的正数，`-1` 不增加期限，仍受脚本总时限约束 |
| `auto-redirect` | 默认 true，检测重定向循环，不设固定跳数配额 |
| `auto-cookie` | 默认 true，Cookie 仅在本次脚本执行内共享 |
| `binary-mode` | 默认 false，开启后 `data` 为 Uint8Array |
| `full-header-mode` | 默认 false，开启后响应头以 `{field,value}` 数组保留重复字段 |
| `insecure` | 默认 false，仅影响该请求的服务器证书校验 |
| `policy` | 当前 sing-box 实例中真实存在的 outbound tag，可包含 selector |

带连字符的选项作为 JavaScript 对象键时需要引号，例如 `{ "auto-redirect": false }`。未知 `policy` 报错，不回退直连；不支持 Surge 的 `policy-descriptor`。

### 路由与递归

不指定 `policy` 时，以 `b-box-scripts` 入站上下文使用当前核心路由和证书库；指定后由同一实例的对应出站拨号。这里不新增监听器。

主动请求不会再次触发改写、脚本或请求记录，避免脚本请求自己递归。不能在请求页找不到这些主动请求就断定它们没有运行，应检查回调或服务日志。

## 限制主动联网

在 HTTP 或 Cron **单条规则**中配置 `http_client`：

```json
{
  "http_client": {
    "allowed_origins": ["https://api.example.test"],
    "max_requests": 2,
    "max_body_bytes": 8192
  }
}
```

这是规则字段片段。它与被拦截请求的 `ports` / `packages` / MITM 域名无关。

| `allowed_origins` 写法 | 效果 |
| --- | --- |
| 省略或 `null` | 允许经核心主动访问 HTTP(S) |
| `[]` | 禁止主动联网 |
| 精确 origin 列表 | 只允许列出的协议、主机和端口，不设条数配额 |

不能使用通配符、路径、凭据、查询或片段；每次重定向也会检查范围。`https://api.example.test` 与 `http://api.example.test` 是不同 origin。

主动 HTTP 不设固定并发或累计调用配额；设置正整数 `max_requests` 后，失败和被拒绝的调用也计数。客户端 `max_body_bytes` 缺省、`0` 或 `-1` 不限制，正整数按字节限制输入和输出，和拦截正文限额独立。

响应按 Content-Encoding 解码；损坏、未知编码、超限或非 UTF-8（未设 binary-mode）会报错，不返回部分正文。

## 持久存储

```js
const value = $persistentStore.read("latest");
const saved = $persistentStore.write("hello", "latest");
const removed = $persistentStore.write(null, "latest");
```

读不到返回 `null`；写入/删除成功返回 `true`。命名空间和并发行为见[持久存储](./storage.md)。

## gzip 解压工具

HTTP 和 Cron 都可调用 `$utils.ungzip(Uint8Array)`，支持 TypedArray 子视图。成功返回 `Uint8Array`；参数无效、gzip 损坏或执行取消时返回 `null`。

```js
// HTTP 规则需 requires_body: true 和 binary_body: true。
const decoded = $utils.ungzip($response.body);
if (decoded !== null) {
  console.log("Decoded bytes:", decoded.length);
}
$done();
```

这个工具用于正文内部仍是 gzip 字节的场景，不需要再解压 HTTP `Content-Encoding` 已处理的内容。它不设固定输出配额，也不会自动解析 Protobuf；gRPC 的使用方式见[消息帧说明](./grpc.md#脚本拿到的是什么)。

## 定时器

支持 `setTimeout(fn, delayMs, ...args)`、`setInterval(fn, delayMs, ...args)`、`clearTimeout(handle)` 和 `clearInterval(handle)`。

```js
setTimeout(function () {
  console.log("Timer fired");
  $done();
}, 100);
```

回调必须是函数；delay 默认 0，接受可表示为 duration 的非负有限毫秒数，实际最小调度间隔为 1 毫秒。待执行定时器与累计回调不设固定次数配额。网络与定时器回调在同次 VM 事件循环中顺序执行。

定时器不延长脚本时限，不跨执行或重启保存，也不会唤醒系统。周期任务请使用 [Cron](./cron.md)，不要用长时间 `setInterval` 代替。

## 日志

支持 `console.log/info/warn/error/debug`。`log` 按 info 等级写入服务日志，不设每次执行的条数或单条截断配额。可用规则 `name` 帮助识别来源；HTTP 规则设 `debug: true` 时，同一日志内容还会附到请求备注。

没有独立脚本日志页面，使用 B-box 的服务日志，核对配置日志等级和页面筛选条件。

## 不提供的宿主能力

没有 Node.js 的 `require`、文件系统模块、浏览器 DOM / `fetch`、Surge 通知、`$task.fetch` 或其他工具专属的 `$prefs` 等接口。外部脚本必须核对实际依赖，不能原样复制后假设可用。
