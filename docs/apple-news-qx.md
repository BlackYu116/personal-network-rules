# Apple News：Quantumult X 详细操作说明

核查日期：2026-09-26。此处是可选操作指南，没有在任何设备安装证书或启用重写。

Apple News 的地区提示不只看 IP。先用主配置的独立 `📰 Apple News` 组（默认 DMIT 美国）验证网络；若已能正常阅读，就不必安装证书或重写。只有仍显示地区不支持、且你接受下述局部 HTTPS 解密范围时，再试 iRingo 的**定位服务＋News 重写**。

普通 Clash 规则只决定出口，无法执行本指南中的 QX 脚本。iOS 26.0 起，原作者明确说明地区判断会综合 GPS、SIM 移动国家代码、Wi-Fi 国家/地区代码、互联网等信号；定位模块不能修改所有检测结果。移动 SIM 与 Tello 同时存在时，也不能假定设备会被判定在美国。[原作者定位服务文档源码](https://github.com/NSRingo/NSRingo.github.io/blob/main/docs/guide/GeoServices/location-service.mdx)

以下菜单以功能名称定位；QX 版本和语言不同，按钮位置可能变化。本次未操作你的手机，因此不把具体按钮位置当作实机验证结果。

## 0. 先备份与确认基础连接

1. 打开 QX 的设置页，进入「配置文件」，保存当前配置副本或导出到“文件”App 的本机位置；记录文件名和日期。完整配置可能包含机场密码和 MITM 私钥，不要分享到公开链接。
2. 先完成塔台基础配置的 QX 导出与导入，再做下文。回到 QX 的策略列表，点开 `📰 Apple News`，手动选中 DMIT 美国；保持这个组名。如果找不到该组，先修复塔台导出配置，不要把后文规则绑到不存在的策略。
3. 确认普通网页能正常使用。暂时停用其他修改Apple地区的重写，避免两个模块同时处理同一请求；不要清空整个配置。
4. 下列飞行模式步骤会暂时中断蜂窝网络，安排在方便测试的时间；完成后恢复日常状态并检查Tello。

## 1. 设置设备地区

iPhone「设置 → 通用 → 语言与地区 → 地区」选美国，或你需要的其他Apple News支持地区。

这是**设备地区**，不是要求你更改Apple账户/App Store国家，也不会自动赋予News+订阅。先保留现有账户和付款信息。[原作者News说明](https://nsringo.github.io/guide/apple-news)

## 2. 先只验证 News 分流

若塔台已经生成了相同规则，不必重复添加。否则进入 QX「设置 → 分流 → 规则」的本地规则编辑入口，添加下面规则，并放在通用 Apple 直连和 `final` 之前。如果使用配置文本编辑器，放到已有的 `[filter_local]` 段内；不要再创建第二个同名段，也不要把整个示例当节点订阅导入。

```ini
host-suffix, apple.news, 📰 Apple News
host, news-edge.apple.com, 📰 Apple News
host, news-todayconfig-edge.apple.com, 📰 Apple News
host, news-events.apple.com, 📰 Apple News
host, news-sports-events.apple.com, 📰 Apple News
host, news-client.apple.com, 📰 Apple News
host, news-client-search.apple.com, 📰 Apple News
host, news-assets.apple.com, 📰 Apple News
host, apple.comscoreresearch.com, 📰 Apple News
host, gateway.icloud.com, 📰 Apple News
```

`gateway.icloud.com`用于首次内容加载的海外路由；它是共享iCloud端点。这里仅分流，不要求对它做MITM。

保存后，保持 QX 开启并使用规则分流模式，打开 News，再到「网络活动」搜索 `news`、`gateway.icloud.com`，查看实际命中的策略及节点。测试首页和一篇免费文章。如果已经能读，直接跳到“以后更新塔台配置时”。如果仍是地区提示，再继续下文。仅能打开首页，或只显示不同的错误，都不能算完整验收通过。

## 3. 添加两个原作者重写引用

进入 QX「设置 → 重写 → 引用」，点新增引用按钮（通常是 `＋`）。先添加一项，保存并检查下载状态，再添加另一项。按下列名称和地址填写，首次可先保持引用关闭，等证书和主机名检查完成后再启用。

名称填 `iRingo News`，地址填 News v3.2.1（发布于 2024-12-10）：

```text
https://github.com/NSRingo/News/releases/download/v3.2.1/iRingo.News.snippet
```

名称填 `iRingo 定位`，地址填 LocationService v1.0.1（发布于 2025-10-24）：

```text
https://github.com/NSRingo/LocationServices/releases/download/v1.0.1/iRingo.LocationService.snippet
```

保存并更新引用，确认没有下载或解析错误。它们是重写资源，**不是节点订阅，不要放到服务器列表，也不要覆盖整个 QX 配置**。若界面提供资源解析器选项，这两个原生 QX snippet 不需要第三方转换解析器。

本次重新核对 GitHub API，上述仍为各自最新稳定发布；这不等于作者已对你当前系统做过验证。固定版本的子脚本同样引用相应版本，便于核查与回退，但仍需信任原作者发布渠道。不要再导入功能重复的旧版合集，也不必为基础试验额外安装 BoxJs。

[News固定版本](https://github.com/NSRingo/News/releases/tag/v3.2.1) · [定位固定版本](https://github.com/NSRingo/LocationServices/releases/tag/v1.0.1)

## 4. 使用你自己的MITM证书

HTTPS重写需要QX解密匹配域名的请求。如果已有由你自己的QX生成、且与当前配置匹配的可信证书，可以继续用，不必重新生成。

若没有：

1. QX「设置 → MitM/HTTPS解密」中生成自己的证书，然后选择配置/安装证书。
2. 按提示在Safari允许下载描述文件。
3. iPhone「设置 → 通用 → VPN与设备管理」，找到刚下载的QX证书描述文件，安装并输入设备解锁密码。
4. 再到「设置 → 通用 → 关于本机 → 证书信任设置」，仅对你刚生成的QX根证书启用完全信任。
5. 返回 QX，先核对下一节的主机名，再在第 6 节一起开启 MITM 与重写。

证书安装与信任是两步，需要你在手机上手动完成。只信任自己生成的证书，不下载别人共享的 P12、根证书或私钥，不将自己的证书、P12 或口令放入 GitHub、塔台导出模板或 VPS 订阅文件。若系统中没有“根证书完全信任”列表，先确认描述文件已经安装；不要用另一份陌生证书代替。[Apple 官方证书信任步骤](https://support.apple.com/en-us/102390)

保持服务器证书校验开启；不要把“跳过证书验证”当作排错手段。QX 官方配置示例也将根证书口令和 P12 标为私密数据。[QX 官方配置说明](https://github.com/crossutility/Quantumult-X/blob/master/sample.conf)

## 5. 限定最终MITM范围

打开 QX 的 MITM 设置，检查本地主机名与远程重写引用合并后的范围。上述固定版本的原始 MITM 名单合计以下 8 项；如果资源已自动带入，不要重复添加。若需手动填写，在主机名编辑区逐项添加；文本配置的 `hostname` 字段使用逗号分隔。

```text
news-edge.apple.com
news-todayconfig-edge.apple.com
news-events.apple.com
news-sports-events.apple.com
news-client.apple.com
news-client-search.apple.com
gspe1-ssl.ls.apple.com
dispatcher.is.autonavi.com
```

不要使用 `*` 或 `*.apple.com` 全站解密，也不要把银行、券商、Crypto 域名放入 MITM。`dispatcher.is.autonavi.com` 说明定位模块还会处理部分地图请求，影响范围不只 News；不接受这个范围就停在这里，不开启定位模块。`news-assets.apple.com`、`apple.comscoreresearch.com` 和 `gateway.icloud.com` 虽在路由规则中，**不在此 MITM 名单中**。路由列表与解密列表不能互相复制。

## 6. 触发并验证

1. 开启QX，确认News策略是DMIT美国，两个重写引用及MITM开关已开启。
2. 打开飞行模式，然后重新打开 Wi-Fi；确认 QX 仍处于连接状态。在 App 切换器中上划关闭 News 和地图，再先打开地图，尝试触发系统地区请求。无 SIM 的设备无需用飞行模式隔离蜂窝信号。
3. 在 QX 网络活动/重写记录中查找 `gspe1-ssl.ls.apple.com/pep/gcc`，检查脚本是否执行、有无错误。Safari 访问 `https://gspe1-ssl.ls.apple.com/pep/gcc` 显示 US 可帮助验证重写，但**不能单凭 Safari 结果认定系统地区检测已通过**；还应观察系统实际请求。看不到请求不代表成功，可能尚未触发或使用了缓存。
4. 打开News，分别检查首页和一篇免费文章。若首页正常但内容加载失败，检查 `gateway.icloud.com` 是否走预期出口。
5. 恢复日常蜂窝状态，再打开News测试。如果又出现地区提示，说明方案未稳定保持；不要继续以“已经解锁”作为结论。
6. 检查地图、天气和Tello是否仍正常。

原作者说明在蜂窝/MCC重新参与检测后可能失效；较新的iOS又增加了其他地区信号。因此这些步骤是实验流程，不是稳定可用保证。具体顺序以[原作者News指南](https://nsringo.github.io/guide/apple-news)及设备版本为准。

| 观察结果 | 下一步 |
| --- | --- |
| 远程引用下载或脚本加载失败 | 核对固定版 URL 和联网情况，先解决加载错误；不要改成全站 MITM。 |
| 出现证书不可信或 TLS 错误 | 检查 QX 当前证书与系统安装、完全信任的证书是否是同一份。 |
| 重写执行、出口正确，仍提示地区不支持 | 记录 iOS 版本及是否仅飞行模式下有效；可能是多因素检测，停止叠加更多脚本。 |
| 首页出现但文章加载失败 | 检查该次请求的实际策略、节点与错误；“Feed Unavailable”不等于成功。 |
| 免费文章正常、News+ 文章打不开 | 先确认已有订阅及 Apple 账户权益，不把这类问题归结为分流。 |

## 7. 回退

1. 进入「重写 → 引用」，关闭 `iRingo News` 和 `iRingo 定位`；确认它们提供的远程 MITM 主机名已退出生效范围，并删除此次手动添加的同名本地主机名。
2. 恢复试验前的设备地区、策略选择。如果 MITM 只用于本次实验，关闭其总开关；保留其他既有配置。
3. 若证书只用于本次实验且不再需要，在「设置 → 通用 → 关于本机 → 证书信任设置」取消对应证书信任，再到「VPN 与设备管理」删除该证书描述文件。不要删除其他用途的证书。
4. 重启 News 与地图，再检查 Tello 和日常网络。必要时切回备份的 QX 配置。`📰 Apple News` 分流组本身可以保留，它不执行 HTTPS 解密。

## 以后更新塔台配置时：保留 QX 本机层

塔台负责节点、策略组和路由；News 重写引用、MITM 主机名与证书由这台设备的 QX 保管。**完整配置重新导入可能覆盖这些内容，不要假定 QX 会自动合并保留。**

1. 更新塔台导出前，在 QX 再做一次本机备份，记录两个重写引用及其开关、MITM 主机名、当前证书名称、`📰 Apple News` 的选择。
2. 先把新导出的完整 QX 配置导入为另一份配置（若当前版本支持），保留旧文件可切回；确认新配置中仍有原名 `📰 Apple News` 且默认选 DMIT。
3. 在新配置重新加入两个固定版重写引用，并核对 MITM 范围。若编辑文本，相关内容分别在 `[rewrite_remote]` 和 `[mitm]`；不要用旧的整个配置覆盖新节点与路由。
4. QX 内的证书必须与 iOS 已信任的那份一致。若当前版本能保留/选用原有本机证书，继续使用；若它随配置丢失，使用自己的私密备份恢复，或重新生成并按第 4 节安装信任新证书。不要把旧私钥复制进塔台或公共模板。
5. 验证分流、免费文章和恢复蜂窝后的表现，成功后再把新配置作为日常配置。失败可切回原备份，避免边使用边丢失已知可用状态。

只刷新已有节点资源或规则资源，通常无需替换整份 QX 配置；只有需要同步塔台的整体组结构等变动时，才走上面的完整导入流程。任何包含 P12、口令、订阅或节点凭据的备份都留在私人本机存储中。

## News+与Shadowrocket

News+仍需真实订阅，地区重写不会授予付费阅读权益。`NewsPlusUser`选项只是影响部分搜索展示。[Apple官方订阅说明](https://support.apple.com/en-us/102209)

News v3.2.1 发布说明明确已完全不再支持 Shadowrocket；不要把本 QX 方案直接当作小火箭通用模块。这里也没有验证你的设备已解锁 News。[发布说明](https://github.com/NSRingo/News/releases/tag/v3.2.1)
