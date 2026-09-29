# 透明代理运行参数：现状与可调项

透明代理（TUN 接管全家流量）的使用体验优化清单。所有路由器变更由用户本人执行；每项独立修改、观察、可回退，不要一次改多项。

## 现状（2026-09-27 审计）

Fake-IP TUN + gVisor 栈、Rule 模式；绕过中国大陆 IP 开；禁用 QUIC 开；数据包引导开；防火墙流量卸载"无"；每日 08:00 定时重启已由用户处理。DNS 链：客户端 → Dnsmasq（缓存0）→ 127.0.0.1:7874（OpenClash）→ DoH。

## 推荐尝试的三个低风险项（按收益排序）

### 1. tcp-concurrent：首次连接更快

内核对一个域名的多个候选 IP 并发拨号，取先成功者。网页首开、App 冷启动改善最明显，风险低。

做法：在覆写模块的 `[YAML]` 段加一行（可加进[规则集模块](../mihomo/openclash-ruleset-overwrite.ini)，也可单独建一个「体验参数」模块），重启插件生效：

```ini
[YAML]
tcp-concurrent: true
unified-delay: true
```

`unified-delay` 只影响延迟显示口径（去掉握手偏置），让测速数字更可比，不改路由。回退：删除该行重启。

### 2. TUN 栈 A/B：gVisor → mixed

- gVisor（当前）：用户态网络栈，兼容性最好，吞吐和 CPU 占用一般。
- system：内核栈，最快，但个别路由器/内核组合有兼容问题。
- mixed：TCP 走 system、UDP 走 gVisor，多数情况是平衡点，**建议先试这个**。

做法：OpenClash 设置中的 TUN 栈（代理栈）下拉改为 mixed，重启插件。观察 48 小时：国内直连测速、代理测速、`top` 看 CPU、有无设备掉线或断流。不合适改回 gVisor。改栈不影响规则、DNS 和出口选择。

### 3. Fake-IP 过滤补充 NTP/STUN 域名

部分设备的时间同步和 NAT 探测走 fake-ip 会出现偶发失败（UDP 经代理转发）。把常用 NTP 域名加入 fake-ip-filter 可消除这类"玄学"问题：

```text
+.time.android.com
+.time.apple.com
+.time.windows.com
+.time.cloudflare.com
+.ntp.org
+.pool.ntp.org
stun.*
+.stun.*.*
```

与 Tello 例外在同一个列表维护（见 [dns.md](dns.md) 的合并语义说明），加在 OpenClash 的 DNS 覆写里，重启插件生效。

## 明确不建议动的（改了大概率变差）

| 项目 | 保持现状 | 理由 |
|---|---|---|
| 防火墙流量卸载 | 无 | offload 加速的是防火墙转发快路径；TUN 接管的流量不受益，且部分平台与 fake-ip/策略路由冲突，可能出现部分流量绕过代理 |
| 禁用 QUIC | 开启 | 海外 UDP 443 经代理的 QUIC 跨国拥塞表现差且易被 QoS；禁用后回落 TCP 443 反而更稳。国内直连不受此开关影响；想放开国内 QUIC 时再单独评估 |
| Dnsmasq 缓存 | 0 | 解析已统一交给 OpenClash，外层再缓存会放大 DNS 陈旧和 fake-ip 映射问题，收益接近零 |
| DNS 链路 | Dnsmasq→7874→DoH | 当前是单链、无回环、无冗余转发，没有重构空间 |
| 自动测速/切换组 | 不用 | 出口 IP 稳定是账户风控的一部分；见[routing-design.md](routing-design.md) |

## 观察方法

改任何一项前后，用同样的方法各记录一次，避免"感觉变快"：

- MetaCubeXD 面板「连接」页：实时命中规则与出口是否符合预期。
- 固定 2–3 个常用站点，记录首开时间；固定一个测速目标，记录代理下载速度。
- 路由器 `top` / 负载页：改栈前后 CPU 对比。
- 断流排查顺序：先看「连接」页是否仍在接管 → 再看 DNS（nslookup 对比）→ 最后才怀疑规则。
