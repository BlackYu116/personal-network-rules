/* Original personal resource converter. MIT; see LICENSE.
 * No network, eval, storage, node tests, or configuration mutations.
 * Bundled with pinned js-yaml; build with scripts/build_qx_parser.js.
 */
(function () {
  'use strict';
  const notices = new Set();
  function fail(code, message) { const e = new Error(message); e.code = code; throw e; }
  function scalar(v, label) {
    if (typeof v !== 'string' && typeof v !== 'number') fail('FIELD', label + ' 缺失或类型错误');
    const s = String(v);
    if (!s || /[,\r\n\x00-\x1f]/.test(s)) fail('FIELD', label + ' 含无法安全转换的分隔符');
    return s;
  }
  function bool(v, fallback) {
    if (v === undefined) return fallback;
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false') return false;
    fail('FIELD', '布尔字段应为 true 或 false');
  }
  function decoded(s) { try { return decodeURIComponent(s); } catch (_) { fail('ENCODING', 'URL 编码无效'); } }
  function options(s) {
    const r = Object.create(null);
    String(s || '').split('&').filter(Boolean).forEach(x => {
      const i = x.indexOf('='); const k = decoded(i < 0 ? x : x.slice(0, i));
      r[k] = decoded(i < 0 ? '' : x.slice(i + 1));
    });
    return r;
  }
  function base64(s) {
    s = s.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s) || s.replace(/=+$/, '').length % 4 === 1) fail('ENCODING', 'Base64 无效');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let bits = 0, acc = 0, hex = '';
    for (const ch of s.replace(/=+$/, '')) {
      acc = (acc << 6) | alphabet.indexOf(ch); bits += 6;
      if (bits >= 8) { bits -= 8; hex += '%' + ((acc >> bits) & 255).toString(16).padStart(2, '0'); }
    }
    return decoded(hex);
  }
  function hostPort(s) {
    const m = /^(\[[0-9a-fA-F:.]+\]|[^\s:@/?#]+):(\d+)$/.exec(s);
    if (!m) fail('ENDPOINT', '服务器地址或端口无效');
    return { server: m[1].replace(/^\[|\]$/g, ''), port: +m[2] };
  }
  function label(s) {
    return String(s || '未命名节点').replace(/[,\r\n\x00-\x1f]/g, ' ').trim();
  }
  function nodeURI(line) {
    const m = /^(ss|vless|anytls|trojan):\/\/(.*)$/i.exec(line);
    if (!m) fail('PROTOCOL', 'URI 协议未实现；请使用机场原生 QX 或塔台导出');
    const type = m[1].toLowerCase(); let rest = m[2], name = type.toUpperCase();
    const hash = rest.indexOf('#');
    if (hash >= 0) { name = decoded(rest.slice(hash + 1)); rest = rest.slice(0, hash); }
    const qi = rest.indexOf('?'), q = options(qi < 0 ? '' : rest.slice(qi + 1));
    rest = qi < 0 ? rest : rest.slice(0, qi);
    const legacySS = type === 'ss' && !rest.includes('@');
    if (legacySS) rest = base64(rest);
    const at = rest.lastIndexOf('@');
    if (at <= 0) fail('URI', '节点 URI 缺少认证信息');
    const endpoint = hostPort(rest.slice(at + 1).replace(/\/$/, ''));
    const n = Object.assign({ type, name }, endpoint);
    let user = legacySS ? rest.slice(0, at) : decoded(rest.slice(0, at));
    if (type === 'ss') {
      if (Object.keys(q).some(k => k !== 'plugin')) fail('URI_OPTION', 'SS URI 含未实现的附加参数，不能静默丢弃');
      if (!user.includes(':')) user = base64(user);
      const colon = user.indexOf(':');
      if (colon < 1) fail('URI', 'SS 认证信息无效');
      n.cipher = user.slice(0, colon); n.password = user.slice(colon + 1);
      if (q.plugin) {
        const fields = q.plugin.split(';'); n.plugin = fields.shift(); n['plugin-opts'] = {};
        fields.forEach(x => { const i = x.indexOf('='); n['plugin-opts'][x.slice(0, i)] = x.slice(i + 1); });
        const po = n['plugin-opts']; po.mode = po.obfs; po.host = po['obfs-host'];
        delete po.obfs; delete po['obfs-host'];
      }
    } else {
      n[type === 'vless' ? 'uuid' : 'password'] = user;
      n.network = q.type || 'tcp';
      if (q.encryption && q.encryption !== 'none') fail('TRANSPORT', 'VLESS encryption 不受支持');
      const security = q.security || (type === 'vless' ? 'none' : 'tls');
      if (!['tls', 'reality', 'none'].includes(security)) fail('TRANSPORT', 'security 不受支持');
      n.tls = security !== 'none'; n.servername = q.sni || q.peer; n.flow = q.flow;
      if (security === 'reality') n['reality-opts'] = { 'public-key': q.pbk, 'short-id': q.sid || '' };
      if (q.allowInsecure !== undefined) n['skip-cert-verify'] = q.allowInsecure === '1' || q.allowInsecure === 'true';
      if (q.alpn) n.alpn = q.alpn.split(',');
      if (q.fp) n['client-fingerprint'] = q.fp;
      const allowed = new Set(['type', 'encryption', 'security', 'sni', 'peer', 'flow', 'pbk', 'sid', 'fp', 'alpn', 'allowInsecure']);
      for (const key of Object.keys(q)) if (!allowed.has(key)) fail('URI_OPTION', 'URI 含未实现的附加参数，不能静默丢弃');
    }
    return n;
  }
  function node(n, opts) {
    if (!n || typeof n !== 'object' || Array.isArray(n)) fail('NODE', '节点必须是对象');
    const type = scalar(n.type, 'type').toLowerCase();
    if (!['ss', 'vless', 'anytls', 'trojan'].includes(type)) fail('PROTOCOL', '订阅含尚未实现的协议；请用塔台原生 QX 导出');
    const allowed = new Set(['name','type','server','port','password','uuid','cipher','plugin','plugin-opts','udp','tfo','tls','network','servername','sni','skip-cert-verify','client-fingerprint','fingerprint','alpn','flow','packet-encoding','reality-opts','idle-session-check-interval','idle-session-timeout','min-idle-session']);
    for (const key of Object.keys(n)) if (!allowed.has(key)) fail('NODE_OPTION', '节点含未实现字段；请用塔台原生导出');
    const server = scalar(n.server, 'server');
    if (/[\s/?#@]/.test(server)) fail('ENDPOINT', '服务器地址无效');
    const port = +n.port;
    if (!Number.isInteger(port) || port < 1 || port > 65535) fail('ENDPOINT', '端口无效');
    const address = server.includes(':') ? '[' + server.replace(/^\[|\]$/g, '') + ']' : server;
    if (n.network && n.network !== 'tcp') fail('TRANSPORT', '当前只转换 TCP；WS/gRPC/XHTTP 等请用原生 QX 订阅');
    if (n.fingerprint) fail('TLS_PIN', '证书 fingerprint 不能静默丢弃；请用原生 QX 导出');
    const out = [(type === 'ss' ? 'shadowsocks' : type) + '=' + address + ':' + port];
    if (type === 'ss') {
      const methods = ['aes-128-gcm','aes-192-gcm','aes-256-gcm','chacha20-ietf-poly1305','xchacha20-ietf-poly1305','2022-blake3-aes-128-gcm','2022-blake3-aes-256-gcm'];
      if (!methods.includes(n.cipher)) fail('CIPHER', 'SS 加密方式不在本解析器支持范围');
      out.push('method=' + n.cipher, 'password=' + scalar(n.password, 'password'));
      if (n.plugin) {
        if (!['obfs','obfs-local','simple-obfs'].includes(n.plugin)) fail('PLUGIN', 'SS 插件未实现，不能丢弃后当作普通 SS');
        const po = n['plugin-opts'] || {};
        if (!['http','tls'].includes(po.mode)) fail('PLUGIN', '只支持 simple-obfs HTTP/TLS');
        for (const k of Object.keys(po)) if (!['mode','host'].includes(k)) fail('PLUGIN', 'simple-obfs 含未实现参数');
        out.push('obfs=' + po.mode);
        if (po.host) out.push('obfs-host=' + scalar(po.host, 'obfs-host'));
      } else if (n['plugin-opts']) fail('PLUGIN', 'plugin-opts 缺少对应插件');
      if (n.tls || n.flow || n['reality-opts']) fail('TRANSPORT', 'SS 的额外 TLS/REALITY 不在此解析器范围');
    } else {
      if (n.plugin || n['plugin-opts']) fail('PLUGIN', '该协议不接受插件');
      if (type === 'vless') {
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(n.uuid || '')) fail('UUID', 'VLESS UUID 格式无效');
        out.push('method=none', 'password=' + n.uuid);
      } else out.push('password=' + scalar(n.password, 'password'));
      const reality = n['reality-opts'];
      const tls = type !== 'vless' || bool(n.tls, false) || !!reality;
      if (tls) {
        out.push(type === 'vless' ? 'obfs=over-tls' : 'over-tls=true');
        const sni = n.servername || n.sni;
        if (sni) out.push((type === 'vless' ? 'obfs-host=' : 'tls-host=') + scalar(sni, 'SNI'));
        const insecure = bool(n['skip-cert-verify'], false);
        if (insecure && opts['allow-insecure'] !== '1') fail('INSECURE_TLS', '来源要求跳过 TLS 证书验证；优先换机场的安全原生订阅。如明确接受原设置，在此资源 URL 末尾加 #allow-insecure=1');
        out.push('tls-verification=' + !insecure);
        if (insecure) notices.add('按 allow-insecure=1 保留上游跳过证书验证设置；仅影响明确标记的节点。');
        if (reality) {
          if (!/^[\w-]{43}$/.test(reality['public-key'] || '')) fail('REALITY', 'REALITY 公钥格式无效');
          if (typeof reality['short-id'] !== 'string' || !/^(?:[a-f0-9]{2}){0,8}$/i.test(reality['short-id'])) fail('REALITY', 'REALITY short-id 应为保留前导零的字符串');
          if (Object.keys(reality).some(k => !['public-key','short-id'].includes(k))) fail('REALITY', 'REALITY 含未实现参数');
          out.push('reality-base64-pubkey=' + reality['public-key']);
          if (reality['short-id']) out.push('reality-hex-shortid=' + reality['short-id']);
          notices.add('REALITY 使用 QX 内核自己的指纹，不复制 Clash 的 Chrome 指纹。');
        } else if (n.alpn) {
          if (!Array.isArray(n.alpn) || n.alpn.some(v => typeof v !== 'string' || !v.length || v.length > 255 || /[^\x20-\x7e]/.test(v))) fail('ALPN', 'ALPN 参数无效');
          out.push('tls-alpn=' + n.alpn.map(v => v.length.toString(16).padStart(2,'0') + Array.from(v).map(x => x.charCodeAt(0).toString(16).padStart(2,'0')).join('')).join(''));
        }
      }
      if (n.flow) {
        if (type !== 'vless' || n.flow !== 'xtls-rprx-vision' || !tls) fail('FLOW', 'VLESS flow 无法转换');
        out.push('vless-flow=xtls-rprx-vision');
      }
      if (n['packet-encoding'] && !(type === 'vless' && n['packet-encoding'] === 'xudp')) fail('UDP', 'packet-encoding 无法安全转换');
      if (n['client-fingerprint']) notices.add('TLS 指纹由 QX 内核决定；不会输出不存在的 client-fingerprint 字段。');
      if (['idle-session-check-interval','idle-session-timeout','min-idle-session'].some(k => n[k] !== undefined)) notices.add('AnyTLS 连接池使用 QX 内核设置，不复制 Mihomo 的 idle-session 调优参数。');
    }
    // TFO off is deliberate for Reality and Amy's published compatibility guidance.
    out.push('fast-open=false', 'udp-relay=' + bool(n.udp, false), 'tag=' + label((opts.prefix || '') + (n.name || type.toUpperCase())));
    return out.join(', ');
  }
  function validIP(s) {
    function v4(t) { const x=t.split('.'); return x.length===4 && x.every(v=>/^\d{1,3}$/.test(v) && +v<=255); }
    if (!s.includes(':')) return v4(s);
    if (s.includes('.')) {
      const at=s.lastIndexOf(':'); if (!v4(s.slice(at+1))) return false;
      s=s.slice(0,at+1)+'0:0';
    }
    const h=s.split('::'); if (h.length>2) return false;
    const a=h[0]?h[0].split(':'):[], b=h.length===2 && h[1]?h[1].split(':'):[];
    if (a.concat(b).some(v=>!/^[0-9a-f]{1,4}$/i.test(v))) return false;
    return h.length===1 ? a.length===8 : a.length+b.length<8;
  }
  function domainRule(v, policy) {
    if (typeof v !== 'string') fail('RULE', 'payload 条目必须是字符串');
    v = v.trim();
    if (v.startsWith('+.')) return 'host-suffix, ' + domain(v.slice(2)) + ', ' + policy;
    if (v.startsWith('*.')) return 'host-wildcard, *.' + domain(v.slice(2)) + ', ' + policy;
    if (v.includes('/')) {
      const parts=v.split('/'), ipv6=parts[0].includes(':'), prefix=+parts[1];
      if (parts.length !== 2 || !/^\d+$/.test(parts[1]) || prefix > (ipv6 ? 128 : 32) || !validIP(parts[0])) fail('RULE','IP 网段无效');
      return (ipv6 ? 'ip6-cidr' : 'ip-cidr') + ', ' + v + ', ' + policy;
    }
    return 'host, ' + domain(v) + ', ' + policy;
  }
  function domain(s) {
    if (!/^(?:[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?\.)*[a-z0-9_](?:[a-z0-9_-]*[a-z0-9_])?$/i.test(s) || /^(MATCH|FINAL|DIRECT|REJECT|AND|OR|NOT|RULE-SET)$/i.test(s)) fail('RULE', '不是支持的域名/IP payload；不要把完整 tower.yaml 或 classical 逻辑规则放进来');
    return s;
  }
  function nativeText(text, opts) {
    opts = opts || {};
    const lines = text.split(/\r?\n/).map(s => s.trim()).filter(s => s && !/^[#;]/.test(s));
    const servers = /^(?:shadowsocks|vless|anytls|trojan|vmess|http|socks5)=/;
    const filters = /^(?:host|host-suffix|host-wildcard|host-keyword|ip-cidr|ip6-cidr|ip-asn|geoip|user-agent)\s*,/i;
    if (lines.length && lines.every(s => servers.test(s))) {
      if (opts.type && opts.type !== 'server') fail('RESOURCE_TYPE','原生节点应放入服务器资源');
      if (opts.prefix) fail('NATIVE_OPTION','原生QX行透传不执行prefix，请在塔台重命名');
      return lines.join('\n');
    }
    if (lines.length && lines.every(s => filters.test(s))) {
      if (opts.type && opts.type !== 'filter') fail('RESOURCE_TYPE','原生规则应放入分流资源');
      return lines.join('\n');
    }
    return null;
  }
  function convert(resource) {
    if (typeof resource.content !== 'string' || !resource.content.trim()) fail('EMPTY', '订阅返回空内容，请检查来源是否有效');
    if (resource.content.length > 8 * 1024 * 1024) fail('SIZE', '资源超过 8 MiB，请拆分资源');
    const opts = options(String(resource.link || '').split('#').slice(1).join('#'));
    const knownOpts = new Set(['allow-insecure','policy','prefix','ua','type']);
    for (const k of Object.keys(opts)) if (!knownOpts.has(k)) fail('OPTION','未知解析参数；此解析器不使用其他解析器的参数语法');
    let text = resource.content.replace(/^\uFEFF/, '').trim();
    if (/^(?:<!doctype\s+html|<html|<head|<body)/i.test(text)) fail('HTML', '下载到 HTML 错误/登录页；检查订阅权限、客户端版本和 UA。解析器不能生成缺失的节点');
    if (/^\s*\[(?:general|policy|dns|server_local|server_remote|filter_local|filter_remote|mitm|rewrite_remote)\]/im.test(text)) fail('FULL_CONFIG', '这是 QX 配置文件。请通过配置文件导入；不要作为服务器或分流资源导入');
    const native = nativeText(text, opts);
    if (native !== null) return native;
    if (/^[A-Za-z0-9+/_=\-\s]+$/.test(text) && text.replace(/\s/g,'').length > 20) {
      const candidate = base64(text);
      if (/^(?:ss|vless|anytls|trojan):\/\//i.test(candidate.trim()) || nativeText(candidate) !== null) text = candidate.trim();
      else fail('FORMAT', 'Base64 解码后不是支持的节点资源');
      const pass = nativeText(text, opts); if (pass !== null) return pass;
    }
    let nodes;
    if (/^\w+:\/\//.test(text)) nodes = text.split(/\r?\n/).map(s=>s.trim()).filter(s=>s && !s.startsWith('#')).map(nodeURI);
    else {
      let parsed;
      try { parsed = jsyaml.load(text, { schema: jsyaml.JSON_SCHEMA }); }
      catch (_) { fail('YAML', 'JSON/YAML 解析失败；未输出原文以保护凭据'); }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail('FORMAT', '不是支持的节点列表或 payload 规则列表');
      if (Array.isArray(parsed.proxies)) {
        // Explicit server-resource conversion ignores an airport's bundled policy/DNS.
        // A node-free personal rule template must never be treated as a server resource.
        nodes = parsed.proxies;
      } else if (Array.isArray(parsed.payload) && Object.keys(parsed).length === 1) {
        if (opts.type && opts.type !== 'filter') fail('RESOURCE_TYPE','该 URL 返回规则，应放入分流资源');
        const policy = scalar(opts.policy || 'proxy','policy');
        if (!parsed.payload.length || parsed.payload.length > 200000) fail('RULE', '规则列表为空或过大');
        return parsed.payload.map(v => domainRule(v, policy)).join('\n');
      } else if (parsed.rules || parsed['proxy-groups'] || parsed['rule-providers']) fail('FULL_CONFIG', 'tower.yaml 是完整规则方案。请在塔台导入并导出 QX；不能作为一条 QX 分流资源');
      else fail('FORMAT', '返回值没有 proxies 或 payload；检查下载地址与订阅状态');
    }
    if (opts.type && opts.type !== 'server') fail('RESOURCE_TYPE','该 URL 返回节点，应放入服务器资源');
    if (!nodes.length || nodes.length > 5000) fail('NODES','节点列表为空或超过5000个');
    const used = new Set(); const output=[];
    for (const n of nodes) {
      if (/(剩余流量|当前流量|流量重置|到期时间|套餐到期|^traffic\s*:|^expire\s*:|traffic remaining|expire date)/i.test(String(n.name || ''))) { notices.add('已去除流量/到期说明占位节点。'); continue; }
      const line = node(n, opts), name = line.slice(line.lastIndexOf('tag=') + 4);
      if (used.has(name)) fail('DUPLICATE','节点重名；请在塔台去重，或对不同来源使用 prefix 参数');
      used.add(name); output.push(line);
    }
    if (!output.length) fail('NODES','过滤后没有节点');
    return output.join('\n');
  }
  let result;
  try { result = { content: convert($resource) }; }
  catch (e) { result = { error: '[' + (e.code || 'PARSER') + '] ' + (e.code ? e.message : '无法解析；请检查格式或使用原生 QX 导出') }; }
  // Native retry is optional; old QX keeps content/error fallback. Never HTTP-fetch here.
  try {
    const o = options(String($resource.link || '').split('#').slice(1).join('#'));
    if (o.ua && !$resource.user_agent) {
      const uas = { clash: 'clash.meta', qx: 'Quantumult%20X/1.8.0' };
      if (!uas[o.ua]) result = { error:'[UA] ua 只允许 clash 或 qx' };
      else result.retry = { user_agent: uas[o.ua] };
    }
  } catch (_) { /* convert already returned the sanitized error */ }
  if (notices.size && result.content && typeof $notify === 'function') $notify('个人资源解析器', '转换说明', Array.from(notices).join('\n'));
  $done(result);
})();
