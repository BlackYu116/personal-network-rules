# QX：资源解析器、服务器资源与 Invalid response

## 先把三个入口分清楚

| 内容 | 放在哪里 |
|---|---|
| 下面的resource-parser.js链接 | QX资源解析器设置，或 `[general] resource_parser_url` |
| DMIT／机场的节点订阅链接 | 服务器资源 `[server_remote]` |
| `rules/*.yaml` 单个域名列表 | 分流资源 `[filter_remote]`，绑定实际策略组 |
| 塔台导出的完整QX配置 | QX配置文件导入，不是服务器资源 |
| 公开 `tower.yaml` | 塔台的规则方案导入，不是QX节点订阅 |

解析器转换资源文本，不能建立整套策略组、DNS、证书或自动获取另一批URL，也不能测试节点速度或出口。[官方解析器API](https://github.com/crossutility/Quantumult-X/blob/master/resource-parser.js)

## 一次性安装自己的解析器

解析器地址：

```text
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/resource-parser.js
```

1. 先备份QX当前配置。建议更新到当前正式版；使用AnyTLS至少需要1.6.0，REALITY至少1.5.5。检查QX“关于”中的实际版本。[App Store版本历史](https://apps.apple.com/us/app/quantumult-x/id1443988620)
2. 在QX设置中找到“资源解析器/Resource Parser”，填入上述URL并更新。不同版本UI位置可能不同；也可编辑当前配置，在**已有** `[general]` 下增加或替换唯一的这一行：

   ```ini
   resource_parser_url = https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/resource-parser.js
   ```

3. 打开需要转换的服务器资源，开启该资源的“资源解析器”开关，然后**手动更新该资源**。只填全局解析器地址、不打开资源自己的开关，不会转换Clash YAML。
4. 保持节点手动刷新：该资源使用 `update-interval=-1`。例如下面是格式示意，PRIVATE_SUBSCRIPTION_URL须替换为你自己的链接，不能原样粘贴：

   ```ini
   [server_remote]
   PRIVATE_SUBSCRIPTION_URL, tag=DMIT, opt-parser=true, update-interval=-1, enabled=true
   ```

5. 若已经由塔台导出为QX原生 `vless=`／`anytls=`／`shadowsocks=` 节点，则一般不需要额外解析。塔台完整配置直接文件导入即可，别为了用解析器多绕一步。

本解析器在手机本地运行，不把订阅交给外部转换服务。JS脚本是公开的，节点URL、节点密码、QX完整配置仍只保存在私人位置。

## 本次排查证据与下一步

2026-09-26，从现有私有来源做了有限HTTP对照，未上传订阅到其他转换服务：

- DMIT：不同模拟UA均返回200、Clash YAML、1个VLESS REALITY节点；它需要本解析器或塔台原生QX导出。
- SS机场：模拟QX与Clash的返回格式不同。HTTP200不等于正文一定适合你导入的资源类型。
- AnyTLS机场：模拟Clash UA能得到Clash节点，几种模拟QX UA返回403。尚未捕获你手机实际UA；不能声称所有QX请求都被拒绝，也不能仅靠这次模拟证明手机错误的唯一原因。

这些结果只记录格式与状态，不在公开仓库保存来源地址、用户套餐信息或节点信息。

如果资源显示403／Invalid response，而且解析器没有显示下面的细分错误，可能在**下载阶段**就被客户端拒绝，脚本尚未运行。此时最稳妥的是从机场面板选择官方QX原生订阅，或继续在塔台读取来源、导出QX原生文件。不要关闭HTTPS证书检查、反复换第三方转换站来处理403。

解析器提供一个可选的、有限的原生UA重试：在私人订阅URL末尾加 `#ua=clash`，并开启资源解析器。它仅调用QX官方的一次重下接口，QX实际能将响应交给解析器时才可能有效；**无法保证挽救已在HTTP层被拒绝的403**。老版本会保留可理解的失败结果，不循环重试。不要把它当作通用网络修复。

## 解析错误对照

| 代码 | 含义和处理 |
|---|---|
| `[HTML]` | 返回登录页/错误页，检查订阅权限和上游响应 |
| `[FULL_CONFIG]` | 把整份QX配置或tower.yaml放错资源入口 |
| `[YAML]` / `[FORMAT]` | 正文不是可支持的节点或payload资源 |
| `[PROTOCOL]` / `[TRANSPORT]` / `[PLUGIN]` | 节点协议或扩展不在小型解析器范围；用塔台/机场原生QX导出，不能删字段假装成功 |
| `[INSECURE_TLS]` | 上游要求跳过TLS验证，需用户明确决定 |
| `[DUPLICATE]` | 同一资源节点重名，先在塔台去重 |
| 下载失败但没有这些代码 | 可能解析器未开启/未下载，或失败发生在脚本运行前；先查HTTP和资源设置 |

### 上游关闭证书验证的实际问题

现有AnyTLS来源中的节点带 `skip-cert-verify: true`。解析器默认**不自动沿用**这个弱化设置，避免在转换中无提示地关闭校验。先查看机场是否提供可正常校验证书的原生节点。

如果你明确接受这家机场原有的设置，可只在这一条私人服务器资源的URL末尾添加：

```text
#allow-insecure=1
```

若同时测试UA重试，则合并成一个hash：`#ua=clash&allow-insecure=1`。已有hash时用`&`追加，不要写两个`#`。该参数仅保留上游已明确要求跳过校验的节点，不会关闭其他节点或QX全局HTTPS校验。解析器会显示说明通知。**此参数不会解决HTTP403。** 原生QX行是透传的，原生资源本身的TLS设置由其提供者决定。

## 支持范围和维护

- 输入：JSON/块式或流式YAML `proxies`；SS/VLESS/AnyTLS/Trojan URI及其Base64订阅；纯QX节点行透传。
- 转换：SS AEAD与simple-obfs HTTP/TLS；TCP VLESS TLS/REALITY/Vision；TCP AnyTLS；TCP Trojan。
- 已带节点的机场完整Clash配置可抽取 `proxies`，不导入机场的DNS与分流；没有节点的tower.yaml明确报错。
- WS/gRPC/XHTTP、未知插件、未知安全扩展、无法转义的凭据、未知协议明确报错；**本解析器不是所有机场的万能转换器**。
- REALITY指纹由QX内核控制；不假装保留Mihomo的Chrome指纹。AnyTLS连接池参数由QX内核决定。转换输出关闭TFO，保留输入的UDP开关。
- 转换非原生资源时，可选 `prefix=来源名` 区分不同服务器资源的重名节点（原生QX透传不执行重命名，应在塔台改名）；它是名称前缀，不代表实际国家。资源解析器不在线测速、不判定家宽、不保证服务解锁。
- 固定打包MIT许可js-yaml 5.4.2，不在运行时下载或执行其他JS。来源、许可证与校验值在 `qx/vendor/`；源码为 `qx/parser-core.js`，修改后运行 `node scripts/build_qx_parser.js`。

## 让个人小规则在QX自动更新

你已从塔台导入完整QX配置、对应策略组存在后，可将**个人域名列表**作为QX远程分流资源引用。例如在现有 `[filter_remote]` 中加入：

```ini
https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/rules/ai-x.yaml#policy=proxy, tag=个人AI-X, force-policy=🤖 AI / X, opt-parser=true, update-interval=86400, enabled=true
```

它会将payload转换成QX原生规则，再由 `force-policy` 绑定现有业务组。其他对应关系为 `direct.yaml → direct`、`finance.yaml → 🏦 金融`、`crypto.yaml → 🪙 Crypto`、`apple-news.yaml → 📰 Apple News`。

**不要不检查就叠加到旧静态规则上。** 需要在QX查看匹配顺序，并移除旧配置中与该个人列表重复的静态条目；否则“GitHub删掉了域名，本机旧行仍生效”。首次过渡建议仍使用塔台刷新导出；确认对应规则资源独立生效后，再将这几个小列表转为日常自动更新。本次没有改你的现有配置，也没有擅自搬迁规则优先级。

规则文件末尾不写MATCH/FINAL，策略组也不由解析器建立。顶层策略或DNS变更仍需重新导入配置，不能混淆为规则资源更新。
