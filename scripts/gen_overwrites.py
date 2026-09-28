#!/usr/bin/env python3
"""Regenerate derived rule files from tower.yaml so there is a single source of truth.

Outputs:
  mihomo/openclash-ruleset-overwrite.ini  OpenClash overwrite module (auto-updating rule-providers)
  qx/filter-remote-snippet.conf           Quantumult X lightweight [filter_remote] block

Run after editing tower.yaml; scripts/validate.py checks the results stay in sync.
"""
import yaml
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
c = yaml.safe_load((ROOT / 'tower.yaml').read_text())
rules = [r for r in c['rules'] if not r.startswith('MATCH,')]

PROVIDER_KEYS = ['type', 'behavior', 'format', 'url', 'path', 'interval', 'proxy']


def dump_provider(name, body, indent):
    lines = [f'{indent}{name}:']
    for key in PROVIDER_KEYS:
        if key in body:
            value = f'"{body[key]}"' if ':' in str(body[key]) else str(body[key])
            lines.append(f'{indent}  {key}: {value}')
    return lines


# --- OpenClash overwrite module -------------------------------------------------
header = """\
# OpenClash 覆写模块：把 tower.yaml 的全部规则集恢复为远程引用，规则每天自动更新。
# 内容由 scripts/gen_overwrites.py 从 tower.yaml 生成，不要手改；改 tower.yaml 后重新生成并粘贴。
#
# 应用步骤（由用户在 OpenClash 中执行，应用会重启插件、可能短暂断网）：
#   1. OpenClash「运行状态」页顶部 →「覆写模块」→ 左栏底部「+ 添加新模块」。
#   2. 粘贴本文件全部内容保存；「匹配配置文件」填 all。
#   3. 打开该模块的启用开关，然后重启 OpenClash 插件（仅保存不生效）。
#
# 效果与回退：
#   - 18 个规则集改为 rule-providers 远程更新；改 GitHub 上 rules/*.yaml 后，
#     路由器一天内自动跟上，或在「规则集」页手动更新，无需塔台重新导出。
#     塔台重导出仍用于换节点、改组结构或基础DNS。
#   - 规则集下载失败时内核照常启动：失败的集合不命中，流量落到塔台导出的
#     静态规则，安全降级；恢复后按间隔自动重试。
#   - 回退：关闭模块开关并重启插件，即回到纯静态导出。
"""
ini = [header, '[YAML]', 'rule-providers:']
for name, body in c['rule-providers'].items():
    ini += dump_provider(name, body, '  ')
ini.append('+rules:')
for r in rules:
    ini.append(f'  - "{r}"')
(ROOT / 'mihomo' / 'openclash-ruleset-overwrite.ini').write_text('\n'.join(ini) + '\n')

# --- Quantumult X filter_remote snippet ------------------------------------------
qx = ['[general]',
      'resource_parser_url = https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/resource-parser.js',
      '',
      '[filter_remote]']
for r in rules:
    parts = r.split(',')
    provider, target = parts[1], parts[2]
    url = c['rule-providers'][provider]['url']
    qx.append(f'{url}, tag={provider}, force-policy={target}, opt-parser=true, update-interval=86400, enabled=true')
qx += ['', '[filter_local]', f'final, {c["rules"][-1].split(",", 1)[1]}']
(ROOT / 'qx' / 'filter-remote-snippet.conf').write_text('\n'.join(qx) + '\n')

print('Regenerated mihomo/openclash-ruleset-overwrite.ini and qx/filter-remote-snippet.conf from tower.yaml.')
