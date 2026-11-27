// Adding Sumgeon to the Home Screen: which way this device can do it, and the iPhone and iPad
// steps with their drawn icons. No DOM: app.js passes in what the browser reports.
//
// On iPhone and iPad, a Home Screen web app keeps its own saved data, apart from Safari's, so a
// player's progress made in Safari isn't in the app (and the other way round). The start screen
// suggests adding it first, quietly, for a grown-up (installHTML in app.js).

// The way to install here:
//   "installed": already running from the Home Screen (or as an installed app): nothing to suggest.
//   "prompt":    Chrome and the like fired beforeinstallprompt (kept): its prompt() installs.
//   "ios":       Safari on an iPhone, iPod or iPad: no install API, so the steps (iosSteps).
//   null:        anything else (desktop, Firefox, an iOS browser other than Safari): nothing.
// env: { ua, platform, touch (navigator.maxTouchPoints), standalone (display-mode standalone or
// fullscreen, or navigator.standalone), prompt (a kept beforeinstallprompt event, or null) }.
export function installWay(env) {
  if (env.standalone) return "installed";
  if (env.prompt) return "prompt";
  return isIOSSafari(env) ? "ios" : null;
}

// iPadOS Safari says it's a Mac ("Macintosh", platform MacIntel) but has a touch screen.
export function isIPad(env) {
  return /iPad/.test(env.ua) || (/Macintosh/.test(env.ua) && env.platform === "MacIntel" && (env.touch || 0) > 1);
}
export function isIOS(env) { return /iPhone|iPod/.test(env.ua) || isIPad(env); }
// Safari itself, not Chrome, Firefox, Edge or Opera on iOS, nor an app's own web view (they add
// to the Home Screen differently, or not at all).
export function isIOSSafari(env) {
  return isIOS(env) && /Safari\//.test(env.ua) && /Version\/\d/.test(env.ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|FBAN|FBAV|Instagram|Line\//.test(env.ua);
}
// Safari's own version ("Version/26.0"). iOS 26 froze the system version in the user agent
// ("OS 18_6"), so Safari's is the one that tells iOS 26 apart.
export function safariVersion(ua) {
  const m = /Version\/(\d+)/.exec(ua);
  return m ? +m[1] : 0;
}

// The drawn icons, as Safari shows them (stroked in currentColor, so they take the text color).
const ICON = (body) => `<svg class="a2i" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const ICONS = {
  // Share: a square open at the top, an arrow up out of it.
  share: ICON('<path d="M8 9H6.5A1.5 1.5 0 0 0 5 10.5v9A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 17.5 9H16"/><path d="M12 3v12M8 6.5 12 3l4 3.5"/>'),
  // More: three dots in a circle (iOS 26's ⋯ by the address bar).
  more: ICON('<circle cx="12" cy="12" r="9.5"/><circle cx="7.6" cy="12" r=".9" fill="currentColor"/><circle cx="12" cy="12" r=".9" fill="currentColor"/><circle cx="16.4" cy="12" r=".9" fill="currentColor"/>'),
  // Add to Home Screen: a plus in a rounded square.
  add: ICON('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>')
};

// The steps, each { icon, html }: iOS 26 Safari on an iPhone opens Share from ⋯ by the address
// bar; older iPhones have Share in the toolbar; an iPad has Share at the top. From iOS 26 every
// site added opens as a web app, with an "Open as Web App" switch that should stay on (off, it's
// a bookmark that opens in Safari, with Safari's progress).
export function iosSteps({ ipad, version }) {
  const ios26 = version >= 26;
  const add = { icon: "add", html: "Tap <b>Add to Home Screen</b>. Scroll down if you don't see it." };
  const last = ios26 ? { icon: "", html: "Leave <b>Open as Web App</b> on, then tap <b>Add</b>." } : { icon: "", html: "Tap <b>Add</b>." };
  if (ipad) return [{ icon: "share", html: "Tap <b>Share</b> at the top of the screen." }, add, last];
  if (ios26) return [{ icon: "more", html: "Tap <b>⋯</b> by the address bar." }, { icon: "share", html: "Tap <b>Share</b>." }, add, last];
  return [{ icon: "share", html: "Tap <b>Share</b> in Safari's toolbar." }, add, last];
}
