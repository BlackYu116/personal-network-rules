> 最新完整覆盖和15组结构见[financial-coverage.md](financial-coverage.md)。本页保留第一轮HSBC/Starryblu/嘉信域名证据，以下旧分组说明已被新结构替代。

# 地区银行与券商：固定出口和域名边界

核查日期：2026-10-17。仅核查官方公共站点和公开规则，没有登录账户或验收 App。

## 地区组怎么选

| 策略组 | 覆盖范围 | 文件初始选择 |
|---|---|---|
| 🏦 银行-内地 | 汇丰中国，以及工行、建行、中行、农行、招行、交行的列明域名 | DIRECT |
| 🏦 银行-香港 | 汇丰香港、ZA Bank 的列明银行业务域名 | REJECT，手选固定香港出口 |
| 🏦 银行-美国 | 汇丰美国专用域名 | REJECT，手选固定美国出口 |
| 🏦 银行-新加坡 | 汇丰新加坡、DBS/POSB、OCBC、UOB、Starryblu 的列明域名 | REJECT，手选固定新加坡出口 |
| 🏦 金融 | IBKR、嘉信/thinkorswim、Longbridge、其他地区及无法按地区拆分的共享银行入口 | 跟随海外默认，可独立固定 |

节点名称不是地区证明。先核实实际出口，再在相应组手选并保持；本模板不测速或自动换节点。内地银行仍默认直连，其他国内银行继续由国内分类直连；没有宣称这份短列表覆盖所有银行。

## HSBC 为什么必须先细分再兜底

地区列表在宽泛的 `hsbc.com` 和上游 HSBC 全品牌集合之前：

