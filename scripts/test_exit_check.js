"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const code = fs.readFileSync(path.join(__dirname, "../qx/exit-check.js"), "utf8");
const tick = () => new Promise(resolve => setImmediate(resolve));
const cf = (ip = "192.0.2.1", country = "US") => ({ statusCode: 200, body: `ip=${ip}\nloc=${country}\ncolo=LAX\n` });
const who = (ip = "192.0.2.1", country = "US") => ({ statusCode: 200, body: JSON.stringify({ success: true, ip, country_code: country, connection: { asn: 64500, isp: "Example ISP" } }) });

function harness(params, handler) {
  const requests = [], outputs = [], timers = new Map();
  let id = 0, now = 1000;
  const forbidden = new Proxy({}, { get() { throw Error("Configuration/storage access is forbidden"); } });
  vm.runInNewContext(code, {
    $environment: { params },
    $task: { fetch(request) { requests.push(request); return handler(request, requests.length); } },
    $done(value) { outputs.push(value); },
    $configuration: forbidden, $prefs: forbidden, $resource: forbidden,
    console: { log() { throw Error("Raw logging is forbidden"); } },
    Date: { now: () => now },
    setTimeout(fn, ms) { const timer = ++id; timers.set(timer, { fn, ms }); return timer; },
    clearTimeout(timer) { timers.delete(timer); }
  });
  return { requests, outputs, timers, fire(ms) {
    now += ms;
    for (const [timer, value] of [...timers]) {
      if (value.ms === ms && timers.has(timer)) { timers.delete(timer); value.fn(); }
    }
  } };
}

(async function () {
  for (const params of [undefined, null, "", "  ", {}, "direct", "PROXY", "reject"]) {
    const h = harness(params, () => { throw Error("Must not fetch"); });
    assert.equal(h.requests.length, 0);
    assert.equal(h.outputs.length, 1);
    assert.match(h.outputs[0].message, /状态：失败/);
  }
  const h = harness("🇺🇸 Amy 01", (_, n) => Promise.resolve(n === 1 ? cf() : who()));
  await tick();
  assert.equal(h.requests.length, 2);
  h.requests.forEach(r => { assert.equal(r.opts.policy, "🇺🇸 Amy 01"); assert.match(r.url, /^https:\/\//); assert.equal(r.method, "GET"); });
  assert.equal(h.outputs.length, 1);
  assert.match(h.outputs[0].message, /状态：完成/);
  assert.match(h.outputs[0].message, /IP 相同；国家 相同/);
  assert.match(h.outputs[0].message, /AS64500/);
  assert.equal(h.timers.size, 0);

  const mismatch = harness("Node", (_, n) => Promise.resolve(n === 1 ? cf() : who("192.0.2.2", "JP")));
  await tick();
  assert.match(mismatch.outputs[0].title, /来源不一致/);
  assert.match(mismatch.outputs[0].message, /192\.0\.2\.1/);
  assert.match(mismatch.outputs[0].message, /192\.0\.2\.2/);
  assert.match(mismatch.outputs[0].message, /IP 不同；国家 不同/);
  const countryMismatch = harness("Node", (_, n) => Promise.resolve(n === 1 ? cf() : who("192.0.2.1", "JP")));
  await tick();
  assert.match(countryMismatch.outputs[0].message, /IP 相同；国家 不同/);

  const ipv6 = harness("Node", (_, n) => Promise.resolve(n === 1 ? cf("2001:db8::1") : who("2001:0db8:0000:0000:0000:0000:0000:0001")));
  await tick();
  assert.match(ipv6.outputs[0].message, /IP 相同/);

  let release;
  const timeout = harness("Node", () => new Promise(resolve => { release = resolve; }));
  timeout.fire(8000);
  assert.equal(timeout.outputs.length, 1);
  assert.match(timeout.outputs[0].title, /失败/);
  assert.match(timeout.outputs[0].message, /请求超时/);
  release(who()); await tick();
  assert.equal(timeout.outputs.length, 1, "late response must not call done twice");
  const hard = harness("Node", () => new Promise(() => {}));
  hard.fire(10000);
  assert.equal(hard.outputs.length, 1);
  assert.match(hard.outputs[0].message, /总时限/);

  const partial = harness("Node", (_, n) => n === 1 ? Promise.resolve(cf()) : Promise.reject(Error("SECRET_SUBSCRIPTION_PASSWORD")));
  await tick();
  assert.match(partial.outputs[0].message, /状态：部分失败/);
  assert.doesNotMatch(JSON.stringify(partial.outputs), /SECRET/);
  const malformed = harness("Node", () => Promise.resolve({ statusCode: 200, body: "SECRET_INVALID_BODY" }));
  await tick();
  assert.match(malformed.outputs[0].message, /状态：失败/);
  assert.doesNotMatch(JSON.stringify(malformed.outputs), /SECRET/);
  const rate = harness("Node", () => Promise.resolve({ statusCode: 429, body: "SECRET" }));
  await tick();
  assert.match(rate.outputs[0].message, /限流/);
  assert.doesNotMatch(JSON.stringify(rate.outputs), /SECRET/);
  const sync = harness("Node", () => { throw Error("SECRET_SYNC"); });
  assert.equal(sync.outputs.length, 1);
  assert.doesNotMatch(JSON.stringify(sync.outputs), /SECRET/);
  assert.doesNotMatch(code, /get_server_description|set_policy_state|\$configuration\s*\./);
  console.log("PASS: explicit node routing, no mutation, HTTPS, agreement/mismatch, IPv6, bounded timeout, done once, safe errors.");
})().catch(error => { console.error(error); process.exitCode = 1; });
