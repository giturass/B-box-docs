---
description: 用完整的 HTTP Mock 演示配置返回第一条本地 JSON，再逐步开启 HTTPS MITM。
---

# 跑通第一条请求

先用 HTTP 和 Map Local 返回一个固定 JSON。这个演示不需要证书，也不需要运行测试服务器；成功后再加入 HTTPS 和脚本。

## 1. 新建一个演示配置

进入 **配置 → 新建配置**，取名“B-box HTTP 实验”。打开原始配置编辑器，使用下面的完整配置。

这是独立演示：监听本机 `127.0.0.1:2080`，只有经这个代理入口发出的请求会进入演示。它不包含你的订阅节点，也不配置全设备 VPN 入站。原有配置可以保留，体验结束后切换回去。

[下载完整演示配置](/examples/http-lab.json)

<<< @/public/examples/http-lab.json

其中 `demo.bbox.test` 是保留测试域名。路由中的 `override_address` 将它固定到回环地址，避免依赖公共 DNS；命中 `/hello` 后，Map Local 直接返回响应，无需连接上游。

## 2. 保存并启动本地服务

保存配置，选择它，再启动 B-box。等待状态实际变为运行中。若端口 `2080` 已占用，换一个空闲端口，并同步修改下一步命令。

只把配置保存到未选中的条目，不会让它在当前服务中生效。更多说明见[编辑与应用配置](./configuration.md)。

## 3. 发出一条请求

在运行 B-box 的同一设备上，使用提供 `curl` 的终端执行：

```sh
curl -i --max-time 10 --noproxy "" \
  --proxy http://127.0.0.1:2080 \
  http://demo.bbox.test/hello
```

`--proxy` 显式使用演示入站，`--noproxy ""` 避免环境中的代理绕过设置影响结果。也可以使用支持 HTTP 代理的请求工具，将代理设为 `127.0.0.1:2080`，再访问相同 URL；这里的回环地址仅供同一设备访问。

预期能看到：

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-B-box: Map Local

{"ok":true,"message":"Hello from B-box"}
```

实际头部顺序、大小写和附加头可能不同。判断依据是状态码 `200`、`X-B-box` 和 JSON 内容。

## 4. 查看记录

进入 **工具 → 连接与请求**，开始记录，再执行一次相同的 curl。选择“抓取记录”筛选，打开新增记录，查看请求 URL、响应头和正文。

默认记录端口包含 `80`；演示请求的**目标端口是 80**。不要把代理监听端口 `2080` 填成抓取目标端口。

停止记录后再次请求，Mock 应继续返回。记录开关只控制保存数据，Map Local 由当前配置控制。

## 5. 加一点变化

把 Map Local 的 `data` 改成 `{"ok":true,"message":"My first rewrite"}`，保存并确认配置已应用，再发一次请求。

如果响应随之改变，你已经跑通了“编辑配置 → 应用服务 → 请求命中 → 返回结果”这条链路。接下来可以选择：

- [Header Rewrite](../rewrite/headers.md)：为请求或响应添加字段。
- [Body Rewrite 与 jq](../rewrite/body.md)：修改上游返回的 JSON。
- [第一条脚本](../scripts/overview.md)：用 JavaScript 动态生成结果。

## 下一步：处理 HTTPS

在自己的有效 sing-box 配置上继续，按顺序完成：

1. [生成并安装 MITM CA](../mitm/certificate.md)，让目标客户端信任它。
2. [启用 MITM](../mitm/overview.md)，填写需要解密的实际域名。
3. 添加匹配 `https://` URL 的改写或脚本。
4. 等待配置应用成功，让目标客户端重新建立连接，再查看新请求。

将示例 URL 改成 HTTPS 并不会自动启用解密。MITM 与 HTTP 处理需要分别配置。

连接拒绝、没有记录或未命中时，见[常见问题与排错](../reference/troubleshooting.md)。
