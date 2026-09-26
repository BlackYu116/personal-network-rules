#!/usr/bin/env python3
"""Validate public rules with synthetic nodes only. Never loads private subscriptions."""
import argparse,concurrent.futures,fnmatch,ipaddress,json,re,subprocess,tempfile,urllib.request
from pathlib import Path
import yaml
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--mihomo-bin');args=p.parse_args()
c=yaml.safe_load((ROOT/'tower.yaml').read_text())
assert set(c)=={'rules','proxy-groups','rule-providers','profile','dns'},'Only public policy fields are allowed'
raw=(ROOT/'tower.yaml').read_text()
for marker in ['vless://','ss://','vmess://','anytls://','token2=','sid=','PRIVATE KEY','password:', 'uuid:','private-key:']:
 assert marker not in raw,'Potential credential or private configuration'
groups={g['name']:g for g in c['proxy-groups']};assert len(groups)==len(c['proxy-groups'])
synthetic=['DMIT','日本 JP validation','美国 US validation','香港 HK validation','英国 UK validation','新加坡 SG validation']
fixture=[{'name':name,'type':'ss','server':'203.0.113.10','port':443,'cipher':'aes-128-gcm','password':'validation-only'} for name in synthetic]
resolved={}
for name,g in groups.items():
 assert g['type']=='select','Account routing should remain manually selectable'
 if g.get('include-all'):
  assert not g.get('proxies'),'Do not prepend REJECT or DIRECT to a dynamic node group'
  assert g.get('filter')
  rx=re.compile(g['filter']);resolved[name]=[n for n in synthetic if rx.search(n)]
  assert resolved[name],('Synthetic node matching failed',name)
 else:
  assert g.get('proxies');resolved[name]=g['proxies']
  assert all(x in groups or x in ['DIRECT','REJECT'] for x in g['proxies'])
def leaf(g,seen=None):
 seen=seen or set();assert g not in seen,'Group cycle'
 return leaf(resolved[g][0],seen|{g}) if g in resolved else g
for g in groups:leaf(g)
assert leaf('🌍 海外默认')=='DMIT'
assert len(groups)==8
assert leaf('🏦 金融')=='DMIT'
assert leaf('🤖 AI / X')=='DMIT'
assert '日本' in leaf('🪙 Crypto')
assert re.search(groups['🇺🇸 DMIT 专线']['filter'],'DMIT | provider')
assert not re.search(groups['🇯🇵 日本节点']['filter'],'美国 US validation')
def get(item):
 name,provider=item
 assert provider['interval']==86400
 assert provider['behavior'] in ['domain','ipcidr'] and provider['format']=='yaml'
 assert provider['proxy'] in groups
 personal='https://raw.githubusercontent.com/BlackYu116/personal-network-rules/main/'
 if provider['url'].startswith(personal):
  rel=provider['url'][len(personal):];assert rel.startswith('rules/') and '..' not in rel
  data=(ROOT/rel).read_bytes()
 else:
  assert provider['url'].startswith('https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/')
  req=urllib.request.Request(provider['url'],headers={'User-Agent':'personal-network-rules-validator'})
  with urllib.request.urlopen(req,timeout=30) as r:data=r.read(8*1024*1024+1)
 assert len(data)<=8*1024*1024
 content=yaml.safe_load(data);assert isinstance(content,dict) and isinstance(content.get('payload'),list) and content['payload']
 assert all(isinstance(x,str) for x in content['payload'])
 return name,provider,data,content['payload']
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:loaded=list(ex.map(get,c['rule-providers'].items()))
sets={}
for name,provider,data,payload in loaded:
 if provider['behavior']=='domain':sets[name]=(set(v for v in payload if not v.startswith('+.')),set(v[2:] for v in payload if v.startswith('+.')))
 else:sets[name]=[ipaddress.ip_network(v) for v in payload]
