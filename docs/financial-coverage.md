# 银行和券商覆盖：按地区与共享服务维护

核查日期：2026-10-17。维护源为 [data/financial-services.yaml](../data/financial-services.yaml)，包含75条机构基线、专用服务和共享入口记录；它不是“75家银行”。所有域名均带来源和适用边界，未登录账户，也未声称已经覆盖每个App的全部后端。

## 出口结构

| 策略 | 覆盖方式 | 初始选择 |
|---|---|---|
| 银行-内地 | 已列明的大陆银行及特定内地分行入口 | DIRECT |
| 银行-香港 / 美国 / 新加坡 | 地区专用银行、支付与相关已验证业务主机 | REJECT，使用前手选 |
| 券商-香港 | 按用户使用偏好归香港的长桥域族、Phillip香港 | REJECT，使用前手选 |
| 券商-美国 | 嘉信/thinkorswim、Fidelity、ETrade、Firstrade及列明美国入口 | REJECT，使用前手选 |
| 券商-新加坡 | 已核实新加坡专用券商入口，如Phillip/POEMS | REJECT，使用前手选 |
| 富途/Moomoo、Webull、Tiger | 各品牌专用网站、共享登录/API/CDN使用同一个品牌组 | 跟随香港券商，可手动改为美国/新加坡券商或具体节点 |
| 金融 | IBKR、HSBCnet、渣打、部分Citi/Amex/TD等无法按账户地区拆分的入口 | 跟随海外默认，可单独手选 |

保留原有海外默认、Crypto、AI/X和广告组，共15组，全部为select。没有按节点名字自动猜国家、没有测速换出口。新品牌组默认跟随香港券商是这套以香港券商为主要需求的使用配置，不是声称这些品牌只有香港业务。

同一品牌若同时使用多个国家账户，而且它们共用同一HTTPS主机，域名规则不能按账号分流；品牌组需要选择当时所用账户的稳定出口。不能声称新增一条规则就可以自动识别两个国家的账户。

## 香港银行

依据[HKMA名册](https://vpr.hkma.gov.hk/eng/regulatory-resources/registers/register-of-ais-and-lros/)与各银行官方站点，核查了27家传统及数字银行。26家的列明专用域名可进入香港银行组，渣打的共享主机留金融兜底。

传统银行专用覆盖包括：汇丰、中银香港、工银亚洲、建行亚洲、恒生、东亚、花旗香港、星展香港、招商永隆、中信银行国际、南洋商业、集友、创兴、上海商业、大新、富邦香港、华侨香港、交通银行香港。

数字银行覆盖包括：ZA、Mox、WeLab、livi、Fusion、Ant Bank香港，以及EleBank/原Airstar和Ping An Digital Bank/原PAO的新旧域名。[逐家官网、登录入口和证据](evidence/2026-10-17-hk-expansion.json)

特别保护两种父子域冲突：

- `asia.ccb.com`、`online.asia.ccb.com` → 香港银行，优先于大陆 `ccb.com`。
- `cn.cmbwinglungbank.com` → 内地银行，优先于香港 `cmbwinglungbank.com`。

没有把整个 `icbc.com.cn`、`bankcomm.com`、`sc.com` 等全球/母行域名当作香港银行。地区规则使用专用子域和明确例外，不按服务器IP所在国家猜测服务地区。

## 美国银行与支付服务

覆盖HSBC美国、Mercury、美国华美/Velo、Chase、Bank of America、Wells Fargo、Capital One、U.S. Bank、PNC、TD美国、Discover、Ally、SoFi、Citi专用零售入口，以及Brex/Ramp的列明服务域。

Mercury、Brex、Ramp是金融科技服务，本规则组将其作为美国资金服务处理，不把它们描述为持牌银行。华美美国使用 `eastwestbank.com`/`velobank.com`，不是菲律宾的 `eastwestbanker.com`。[逐家公开登录与服务证据](evidence/2026-10-17-us-expansion.json)

`depositbridgeplus-eastwestbank.fisglobal.com`、TD美国的特定业务主机等按精确主机处理，不把整个FIS或第三方平台都分美国。

`www.citi.com`、`online.citi.com`、`www.americanexpress.com`、`www.td.com`及 `eastwest.bankonline.com` 存在共享国家路径或美港业务。无法只靠域名自动选国家，保留金融共享策略；`citibankonline.com`、`tdbank.com`及已确证的地区专用入口另外优先匹配。

## 地区券商和共享接口

- 长桥：整个已核实Longbridge/LongPort域族，包含网站、旧SDK、新API、报价/交易和静态资源，按用户明确要求归香港券商。`.cn`或`.sg`服务入口仍按该使用偏好处理，不据后缀误认账户司法辖区。
- 嘉信/thinkorswim：官网、登录、下载、分享、已核实的交易服务和历史TD Ameritrade入口统一美国券商。Schwab Bank与券商共用登录，不能另外拆成另一银行出口。
- 富途/Moomoo：香港和新加坡专用网站，以及 `futunn.com`、`futustatic.com`、Moomoo等共享域，统一富途/Moomoo组，避免官网香港而共享登录美国。
- Webull：`webull.hk`、`webull.com`、香港明确交易主机与共享 `webullfintech.com` 使用同一Webull组。
- Tiger：香港/新加坡专用域与 `itiger.com` 等共享业务域使用同一Tiger组。
- 另补Phillip/POEMS香港和新加坡、Fidelity、ETrade、Firstrade及已核实Robinhood/Vanguard美国入口。
- IBKR跨地区共享网站与登录仍走金融，不擅自根据交易所或账户地区猜出口。

[券商官网、上游规则与共享API证据](evidence/2026-10-17-broker-expansion.json)。官网CSP里出现某主机，证明它是允许的来源，不证明本次已建立所有连接；共享第三方行情、视频或云厂商仍不整域硬绑某个券商。

## 新加坡与既有功能

HSBC Singapore、DBS/POSB、OCBC、UOB、Starryblu保留原有覆盖。`velocity.ocbc.com`是跨地区共享企业入口，优先于宽泛的 `ocbc.com` 新加坡规则。香港 `hk.dbs.com` 也先于共享 `dbs.com`。[上一轮公开证据](bank-regions.md)

银行和券商规则优先于广告和中国IP分类；明确直连例外仍优先。Tailscale私有节点继续由塔台维护，专用前置规则及OpenClash网络接管要求见[tailscale.md](tailscale.md)。本次不改变路由器设置。

## 维护和验收

修改 `data/financial-services.yaml` 的机构、域名、策略和来源后执行：

```sh
python scripts/gen_financial_rules.py
python scripts/gen_overwrites.py
python scripts/validate.py
```

不要直接编辑生成的金融列表。验证器会逐条检查源目录与派生列表同步，并测试后缀根域、子域、列明登录主机、共享例外、父子域优先级、任意节点名和空节点池。离线用例是匹配测试，不是银行登录、行情或交易实测。

这是策略组结构升级：塔台必须重新导入完整模板并确认15组后再导出；只刷新子列表不够。新增地区组未选节点时会按设计REJECT。不使用的地区组可以保持REJECT。

个别不可用还可能是维护、出口IP信誉、设备或服务限制。例如核查当日OCBC香港官网正在公告核心系统维护；不能把每次不可用都归因于分流，也不应为此自动轮换账户出口。
