# Tello：保持已知可用的直连路径

已知场景：Tello在纯中国大陆网络的其他Wi-Fi下正常，连接有OpenClash接管的家庭Wi-Fi后失败。因此默认策略是DIRECT，不因为美国号码就强制走美国代理。

本模板将Tello/T-Mobile相关域名直接设为DIRECT；历史T-Mobile地址范围的兜底仅匹配UDP500/4500，不把整个网段或所有IPsec流量无差别接管。

## 一次性设备侧检查

1. 确认使用新方案，相关域名命中personal-direct并显示DIRECT。精简版不再有独立Tello策略组。
2. ePDG不能依赖虚拟Fake-IP。若OpenClash使用Fake-IP，在其持久DNS覆写/过滤设置中**追加**以下例外，保留已有LAN等例外：

```text
+.pub.3gppnetwork.org
+.wifi.t-mobile.com
```

3. 对这些域名使用正常的直连DNS。可在Mihomo DNS策略中添加以下片段，但不是替换整个DNS段：

```yaml
dns:
  nameserver-policy:
    "+.pub.3gppnetwork.org":
      - https://223.5.5.5/dns-query#DIRECT
    "+.wifi.t-mobile.com":
      - https://223.5.5.5/dns-query#DIRECT
```

4. 检查最终生效配置确实保留了这些例外。当前Tower版本会重建部分DNS设置，不能只看GitHub模板就认为已生效。
5. 在方便中断连接时，切换Wi-Fi或飞行模式后重开Wi-Fi，重新注册Wi-Fi Calling，避免沿用旧DNS缓存。
6. 检查系统出现Tello Wi-Fi，测试接听、拨出、收短信和待机来电。不要使用紧急号码做测试。

若仍失败，先做单手机绕过OpenClash的对照，再检查UDP是否进入内核、访问控制/来源端口绕过、NAT和IPv6。不要用“浏览器显示美国IP”代替通话验收。iOS系统蜂窝服务可能不走手机VPN，而家庭路由器又处在另一层。

可维护的高级DNS片段见[DNS说明](dns.md)。此仓库不修改路由器，不声称以上步骤已经在你的手机验收。

[Tello官方排障](https://tello.com/help_center/technical-support/wi-fi-calling-is-not-working-what-can-i-do) · [T-Mobile网络要求](https://www.t-mobile.com/support/coverage/wi-fi-calling-on-a-corporate-network)
