// Adding to the Home Screen (js/install.js): which devices get which suggestion, and the steps.
import assert from "node:assert/strict";
import { installWay, isIPad, safariVersion, iosSteps, ICONS } from "../js/install.js";

const UA = {
  iphone26: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1",
  iphone17: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  ipadDesk: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15",
  ipadOld: "Mozilla/5.0 (iPad; CPU OS 12_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
  chromeIOS: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
  firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:128.0) Gecko/20100101 Firefox/128.0"
};
const env = (ua, o = {}) => Object.assign({ ua, platform: /Macintosh/.test(ua) ? "MacIntel" : "iPhone", touch: 0, standalone: false, prompt: null }, o);

assert.equal(installWay(env(UA.iphone26, { touch: 5 })), "ios");
assert.equal(installWay(env(UA.iphone17, { touch: 5 })), "ios");
assert.equal(installWay(env(UA.ipadDesk, { touch: 5 })), "ios", "iPadOS Safari asks for the desktop site");
assert.equal(installWay(env(UA.ipadOld, { touch: 5 })), "ios");
assert.equal(installWay(env(UA.ipadDesk, { touch: 0 })), null, "a Mac's Safari gets nothing");
assert.equal(installWay(env(UA.chromeIOS, { touch: 5 })), null, "Chrome on iOS isn't Safari");
assert.equal(installWay(env(UA.firefox)), null);
assert.equal(installWay(env(UA.android, { platform: "Linux" })), null, "no event yet, nothing");
assert.equal(installWay(env(UA.android, { platform: "Linux", prompt: {} })), "prompt");
assert.equal(installWay(env(UA.iphone26, { touch: 5, standalone: true })), "installed");
assert.equal(installWay(env(UA.android, { prompt: {}, standalone: true })), "installed");

assert.ok(isIPad(env(UA.ipadDesk, { touch: 5 })) && !isIPad(env(UA.iphone26, { touch: 5 })));
assert.equal(safariVersion(UA.iphone26), 26);
assert.equal(safariVersion(UA.iphone17), 17);

// iOS 26 on an iPhone goes through ⋯; older through Share; an iPad's Share is at the top.
const s26 = iosSteps({ ipad: false, version: 26 }), s17 = iosSteps({ ipad: false, version: 17 }), pad = iosSteps({ ipad: true, version: 26 });
assert.deepEqual(s26.map((s) => s.icon), ["more", "share", "add", ""]);
assert.deepEqual(s17.map((s) => s.icon), ["share", "add", ""]);
assert.match(pad[0].html, /top of the screen/);
assert.match(s26.at(-1).html, /Open as Web App/);
assert.doesNotMatch(s17.at(-1).html, /Web App/);
for (const steps of [s26, s17, pad, iosSteps({ ipad: true, version: 17 })]) {
  for (const s of steps) assert.ok(!s.icon || ICONS[s.icon], s.icon);
  assert.ok(steps.some((s) => /Add to Home Screen/.test(s.html)));
}
for (const [k, v] of Object.entries(ICONS)) assert.match(v, /^<svg [^>]*aria-hidden="true"/, k);

console.log("install: ok");
