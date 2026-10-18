# Personal Network Rules

**只维护业务分流，不绑定VPS、机场、节点名称或国家标签。** 节点来源由塔台管理；GitHub保存个人例外、上游规则引用和策略关系，不保存节点凭据。

## 导入

在塔台「规则 → 导入」使用：

```text
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/tower.yaml
```

这是规则方案，不是含节点的订阅。先在塔台启用并勾选你的节点，再导入规则并按客户端导出。

**地区银行和券商分开手选。**原有五组保留，新增银行地区组、券商地区组和三组跨地区品牌出口，共15组。内地银行默认DIRECT；使用哪个境外地区组，就先手选该组的稳定出口，不使用的可保持REJECT。

| 组 | 初始选择 | 用途 |
|---|---|---|
| 🌍 海外默认 | REJECT | 其他境外流量 |
| 🏦 金融 | 海外默认 | IBKR、渣打、HSBCnet、部分Citi/Amex/TD等共享入口 |
| 🏦 银行-内地 | DIRECT | 大陆银行及列明内地分行入口 |
| 🏦 银行-香港 | REJECT | 香港主流传统和数字银行的专用域名 |
| 🏦 银行-美国 | REJECT | HSBC美国、Mercury、华美/Velo、Chase、BOA、Wells Fargo等 |
| 🏦 银行-新加坡 | REJECT | HSBC、DBS/POSB、OCBC、UOB、Starryblu |
| 📈 券商-香港 | REJECT | 长桥完整已核实域族、Phillip香港 |
| 📈 券商-美国 | REJECT | 嘉信/thinkorswim、Fidelity、ETrade、Firstrade等 |
| 📈 券商-新加坡 | REJECT | 列明新加坡专用券商入口 |
| 📈 富途/Moomoo | 香港券商 | 地区网站与共享登录/行情统一出口，可改美国/新加坡 |
| 📈 Webull | 香港券商 | 地区网站与共享服务统一出口，可改地区 |
| 📈 Tiger | 香港券商 | 地区网站与共享服务统一出口，可改地区 |
| 🪙 Crypto | REJECT | Binance、OKX、TradingView等，维持原有规则 |
| 🤖 AI / X | 海外默认 | 境外AI和X，可独立固定出口 |
| 🛑 广告过滤 | REJECT | 可临时放行排查误杀 |

全部是select，不按节点名猜国家、不自动测速换出口。原五组名字和候选关系保留；长桥和嘉信业务规则分别迁入香港/美国券商。三品牌共享组默认跟随香港券商，不把同一App的共享登录/API送到另一个国家。

已核查27家香港银行，并补齐主要美国银行与地区券商；75条机构/共享入口记录带官方来源，生成金融域名列表。它们不是75家银行，也不等于所有App后端已经实测。[完整覆盖与边界](docs/financial-coverage.md)。

共享HTTPS主机的账号或国家路径无法靠域名规则拆分；使用不同国家账户时，应手动选择对应品牌共享出口，不能宣称同一主机可以同时识别两个国家账户。

Apple News不再单独分组，没有强制 `gateway.icloud.com` 的特殊路由。Microsoft也不再整家公司一律直连：已有国内分类走直连，其余按海外规则处理；其AI服务优先进入AI组。历史News文档及旧规则URL暂留以兼容旧导出，新模板不引用。

## 日常只维护少量例外

| 需求 | 修改文件 |
|---|---|
| 强制直连 | [rules/direct.yaml](rules/direct.yaml) |
| 强制使用海外默认 | [rules/proxy.yaml](rules/proxy.yaml) |
| 银行、券商及共享金融入口（维护源） | [data/financial-services.yaml](data/financial-services.yaml)，运行 `scripts/gen_financial_rules.py` |
| 金融派生列表（不要手改） | `rules/bank-*.yaml`、`rules/broker-*.yaml`、`rules/finance*.yaml` |
| Crypto/TradingView补充 | [rules/crypto.yaml](rules/crypto.yaml) |
| AI/X补充 | [rules/ai-x.yaml](rules/ai-x.yaml) |
| 策略关系、顺序、基础DNS | [tower.yaml](tower.yaml) |

