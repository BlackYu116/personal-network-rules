# Personal Network Rules

**塔台管理节点，GitHub管理规则。** 本仓库不包含机场订阅、VPS地址、节点凭据或证书。

## 导入入口

在塔台的「规则 → 导入」中使用：

```text
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/tower.yaml
```

先在塔台启用机场与自有节点，并勾选需要导出的节点。DMIT节点名称保留 `DMIT` 字样。

`tower.yaml` 是规则方案，不能直接作为带节点的完整客户端订阅。DMIT私有节点链接和机场链接只保存在你自己的塔台中。

## 默认分流

| 业务 | 默认 |
|---|---|
| 大陆银行、HSBC China、国内网站、内网 | DIRECT |
| IBKR、Schwab、Longbridge | 各自的手选组 → 券商默认 → DMIT |
| HSBC UK / HK | 各自的手选组 → 海外银行 → DMIT |
| 币安、OKX、TradingView及其他Crypto | 日本手选组 |
| AI、Apple News、其他海外流量 | DMIT |
| Tello Wi-Fi Calling | DIRECT |
| Microsoft | 保留直连默认，可手选 |

各海外业务组可以选择其他国家、具体节点、DIRECT或REJECT。国家组根据当前勾选的节点名称匹配，不绑定某一家机场，也不按测速自动轮换节点。

## 以后怎么维护

- **增减机场、换订阅URL**：只在塔台改，手动刷新并重新导出；不必修改本仓库。
- **临时换线路**：在客户端手选对应策略组。
- **修改长期默认出口**：编辑 `tower.yaml` 对应组 `proxies` 的第一项。
- **添加个人域名规则**：编辑 `tower.yaml` 前面的 `rules`，放在可能覆盖它的通用规则之前。
- **公共规则更新**：`rule-providers` 每日更新；开启塔台的“优先使用规则集”，并核对目标导出保留了远程引用。
- **GitHub顶层文件改动**：在塔台重新导入此URL，选用新方案，再导出。单点“刷新规则”不一定重取顶层模板；已导出的静态客户端配置也不会自动改变策略组。

为保持单一规则来源，长期规则改动以GitHub为准，不同时在塔台维护另一份长期覆盖。节点选择仍可在客户端临时调整。

## 首次只需看这两份说明

- [塔台设置与更新流程](docs/tower.md)
- [Apple News：Quantumult X详细步骤](docs/apple-news-qx.md)

Tello需要额外做一次设备侧DNS检查：[Tello与DNS边界](docs/tello.md)。这属于网络环境设置，不是日常增减机场的步骤。

## 当前Tower兼容边界

核查日期：2026-09-26，依据当时的Tower main与1.0.8手册；不同版本应检查实际导出。

1. **必需组必须有节点**：当前源码可能把空组回退到DIRECT。导出前确认DMIT、日本组非空，不要忽略警告。
2. **不把REJECT放地区组第一项**：Tower会先保留显式候选、再追加匹配节点，REJECT占位会变成实际默认。
3. **DNS不是无损透传**：Tower可能重建DNS，丢失自定义Fake-IP例外或nameserver-policy。本模板因此不装作能集中控制所有设备的DNS/TUN；Tello例外按设备持久设置。
4. **按客户端分别导出**：Clash/Mihomo、Quantumult X、Shadowrocket不是同一种配置格式。不兼容的规则可能展开或降级，必须检查提示。

[塔台官方文档](https://tower.shenqi.uk/docs/rule-schemes/) · [解析器](https://github.com/pengchujin/tower/blob/main/Tower/Services/RuleSchemeParser.swift) · [生成器](https://github.com/pengchujin/tower/blob/main/Tower/Services/ConfigurationGenerator.swift)

## 校验

GitHub Actions检查规则结构、策略引用、远程规则可读取性与28个分流场景。测试只使用合成节点，不需要你的订阅或密钥。

```sh
python -m pip install -r requirements.txt
python scripts/validate.py
# 可选：额外使用本机Mihomo做语法校验
python scripts/validate.py --mihomo-bin /path/to/mihomo
```

规则校验不代表金融登录、Tello通话或Apple News已在你的设备上验收。

## 来源

公共域名/IP集合引用 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)。本仓库仅维护引用、个人优先级和策略组，不镜像整套上游数据库。
