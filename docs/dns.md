# DNS：基础地址在GitHub维护，高级设置按内核使用

## 只想添加或替换一个DNS地址

打开仓库 `tower.yaml` 的GitHub编辑页面，找到底部 `dns:`。

- `default-nameserver`：解析加密DNS服务域名时使用的普通IP地址。
- `nameserver`：加密DNS地址，一行一个HTTPS URL。

保留现有换行和缩进：列表前4个空格，不能改成 `[地址1, 地址2]`。这是当前Tower逐行解析器的要求。

```yaml
dns:
  default-nameserver:
    - 223.5.5.5
    - 119.29.29.29
  nameserver:
    - https://223.5.5.5/dns-query
    - https://120.53.53.53/dns-query
```

Commit后，等待Actions通过，在塔台重新导入同一Raw URL，查看“规则方案 → 编辑 → DNS与网络”的地址，再导出。Raw地址只读；编辑是在GitHub文件页面完成。

这是可导入的基础DNS地址清单，不意味着国内外DNS已经分别走不同出口。Tower可能将同一加密地址池用于nameserver、fallback和节点解析。不要在这份通用模板里添加Mihomo专用 `#策略组`，不同客户端转换不会保留同样含义。

## 要求境外DNS经过代理、Tello使用真实IP

仓库另外提供 [dns/mihomo.yaml](../dns/mihomo.yaml)：

- 普通境外查询通过“海外默认”出口访问加密DNS。
- 节点域名、国内域名和Tello域名使用直连DNS。
- Tello ePDG加入Fake-IP例外。

该文件是**Mihomo DNS覆写片段**，既不是节点订阅，也不是完整配置。它引用本方案的组名和rule-provider名称，应合并到塔台导出的本方案配置中。客户端如果有持久Merge/覆写入口，可以在那里保存；OpenClash应在其持久DNS覆写中合并对应内容。不同版本入口不同，不把未经验证的下载脚本放入路由器启动项。

合并时保留原 `dns.listen`、TUN、IPv6设置，`fake-ip-filter`取原列表与新列表的并集，别覆盖掉其他设备所需例外。片段按blacklist语义编写；若原先采用whitelist或rule模式，先转换原例外规则，不能把不同语义的列表直接拼接。片段会清除旧fallback，避免它继续提供另一条解析路径。重新导出后检查实际生效配置仍有这些字段。此操作本次没有替你执行。

**当前Tower不保留这些高级字段：**`nameserver-policy`、自定义`fake-ip-filter`等不会完整进入其内部模型。仅把这个URL导入Tower，不能完成高级DNS配置。GitHub可作为维护源，是否能定时拉取覆写取决于目标客户端；目前没有宣称所有设备都能自动同步。

## QX与Shadowrocket

它们使用各自格式，不能把Mihomo DNS YAML直接粘进去。当前Tower的QX生成器只导出普通DNS列表，不导出上述加密DNS列表；需要在QX本机设置并检查 `[dns]`。Apple News重写和MITM也属于QX本机设置，见[操作指南](apple-news-qx.md)。

[Tower DNS手册](https://tower.shenqi.uk/docs/dns-network/) · [网络设置解析](https://github.com/pengchujin/tower/blob/main/Tower/Services/RuleSchemeParser.swift#L653) · [Mihomo DNS参数](https://wiki.metacubex.one/config/dns/)