在GitHub文件页点铅笔编辑并提交。Raw是读取地址，不能在Raw页面保存修改。`+.example.com`匹配主域及子域；`api.example.com`只匹配精确域名。文件中不写节点名称、订阅URL、证书或密码。

个人例外位于通用数据库前，直连例外优先于强制代理例外。不要把同一域名同时放进相反列表。业务分类使用一个统一上游数据库，个人文件只补需求，不同时堆叠多套中国域名库或广告库。

## 规则逻辑

优先级为：内网 → 明确直连 → 明确的子域/共享入口例外 → 地区银行 → 地区券商/品牌共享 → 个人业务例外 → 明确海外例外 → 金融/Crypto/AI/X上游分类 → 可切换广告过滤 → 国内域名/IP → 海外默认。个人业务例外优先于GitHub全站这类较宽的海外例外，避免Copilot被普通GitHub规则抢先。

业务分类优先于通用广告库，是考虑账户登录和交易功能的稳定性；这可能放行属于业务域名的部分追踪请求。广告误杀优先用少量明确例外修正，广告组临时放行用于排查。完整理由、ACL4SSR对照及限制见[规则设计](docs/routing-design.md)。

## 塔台与客户端

- 节点保持手动更新，代理集合关闭；“优先使用规则集”开启。
- 改个人子列表：保留远程引用的客户端可每天更新；被展开为静态行的配置需刷新重导，或采用下面的自动更新方案。
- 改组、基础DNS或规则顺序：塔台重新导入模板并重新导出。
- “通用”指规则与节点来源解耦，不代表Clash、QX、Shadowrocket的原生语法完全相同。分别导出并检查兼容提示。

### 改完 rules/*.yaml 后，规则怎么到设备

| 设备 | 采用方案 | 生效方式 |
|---|---|---|
| OpenClash | [mihomo/openclash-ruleset-overwrite.ini](mihomo/openclash-ruleset-overwrite.ini) 覆写模块 | 30个规则集恢复远程引用，每天自动更新（含Tailscale导出的配置不要启用此模块）；详见[OpenClash自动更新](docs/openclash.md) |
| Quantumult X | [qx/filter-remote-snippet.conf](qx/filter-remote-snippet.conf) 轻量配置 | filter_remote每天自动更新；详见[QX远程规则](docs/qx-remote-rules.md) |
| 未采用上述 | 塔台重新导出并上传 | 结构不变时不需要；换节点/改组/改DNS仍走这条路 |

金融列表由 `scripts/gen_financial_rules.py` 从金融目录生成；OpenClash/QX片段由 `scripts/gen_overwrites.py` 从tower.yaml生成。修改维护源后重新生成，验证脚本会检查同步。

[塔台导入与迁移](docs/tower.md) · [DNS边界](docs/dns.md) · [OpenClash自动更新](docs/openclash.md) · [IPv6路线](docs/ipv6.md) · [透明代理调优](docs/transparent-proxy.md) · [Tailscale与新版导出验收](docs/tailscale.md) · [Tello](docs/tello.md) · [QX远程规则与文件体积](docs/qx-remote-rules.md)

## Quantumult X 工具

- [资源解析器与Invalid response排查](docs/qx-resources.md)
- [节点出口体检与优选方法](docs/node-quality.md)
- [机场候选与现有订阅的分工](docs/provider-options.md)

解析器地址：`https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/resource-parser.js`。

## 验证与来源

GitHub Actions检查地区银行、共享入口和业务分流场景、策略引用、任意命名节点、空节点池、资源解析器及手动体检脚本。测试不需要私人订阅。可用本地Mihomo额外校验基础配置和可选DNS/UDP片段。

```sh
python -m pip install -r requirements.txt
python scripts/validate.py
python scripts/validate.py --mihomo-bin /path/to/mihomo
```

借鉴[ACL4SSR在线模板](https://github.com/ACL4SSR/ACL4SSR/blob/master/Clash/config/ACL4SSR_Online.ini)的分层、统一出口和广告开关思路；公共域名/IP数据继续引用[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)。没有复制并叠加整套ACL4SSR数据库。

结构和规则验证不代表每个网站、每家银行或每台设备都已经实机通过；个别应用的共享域名、CDN、IP归属和地区条件仍需按实际请求修正。
