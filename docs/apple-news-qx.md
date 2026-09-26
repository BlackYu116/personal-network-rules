# Apple News：Quantumult X详细步骤

核查日期：2026-09-26。此处是可选操作指南，没有在任何设备安装证书或启用重写。

Apple News的地区提示不只看IP。iRingo方案使用**可用地区出口＋定位/News重写**；普通Clash规则无法独立实现。iOS26的多因素检测仍可能使方案失效，特别是SIM国家代码、GPS、Wi-Fi国家代码等。[原作者定位服务说明](https://nsringo.github.io/guide/GeoServices/location-service)

## 0. 先备份与确认基础连接

1. 在QX保存当前配置副本，仅保存在自己的设备；完整配置可能包含机场密码和MITM私钥。
2. 先完成塔台基础配置的QX导出与导入，再做下文。确认 `📰 Apple News` 组存在且选中DMIT美国；组名以实际QX导出结果为准。
3. 确认普通网页能正常使用。暂时停用其他修改Apple地区的重写，避免两个模块同时处理同一请求；不要清空整个配置。
4. 下列飞行模式步骤会暂时中断蜂窝网络，安排在方便测试的时间；完成后恢复日常状态并检查Tello。

## 1. 设置设备地区

iPhone「设置 → 通用 → 语言与地区 → 地区」选美国，或你需要的其他Apple News支持地区。

这是**设备地区**，不是要求你更改Apple账户/App Store国家，也不会自动赋予News+订阅。先保留现有账户和付款信息。[原作者News说明](https://nsringo.github.io/guide/apple-news)

## 2. 确认QX的News分流

若塔台已经生成了相同规则，不必重复添加。否则在QX「设置 → 分流/规则 → 本地规则」中，将下面规则放在通用Apple直连和final之前。示例策略名是 `📰 Apple News`；若导出后名称不同，替换成你实际的组名。

```ini
host-suffix, apple.news, 📰 Apple News
host, news-edge.apple.com, 📰 Apple News
host, news-todayconfig-edge.apple.com, 📰 Apple News
host, news-events.apple.com, 📰 Apple News
host, news-sports-events.apple.com, 📰 Apple News
host, news-client.apple.com, 📰 Apple News
host, news-client-search.apple.com, 📰 Apple News
host, gateway.icloud.com, 📰 Apple News
```

`gateway.icloud.com`用于首次内容加载的海外路由；它是共享iCloud端点。这里仅分流，不要求对它做MITM。

## 3. 添加两个原作者重写引用

QX「设置 → 重写 → 引用 → ＋」（不同版本入口名称略有差异），分别添加：

News v3.2.1：

```text
https://github.com/NSRingo/News/releases/download/v3.2.1/iRingo.News.snippet
```

LocationService v1.0.1：

```text
https://github.com/NSRingo/LocationServices/releases/download/v1.0.1/iRingo.LocationService.snippet
```

分别命名为“iRingo News”和“iRingo 定位”，下载并启用引用，打开重写总开关。它们是重写资源，**不是节点订阅，不要放到服务器列表，也不要覆盖整个QX配置**。若界面提供资源解析器选项，这两个原生QX snippet不需要第三方转换解析器。

固定版本的子脚本同样引用相应版本，便于核查与回退，但仍需信任原作者发布渠道。不要再导入功能重复的旧版合集。

[News固定版本](https://github.com/NSRingo/News/releases/tag/v3.2.1) · [定位固定版本](https://github.com/NSRingo/LocationServices/releases/tag/v1.0.1)

## 4. 使用你自己的MITM证书

HTTPS重写需要QX解密匹配域名的请求。如果已有由你自己的QX生成、且与当前配置匹配的可信证书，可以继续用，不必重新生成。

若没有：

1. QX「设置 → MitM/HTTPS解密」中生成自己的证书，然后选择配置/安装证书。
2. 按提示在Safari允许下载描述文件。
3. iPhone「设置 → 通用 → VPN与设备管理」，找到刚下载的QX证书描述文件，安装并输入设备解锁密码。
4. 再到「设置 → 通用 → 关于本机 → 证书信任设置」，仅对你刚生成的QX根证书启用完全信任。
5. 返回QX开启MITM。

证书安装与信任是两步。只信任自己生成的证书，不下载别人共享的P12、根证书或私钥，不将自己的证书、P12或口令放入GitHub。[Apple官方证书信任步骤](https://support.apple.com/en-us/102390)

## 5. 限定最终MITM范围

检查重写引用和本地设置合并后的主机名。上述固定版本需要以下8项；如果资源已自动带入，不要重复添加：

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

不要使用 `*` 或 `*.apple.com` 全站解密，也不要把银行、券商、Crypto域名放入MITM。`dispatcher.is.autonavi.com`说明定位模块还会处理部分地图请求，影响范围不只News；不接受这个范围就停在这里，不开启定位模块。

## 6. 触发并验证

1. 开启QX，确认News策略是DMIT美国，两个重写引用及MITM开关已开启。
2. 打开飞行模式，然后重新打开Wi-Fi。强制关闭News和地图后，先重新打开地图，触发系统地区请求。
3. 在QX网络活动/重写记录中检查 `gspe1-ssl.ls.apple.com/pep/gcc` 的处理结果。Safari访问该URL显示US可帮助验证脚本，但**不能单凭Safari结果认定系统地区检测已通过**；还应观察系统实际请求。
4. 打开News，分别检查首页和一篇免费文章。若首页正常但内容加载失败，检查 `gateway.icloud.com` 是否走预期出口。
5. 恢复日常蜂窝状态，再打开News测试。如果又出现地区提示，说明方案未稳定保持；不要继续以“已经解锁”作为结论。
6. 检查地图、天气和Tello是否仍正常。

原作者说明在蜂窝/MCC重新参与检测后可能失效；较新的iOS又增加了其他地区信号。因此这些步骤是实验流程，不是稳定可用保证。具体顺序以[原作者News指南](https://nsringo.github.io/guide/apple-news)及设备版本为准。

## 7. 回退

关闭这两个重写引用，移除它们新增的MITM域名，恢复试验前的设备地区与策略。如果证书仅用于这次实验且不再需要，取消信任并删除对应描述文件；保留其他用途的证书。重启News与地图，再检查Tello和日常网络。

## 以后重新导出QX时

MITM证书/P12与重写引用是QX本机层，不在公开Clash模板中。重新导入塔台生成的完整QX配置前，先备份并保留这些设置；不要为了省事把带私钥的完整QX文件放进GitHub。公共规则库无法替代这个私有本机层。

## News+与Shadowrocket

News+仍需真实订阅，地区重写不会授予付费阅读权益。`NewsPlusUser`选项只是影响部分搜索展示。[Apple官方订阅说明](https://support.apple.com/en-us/102209)

News v3.2.1发布说明已不再支持Shadowrocket；不要把本QX方案直接当作小火箭通用模块。
