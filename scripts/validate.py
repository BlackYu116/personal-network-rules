#!/usr/bin/env python3
"""Validate provider-independent routing with synthetic nodes; never load subscriptions."""
import argparse
import concurrent.futures
import ipaddress
import re
import subprocess
import tempfile
import urllib.request
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
p = argparse.ArgumentParser()
p.add_argument('--mihomo-bin')
args = p.parse_args()
c = yaml.safe_load((ROOT / 'tower.yaml').read_text())
raw = (ROOT / 'tower.yaml').read_text()
assert set(c) == {'rules', 'proxy-groups', 'rule-providers', 'profile', 'dns'}
for marker in ['vless://', 'ss://', 'token2=', 'PRIVATE KEY', 'password:', 'uuid:', 'private-key:', 'DMIT', 'AmyTelecom', '日本节点', '美国节点']:
    assert marker not in raw, 'Credential or provider/region dependency in public template'
G, F, C, A, ADS, AUTO = '🌍 海外默认', '🏦 金融', '🪙 Crypto', '🤖 AI / X', '🛑 广告过滤', '♻️ 自动选择'
groups = {g['name']: g for g in c['proxy-groups']}
assert set(groups) == {G, F, C, A, ADS, AUTO} and len(c['proxy-groups']) == 6
assert c['profile']['store-selected'] is True
for name, group in groups.items():
    assert group['proxies']
    assert all(x in groups or x in ['DIRECT', 'REJECT'] for x in group['proxies'])
    if name == AUTO:
        assert group['type'] == 'url-test' and group['proxies'] == ['REJECT']
        assert group['include-all'] is True and group['filter'] == '.*'
        assert group['url'].startswith('https://') and group['interval'] >= 300 and group['tolerance'] >= 100 and group['lazy'] is True
        continue
    assert group['type'] == 'select'
    if name != ADS:
        assert group['include-all'] is True and group['filter'] == '.*'
# Auto failover stays opt-in and manual-first: only the general exit offers it, never account-bound groups.
assert groups[G]['proxies'][0] == 'REJECT' and AUTO in groups[G]['proxies']
assert all(AUTO not in groups[n]['proxies'] for n in [F, C, A, ADS])


def choices(pool):
    # Tower preserves explicit candidates, then appends matching enabled nodes.
    return {n: list(g['proxies']) + ([x for x in pool if re.search(g['filter'], x)] if g.get('include-all') else []) for n, g in groups.items()}


def leaf(name, pool, selected=None, seen=None):
    selected, seen = selected or {}, seen or set()
    assert name not in seen, 'Group cycle'
    if name not in groups:
        return name
    candidates = choices(pool)[name]
    chosen = selected.get(name, candidates[0])
    assert chosen in candidates, 'Missing node or policy candidate'
    return leaf(chosen, pool, selected, seen | {name})


for pool in [['node-a', 'node-b'], ['任意来源-甲', '任意来源-乙'], []]:
    for name in groups:
        assert leaf(name, pool) == 'REJECT', 'First import must not silently select a random exit'
    if pool:
        assert leaf(F, pool, {G: pool[0]}) == pool[0]
        assert leaf(A, pool, {G: pool[0]}) == pool[0]
        assert leaf(C, pool, {G: pool[0], C: pool[1]}) == pool[1]
        assert leaf(F, pool, {G: pool[0], F: pool[1]}) == pool[1]
        assert leaf(A, pool, {G: pool[0], A: pool[1]}) == pool[1]
        assert leaf(ADS, pool, {G: pool[0], ADS: G}) == pool[0]


def get(item):
    name, provider = item
    assert provider['interval'] == 86400
    assert provider['behavior'] in ['domain', 'ipcidr'] and provider['format'] == 'yaml'
    assert provider['proxy'] == G
    personal = 'https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/'
    if provider['url'].startswith(personal):
        rel = provider['url'][len(personal):]
        assert rel.startswith('rules/') and '..' not in rel
        data = (ROOT / rel).read_bytes()
    else:
        assert provider['url'].startswith('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/')
        request = urllib.request.Request(provider['url'], headers={'User-Agent': 'personal-network-rules-validator'})
        with urllib.request.urlopen(request, timeout=30) as response:
            data = response.read(8 * 1024 * 1024 + 1)
    assert len(data) <= 8 * 1024 * 1024
    content = yaml.safe_load(data)
    assert isinstance(content, dict) and isinstance(content.get('payload'), list) and content['payload']
    assert all(isinstance(x, str) for x in content['payload'])
    return name, provider, data, content['payload']


with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:
    loaded = list(ex.map(get, c['rule-providers'].items()))
sets = {}
for name, provider, data, payload in loaded:
    if provider['behavior'] == 'domain':
        sets[name] = (set(v for v in payload if not v.startswith('+.')), set(v[2:] for v in payload if v.startswith('+.')))
    else:
        sets[name] = [ipaddress.ip_network(v) for v in payload]

# Duplicate explicit opposite-policy exceptions need a human decision, not silent precedence.
direct = yaml.safe_load((ROOT / 'rules/direct.yaml').read_text())['payload']
proxy = yaml.safe_load((ROOT / 'rules/proxy.yaml').read_text())['payload']
assert not set(direct) & set(proxy), 'Same entry in direct and proxy exceptions'


def route(host):
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None
    for row in c['rules']:
        z = row.split(',')
        if z[0] == 'MATCH':
            assert z[1] in groups
            return z[1]
        assert z[0] == 'RULE-SET' and z[1] in sets
        assert z[2] in groups or z[2] in ['DIRECT', 'REJECT']
        if c['rule-providers'][z[1]]['behavior'] == 'domain':
            exact, suffix = sets[z[1]]
            parts = host.split('.')
            match = host in exact or any('.'.join(parts[i:]) in suffix for i in range(len(parts)))
        else:
            match = ip is not None and any(ip in net for net in sets[z[1]])
        if match:
            return z[2]
    raise AssertionError('Missing final rule')


