/* Reading-light, dialog and optional motion enhancements. */
"use strict";
(() => {
  document.querySelectorAll("dialog").forEach((dialog) =>
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }),
  );
  // External photos can be unavailable offline: preserve layout and meaningful alt text.
  document.addEventListener(
    "error",
    (event) => {
      const photo = event.target;
      if (!(photo instanceof HTMLImageElement) || photo.dataset.failed) return;
      photo.dataset.failed = "true";
      photo.classList.add("image-unavailable");
      if (photo.closest(".hero-photo,.library-card,.gallery-tile,.hero-visual"))
        return;
      const note = document.createElement("p");
      note.className = "image-fallback-note";
      note.textContent =
        "Photo unavailable. Connect to the internet to load external photography.";
      photo.insertAdjacentElement("afterend", note);
    },
    true,
  );
})();
