# Personal Network Rules

**塔台管节点，GitHub管分流。** 公开仓库只放规则，不含机场订阅、节点凭据或证书。

## 导入地址

在塔台「规则 → 导入」中使用：

```text
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/tower.yaml
```

这是规则方案，不是带节点的订阅。先启用自己的机场和DMIT节点；DMIT名称保留 `DMIT` 字样。

## 精简后的默认分流

从22个组减少为8个组：5个业务组、3个节点选择组。

| 业务组 | 默认出口 |
|---|---|
| 🌍 海外默认 | DMIT |
| 🏦 金融：海外银行、IBKR、Schwab、Longbridge | DMIT |
| 🪙 Crypto：币安、OKX、TradingView等 | 日本手选节点 |
| 🤖 AI / X：Claude、ChatGPT、Gemini、Grok、Perplexity、Copilot、Cursor、X等 | DMIT |
| 📰 Apple News | DMIT；地区判定另见指南 |

其余3组为 `🇺🇸 DMIT 专线`、`🇯🇵 日本节点`、`🌐 全部节点`。其他国家的线路在“全部节点”中选择，不再为每个国家或每家银行创建单独组。业务组仍可手选其他节点组、DIRECT或REJECT；不自动轮换账户出口。

国内银行、HSBC China、国内网站、内网与Tello直连。Microsoft通用服务保留原先直连默认，境外AI专用域名规则排在它前面。广告规则直接REJECT。Apple普通服务按国内/海外分流，无独立组。

## 日常只改这些地方

| 想改什么 | 编辑位置 | 如何生效 |
|---|---|---|
| 换机场、增减机场 | 塔台订阅 | 手动更新节点，重新导出 |
| 临时换出口 | 客户端业务组／全部节点 | 手动选择 |
| 必须直连的域名 | [rules/direct.yaml](rules/direct.yaml) | 兼容远程规则的客户端每日更新 |
| 海外银行／券商域名 | [rules/finance.yaml](rules/finance.yaml) | 同上 |
| Crypto／TradingView域名 | [rules/crypto.yaml](rules/crypto.yaml) | 同上 |
| AI或X的补充域名 | [rules/ai-x.yaml](rules/ai-x.yaml) | 同上 |
| Apple News域名 | [rules/apple-news.yaml](rules/apple-news.yaml) | 同上 |
| 策略组、优先级、默认出口、基础DNS地址 | [tower.yaml](tower.yaml) | 塔台重新导入同一URL，再导出 |
| Mihomo分域名DNS／Fake-IP例外 | [dns/mihomo.yaml](dns/mihomo.yaml) | 合并到目标客户端的DNS覆写；Tower不无损透传 |

GitHub Raw是**读取地址**，不能在Raw页面保存修改。登录GitHub，打开对应文件 → 铅笔“Edit” → Commit changes。等Actions通过后，原Raw链接即指向新版本（可能有短暂缓存）。

例如在 `rules/ai-x.yaml` 的 `payload:` 下新增：

```yaml
- +.example.com
```

`+.example.com`匹配主域和所有子域；`api.example.com`只匹配该精确域名。不填协议、路径、端口或策略名。不要把整个 `google.com`、`cloudflare.com`、`amazonaws.com`为了某个AI服务一并纳入；添加专用域名即可。

自定义列表先于上游大集合；同一域名不要重复放进互相冲突的列表，尤其direct列表优先最高。公共上游数据库继续提供主要覆盖，自定义列表只补个人需求。新增域名不需要增加策略组。

## 首次设置和说明

- [塔台设置、DMIT节点修复、更新与导出](docs/tower.md)
- [DNS怎样集中维护，以及Tower的边界](docs/dns.md)
- [Tello Wi-Fi Calling排查](docs/tello.md)
- [Apple News：Quantumult X完整操作步骤](docs/apple-news-qx.md)

开启“优先使用规则集”，关闭自动更新订阅及代理集合，保持“节点手动、规则自动”。当前Tower的QX导出会把这些YAML规则展开为静态行，需要塔台刷新并重新导出；Clash/Mihomo可以保留远程更新。更新顶层模板不等于更新子列表：当前Tower的“刷新规则”主要取子列表，顶层需要重新导入。

**导出前确认DMIT、日本组都有节点。** Tower当前可能把空组回退到DIRECT；删除机场后尤其要检查。客户端旧的持久化选择也可能覆盖新默认值。

## 验证与来源

GitHub Actions用合成节点检查策略引用、上游规则可读性和47个分流场景。可选使用本地Mihomo检查基础配置及高级DNS片段；不需要私人节点或订阅。

```sh
python -m pip install -r requirements.txt
python scripts/validate.py
python scripts/validate.py --mihomo-bin /path/to/mihomo
```

结构与分流测试不代表金融登录、Tello通话或Apple News已经在设备验收。

公共集合来自 [MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)。Tower兼容性依据2026-09-26的源码：[节点解析器](https://github.com/pengchujin/tower/blob/main/Tower/Services/SubscriptionParser.swift)、[规则解析器](https://github.com/pengchujin/tower/blob/main/Tower/Services/RuleSchemeParser.swift)、[配置生成器](https://github.com/pengchujin/tower/blob/main/Tower/Services/ConfigurationGenerator.swift)。
