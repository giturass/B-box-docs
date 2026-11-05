---
description: B-box Map Local 与脚本的内嵌、文件和 URL 资源，缓存刷新、大小上限及失败回退。
---

# 文件与远程资源

Map Local 和脚本支持内嵌数据、相对文件路径及 HTTP(S) URL。简单配置用内嵌内容最容易迁移；需要独立维护脚本或模板时再选文件或 URL。

## 选择资源来源

| 来源 | Map Local | JavaScript |
| --- | --- | --- |
| 内嵌内容 | `data_type: text` + `data`，或资源字典 | `source`，或 `resources` 中的 text 资源 |
| 本地文件 | `data_type: file` + 相对路径 | `script_path`，或 file 资源 |
| HTTP(S) URL | `data_type: file` + URL | `script_path` URL，或 file 资源 |

Map Local 的资源字典位于 `http_rewrite.resources`，脚本资源字典位于 `scripts.resources`，不能跨字典直接引用。

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

```json
{
  "experimental": {
    "scripts": {
      "enabled": true,
      "http": [
        {
          "pattern": "^https://api\\.example\\.test/profile$",
          "phase": "response",
          "requires_body": true,
          "resource": "profile-script"
        }
      ],
      "resources": {
        "profile-script": {
          "data_type": "file",
          "data": "https://resources.example.test/response.js",
          "update_interval": 86400
        }
      }
    }
  }
}
```

`script_path` 对应 `script_update_interval`；资源字典的间隔叫 `update_interval`。两者默认均为 86400 秒，可设 1～31536000 秒。

## 本地路径如何解析

相对路径以**当前实际配置文件的父目录**为基准，例如 `resources/response.js`。它不是浏览器下载目录或任意外部存储路径；拒绝绝对本地路径、目录逃逸和非普通文件。

配置导入/导出只携带路径引用，不会顺便把文件复制进配置目录。若无法管理实际配置目录，使用内嵌源码或可访问的 URL 资源更直接。

本地 Map Local 每次命中重新读取，可按文件后缀推断 MIME，显式 Content-Type 优先。本地脚本默认缓存编译结果到服务结束；设置 `debug: true` 才在每次执行重新读取和编译。

## 什么时候下载

保存、校验、编辑、格式化、导入和备份不会读取文件、下载或运行代码。外部资源在本地服务成功激活后通过当前核心路由加载并刷新。

首次命中可能等待下载；脚本源码加载计入脚本总时限。资源下载最多 15 秒、10 次重定向，有缓存时使用缓存并在后台刷新；不会递归进入改写或脚本。

## 更新失败会怎样

| 状态 | 结果 |
| --- | --- |
| 已有可用缓存，下载或新脚本编译失败 | 保留上一份可用缓存并告警 |
| 没有缓存，Map Local 资源不可用 | 跳过本地响应，继续上游 |
| 没有缓存，脚本源码不可用 | 保留当前报文并告警 |
| 停止或重载服务 | 取消下载，等待后台刷新退出 |

因此看到旧结果时，检查更新时间、服务日志与下载路由；不要只重复编辑规则。

## 大小与迁移

Map Local 文件资源最多 15 MiB，脚本源码最多 128 KiB，URL 磁盘缓存总计最多 64 MiB。正文工作仍受[其他处理限额](./limits.md)约束。

缓存不随配置或备份迁移，清空请求记录也不会删除它。引用会保留，文件和缓存需要在新设备重新准备。
