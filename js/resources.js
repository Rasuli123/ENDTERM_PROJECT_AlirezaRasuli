"use strict";
(async () => {
  await HubStore.ready;
  const UI = HubUI;
  const grid = document.getElementById("resource-grid");
  if (grid) {
    const search = document.getElementById("resource-search"),
      category = document.getElementById("resource-category"),
      type = document.getElementById("resource-type"),
      sort = document.getElementById("resource-sort"),
      saved = document.getElementById("saved-only");
    const queryCategory = new URLSearchParams(location.search).get("subject");
    if (HubData.subjects.some((s) => s.name === queryCategory))
      category.value = queryCategory;
    function render() {
      const all = HubStore.resources(),
        bookmarks = HubStore.bookmarks(),
        q = search.value.trim().toLowerCase();
      let matches = all.filter(
        (r) =>
          (!q ||
            [r.title, r.author, r.category, r.description]
              .join(" ")
              .toLowerCase()
              .includes(q)) &&
          (!category.value || r.category === category.value) &&
          (!type.value || r.type === type.value) &&
          (!saved.checked || bookmarks.includes(r.id)),
      );
      matches.sort(
        sort.value === "duration"
          ? (a, b) => a.minutes - b.minutes
          : sort.value === "title"
            ? (a, b) => a.title.localeCompare(b.title)
            : (a, b) =>
                Number(b.core) - Number(a.core) || a.id.localeCompare(b.id),
      );
      grid.replaceChildren(...matches.map(UI.resourceCard));
      document.getElementById("resource-result-count").textContent =
        matches.length + " of " + all.length + " resources";
      document.getElementById("resource-empty").hidden = matches.length !== 0;
      const minutes = matches.reduce((total, r) => total + r.minutes, 0);
      document.getElementById("resource-reading-total").textContent =
        minutes + " minutes of suggested study blocks";
      // Preserve the original academic archive, now populated from the same data array.
      const tbody = document.getElementById("archive-body");
      tbody.replaceChildren();
      matches
        .filter((r) => r.core)
        .forEach((r, i) => {
          const row = UI.el("tr");
          [
            String(i + 1).padStart(3, "0"),
            r.category,
            r.title,
            r.author,
            r.year,
          ].forEach((value) => row.append(UI.el("td", "", value)));
          tbody.append(row);
        });
      if (!tbody.children.length) {
        const row = UI.el("tr");
        const cell = UI.el(
          "td",
          "",
          "No core books match these filters. Reset the filters to see the original archive.",
        );
        cell.colSpan = 5;
        row.append(cell);
        tbody.append(row);
      }
    }
    [search, category, type, sort, saved].forEach((n) =>
      n.addEventListener(n === search ? "input" : "change", render),
    );
    function reset() {
      search.value = "";
      category.value = "";
      type.value = "";
      sort.value = "featured";
      saved.checked = false;
      render();
      search.focus();
    }
    document
      .querySelectorAll("[data-reset-resources]")
      .forEach((b) => b.addEventListener("click", reset));
    search.addEventListener("keydown", (e) => {
      if (e.key === "Escape") reset();
    });
    window.addEventListener("hub:bookmarks", render);
    window.addEventListener("hub:resources", render);
    render();
  }
  const preview = document.getElementById("home-resources");
  if (preview)
    preview.replaceChildren(
      ...HubStore.resources().slice(0, 3).map(UI.resourceCard),
    );
  const subjectSearch = document.getElementById("subject-search");
  if (subjectSearch) {
    subjectSearch.addEventListener("input", () => {
      let count = 0;
      document.querySelectorAll(".pathway-card").forEach((card) => {
        const match = card.textContent
          .toLowerCase()
          .includes(subjectSearch.value.trim().toLowerCase());
        card.hidden = !match;
        if (match) count++;
      });
      document.getElementById("subject-count").textContent =
        count + " pathways";
      document.getElementById("subject-empty").hidden = count !== 0;
    });
    document.getElementById("subject-reset").addEventListener("click", () => {
      subjectSearch.value = "";
      subjectSearch.dispatchEvent(new Event("input"));
      subjectSearch.focus();
    });
  }
})();