def route(host,network='tcp',port=443):
 try:ip=ipaddress.ip_address(host)
 except ValueError:ip=None
 for row in c['rules']:
  z=row.split(',');kind=z[0];match=False
  if kind=='AND':
   m=re.fullmatch(r'AND,\(\(NETWORK,UDP\),\(DST-PORT,(\d+)\),\(IP-CIDR,([^,]+),no-resolve\)\),([^,]+)',row)
   assert m and (m.group(3) in groups or m.group(3)=='DIRECT')
   if network=='udp' and int(m.group(1))==port and ip is not None and ip in ipaddress.ip_network(m.group(2)):return m.group(3)
   continue
  if kind=='MATCH':assert z[1] in groups;return z[1]
  assert z[2] in groups or z[2] in ['DIRECT','REJECT'],('Unknown policy',row)
  if kind=='DOMAIN':match=host==z[1]
  elif kind=='DOMAIN-SUFFIX':match=host==z[1] or host.endswith('.'+z[1])
  elif kind=='IP-CIDR':match=ip is not None and ip in ipaddress.ip_network(z[1])
  elif kind=='RULE-SET':
   assert z[1] in sets
   if c['rule-providers'][z[1]]['behavior']=='domain':
    exact,suffix=sets[z[1]];parts=host.split('.');match=host in exact or any('.'.join(parts[i:]) in suffix for i in range(len(parts)))
   elif ip is not None:match=any(ip in n for n in sets[z[1]])
  else:raise AssertionError('Unexpected rule type '+kind)
  if match:return z[2]
 raise AssertionError('Missing final rule')
cases={'www.hsbc.com.cn':'DIRECT','www.icbc.com.cn':'DIRECT','www.ccb.com':'DIRECT','www.boc.cn':'DIRECT','www.abchina.com':'DIRECT','www.cmbchina.com':'DIRECT','www.bankcomm.com':'DIRECT','www.hsbc.co.uk':'🏦 金融','www.hsbc.com.hk':'🏦 金融','www.interactivebrokers.com':'🏦 金融','api.ibkr.com':'🏦 金融','www.schwab.com':'🏦 金融','www.longbridge.com':'🏦 金融','openapi.longportapp.com':'🏦 金融','www.binance.com':'🪙 Crypto','www.okx.com':'🪙 Crypto','www.tradingview.com':'🪙 Crypto','claude.ai':'🤖 AI / X','tello.com':'DIRECT','epdg.epc.mnc260.mcc310.pub.3gppnetwork.org':'DIRECT','apple.news':'📰 Apple News','news-client-search.apple.com':'📰 Apple News','gateway.icloud.com':'📰 Apple News','www.microsoft.com':'DIRECT','unlisted-routing-test-7d95.net':'🌍 海外默认'}
cases.update({h:'🤖 AI / X' for h in ['x.com','api.x.com','pbs.twimg.com','video.twimg.com','t.co','grok.com','x.ai','chatgpt.com','cdn.oaistatic.com','api.anthropic.com','gemini.google.com','generativelanguage.googleapis.com','aistudio.google.com','perplexity.ai','api.githubcopilot.com','cursor.com']})
cases.update({'192.168.2.22':'DIRECT','api.deepseek.com':'DIRECT','www.bilibili.com':'DIRECT'})
for host,want in cases.items():assert route(host)==want,(host,route(host),want)
for port in [500,4500]:assert route('208.54.85.1','udp',port)=='DIRECT'
assert route('208.54.85.1','tcp',443)=='🌍 海外默认'
dns_override=yaml.safe_load((ROOT/'dns/mihomo.yaml').read_text())
assert '+.pub.3gppnetwork.org' in dns_override['dns']['fake-ip-filter']
assert set(c['dns'])=={'default-nameserver','nameserver'}
if args.mihomo_bin:
 with tempfile.TemporaryDirectory(prefix='public-rules-test-') as tmp:
  d=Path(tmp);fixture_config=dict(c);fixture_config['proxies']=fixture;fixture_config['mixed-port']=7890
  for name,provider,data,payload in loaded:
   dest=d/provider['path'];dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
  path=d/'validation.yaml';path.write_text(yaml.safe_dump(fixture_config,allow_unicode=True,sort_keys=False))
  subprocess.run([args.mihomo_bin,'-t','-d',tmp,'-f',str(path)],check=True)
  fixture_config['dns'].update(dns_override['dns'])
  path.write_text(yaml.safe_dump(fixture_config,allow_unicode=True,sort_keys=False))
  subprocess.run([args.mihomo_bin,'-t','-d',tmp,'-f',str(path)],check=True)
print(f'PASS: {len(groups)} groups, {len(loaded)} remote rule sets, {len(cases)+3} routing checks; synthetic nodes only.')
print('Tower can fall back to DIRECT for an empty node group. Check DMIT and Japan membership before every export.')
