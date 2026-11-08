/* Frontend motion: navigation and study-cycle feedback. The supplied favicon stays unchanged. */
"use strict";
(() => {
  const root = document.documentElement;
  const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const preferenceKey = "rasuli.hub.endterm.motion";
  let preference = "on";
  try {
    preference = sessionStorage.getItem(preferenceKey) || "on";
  } catch {
    /* Optional preference only. */
  }
  let enabled = !systemMotion.matches && preference !== "off";
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "motion-toggle";
  const dot = document.createElement("span");
  dot.className = "motion-dot";
  dot.setAttribute("aria-hidden", "true");
  const toggleText = document.createElement("span");
  toggle.append(dot, toggleText);
  document.body.append(toggle);

  function applyMotion() {
    enabled = !systemMotion.matches && preference !== "off";
    root.dataset.motion = enabled ? "on" : "off";
    toggle.setAttribute("aria-pressed", String(enabled));
    toggle.setAttribute(
      "aria-label",
      systemMotion.matches
        ? "Animations paused by your reduced-motion setting"
        : enabled
          ? "Pause animations"
          : "Enable animations",
    );
    toggleText.textContent = systemMotion.matches
      ? "Reduced motion"
      : enabled
        ? "Motion on"
        : "Motion off";
    toggle.title = toggle.getAttribute("aria-label");
    toggle.disabled = systemMotion.matches;
    if (window.jQuery) {
      window.jQuery.fx.off = !enabled;
      if (!enabled) window.jQuery(":animated").stop(true, true);
    }
    window.dispatchEvent(new Event("hub:motion"));
  }
  toggle.addEventListener("click", () => {
    preference = enabled ? "off" : "on";
    try {
      sessionStorage.setItem(preferenceKey, preference);
    } catch {
      /* Still works for this page. */
    }
    applyMotion();
  });
  systemMotion.addEventListener("change", applyMotion);
  applyMotion();

  // Follow the hovered or keyboard-focused link without moving neighbouring links.
  const navigation = document.getElementById("mainNav");
  let highlighted = navigation?.querySelector('[aria-current="page"]');
  function highlight(link) {
    if (!navigation || !link) return;
    highlighted = link;
    navigation.style.setProperty(
      "--nav-x",
      link.parentElement.offsetLeft + link.offsetLeft + "px",
    );
    navigation.style.setProperty(
      "--nav-y",
      link.parentElement.offsetTop + link.offsetTop + "px",
    );
    navigation.style.setProperty("--nav-width", link.offsetWidth + "px");
    navigation.style.setProperty("--nav-height", link.offsetHeight + "px");
    navigation.style.setProperty("--nav-visible", "1");
  }
  function restoreHighlight() {
    const focused = document.activeElement?.closest(".page-nav-link");
    highlight(
      focused && navigation.contains(focused)
        ? focused
        : navigation.querySelector('[aria-current="page"]'),
    );
  }
  if (navigation) {
    navigation.addEventListener("pointerover", (event) => {
      const link = event.target.closest(".page-nav-link");
      if (link) highlight(link);
    });
    navigation.addEventListener("focusin", (event) => {
      const link = event.target.closest(".page-nav-link");
      if (link) highlight(link);
    });
    navigation.addEventListener("pointerleave", restoreHighlight);
    navigation.addEventListener("focusout", () =>
      requestAnimationFrame(restoreHighlight),
    );
    if ("ResizeObserver" in window)
      new ResizeObserver(() => highlight(highlighted)).observe(navigation);
    window.addEventListener("resize", () => highlight(highlighted), {
      passive: true,
    });
    requestAnimationFrame(() => highlight(highlighted));
  }

  const header = document.querySelector(".site-header");
  let scrollQueued = false;
  function scrollProgress() {
    const range = document.documentElement.scrollHeight - innerHeight;
    header?.style.setProperty(
      "--reading-progress",
      String(range > 0 ? Math.min(1, Math.max(0, scrollY / range)) : 0),
    );
    scrollQueued = false;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scrollQueued) {
        scrollQueued = true;
        requestAnimationFrame(scrollProgress);
      }
    },
    { passive: true },
  );
  scrollProgress();

  // Each study card is a real button with a useful instruction, not a dead tile.
  const steps = [...document.querySelectorAll("[data-focus-step]")];
  const detail = document.getElementById("focus-step-detail");
  const tips = [
    [
      "01 / PREVIEW",
      "Before you start, scan the headings and write one question you want this session to answer.",
    ],
    [
      "02 / LEARN",
      "Read one focused section. Note the central idea in your own words before moving to the next concept.",
    ],
    [
      "03 / PRACTICE",
      "Close the source and try one exercise from memory. Use mistakes to decide what needs another look.",
    ],
    [
      "04 / REVIEW",
      "Write a two-sentence summary, mark your session complete, and choose one question for your next study block.",
    ],
  ];
  steps.forEach((button) =>
    button.addEventListener("click", () => {
      const index = Number(button.dataset.focusStep);
      steps.forEach((step) =>
        step.setAttribute("aria-pressed", String(step === button)),
      );
      detail.querySelector(".focus-detail-kicker").textContent = tips[index][0];
      detail.querySelector("p").textContent = tips[index][1];
      if (window.jQuery)
        window
          .jQuery(detail)
          .stop(true, true)
          .hide()
          .fadeIn(enabled ? 220 : 0);
    }),
  );

  let pointerFrame = null;
  document.addEventListener(
    "pointermove",
    (event) => {
      const card = event.target.closest(".focus-step");
      if (!enabled || !finePointer.matches || !card) return;
      cancelAnimationFrame(pointerFrame);
      const x = event.clientX,
        y = event.clientY;
      pointerFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const horizontal = Math.max(
          0,
          Math.min(1, (x - rect.left) / rect.width),
        );
        const vertical = Math.max(0, Math.min(1, (y - rect.top) / rect.height));
        card.style.setProperty("--pointer-x", horizontal * 100 + "%");
        card.style.setProperty("--pointer-y", vertical * 100 + "%");
        card.style.setProperty("--tilt-x", (0.5 - vertical) * 4 + "deg");
        card.style.setProperty("--tilt-y", (horizontal - 0.5) * 4 + "deg");
      });
    },
    { passive: true },
  );
  steps.forEach((card) =>
    card.addEventListener("pointerleave", () => {
      cancelAnimationFrame(pointerFrame);
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    }),
  );

  document.addEventListener("click", (event) => {
    if (!enabled) return;
    const button = event.target.closest(
      ".btn,.icon-button,.save-button,.page-nav-link,.focus-step",
    );
    if (!button || button.disabled) return;
    button.querySelector(".click-wave")?.remove();
    const wave = document.createElement("span");
    wave.className = "click-wave";
    wave.setAttribute("aria-hidden", "true");
    const rect = button.getBoundingClientRect(),
      size = Math.max(rect.width, rect.height) * 2;
    wave.style.width = wave.style.height = size + "px";
    wave.style.left =
      (event.detail ? event.clientX - rect.left : rect.width / 2) + "px";
    wave.style.top =
      (event.detail ? event.clientY - rect.top : rect.height / 2) + "px";
    button.append(wave);
    setTimeout(() => wave.remove(), 700);
  });

  // Content remains readable if animation or JavaScript is unavailable.
  if ("IntersectionObserver" in window) {
    const selector =
      ".feature-card,.focus-step,.pathway-card,.library-card,.photo-story,.section-heading-row,.planner-panel,.plan-stat";
    const observed = new WeakSet();
    let order = 0;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.08 },
    );
    function observeWithin(node) {
      if (!(node instanceof Element)) return;
      const targets = [...node.querySelectorAll(selector)];
      if (node.matches(selector)) targets.unshift(node);
      targets.forEach((target) => {
        if (observed.has(target)) return;
        observed.add(target);
        target.classList.add("motion-arrival");
        target.style.setProperty("--arrival-delay", (order++ % 4) * 60 + "ms");
        observer.observe(target);
      });
    }
    const main = document.querySelector("main");
    if (main) {
      observeWithin(main);
      new MutationObserver((records) =>
        records.forEach((record) => record.addedNodes.forEach(observeWithin)),
      ).observe(main, { childList: true, subtree: true });
    }
  }
})();

