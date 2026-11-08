"use strict";
window.HubUI = (() => {
  const $ = window.jQuery;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ($) $.fx.off = reduced;
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function toast(message) {
    const box = document.getElementById("toast-message");
    if (!box) return;
    box.textContent = message;
    $(box).stop(true, true).fadeIn(180).delay(3200).fadeOut(220);
  }
  function dateToday() {
    const d = new Date();
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + "T12:00:00");
    if (Number.isNaN(date.getTime())) return false;
    // JavaScript normalizes dates such as February 30; require an exact match.
    const [year, month, day] = value.split("-").map(Number);
    return (
      date.getFullYear() === year &&
      date.getMonth() + 1 === month &&
      date.getDate() === day
    );
  }
  function formatDate(value) {
    return validDate(value)
      ? new Date(value + "T12:00:00").toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : value;
  }
  function status(form, message, success = false) {
    const box = form.querySelector(".form-status");
    if (!box) return;
    box.className =
      "form-status " + (success ? "status-success" : "status-error");
    box.textContent = message;
    $(box).stop(true, true).hide().fadeIn(200);
  }
  function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach((n) => (n.textContent = ""));
    form.querySelectorAll("[aria-invalid]").forEach((n) => {
      n.removeAttribute("aria-invalid");
      n.classList.remove("is-invalid");
    });
    form.dataset.attempted = "";
  }
  function errorFor(field, message) {
    let box = document.getElementById(field.id + "-error");
    if (!box) {
      box = el("span", "field-error");
      box.id = field.id + "-error";
      field.insertAdjacentElement("afterend", box);
      const old = field.getAttribute("aria-describedby") || "";
      field.setAttribute("aria-describedby", (old + " " + box.id).trim());
    }
    box.textContent = message || "";
    field.setAttribute("aria-invalid", message ? "true" : "false");
    field.classList.toggle("is-invalid", Boolean(message));
  }
  function bindForm(form, rules, onSubmit) {
    if (!form) return;
    form.noValidate = true;
    const fieldFor = (name) => form.elements.namedItem(name);
    const check = (name) => {
      const field = fieldFor(name);
      if (!field) return true;
      const msg = rules[name](field.value, form);
      errorFor(field, msg);
      return !msg;
    };
    ["input", "change"].forEach((type) =>
      form.addEventListener(type, (e) => {
        if (
          rules[e.target.name] &&
          (form.dataset.attempted ||
            e.target.getAttribute("aria-invalid") === "true")
        )
          check(e.target.name);
      }),
    );
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (form.dataset.busy) return;
      form.dataset.attempted = "true";
      const previousStatus = form.querySelector(".form-status");
      if (previousStatus) {
        $(previousStatus).stop(true, true).hide();
        previousStatus.textContent = "";
      }
      const checks = Object.keys(rules).map(check);
      if (checks.some((ok) => !ok)) {
        form.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }
      const button = form.querySelector('[type="submit"]');
      form.dataset.busy = "true";
      if (button) button.disabled = true;
      try {
        await onSubmit(new FormData(form), form);
      } catch (e) {
        const field = e.field && fieldFor(e.field);
        if (field) {
          errorFor(field, e.message);
          field.focus();
        } else
          status(form, e.message || "Something went wrong. Please try again.");
      } finally {
        delete form.dataset.busy;
        if (button) button.disabled = false;
      }
    });
  }
  function resourceCard(resource) {
    const article = el("article", "library-card");
    const picture = el("img", "resource-photo");
    picture.src = HubPhotos.resolve(
      HubData.subjects.find((s) => s.name === resource.category)?.image ||
        "books.jpg",
    );
    picture.alt =
      HubData.subjects.find((s) => s.name === resource.category)?.alt ||
      "Books in a library";
    picture.loading = "lazy";
    picture.width = 600;
    picture.height = 360;
    article.append(picture);
    const body = el("div", "library-card-body");
    const meta = el("div", "card-meta");
    meta.append(
      el("span", "pill", resource.category),
      el("span", "reading-time", resource.minutes + " min block"),
    );
    body.append(
      meta,
      el("h3", "", resource.title),
      el("p", "resource-author", resource.author),
      el("p", "muted-text", resource.description),
    );
    const labels = el("div", "resource-labels");
    labels.append(
      el("span", "", resource.type),
      el("span", "", resource.level),
    );
    body.append(labels);
    const actions = el("div", "card-actions");
    const link = el(
      "a",
      "text-link",
      resource.type === "Book" ? "Find book ↗" : "Open resource ↗",
    );
    link.href = resource.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute(
      "aria-label",
      (resource.type === "Book" ? "Find " : "Open ") +
        resource.title +
        " (new tab)",
    );
    const save = el("button", "save-button");
    save.type = "button";
    save.dataset.save = resource.id;
    save.dataset.title = resource.title;
    actions.append(link, save);
    body.append(actions);
    article.append(body);
    syncBookmarkButton(save);
    return article;
  }
  function syncBookmarkButton(button) {
    const saved = HubStore.bookmarks().includes(button.dataset.save);
    button.textContent = saved ? "✓ Saved" : "+ Save";
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute(
      "aria-label",
      (saved ? "Unsave " : "Save ") + button.dataset.title,
    );
  }
  function refreshBookmarks() {
    document.querySelectorAll("[data-save]").forEach(syncBookmarkButton);
    document
      .querySelectorAll("[data-saved-count]")
      .forEach(
        (n) =>
          (n.textContent = HubStore.bookmarks().filter((id) =>
            HubStore.resources().some((r) => r.id === id),
          ).length),
      );
  }
  document.addEventListener("click", async (e) => {
    const save = e.target.closest("[data-save]");
    if (save) {
      if (!HubStore.current()) {
        location.href = "login.html?next=resources.html";
        return;
      }
      save.disabled = true;
      try {
        const active = await HubStore.toggleBookmark(save.dataset.save);
        toast(
          active
            ? "Added to your reading shelf."
            : "Removed from your reading shelf.",
        );
      } catch (error) {
        toast(error.message);
      } finally {
        save.disabled = false;
      }
    }
    const logout = e.target.closest("[data-logout]");
    if (logout) {
      try {
        await HubStore.logout();
      } catch (error) {
        toast(error.message);
      }
    }
    const show = e.target.closest("[data-show-password]");
    if (show) {
      const input = document.getElementById(show.dataset.showPassword);
      const showing = input.type === "password";
      input.type = showing ? "text" : "password";
      show.textContent = showing ? "Hide password" : "Show password";
      show.setAttribute("aria-pressed", String(showing));
    }
    const close = e.target.closest("[data-close-dialog]");
    if (close) close.closest("dialog").close();
  });
  window.addEventListener("hub:bookmarks", refreshBookmarks);
  function storageNotice(message) {
    const warning = document.getElementById("storage-warning");
    if (warning) {
      warning.querySelector("[data-storage-message]").textContent =
        message || "";
      warning.hidden = !message;
    }
  }
  window.addEventListener("hub:storage-error", (event) =>
    storageNotice(event.detail),
  );
  window.addEventListener("hub:storage-ready", () => storageNotice(""));
  function accountUI() {
    const user = HubStore.current();
    document
      .querySelectorAll("[data-guest-only]")
      .forEach((n) => (n.hidden = !!user));
    document
      .querySelectorAll("[data-member-only]")
      .forEach((n) => (n.hidden = !user));
    document
      .querySelectorAll("[data-user-name]")
      .forEach((n) => (n.textContent = user?.name || "Guest learner"));
    refreshBookmarks();
    storageNotice(HubStore.storageMessage);
  }
  HubStore.ready.then(accountUI);
  window.addEventListener("hub:account", accountUI);
  document.querySelectorAll("[data-accordion]").forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    panel.hidden = false;
    $(panel).hide();
    button.setAttribute("aria-expanded", "false");
    button.addEventListener("click", () => {
      const expand = button.getAttribute("aria-expanded") !== "true";
      button.setAttribute("aria-expanded", String(expand));
      $(panel).stop(true, true).slideToggle(220);
    });
  });
  document.querySelector("[data-back-top]")?.addEventListener("click", () => {
    $("html, body")
      .stop(true)
      .animate({ scrollTop: 0 }, reduced ? 0 : 400);
    document.querySelector(".navbar-brand")?.focus({ preventScroll: true });
  });
  document.querySelectorAll(".table-frame").forEach((n) => {
    n.tabIndex = 0;
    n.setAttribute("role", "region");
    n.setAttribute("aria-label", "Scrollable table");
  });
  const topButton = document.querySelector("[data-back-top]");
  window.addEventListener(
    "scroll",
    () => {
      document
        .querySelector(".site-header")
        ?.classList.toggle("has-scrolled", scrollY > 30);
      if (topButton) topButton.hidden = scrollY < 450;
    },
    { passive: true },
  );
  // Gallery: native dialog handles Escape and keyboard focus; jQuery handles fading.
  const gallery = document.getElementById("gallery-dialog");
  if (gallery) {
    let index = 0;
    const entries = Array.from(document.querySelectorAll("[data-gallery-src]"));
    const photo = gallery.querySelector("img");
    const caption = gallery.querySelector("figcaption");
    function show(i) {
      index = (i + entries.length) % entries.length;
      const source = entries[index];
      $(photo).stop(true, true).css("opacity", 0.35);
      photo.src = source.dataset.gallerySrc;
      photo.alt = source.dataset.galleryCaption;
      caption.textContent =
        index +
        1 +
        " / " +
        entries.length +
        " · " +
        source.dataset.galleryCaption;
      $(photo).fadeTo(220, 1);
    }
    entries.forEach((button, i) =>
      button.addEventListener("click", () => {
        show(i);
        gallery.showModal();
      }),
    );
    gallery
      .querySelector("[data-gallery-prev]")
      .addEventListener("click", () => show(index - 1));
    gallery
      .querySelector("[data-gallery-next]")
      .addEventListener("click", () => show(index + 1));
    gallery.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        show(index + 1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(index - 1);
      }
    });
  }
  return {
    el,
    toast,
    dateToday,
    validDate,
    formatDate,
    status,
    clearErrors,
    errorFor,
    bindForm,
    resourceCard,
    refreshBookmarks,
  };
})();
