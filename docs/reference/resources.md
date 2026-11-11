---
description: B-box Map Local 与脚本的内嵌资源、本地文件导入、URL 缓存刷新和备份边界。
---

# 文件与远程资源

Map Local 和脚本支持内嵌数据、导入本地文件及 HTTP(S) URL。简单配置用内嵌内容最容易迁移；需要独立维护脚本或模板时再选文件或 URL。

## 选择资源来源

| 来源 | Map Local | JavaScript |
| --- | --- | --- |
| 内嵌内容 | `data_type: text/base64` + `data`，或资源字典 | `source`，或 `resources` 中的 text/base64 资源 |
| 本地文件 | `data_type: file` + 相对路径 | `script_path`，或 file 资源 |
| HTTP(S) URL | `data_type: file` + URL | `script_path` URL，或 file 资源 |

Map Local 的资源字典位于 `http_rewrite.resources`，脚本资源字典位于 `scripts.resources`，不能跨字典直接引用。

## 导入本地资源

进入 **配置 → 编辑 → 脚本 / HTTP 改写 → 资源 → 导入本地资源**，选择脚本或模板文件。B-box 会复制文件到当前配置实际目录，生成相对路径，并在对应资源字典中登记；已有同名资源会保留，新资源名称添加后缀。

导入成功后记下页面显示的资源名，在单条规则的 `resource` 中引用它。例如导入后名称为 `response.js`，就在 HTTP 响应脚本规则中设置：

```json
{
  "name": "Imported response script",
  "pattern": "^https://api\\.example\\.test/profile$",
  "phase": "response",
  "requires_body": true,
  "resource": "response.js"
}
```

将此规则放入 `scripts.http`，使用实际资源名，并开启脚本扩展。导入只登记资源，不自动添加规则；取消选择会保留配置，修订冲突或应用失败会提示原因。系统选择器中的 `content://` 地址不能直接填成 `script_path`。

## 远程脚本例子

这是一条放入 `scripts.http` 的规则：

```json
{
  "name": "Remote response script",
  "pattern": "^https://api\\.example\\.test/profile$",
  "phase": "response",
  "requires_body": true,
  "script_path": "https://resources.example.test/response.js",
  "script_update_interval": 86400,
  "timeout_ms": 5000
}
```

把 URL 换成实际脚本地址。单条规则从 `source`、`resource`、`script_path` 中选一种；不要一边留着内联 `source`，一边再填 `script_path`。

## 通过字典引用 URL 资源

[下载 URL 脚本资源片段](/examples/remote-script.json)，合并到已有 `experimental.scripts`，替换测试域名及实际资源 URL：

<<< @/public/examples/remote-script.json

`script_path` 对应 `script_update_interval`；资源字典的间隔叫 `update_interval`。两者默认均为 86400 秒，接受可表示为 duration 的正整数秒，不再固定为最多一年。

## 本地路径如何解析

相对路径以**当前实际配置文件的父目录**为基准，例如 `resources/response.js`。它不是浏览器下载目录或任意外部存储路径；拒绝绝对本地路径、目录逃逸和非普通文件。

配置导入/导出只携带路径引用；通过资源页主动“导入本地资源”才会复制文件并写入相对引用。手动维护路径时，需要确保文件确实位于对应配置目录。

本地 Map Local 每次命中重新读取，可按文件后缀推断 MIME，显式 Content-Type 优先。本地脚本默认缓存编译结果到服务结束；设置 `debug: true` 才在每次执行重新读取和编译。

## 什么时候下载

保存、校验、编辑、格式化、配置导入及应用内备份不会读取所引用的文件、下载或运行代码。外部资源在本地服务成功激活后通过当前核心路由加载并刷新。

首次命中可能等待下载，脚本源码加载计入用户设置的脚本总时限。资源下载不另加固定期限或重定向跳数配额，会检测重定向循环，并服从调用方及服务取消；不会递归进入改写或脚本。

同一资源合并并发下载，有缓存时先使用缓存并后台刷新。URL 脚本默认按资源身份和内容哈希复用编译结果，相同内容刷新不重复编译；`debug: true` 每次重新编译，每次执行仍使用独立 VM。

## 更新失败会怎样

| 状态 | 结果 |
| --- | --- |
| 已有可用缓存，下载或新脚本编译失败 | 保留上一份可用缓存并告警 |
| 没有缓存，Map Local 资源不可用 | 跳过本地响应，继续上游 |
| 没有缓存，脚本源码不可用 | 保留当前报文并告警 |
| 停止或重载服务 | 取消下载，等待后台刷新退出 |

因此看到旧结果时，检查更新时间、服务日志与下载路由；不要只重复编辑规则。

## 大小与迁移

Map Local 文件、脚本源码和 URL 磁盘缓存不设固定容量配额；用户设置的正文限额与执行期限继续生效，见[默认值与限制](./limits.md)。处理配置激活时，会清理已无引用的缓存身份及未提交的临时文件，仍被引用的最后可用版本保留。

配置分享、导出及 B-box 应用内备份只保存引用，不打包本地资源文件、下载缓存或脚本持久数据。换设备后需要重新导入文件或等待资源下载；清空请求记录不会清理资源缓存。

Android 系统云备份与设备迁移按独立规则包含整个配置目录及其中导入的文件，实际执行由系统决定。脚本持久数据和下载缓存位于不参与系统备份的目录，不能把系统迁移范围等同于应用内备份。