| 地区 | 收录后缀 | 官方公开证据 |
|---|---|---|
| 美国 | `us.hsbc.com`、`us.personal-banking.hsbc.com` | [美国网银](https://www.us.hsbc.com/online-banking/)、[美国注册入口](https://www.us.hsbc.com/register/)；公开页面引用个人银行服务子域 |
| 香港 | `hsbc.com.hk`、`hk.personal-banking.hsbc.com` | [香港网银](https://www.hsbc.com.hk/ways-to-bank/internet/)、[香港 App](https://www.hsbc.com.hk/ways-to-bank/mobile-apps/banking/)；公开页面引用香港个人银行服务子域 |
| 内地 | `hsbc.com.cn`、`hsbcqh.com.cn`、`hsbcinsurance.com.cn`、`cn.secure.hsbcnet.com` | [中国网银](https://www.hsbc.com.cn/ways-to-bank/online/)，含中国专用 HSBCnet 登录链接；前三项也见[上游 hsbc-cn](https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/hsbc-cn.yaml) |
| 新加坡 | `hsbc.com.sg` | [新加坡网银](https://www.hsbc.com.sg/ways-to-bank/online/)、[安全登录](https://www.hsbc.com.sg/security/) |

全球 `hsbc.com`、`hsbcnet.com`、英国等未细分地区仍走“金融”。不能把整个 `hsbc.com` 当作美国业务，也不能因为中国入口用了 HSBCnet，就把全球 HSBCnet 全部直连。[HSBCnet 登录说明](https://www.hsbcnet.com/hsbcnet-getting-started/logging-on-to-hsbcnet)

同一 HTTPS 主机的不同 URL 路径、账号或国家选项无法靠域名规则区分。HSBC Global View 可在同一 App 中显示多个地区账户；共享主机只能共用一个路由策略。此时应根据实际连接记录决定共享入口使用哪个稳定出口，不解密 HTTPS、不承诺规则自动识别账户地区。[新加坡 App FAQ](https://www.hsbc.com.sg/ways-to-bank/mobile/singapore-app/faq/)

## 香港和新加坡覆盖

- ZA：`bank.za.group`、`bank-invest.za.group`、`business-internet-banking.za.group`、`cdn.za.group` 来自[官方银行页面](https://bank.za.group/en)的银行业务与资源链接。没有把整个 `za.group` 及其保险、博客、SDK 服务全部归香港银行；列表不是手机 App API 的完整清单。
- DBS/POSB：`dbs.com.sg`、`posb.com.sg`。两者共用 digibank 体系；`dbs.com` 是集团共享域，不据品牌把整个集团判为新加坡。[DBS 官方说明](https://www.dbs.com.sg/personal/digital-banking/ibanking-mobile-app)、[POSB 官方说明](https://www.posb.com.sg/personal/deposits/bank-with-ease/e-services-existing-ib-customer.page)
- OCBC：`ocbc.com`，包括 `internet.ocbc.com`，依据[新加坡网银登录说明](https://www.ocbc.com/personal-banking/help-and-support/digital-banking/online-banking-login)。它也是集团域；未来使用其他地区的 OCBC 账户时需复核共享入口。`ocbc.com.my` 不会被这条后缀规则匹配。
- UOB：`uob.com.sg`、`uob.sg`、`uobgroup.com.sg`，分别覆盖公开登录和新加坡服务页面。没有把 `uobgroup.com` 全集团强制归新加坡。[官方个人网银说明](https://www.uobgroup.com.sg/personal/digital-banking/pib/index.page)、[新加坡官网](https://www.uob.sg/personal/index.page)、[个人登录入口](https://pib.uob.com.sg/auth/)
- Starryblu：`starryblu.com`、精确主机 `h2static.wotransfer.com` 和 `starryblu-public.oss-accelerate.aliyuncs.com` 归新加坡组。依据[官方公司页](https://www.starryblu.com/en/company)及其公开前端生产配置；没有扩大到整个 `wotransfer.com`、`aliyuncs.com` 或同集团其他汇款产品。它是支付服务，此分类不将其描述成银行或评价金融产品。
- 内地其他列明域名依据对应官方站点：[工商银行](https://www.icbc.com.cn/)、[建设银行](https://www.ccb.com/)、[中国银行](https://www.boc.cn/)、[农业银行](https://www.abchina.com/)、[招商银行](https://www.cmbchina.com/)、[交通银行](https://www.bankcomm.com/)。全球共享域不等于每项海外服务都属于大陆账户；未来使用这些银行的境外业务时需细分。

## 嘉信与 thinkorswim 共用金融出口

保留上游 `schwab` 对 `schwab.com`、`schwabcdn.com`、资产管理和各地区嘉信官网的覆盖；个人列表另外补 `thinkorswim.com`、`tos.mx`、`schwab.tech`、`schwabcloud.com`，以及当前重定向嘉信官网的历史 `tdameritrade.com`、`ameritrade.com`。这些统一使用“🏦 金融”，不因下载、登录、行情主机不同而自动切换出口；用户可给金融组单独固定节点。

[Schwab官方下载页](https://www.schwab.com/trading/thinkorswim/download)公开链接 `tosmediaserver.schwab.com` 和 `trade.thinkorswim.com`；[thinkorswim官方分享手册](https://toslc.thinkorswim.com/center/howToTos/thinkManual/Tools/Sharing)说明 `tos.mx`。2026-10-17公开交易页的CSP还列出 `*.schwab.tech` 与 `thinkorswim-services-b.tos-prd.prd.gcp.schwabcloud.com` 等业务来源。这是官方声明的可用来源，不能据此声称本次已连接所有服务。

第三方行情、视频、分析平台是共享域，未把整个 MarkitDigital、WSOD、CNBC 或云厂商域名绑定金融。实际缺少哪条请求，应从连接记录提取精确主机再补；未登录交易账户，也未验证桌面/移动端所有API和实时行情。[详细域名证据](evidence/2026-10-17-broker-domains.txt)

## 与其他规则的关系

地区银行先于通用 HSBC、广告和中国 IP 分类；明确直连例外仍在地区银行之前。已知业务子域先于 GitHub 这类整站海外例外，Copilot 的独立服务子域不再被 GitHub 普通出口抢走；同主机路径仍无法拆分。[GitHub 官方端点](https://docs.github.com/en/copilot/reference/copilot-allowlist-reference)

规则匹配正确不保证账户可用：IP信誉、银行允许地区、设备状态、App 共用服务、DNS、协议和网络接管仍需实际核对。不要因一次失败让银行组自动轮换多国出口。新增 App 域名应先看连接日志，再按证据补入对应 `rules/bank-*.yaml`。

重新导入顶层模板才能得到九个组；仅刷新子列表不会创建新策略组。第一次使用时核对实际选中项，缓存可能覆盖文件首项。
