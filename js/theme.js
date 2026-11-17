/* Run before stylesheets so a saved theme does not flash the opposite colour. */
"use strict";
(() => {
  const key = "rasuli.hub.final.theme";
  const root = document.documentElement;
  let theme = "dark";
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (saved === "light" || saved === "dark") theme = saved;
  } catch { /* A missing preference starts with the original dark design. */ }

  function paint() {
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#090a0b" : "#f5f2e9");
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.setAttribute("aria-pressed", String(theme === "dark"));
      button.setAttribute("aria-label", "Switch to " + (theme === "dark" ? "light" : "dark") + " mode");
      button.querySelector("[data-theme-label]").textContent = theme === "dark" ? "Dark" : "Light";
      button.querySelector("[data-theme-icon]").textContent = theme === "dark" ? "☾" : "☀";
    });
  }
  paint();
  document.addEventListener("DOMContentLoaded", () => {
    paint();
    document.querySelectorAll("[data-theme-toggle]").forEach(button => button.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      paint();
      try { localStorage.setItem(key, JSON.stringify(theme)); }
      catch { window.HubUI?.toast("Theme changed for this page. Allow site storage to remember it."); }
    }));
  });
  window.addEventListener("storage", event => {
    if (event.key !== key && event.key !== null) return;
    try { theme = JSON.parse(localStorage.getItem(key)) === "light" ? "light" : "dark"; }
    catch { theme = "dark"; }
    paint();
  });
})();
