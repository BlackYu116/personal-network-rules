# Personal Network Rules

**只维护业务分流，不绑定VPS、机场、节点名称或国家标签。** 节点来源由塔台管理；GitHub保存个人例外、上游规则引用和策略关系，不保存节点凭据。

## 导入

在塔台「规则 → 导入」使用：

```text
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/tower.yaml
```

这是规则方案，不是含节点的订阅。先在塔台启用并勾选你的节点，再导入规则并按客户端导出。

**首次导入需手选五个出口：**海外默认、Crypto，以及香港/美国/新加坡银行。它们初始均为REJECT，避免把香港银行自动送到现有美国出口。内地银行默认DIRECT；金融和AI/X仍默认跟随海外默认。组名标识服务地区，不会根据节点名称猜测实际国家；先验证节点真实出口，再固定选择。

## 九个手选策略组

| 组 | 初始选择 | 用途 |
|---|---|---|
| 🌍 海外默认 | REJECT，首次手选 | 其他境外流量 |
| 🏦 金融 | 海外默认 | IBKR、嘉信/thinkorswim、Longbridge，其他地区与无法区分地区的银行共享入口 |
| 🏦 银行-内地 | DIRECT | 汇丰中国及已列入的主要大陆银行 |
| 🏦 银行-香港 | REJECT，首次手选香港出口 | 汇丰香港、ZA Bank银行业务域名 |
| 🏦 银行-美国 | REJECT，首次手选美国出口 | 汇丰美国专用服务域名 |
| 🏦 银行-新加坡 | REJECT，首次手选新加坡出口 | 汇丰新加坡、DBS/POSB、OCBC、UOB、Starryblu |
| 🪙 Crypto | REJECT，首次手选 | Binance、OKX、TradingView及其他Crypto |
| 🤖 AI / X | 海外默认 | 境外AI和X，可独立固定出口 |
| 🛑 广告过滤 | REJECT | 可临时改为海外默认或DIRECT排查误杀 |

除广告组外，各组可手选当前启用的任意节点。所有组均为select；不测速换出口，不按机场或国家标签自动筛节点。原来的五个组名和候选关系保留，新增银行组不会自动继承旧金融组的节点。国内网站、内网和Tello指定域名仍按既有直连规则处理。

同一个HTTPS域名中的不同国家账户、URL路径或Global View页面，不能靠域名规则区分。`hsbc.com`、全球HSBCnet等共享入口保留金融兜底；有证据的地区子域先匹配。详见[银行地区、来源与边界](docs/bank-regions.md)。

Apple News不再单独分组，没有强制 `gateway.icloud.com` 的特殊路由。Microsoft也不再整家公司一律直连：已有国内分类走直连，其余按海外规则处理；其AI服务优先进入AI组。历史News文档及旧规则URL暂留以兼容旧导出，新模板不引用。

## 日常只维护少量例外

| 需求 | 修改文件 |
|---|---|
| 强制直连 | [rules/direct.yaml](rules/direct.yaml) |
| 强制使用海外默认 | [rules/proxy.yaml](rules/proxy.yaml) |
| 券商/其他地区/共享金融入口 | [rules/finance.yaml](rules/finance.yaml) |
| 地区银行 | [内地](rules/bank-cn.yaml)、[香港](rules/bank-hk.yaml)、[美国](rules/bank-us.yaml)、[新加坡](rules/bank-sg.yaml) |
| Crypto/TradingView补充 | [rules/crypto.yaml](rules/crypto.yaml) |
| AI/X补充 | [rules/ai-x.yaml](rules/ai-x.yaml) |
| 策略关系、顺序、基础DNS | [tower.yaml](tower.yaml) |

在GitHub文件页点铅笔编辑并提交。Raw是读取地址，不能在Raw页面保存修改。`+.example.com`匹配主域及子域；`api.example.com`只匹配精确域名。文件中不写节点名称、订阅URL、证书或密码。

个人例外位于通用数据库前，直连例外优先于强制代理例外。不要把同一域名同时放进相反列表。业务分类使用一个统一上游数据库，个人文件只补需求，不同时堆叠多套中国域名库或广告库。

## 规则逻辑

优先级为：内网 → 明确直连 → 地区银行及HSBC China → 个人业务例外 → 明确海外例外 → 金融/Crypto/AI/X上游分类 → 可切换广告过滤 → 国内域名/IP → 海外默认。个人业务例外优先于GitHub全站这类较宽的海外例外，避免Copilot被普通GitHub规则抢先。

业务分类优先于通用广告库，是考虑账户登录和交易功能的稳定性；这可能放行属于业务域名的部分追踪请求。广告误杀优先用少量明确例外修正，广告组临时放行用于排查。完整理由、ACL4SSR对照及限制见[规则设计](docs/routing-design.md)。

## 塔台与客户端

- 节点保持手动更新，代理集合关闭；“优先使用规则集”开启。
- 改个人子列表：保留远程引用的客户端可每天更新；被展开为静态行的配置需刷新重导，或采用下面的自动更新方案。
- 改组、基础DNS或规则顺序：塔台重新导入模板并重新导出。
- “通用”指规则与节点来源解耦，不代表Clash、QX、Shadowrocket的原生语法完全相同。分别导出并检查兼容提示。

### 改完 rules/*.yaml 后，规则怎么到设备

| 设备 | 采用方案 | 生效方式 |
|---|---|---|
| OpenClash | [mihomo/openclash-ruleset-overwrite.ini](mihomo/openclash-ruleset-overwrite.ini) 覆写模块 | 22个规则集恢复远程引用，每天自动更新（含Tailscale导出的配置不要启用此模块）；详见[OpenClash自动更新](docs/openclash.md) |
| Quantumult X | [qx/filter-remote-snippet.conf](qx/filter-remote-snippet.conf) 轻量配置 | filter_remote每天自动更新；详见[QX远程规则](docs/qx-remote-rules.md) |
| 未采用上述 | 塔台重新导出并上传 | 结构不变时不需要；换节点/改组/改DNS仍走这条路 |

两个派生文件由 `python scripts/gen_overwrites.py` 从 tower.yaml 生成，验证脚本会检查同步；改完 tower.yaml 后重新生成并提交。

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
