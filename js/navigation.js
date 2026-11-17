/* Real HTML pages with native cross-document transitions and a short fade
   fallback. Links still support keyboard, new tabs, downloads and history. */
"use strict";
(() => {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const nativeTransitions = "onpagereveal" in window && "onpageswap" in window &&
    /^https?:$/.test(location.protocol);
  root.dataset.navigation = nativeTransitions ? "native" : "fade";
  let leaving = false;
  let navigationTimer;
  let recoveryTimer;

  function reset() {
    clearTimeout(navigationTimer);
    clearTimeout(recoveryTimer);
    leaving = false;
    root.classList.remove("is-page-leaving");
  }

  function go(href) {
    if (leaving) return;
    if (nativeTransitions || reduced.matches) {
      location.assign(href);
      return;
    }
    leaving = true;
    root.classList.add("is-page-leaving");
    navigationTimer = setTimeout(() => location.assign(href), 140);
    // A cancelled or slow navigation must never leave an invisible document.
    recoveryTimer = setTimeout(reset, 1600);
  }

  document.addEventListener("click", event => {
    if (nativeTransitions || reduced.matches || event.defaultPrevented ||
        event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link || link.hasAttribute("download") ||
        (link.target && link.target !== "_self") || link.relList.contains("external")) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || !/\/(?:[^/]+\.html)?$/.test(destination.pathname) ||
        (destination.pathname === location.pathname && destination.search === location.search)) return;
    event.preventDefault();
    go(destination.href);
  });

  window.addEventListener("pagereveal", event => {
    reset();
    if (event.viewTransition) {
      if (reduced.matches) event.viewTransition.skipTransition();
      // The shared page transition supplies the entrance; do not replay the
      // separate headline and reading-room entrances underneath it.
      root.dataset.pageEntry = "cross-document";
    }
  });
  window.addEventListener("pageshow", reset);
  window.HubNavigation = {go};
})();