cases = {h: 'DIRECT' for h in [
    'www.hsbc.com.cn', 'www.icbc.com.cn', 'www.ccb.com', 'www.boc.cn', 'www.abchina.com',
    'www.cmbchina.com', 'www.bankcomm.com', 'tello.com', 'epdg.epc.mnc260.mcc310.pub.3gppnetwork.org',
    'epdg.epc.mnc240.mcc310.pub.3gppnetwork.org', 'test.wifi.t-mobile.com', '192.168.2.22',
    'fc00::1', 'router.lan', 'localhost', 'api.deepseek.com', 'www.bilibili.com',
]}
cases.update({h: F for h in ['www.hsbc.co.uk', 'www.hsbc.com.hk', 'www.interactivebrokers.com', 'api.ibkr.com', 'www.schwab.com', 'www.longbridge.com', 'openapi.longportapp.com']})
cases.update({h: C for h in ['www.binance.com', 'www.okx.com', 'www.tradingview.com', 'zftksc.cdn-settings.appsflyersdk.com']})
cases.update({h: A for h in ['claude.ai', 'x.com', 'api.x.com', 'pbs.twimg.com', 'video.twimg.com', 't.co', 'grok.com', 'x.ai', 'chatgpt.com', 'cdn.oaistatic.com', 'api.anthropic.com', 'gemini.google.com', 'generativelanguage.googleapis.com', 'aistudio.google.com', 'perplexity.ai', 'api.githubcopilot.com', 'cursor.com']})
cases.update({h: G for h in ['www.microsoft.com', 'outlook.live.com', 'login.microsoftonline.com', 'apple.news', 'news-client-search.apple.com', 'gateway.icloud.com', 'www.t-mobile.com', 'raw.githubusercontent.com', 'github.com', '208.54.85.1', 'unlisted-routing-test-7d95.net']})
cases['doubleclick.net'] = ADS
for host, want in cases.items():
    assert route(host) == want, (host, route(host), want)
assert c['rules'][-1] == 'MATCH,' + G
assert not any(x.startswith('AND,') for x in c['rules'])

# Derived artifacts must stay generated from tower.yaml (scripts/gen_overwrites.py).
derived_rules = [r for r in c['rules'] if not r.startswith('MATCH,')]
overwrite = yaml.safe_load((ROOT / 'mihomo' / 'openclash-ruleset-overwrite.ini').read_text().split('[YAML]', 1)[1])
assert overwrite['rule-providers'] == c['rule-providers'], 'OpenClash overwrite module out of sync with tower.yaml'
assert overwrite['+rules'] == derived_rules, 'OpenClash overwrite rules out of sync with tower.yaml'
qx = (ROOT / 'qx' / 'filter-remote-snippet.conf').read_text().splitlines()
qx_remote = [l for l in qx if l.startswith('https://')]
assert len(qx_remote) == len(derived_rules), 'QX filter_remote snippet out of sync with tower.yaml'
for line, rule in zip(qx_remote, derived_rules):
    parts = rule.split(',')
    fields = line.split(', ')
    assert fields[0] == c['rule-providers'][parts[1]]['url'], 'QX snippet URL mismatch: ' + parts[1]
    assert fields[1] == f'tag={parts[1]}' and fields[2] == f'force-policy={parts[2]}', 'QX snippet tag/policy mismatch: ' + parts[1]
    assert all(x in line for x in ['opt-parser=true', 'update-interval=86400', 'enabled=true'])
assert 'resource_parser_url = https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/qx/resource-parser.js' in qx
assert f'final, {G}' in qx
assert 'microsoft' not in c['rule-providers'] and 'personal-apple-news' not in c['rule-providers']
extra = yaml.safe_load((ROOT / 'mihomo/tello-udp.yaml').read_text())['prepend-rules']
assert len(extra) == 2 and all(x.startswith('AND,') and x.endswith(',DIRECT') for x in extra)
dns_override = yaml.safe_load((ROOT / 'dns/mihomo.yaml').read_text())
assert '+.pub.3gppnetwork.org' in dns_override['dns']['fake-ip-filter']
assert set(c['dns']) == {'default-nameserver', 'nameserver'}
if args.mihomo_bin:
    with tempfile.TemporaryDirectory(prefix='public-rules-test-') as tmp:
        d = Path(tmp)
        fixture_config = dict(c)
        fixture_config['proxies'] = [{'name': n, 'type': 'ss', 'server': '203.0.113.10', 'port': 443, 'cipher': 'aes-128-gcm', 'password': 'validation-only'} for n in ['node-a', 'node-b']]
        fixture_config['mixed-port'] = 7890
        for name, provider, data, payload in loaded:
            dest = d / provider['path']
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
        path = d / 'validation.yaml'
        path.write_text(yaml.safe_dump(fixture_config, allow_unicode=True, sort_keys=False))
        subprocess.run([args.mihomo_bin, '-t', '-d', tmp, '-f', str(path)], check=True)
        fixture_config['dns'].update(dns_override['dns'])
        fixture_config['rules'] = extra + fixture_config['rules']
        path.write_text(yaml.safe_dump(fixture_config, allow_unicode=True, sort_keys=False))
        subprocess.run([args.mihomo_bin, '-t', '-d', tmp, '-f', str(path)], check=True)
print(f'PASS: {len(groups)} provider-independent groups, {len(loaded)} rule sets, {len(cases)} routing cases, renamed/empty node pools; synthetic nodes only.')
print('First import: select an overseas node and a Crypto node. Neither group auto-selects a country or provider.')
