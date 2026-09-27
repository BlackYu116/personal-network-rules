# QX 手动节点出口体检

`qx/exit-check.js` 检查你点选的一个节点。它向 Cloudflare 和 ipwho.is 各发送一次 HTTPS 请求，显示两边看到的出口 IP、国家代码、ipwho.is 的 ASN/ISP，以及各请求耗时。它不会更改策略组、读取节点密码、读取订阅内容、安装证书或修改分流规则。

## 在 Quantumult X 中使用

1. 先备份QX配置。脚本地址为[自己的GitHub Raw](https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/exit-check.js)，不是资源解析器地址。
2. 编辑现有 QX 配置，在已有 `[task_local]` 段增加下面一行；没有该段时再新增段名。不要替换整个现有配置。

   ```ini
   [task_local]
   event-interaction https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/exit-check.js, tag=出口体检, img-url=text.magnifyingglass.system
   ```

   也可下载脚本到“文件 → 我的iPhone → Quantumult X → Scripts”，将上面的URL换成 `exit-check.js`；远程引用与本地文件二选一。

3. 保存配置并开启 QX 隧道。打开节点列表，长按或打开**具体节点**的操作菜单，选择「出口体检」。不同 QX 版本的菜单位置可能不同；关键是从节点上下文菜单触发，让 QX 自动传入该节点名。
4. 不要从任务列表直接运行。没有收到节点名时脚本会明确报错，且不会发送请求或改用 direct。为避免歧义，名为 `direct`、`reject`、`proxy` 的保留名称也会拒绝。
5. 等待结果，通常几秒，单请求等待上限 8 秒，总保护时限 10 秒。失败时稍后手动重试；脚本不会自动切换节点或重试直连。JavaScript 时限结束等待，并不保证取消底层已发出的网络请求；迟到响应不会再次输出结果。

安装动作需由用户或获得授权的主任务执行，本文件和脚本本身不会修改 QX。若通过远程脚本方式部署，请使用自己核验的脚本链接，不要让陌生转换服务接收完整订阅。

## 如何读结果

- **两源一致**：两个检测站在这次请求中观察到相同 IP 和国家代码，不代表节点永久固定，也不代表所有网站都走同一出口。
- **来源不一致**：逐一显示两边结果，不合并成一个“真实 IP”。可能是 IPv4/IPv6、按目的地分流、出口轮换或数据库归属差异。先复测，暂不列为固定账户出口。ASN/ISP 只对应 ipwho.is 观察到的那个 IP。
- **部分失败 / 失败**：可能是节点、检测站、DNS、限流或响应格式问题，不直接宣布节点失效。错误不会显示原始异常、响应正文或凭据。
- 国家代码是数据库判断；Cloudflare 的 `colo` 是它接收请求的数据中心位置，不能当作代理出口国家，因此本工具不使用 `colo`。
- ASN/ISP 是网络归属线索，不是“真实家宽”证明。脚本不购买或推测付费住宅代理识别结果，也不提供 IP 风险分数。
- 耗时包括本次 HTTPS 请求流程，不等同于 ping、下载带宽或长期稳定性。此工具不测试 Claude、金融账号、流媒体解锁或账号风控。

两个服务会看到节点出口 IP、时间和普通 HTTP 请求信息；脚本不向它们发送订阅、节点名、节点密码或其他配置。ipwho.is 无需 API key；其免费接口可能限流且没有可用性保证。不要设置 cron 或批量高频扫描。

## 建议的日常分层

固定账户用途（金融、AI）使用 `static` 手选一个已经实际验证可用的出口，备用节点也手动切换。固定选择不保证服务资格、解锁或账号安全。`dest-hash` 按目标域名/IP 分配，一个 App 的多个域名仍可能走不同节点；`round-robin` 会按新连接轮换，二者都不能替代账户固定出口。

