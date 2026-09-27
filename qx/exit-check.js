/* Quantumult X event-interaction: inspect only the node selected in its UI.
 * No policy selection changes, subscription reads, persistence, or API keys.
 * Official API: crossutility/Quantumult-X/sample-fetch-opts-policy.js
 */
(function () {
  "use strict";
  var REQUEST_MS = 8000;
  var TOTAL_MS = 10000;
  var finished = false;
  var timers = [];
  var started = Date.now();
  var results = {};
  var sources = [
    { id: "cf", name: "Cloudflare", url: "https://www.cloudflare.com/cdn-cgi/trace" },
    { id: "who", name: "ipwho.is", url: "https://ipwho.is/?fields=success,ip,country_code,connection" }
  ];
  var limits = "国家为数据库判断；ASN/ISP 不是家宽证明；不保证 AI 或流媒体解锁。耗时是本次 HTTPS 请求时间，不是下载速度。";

  function finish(title, message) {
    if (finished) return;
    finished = true;
    timers.forEach(function (timer) { clearTimeout(timer); });
    $done({ title: title, message: message });
  }

  function safeLabel(value) {
    if (typeof value !== "string") return "未知";
    return value.replace(/[\u0000-\u001f\u007f<>]/g, " ").slice(0, 96) || "未知";
  }

  // Compare IPv6 representations without relying on browser-specific URL APIs.
  function ipKey(value) {
    if (typeof value !== "string" || value.length > 45) return null;
    function v4(text) {
      var parts = text.split(".");
      if (parts.length !== 4 || parts.some(function (p) { return !/^\d{1,3}$/.test(p) || +p > 255; })) return null;
      return parts.map(Number);
    }
    if (value.indexOf(":") < 0) {
      var octets = v4(value);
      return octets ? "v4:" + octets.join(".") : null;
    }
    var text = value.toLowerCase();
    if (text.indexOf(".") >= 0) {
      var split = text.lastIndexOf(":");
      var tail = v4(text.slice(split + 1));
      if (!tail) return null;
      text = text.slice(0, split + 1) + ((tail[0] << 8) | tail[1]).toString(16) + ":" + ((tail[2] << 8) | tail[3]).toString(16);
    }
    var halves = text.split("::");
    if (halves.length > 2) return null;
    var left = halves[0] ? halves[0].split(":") : [];
    var right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
    if (left.concat(right).some(function (p) { return !/^[0-9a-f]{1,4}$/.test(p); })) return null;
    var missing = 8 - left.length - right.length;
    if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
    return "v6:" + left.concat(Array(missing).fill("0"), right).map(function (p) { return parseInt(p, 16).toString(16); }).join(":");
  }

  function parse(source, response) {
    if (!response || response.statusCode !== 200) {
      return { ok: false, error: response && response.statusCode === 429 ? "限流，请稍后再试" : "HTTP 请求失败" };
    }
    if (typeof response.body !== "string" || response.body.length > 65536) return { ok: false, error: "响应格式异常" };
    var ip, country, asn = "未知", isp = "未知";
    try {
      if (source.id === "cf") {
        var fields = {};
        response.body.split(/\r?\n/).forEach(function (line) {
          var at = line.indexOf("=");
          if (at > 0) fields[line.slice(0, at)] = line.slice(at + 1).trim();
        });
        ip = fields.ip;
        country = fields.loc;
      } else {
        var data = JSON.parse(response.body);
        if (!data || data.success !== true) return { ok: false, error: "查询服务未返回有效结果" };
        ip = data.ip;
        country = data.country_code;
        var connection = data.connection || {};
        if (Number.isInteger(connection.asn) && connection.asn > 0 && connection.asn <= 4294967295) asn = "AS" + connection.asn;
        isp = safeLabel(connection.isp || connection.org);
      }
      var key = ipKey(ip);
      if (!key || typeof country !== "string" || !/^[A-Z]{2}$/.test(country)) return { ok: false, error: "响应缺少有效 IP 或国家代码" };
      return { ok: true, ip: ip, key: key, country: country, asn: asn, isp: isp };
    } catch (_) {
      return { ok: false, error: "响应格式异常" };
    }
  }

  function report(deadline) {
    if (finished) return;
    var cf = results.cf, who = results.who;
    var good = [cf, who].filter(function (r) { return r && r.ok; }).length;
    var state = good === 2 ? "完成" : good === 1 ? "部分失败" : "失败";
    var comparison = "两源一致性：无法判断（需要两源都成功）";
    if (good === 2) {
      var sameIP = cf.key === who.key;
      var sameCountry = cf.country === who.country;
      state = sameIP && sameCountry ? "完成" : "来源不一致";
      comparison = "两源一致性：IP " + (sameIP ? "相同" : "不同") + "；国家 " + (sameCountry ? "相同" : "不同");
    }
    var lines = ["状态：" + state];
    sources.forEach(function (source) {
      var r = results[source.id];
      lines.push(source.name + "：" + (!r ? "总超时" : !r.ok ? r.error + "（" + r.ms + " ms）" : r.ip + " / " + r.country + "（" + r.ms + " ms）"));
    });
    lines.push("ASN：" + (who && who.ok ? who.asn : "未知") + "；ISP：" + (who && who.ok ? who.isp : "未知") + "（仅 ipwho.is）");
    lines.push(comparison);
    if (state === "来源不一致") lines.push("先复测；可能是 IPv4/IPv6、按目的地分出口、出口轮换或数据库差异，暂不归为固定出口。ASN 只描述 ipwho.is 观察到的 IP。");
    if (deadline) lines.push("已到总时限，结束等待；不会转为直连重试。");
    lines.push("总耗时：" + (Date.now() - started) + " ms", limits);
    finish("节点出口体检：" + state, lines.join("\n"));
  }

  var node = typeof $environment !== "undefined" ? $environment.params : null;
  if (typeof node !== "string" || !node.trim() || /^(direct|reject|proxy)$/i.test(node.trim())) {
    finish("节点出口体检：失败", "状态：失败\n没有收到明确的节点名称。请开启 QX 隧道后，从具体节点的操作菜单点按“出口体检”；不要从任务列表直接运行。未发送请求，也不会默认检查 direct。");
    return;
  }
  timers.push(setTimeout(function () { report(true); }, TOTAL_MS));
  sources.forEach(function (source) {
    var requestStart = Date.now();
    var settled = false;
    function settle(value) {
      if (settled || finished) return;
      settled = true;
      clearTimeout(timer);
      value.ms = Date.now() - requestStart;
      results[source.id] = value;
      if (results.cf && results.who) report(false);
    }
    var timer = setTimeout(function () { settle({ ok: false, error: "请求超时" }); }, REQUEST_MS);
    timers.push(timer);
    try {
      $task.fetch({ url: source.url, method: "GET", opts: { policy: node }, headers: { "Accept": source.id === "cf" ? "text/plain" : "application/json" } }).then(
        function (response) { settle(parse(source, response)); },
        function () { settle({ ok: false, error: "网络请求失败" }); }
      );
    } catch (_) {
      settle({ ok: false, error: "无法发起请求" });
    }
  });
})();
