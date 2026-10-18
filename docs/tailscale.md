# Tailscale 与塔台 / OpenClash 导出

公开仓库只维护业务规则。Tailscale 节点、认证材料、私有 Tailnet 域名与状态目录继续在塔台和设备私有配置中维护，不能提交到本仓库。

## 新版十五组规则的导出路径

1. 在塔台重新导入 `tower.yaml`，选用十五组方案。保留原机场和 Tailscale 配置，勾选要导出的节点。
2. 导出完整 Clash/Mihomo YAML。检查 Tailscale 节点仍存在，专用域名和地址段规则仍在通用内网直连之前。
3. 将完整文件交给助手做离线 OpenClash 优化。后处理应基于新文件，不能拿旧五组配置的节点、组或规则覆盖它。
4. 用户自行上传独立配置并“切换”；不要从尚未读取配置的空节点管理页“应用配置”。

## 离线后处理和验收条件

- 保留新导出的全部普通节点、十五个手选组、地区规则和 Tailscale 节点认证字段。普通业务组仍是 select，不自动测速或换节点。
- 根据节点的 `type: tailscale` 识别它，而不是硬编码名称。Tailscale 不进入海外默认、银行、金融、Crypto、AI/X等普通上网候选，避免用户误选后把公网上网交给没有 exit-node 的内网出站。专用规则仍可直接引用该节点。
- 专用 Tailnet 域名、`100.64.0.0/10`、`fd7a:115c:a1e0::/48` 到 Tailscale 的规则必须早于通用 `private`、`private-ip` 直连。不把 `DIRECT` 当作“自动进入 Tailscale”。
- 合并 `profile.store-selected`、TCP并发、进程匹配关闭和既有 Tello/Fake-IP例外；不重写节点认证，不改变用户选定出口。
- 检查 YAML 重复键、节点/组引用和环路、十五组与规则完整性；用 OpenClash Ruby 解析路径和可用 Mihomo 的离线模式核验。认证材料不输出到报告，不在校验中启动 Tailscale或消耗认证密钥。
- 新文件不能携带路由器正在运行的选择缓存。首次启用后，用户仍须核对实际手选结果，尤其新增香港/美国/新加坡银行组。

## 当前自动规则模块的边界

`mihomo/openclash-ruleset-overwrite.ini` 使用 `+rules` 前置整套规则，其中包含通用私有地址直连。它会抢在导出文件的 Tailscale 专用规则前面，因此**含内置 Tailscale 的配置不要启用这个模块**。当前使用塔台完整静态导出，保持一套主规则；没有宣称本模块已自动兼容专用前缀。

模块只带规则和 provider，不会创建新增银行策略组。十五组规则不能叠加到仍只有五组的旧导出上，否则会出现“proxy not found”。QX 的轻量远程片段同样要求先有完整的新策略组。

## 防火墙绕过和子网路由

如果 OpenClash 的“本地 IPv4 绕过地址”包含 `100.64.0.0/10`，普通 LAN 到 `100.x` 的流量可能在到达 Mihomo 前就绕过内核。即使 YAML 里的专用规则排第一，也不能消除这个接管问题；需要另行核对实际防火墙和系统路由。此仓库更新不修改路由器。

`accept-routes: true` 只表示接受 Tailnet 已发布的子网路由，不表示向 Tailnet 发布本地 LAN。现有 `192.168.x.x` 直连也不会自动变为 Tailscale出站。两地网段重叠时须单独设计，不靠增加一条通用私网规则解决。

终端自带 Tailscale 与网关内置出站是两条不同路径；启用出口节点会改变公网上网出口。相关功能边界以[Mihomo官方说明](https://wiki.metacubex.one/config/proxies/tailscale/)和[Tailscale子网路由说明](https://tailscale.com/docs/features/subnet-routers)为准。配置校验通过不等于入网、ACL、认证有效性或内网服务已实测。
