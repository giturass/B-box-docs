---
description: 理解 MITM hosts 的首个匹配、排除顺序、通配符、端口后缀和应用筛选。
---

# 域名与范围匹配

`hosts` 按列表顺序检查，**第一个匹配项决定是否解密**。前缀 `-` 表示排除，因此排除项通常需要放在宽泛匹配之前。

## 一个常用例子

```json
{
  "experimental": {
    "mitm": {
      "enabled": true,
      "hosts": [
        "-private.example.test:0",
        "*.example.test:0",
        "api.example.net:8443"
      ]
    }
  }
}
```

这段配置先排除 `private.example.test` 的所有端口，再允许其他 `example.test` 子域的所有端口，另允许 `api.example.net` 的 `8443` 端口。

如果把宽泛的 `*.example.test:0` 放到最前面，后面的排除项就没有机会决定该连接。

## 写法速查

| 写法 | 含义 |
| --- | --- |
| `api.example.test` | 指定名称；省略端口的特殊规则见下文 |
| `*.example.test` | 子域通配；根域 `example.test` 需要时单独列出 |
| `api?.example.test` | `?` 匹配一个字符 |
| `-private.example.test:0` | 排除指定名称的所有端口 |
| `api.example.test:8443` | 仅原始目的端口 8443 |
| `api.example.test:0` | 该名称的所有端口 |
| `[2001:db8::1]:8443` | 带端口的 IPv6 地址 |
| `<ip-address>` / `<ipv4-address>` / `<ipv6-address>` | IP 地址类别 |
| `<simple-hostname>` | 不带点的简单主机名 |

域名项不填写 `https://`、路径或查询参数。路径匹配应在改写或脚本的 URL 正则中设置。

## 省略端口不完全等于 443

普通名称或 IP 项没有端口后缀时默认匹配 443。**名称来自实际 TLS/QUIC SNI 时**，没有端口后缀的项也可以匹配其他端口。

需要确定地限制端口，就显式写 `:443` / `:8443`；明确匹配所有端口用 `:0`。端口判断以原始目标端口为准，不随路由中的端口覆写改变。

## 叠加应用与端口筛选

```json
{
  "experimental": {
    "mitm": {
      "enabled": true,
      "hosts": ["api.example.test:8443"],
      "ports": [8443],
      "packages": ["com.example.app"]
    }
  }
}
```

`com.example.app` 只是应用包名占位符，使用时替换。域名、端口、应用三项必须同时满足；未知应用归属不能匹配指定应用。

MITM 的 `ports` 或 `packages` 为空时不增加对应限制。HTTP 改写、脚本和请求记录有各自的范围，**MITM 命中 8443 不代表其他处理一定命中 8443**。

## 为什么看起来有域名，却没有命中

MITM 以实际 ClientHello 中的 SNI 为准。没有 SNI 时只接受已知 IP 目标，不把 DNS 映射当成实际 SNI。真实 ECH 隐藏的名称无法恢复；单纯域名提取也不会打开解密。

检查顺序：实际连接 → SNI/IP → 第一个命中 hosts 项 → 原始端口 → 应用归属 → 目标客户端信任。不要只看地址栏或 DNS 记录。

字段与限额见[默认值与限制](../reference/limits.md)。
