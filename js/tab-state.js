/* Only the reading lamp belongs to a tab. Accounts and progress use localStorage.
   A new window can inherit sessionStorage from its opener. The window-name token
   distinguishes that new context from navigation within the original tab. */
"use strict";
window.HubLamp = (() => {
  const key = "rasuli.hub.final.lamp";
  const tokenKey = "rasuli.hub.final.tab";
  const prefix = "rasuli-reading-room:";
  let on = false;
  try {
    if (!window.name.startsWith(prefix) || sessionStorage.getItem(tokenKey) !== window.name) {
      window.name = prefix + crypto.randomUUID();
      sessionStorage.setItem(tokenKey, window.name);
      sessionStorage.removeItem(key);
    }
    on = sessionStorage.getItem(key) === "on";
  } catch { /* The lamp still works on the current page if storage is blocked. */ }
  document.documentElement.dataset.lamp = on ? "on" : "off";
  return {
    get on() { return on; },
    set(value) {
      on = Boolean(value);
      document.documentElement.dataset.lamp = on ? "on" : "off";
      try { sessionStorage.setItem(key, on ? "on" : "off"); } catch { /* Optional tab preference. */ }
    }
  };
})();
