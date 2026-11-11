---
description: 使用 $persistentStore 在 B-box HTTP 脚本与 Cron 间共享字符串数据，理解命名空间、删除和备份边界。
---

# 持久存储与共享数据

`$persistentStore` 用于保存小量跨执行数据，例如 Cron 获取的响应、上次运行时间或简单缓存。HTTP 与 Cron 可以通过同一命名空间和 key 共享值。

## 读取、写入和删除

```js
const previous = $persistentStore.read("latest");
if (previous !== null) {
  console.log("Cache exists");
}

if (!$persistentStore.write(JSON.stringify({ ok: true }), "latest")) {
  console.warn("Storage write failed");
}
$done();
```

| 操作 | 结果 |
| --- | --- |
| `read(key)` | 字符串，不存在为 `null`；空字符串是有效值 |
| `write(value, key)` | 写入字符串，成功为 `true`，存储不可用或 I/O 失败为 `false` |
| `write(null, key)` | 删除 key，成功为 `true` |

读取失败与非法参数会抛出异常。不要用 `if (value)` 判断 key 是否存在，因为它会把空字符串也当作没有数据。

## 指定命名空间

在每条 HTTP 或 Cron 规则中设置：

```json
{
  "storage_namespace": "my-api-cache"
}
```

命名空间使用非空 ASCII 字母、数字、点、下划线或连字符，首字符必须为字母或数字。省略时使用共享的 `default`。不另设固定名称长度配额，但名称用于私有文件名，实际文件系统错误仍会报告。

**同名命名空间在本机不同配置、HTTP 与 Cron 之间共享。** 希望项目间隔离时，请显式设置不同名称；它不会自动按配置隔离。

HTTP 与 Cron 都写 `storage_namespace: "my-api-cache"` 并使用 key `latest`，就能交换数据。脚本不能在运行时枚举或切换命名空间。

## 省略 key 会怎样

省略 key 时，B-box 根据脚本身份生成默认 key。同一文件/URL 的 HTTP 和 Cron 可以共享它；内联源码变化会改变默认 key，单纯改名或排序不会。

需要稳定的数据约定时，建议显式指定命名空间和 key，避免修改内联代码后看起来“缓存消失”。

## 一个可下载的组合

[Cron → 存储 → HTTP 缓存响应示例](/examples/cron-cache.json) 中：

1. Cron 每半小时请求指定 API。
2. 成功后将响应写入 `docs-demo` 命名空间的 `latest`。
3. HTTP 请求脚本读取同一 key，存在时直接返回；没有缓存时 `$done()`，继续后续处理或上游。

示例用于返回 JSON 的受控测试接口。若换成其他内容，调整响应 Content-Type。

## 保留与备份

停止/重启服务、重载配置、清空请求记录和删除规则都不会自动删除存储值。需要删除时使用 `write(null, key)`；移除最后一个 key 会释放命名空间。

数据保存在设备私有目录，不随配置导出、应用备份或系统自动备份迁移。配置只保存命名空间设置，所以换设备后读取可能返回 `null`。

## 大小与并发

key 必须是非空合法 UTF-8 字符串，不用作文件路径。当前实现不设键/值长度、键/命名空间数量、空间容量或每次执行读写次数的固定配额。读写仍受存储可用性、文件系统及执行取消影响。

单次写入是原子操作，但“先读再写”不是事务；并发脚本同时递增同一值可能相互覆盖。成功写入也不会因为后续脚本异常或非法 `$done` 而回滚。