普通浏览只放少量已验证的节点入池，例如每个可用地区选 1–2 个。可用 `url-latency-benchmark` 做延迟优选，初始尝试 `check-interval=600, tolerance=80, alive-checking=false`；需要按顺序主备时使用 `available`。这组参数是保守起点，不是官方性能保证。不要把所有“美国”节点直接视作同等质量。

对候选节点在移动宽带和移动蜂窝分别记录：日期时间、节点名、本次出口 IP/国家/ASN、是否两源一致、耗时与失败情况。白天和晚高峰各测几次，再结合正常浏览/下载体验筛选。单次检测不能推出长期稳定性；目前脚本不保存历史记录。

## 版本、来源与验证边界

- 官方 [`sample-fetch-opts-policy.js`](https://github.com/crossutility/Quantumult-X/blob/master/sample-fetch-opts-policy.js) 标注 `opts.policy` 支持起点为 QX v1.0.25-build598，并说明 `event-interaction` 需要隧道运行、`$environment.params` 由节点 UIAction 自动传入。特定策略请求不复用连接，所以耗时包含完整建连过程。本工具采用文本 `title/message` 输出，无 HTML。
- 当前协议能力以 [App Store 版本历史](https://apps.apple.com/us/app/quantumult-x/id1443988620) 和设备安装版本为准：1.5.5 加入 REALITY，1.6.0 加入 AnyTLS。使用 AnyTLS 节点至少需要相应版本；旧教程“不支持”的说法已过时。
- [官方策略示例](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf) 定义 `static`、`available`、`url-latency-benchmark`、`round-robin`、`dest-hash`。该示例关于正则适用范围的注释与其示例存在不一致，具体候选筛选需在实际安装版本验证。
- [官方资源解析器](https://github.com/crossutility/Quantumult-X/blob/master/resource-parser.js) 不支持 HTTP 请求和持久化，因此本工具是独立手动任务，不是订阅解析器插件。
- [ipwho.is 官方文档](https://ipwhois.io/documentation) 确认无需 key、支持 HTTPS、省略 IP 时查询请求出口，并说明成功标记及 ASN/ISP 字段。检测地址为 `https://ipwho.is/?fields=success,ip,country_code,connection`；另一个地址为 `https://www.cloudflare.com/cdn-cgi/trace`。
- [MaxMind 准确性说明](https://support.maxmind.com/knowledge-base/articles/maxmind-geolocation-accuracy) 说明 IP 地理数据存在误差，不能定位到具体家庭。

2026-09-26 开发环境验证两个 HTTPS 地址均返回 200，所需字段存在；这不等于用户选定节点或 QX 真机已通过测试。运行 `node scripts/test_exit_check.js` 可执行离线 VM mocks，检查指定节点路由、不改配置、双源差异、超时、只调用一次 `$done` 和错误不回显原文。最终仍需在 QX 节点菜单实点一次确认设备兼容性。

## 把合格节点用于日常优选

先保留已有5组结构，金融、Crypto、AI都用手选。若想增加一组日常优选，在QX中选2–4个已经实测通过的**具体节点**，新增url-latency-benchmark组；不要直接纳入全机场，也不要只根据“日本/美国”标签判为合格。下面是格式示意，必须把候选名称替换为你自己的精确节点名后才能使用：

```ini
[policy]
url-latency-benchmark = 日常优选, 已验证节点A, 已验证节点B, check-interval=600, tolerance=80, alive-checking=false
```

该组不会自己成为默认出口，需要在“海外默认”的候选中显式加入它并选中。金融、Crypto、AI、News仍维持原手选组，不自动跟着切换。如果坚持只通过塔台维护组，也可在塔台建立对应优选策略后检查QX实际导出类型；不要同时在两处长期维护相互覆盖的组。

上述是可选的手动配置示例，本次没有替你增加组或改动任何运行配置。测速URL只证明该检测目标可达，不代表Claude/券商等真实业务验证通过。
