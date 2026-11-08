/* Visual feedback only. Account rules live in auth.js; table data stays semantic. */
"use strict";
(() => {
  const root = document.documentElement;
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const motionAllowed = () => root.dataset.motion !== "off" && !reduced.matches;
  const animations = new Set();
  function animate(node, frames, options) {
    if (!motionAllowed() || !node.animate) return;
    // A new interaction replaces the previous one, avoiding queued animations.
    node
      .getAnimations()
      .filter((item) => item.id === "hub-feedback")
      .forEach((item) => item.cancel());
    const effect = node.animate(frames, options);
    effect.id = "hub-feedback";
    animations.add(effect);
    effect.finished.catch(() => {}).finally(() => animations.delete(effect));
  }
  window.addEventListener("hub:motion", () => {
    if (!motionAllowed()) {
      animations.forEach((effect) => effect.cancel());
      animations.clear();
    }
  });

  document.querySelectorAll(".lamp-switch").forEach((button) => {
    const room = button.closest(".auth-layout");
    const details = room.querySelector(".auth-details");
    const invitation = room.querySelector(".lamp-invitation");
    let startY = null,
      suppressClick = false;
    function setLight(on) {
      room.classList.toggle("lamp-on", on);
      document.body.classList.toggle("auth-asleep", !on);
      details.inert = !on;
      details.setAttribute("aria-hidden", String(!on));
      invitation.setAttribute("aria-hidden", String(on));
      button.setAttribute("aria-pressed", String(on));
      button.setAttribute("aria-expanded", String(on));
      button.setAttribute(
        "aria-label",
        on
          ? "Pull cord to turn off the light and hide the form"
          : "Pull cord to turn on the light and show the form",
      );
      button.querySelector(".pull-label").textContent = on
        ? "PULL TO SWITCH OFF"
        : "PULL FOR LIGHT";
      room.querySelector(".lamp-caption").textContent = on
        ? "The light is on. Your next chapter awaits."
        : "Pull the cord. Find your focus.";
      room
        .querySelectorAll(".auth-photo>p,.auth-photo-label")
        .forEach((node) => node.setAttribute("aria-hidden", String(!on)));
    }
    function toggleLight() {
      setLight(!room.classList.contains("lamp-on"));
      animate(
        button,
        [{ translate: "0 0" }, { translate: "0 16px" }, { translate: "0 0" }],
        { duration: 450, easing: "cubic-bezier(.2,.8,.2,1)" },
      );
    }
    // Keep entered values when dimmed. Inert also removes hidden controls from Tab order.
    setLight(false);
    button.addEventListener("click", (event) => {
      if (suppressClick && event.detail !== 0) {
        suppressClick = false;
        return;
      }
      toggleLight();
    });
    // A genuine downward pull works with a mouse, pen or touch; clicking and
    // native Enter/Space activation remain equally usable alternatives.
    button.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      startY = event.clientY;
      suppressClick = false;
      button.setPointerCapture(event.pointerId);
      button.classList.add("is-pulling");
    });
    button.addEventListener("pointermove", (event) => {
      if (startY === null) return;
      button.style.setProperty(
        "--pull-distance",
        Math.min(65, Math.max(0, event.clientY - startY)) + "px",
      );
    });
    button.addEventListener("pointerup", (event) => {
      if (startY === null) return;
      const pulled = event.clientY - startY >= 18;
      startY = null;
      button.classList.remove("is-pulling");
      button.style.removeProperty("--pull-distance");
      if (pulled) {
        suppressClick = true;
        toggleLight();
      }
    });
    button.addEventListener("pointercancel", () => {
      startY = null;
      suppressClick = false;
      button.classList.remove("is-pulling");
      button.style.removeProperty("--pull-distance");
    });
  });

  const signup = document.getElementById("signup-form");
  if (signup) {
    const fields = [
      "fullName",
      "email",
      "password",
      "confirmPassword",
      "field",
    ];
    function updateProgress() {
      const valid = fields.map((name) => {
        const field = signup.elements.namedItem(name);
        if (!field.value || !field.checkValidity()) return false;
        if (name === "password")
          return (
            /[a-z]/.test(field.value) &&
            /[A-Z]/.test(field.value) &&
            /[0-9]/.test(field.value) &&
            /[\W_]/.test(field.value)
          );
        if (name === "confirmPassword")
          return field.value === signup.elements.password.value;
        return field.value.trim().length > 0;
      });
      signup
        .querySelectorAll(".form-completion span")
        .forEach((segment, index) =>
          segment.classList.toggle("complete", valid[index]),
        );
      const count = valid.filter(Boolean).length;
      document.getElementById("signup-progress").textContent =
        count === 5
          ? "All five details are ready. Your chapter awaits."
          : count
            ? count + " of 5 details ready"
            : "Your first chapter starts with five details.";
    }
    signup.addEventListener("input", updateProgress);
    signup.addEventListener("change", updateProgress);
    signup.addEventListener("reset", () =>
      requestAnimationFrame(updateProgress),
    );
  }

  // Delegate pointer lighting so newly filtered resource cards work immediately.
  const cardSelector =
    ".feature-card,.pathway-card,.library-card,.plan-stat,.planner-panel";
  let pointerFrame;
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!motionAllowed() || !fine.matches) return;
      const card = event.target.closest(cardSelector);
      if (!card) return;
      const x = event.clientX,
        y = event.clientY;
      cancelAnimationFrame(pointerFrame);
      pointerFrame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const rx = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
        const ry = Math.max(0, Math.min(1, (y - rect.top) / rect.height));
        card.style.setProperty("--spot-x", rx * 100 + "%");
        card.style.setProperty("--spot-y", ry * 100 + "%");
        card.style.setProperty("--card-rx", (0.5 - ry) * 5 + "deg");
        card.style.setProperty("--card-ry", (rx - 0.5) * 5 + "deg");
      });
    },
    { passive: true },
  );
  document.addEventListener(
    "pointerout",
    (event) => {
      const card = event.target.closest(cardSelector);
      if (!card || card.contains(event.relatedTarget)) return;
      card.style.setProperty("--card-rx", "0deg");
      card.style.setProperty("--card-ry", "0deg");
    },
    { passive: true },
  );

  // Celebrate actual state changes, never a failed save or an invalid submission.
  window.addEventListener("hub:bookmarks", () => {
    document
      .querySelectorAll("[data-save][aria-pressed=true]")
      .forEach((button) =>
        animate(button, [{ scale: 1 }, { scale: 1.12 }, { scale: 1 }], {
          duration: 420,
          easing: "ease-out",
        }),
      );
  });
  window.addEventListener("hub:tasks", () => {
    document.querySelectorAll(".plan-stat strong").forEach((node) =>
      animate(
        node,
        [
          { translate: "0 8px", opacity: 0.4 },
          { translate: "0 0", opacity: 1 },
        ],
        { duration: 450, easing: "ease-out" },
      ),
    );
  });

  // Table sorting uses the rows' measured positions to animate their real movement.
  window.addEventListener("hub:table-render", (event) => {
    const { rows, positions } = event.detail;
    rows.forEach((row, index) => {
      const old = positions.get(row);
      const distance =
        old === undefined ? 12 : old - row.getBoundingClientRect().top;
      animate(
        row,
        [
          {
            transform: "translateY(" + distance + "px)",
            opacity: old === undefined ? 0 : 1,
          },
          { transform: "translateY(0)", opacity: 1 },
        ],
        {
          duration: 420,
          delay: Math.min(index, 8) * 25,
          easing: "cubic-bezier(.2,.75,.25,1)",
        },
      );
    });
  });
})();
