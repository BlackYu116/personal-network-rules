# QX 导出太大：把展开规则改回远程引用

主配置变大通常不是节点太多。Tower在无法保留来源格式的远程引用时，会把YAML规则集展开到 `[filter_local]`。即使GitHub模板只有几十条RULE-SET引用，导出仍可能包含十几万条规则。

本方案已经有独立的资源解析器，可让QX直接在 `[filter_remote]` 引用同一批YAML源，不必把所有条目写进主配置。无需为此再维护一套镜像数据库或第二份业务规则。

**当前五组版本的完整 `[filter_remote]` 已生成为 [qx/filter-remote-snippet.conf](../qx/filter-remote-snippet.conf)**（含 general 解析器行、18个远程源和 final 兜底），由 `scripts/gen_overwrites.py` 从 tower.yaml 派生并保持同步。它不含节点和策略组定义——`[server_local]` 与 `[policy]` 从你现有QX配置保留。

## 轻量配置的结构

- `[server_local]`：保留手动刷新的节点快照。
- `[policy]`：保留已有策略组与节点候选。
- `[general]`：指定本仓库的 `qx/resource-parser.js`。
- `[filter_remote]`：按 `tower.yaml` 中RULE-SET的顺序引用源URL，设置 `force-policy`、`opt-parser=true`、`update-interval=86400`。
- `[filter_local]`：只保留 `final, 🌍 海外默认`。

**不要保留 `host-keyword, ., 🌍 海外默认` 这种本地域名总兜底**，否则可能在远程域名规则之前命中。不要把旧的十几万条本地快照和新远程资源重复叠加。

例如：

```ini
[general]
resource_parser_url = https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/resource-parser.js

[filter_remote]
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/rules/crypto.yaml, tag=personal-crypto, force-policy=🪙 Crypto, opt-parser=true, update-interval=86400, enabled=true

[filter_local]
final, 🌍 海外默认
```

这是结构示例，不是完整配置；实际需要已有节点、组和其余远程规则。公开仓库不保存带节点凭据的完整导出。

## 首次导入

1. 保留旧QX配置可切回，将轻量副本作为另一份完整配置导入。不是添加到“服务器资源”。
2. 首次安装时确保GitHub Raw可访问，更新资源解析器。最新版已支持 `+.lan`、`+.cn`、`+.hsbc` 等单标签/TLD后缀。
3. 在分流资源中手动更新全部18个来源，确认均下载并解析成功，然后再作为日常配置使用。规则缓存尚未建立或资源失败时，不能把只有final兜底的状态当作完整分流已生效。
4. 检查国内银行/Tello命中direct、Crypto命中日本、AI和其他海外命中预期出口。原有手选结果可能由客户端保留，仍应确认。

节点仍是手动更新后的本地快照；规则资源由QX每天检查更新。完整主配置变小，不意味着手机不再下载或加载这些规则，也不保证内核内存、延迟或下载速度按同样比例改善。

## 日常维护

个人域名继续编辑 `rules/` 中的小文件，URL不变；QX更新对应远程资源即可。公共集合仍直接引用原来的MetaCubeX数据源，没有复制到本仓库。

当前Tower以后重新完整导出QX仍可能把YAML展开，这是其导出策略，不会因这里提供轻量副本就自动改变。因此不要用新的大文件直接覆盖轻量配置后，又认为远程引用会自行保留。以后需要换节点时，保留轻量配置的general/filter_remote/filter_local，更新节点与相应组候选；完整替换前先备份。

如以后需要“每次Tower导出都自动保留远程规则”，才有必要另做原生QX列表和相应Tower方案。当前无需为一次体积优化增加第二套规则维护系统。

## 验证范围

当前规则源已通过本仓库解析器的桌面Node VM转换；包含超过11万项的cn列表。规则条目与策略绑定已核对，未进行QX真机加载验收，不能将桌面耗时当作手机性能数据。

[Tower规则输出规划器](https://github.com/pengchujin/tower/blob/main/Tower/Services/RuleSetEmissionPlanner.swift) · [QX官方远程资源示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) · [本地域名兜底相关问题报告](https://github.com/crossutility/Quantumult-X/issues/251)

通用五组模板已取代历史八组模板；之前交付的本地轻量副本是当时方案的验证产物，不会自动获得新的策略组结构。迁移以最新tower.yaml和本文结构说明为准。
