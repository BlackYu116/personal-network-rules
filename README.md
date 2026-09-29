# Personal Network Rules

**只维护业务分流，不绑定VPS、机场、节点名称或国家标签。** 节点来源由塔台管理；GitHub保存个人例外、上游规则引用和策略关系，不保存节点凭据。

## 导入

在塔台「规则 → 导入」使用：

```text
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/tower.yaml
```

这是规则方案，不是含节点的订阅。先在塔台启用并勾选你的节点，再导入规则并按客户端导出。

**首次使用必须做两次选择：**在“🌍 海外默认”选日常出口，在“🪙 Crypto”选Crypto出口（按目前偏好手选实测日本节点）。两组初始均为REJECT，不会根据节点名字猜测实际国家，也不会自动挑选某个机场。选完后更新规则资源；客户端支持时会保存选择。旧客户端持久选择可能覆盖文件首项，迁移时应检查。

## 五个通用策略组

| 组 | 初始选择 | 用途 |
|---|---|---|
| 🌍 海外默认 | REJECT，首次手选节点 | 其他境外流量、个人强制代理例外 |
| 🏦 金融 | 海外默认 | HSBC境外业务、IBKR、Schwab、Longbridge；也可单独固定节点 |
| 🪙 Crypto | REJECT，首次手选节点 | Binance、OKX、TradingView及其他Crypto |
| 🤖 AI / X | 海外默认 | 境外AI和X；也可单独固定节点 |
| 🛑 广告过滤 | REJECT | 可临时改选海外默认或DIRECT排查误杀 |

前四组可直接选择当前启用的任意节点。更换机场或停用自有VPS，不需要改分流规则；重新导出节点后检查旧选项是否仍存在。没有国家组、供应商品牌过滤，**也没有任何自动测速/自动切换组**——全部出口手选并保持，出口IP稳定是账户风控的一部分，这是有意设计；换出口永远是显式的手动动作。国内银行、国内网站、内网和Tello指定域名仍直连。

Apple News不再单独分组，没有强制 `gateway.icloud.com` 的特殊路由。Microsoft也不再整家公司一律直连：已有国内分类走直连，其余按海外规则处理；其AI服务优先进入AI组。历史News文档及旧规则URL暂留以兼容旧导出，新模板不引用。

## 日常只维护少量例外

| 需求 | 修改文件 |
|---|---|
| 强制直连 | [rules/direct.yaml](rules/direct.yaml) |
| 强制使用海外默认 | [rules/proxy.yaml](rules/proxy.yaml) |
| 金融专用域名补充 | [rules/finance.yaml](rules/finance.yaml) |
| Crypto/TradingView补充 | [rules/crypto.yaml](rules/crypto.yaml) |
| AI/X补充 | [rules/ai-x.yaml](rules/ai-x.yaml) |
| 策略关系、顺序、基础DNS | [tower.yaml](tower.yaml) |

在GitHub文件页点铅笔编辑并提交。Raw是读取地址，不能在Raw页面保存修改。`+.example.com`匹配主域及子域；`api.example.com`只匹配精确域名。文件中不写节点名称、订阅URL、证书或密码。

个人例外位于通用数据库前，直连例外优先于强制代理例外。不要把同一域名同时放进相反列表。业务分类使用一个统一上游数据库，个人文件只补需求，不同时堆叠多套中国域名库或广告库。

## 规则逻辑

优先级为：内网 → 明确直连及HSBC China → 明确海外例外 → 个人业务例外 → 金融/Crypto/AI/X上游分类 → 可切换广告过滤 → 国内域名/IP → 海外默认。

业务分类优先于通用广告库，是考虑账户登录和交易功能的稳定性；这可能放行属于业务域名的部分追踪请求。广告误杀优先用少量明确例外修正，广告组临时放行用于排查。完整理由、ACL4SSR对照及限制见[规则设计](docs/routing-design.md)。

## 塔台与客户端

- 节点保持手动更新，代理集合关闭；“优先使用规则集”开启。
- 改个人子列表：保留远程引用的客户端可每天更新；被展开为静态行的配置需刷新重导，或采用下面的自动更新方案。
- 改组、基础DNS或规则顺序：塔台重新导入模板并重新导出。
- “通用”指规则与节点来源解耦，不代表Clash、QX、Shadowrocket的原生语法完全相同。分别导出并检查兼容提示。

### 改完 rules/*.yaml 后，规则怎么到设备

| 设备 | 采用方案 | 生效方式 |
|---|---|---|
| OpenClash | [mihomo/openclash-ruleset-overwrite.ini](mihomo/openclash-ruleset-overwrite.ini) 覆写模块 | 18个规则集恢复远程引用，每天自动更新；详见[OpenClash自动更新](docs/openclash.md) |
| Quantumult X | [qx/filter-remote-snippet.conf](qx/filter-remote-snippet.conf) 轻量配置 | filter_remote每天自动更新；详见[QX远程规则](docs/qx-remote-rules.md) |
| 未采用上述 | 塔台重新导出并上传 | 结构不变时不需要；换节点/改组/改DNS仍走这条路 |

两个派生文件由 `python scripts/gen_overwrites.py` 从 tower.yaml 生成，验证脚本会检查同步；改完 tower.yaml 后重新生成并提交。

[塔台导入与迁移](docs/tower.md) · [DNS边界](docs/dns.md) · [OpenClash自动更新](docs/openclash.md) · [IPv6路线](docs/ipv6.md) · [透明代理调优](docs/transparent-proxy.md) · [Tello](docs/tello.md) · [QX远程规则与文件体积](docs/qx-remote-rules.md)

## Quantumult X 工具

- [资源解析器与Invalid response排查](docs/qx-resources.md)
- [节点出口体检与优选方法](docs/node-quality.md)
- [机场候选与现有订阅的分工](docs/provider-options.md)

解析器地址：`https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/resource-parser.js`。

## 验证与来源

GitHub Actions检查分流场景、策略引用、任意命名节点、空节点池、资源解析器及手动体检脚本。测试不需要私人订阅。可用本地Mihomo额外校验基础配置和可选DNS/UDP片段。

```sh
python -m pip install -r requirements.txt
python scripts/validate.py
python scripts/validate.py --mihomo-bin /path/to/mihomo
```

借鉴[ACL4SSR在线模板](https://github.com/ACL4SSR/ACL4SSR/blob/master/Clash/config/ACL4SSR_Online.ini)的分层、统一出口和广告开关思路；公共域名/IP数据继续引用[MetaCubeX/meta-rules-dat](https://github.com/MetaCubeX/meta-rules-dat)。没有复制并叠加整套ACL4SSR数据库。

结构和规则验证不代表每个网站、每家银行或每台设备都已经实机通过；个别应用的共享域名、CDN、IP归属和地区条件仍需按实际请求修正。
