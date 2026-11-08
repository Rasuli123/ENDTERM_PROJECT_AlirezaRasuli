/* Progressive enhancement: original semantic tables remain usable without this file. */
"use strict";
(() => {
  document.querySelectorAll(".knowledge-table").forEach((table, index) => {
    const body = table.tBodies[0];
    if (!body) return;
    const UI = HubUI,
      headers = Array.from(table.tHead?.rows[0]?.cells || []);
    const frame = table.closest(".table-frame");
    if (!frame) return;
    const caption = table.caption?.textContent.trim() || "Data table";
    const tableID = table.id || "hub-table-" + index;
    table.id = tableID;
    frame.setAttribute(
      "aria-label",
      caption + " — scroll horizontally to see all columns",
    );
    const shell = UI.el("section", "data-table-shell");
    shell.setAttribute("aria-label", caption + " controls");
    frame.before(shell);
    shell.append(frame);
    const toolbar = UI.el("div", "table-toolbar"),
      label = UI.el("label", "table-search-label", "SEARCH THIS TABLE");
    const search = UI.el("input", "form-control");
    search.type = "search";
    search.id = tableID + "-search";
    search.placeholder = "Find a title, subject, or keyword…";
    search.setAttribute("aria-controls", tableID);
    label.htmlFor = search.id;
    label.append(search);
    toolbar.append(label);
    const options = UI.el("div", "table-options"),
      sizeLabel = UI.el("label", "", "Rows"),
      sizeSelect = UI.el("select", "form-select");
    sizeSelect.id = tableID + "-size";
    sizeLabel.htmlFor = sizeSelect.id;
    [6, 12, 24].forEach((value) => {
      const option = UI.el("option", "", String(value));
      option.value = String(value);
      sizeSelect.append(option);
    });
    sizeLabel.append(sizeSelect);
    options.append(sizeLabel);
    const compact = UI.el("button", "icon-button", "Compact");
    compact.type = "button";
    compact.setAttribute("aria-pressed", "false");
    compact.setAttribute("aria-label", "Toggle compact rows");
    compact.addEventListener("click", () => {
      const on = shell.classList.toggle("is-compact");
      compact.setAttribute("aria-pressed", String(on));
    });
    options.append(compact);
    const reset = UI.el("button", "icon-button", "Reset");
    reset.type = "button";
    reset.setAttribute("aria-label", "Reset table search and sorting");
    options.append(reset);
    toolbar.append(options);
    shell.prepend(toolbar);
    const empty = UI.el(
      "p",
      "table-empty",
      "No rows match your search. Try another word or reset the table.",
    );
    empty.hidden = true;
    shell.append(empty);
    const footer = UI.el("div", "table-footer"),
      status = UI.el("span");
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    const pager = UI.el("div", "table-pager"),
      previous = UI.el("button", "icon-button", "←"),
      next = UI.el("button", "icon-button", "→"),
      pageLabel = UI.el("span");
    previous.type = next.type = "button";
    previous.setAttribute("aria-label", "Previous table page");
    next.setAttribute("aria-label", "Next table page");
    pager.append(previous, pageLabel, next);
    footer.append(status, pager);
    shell.append(footer);
    const state = { query: "", column: -1, direction: 1, page: 0, size: 6 };
    let rows = [];
    let placeholder = null;
    const observer = new MutationObserver(() => {
      capture();
      render();
    });
    function watch() {
      observer.observe(body, { childList: true });
    }
    function capture() {
      rows = Array.from(body.rows)
        .filter(
          (row) =>
            row.cells.length === headers.length &&
            !row.querySelector("[colspan]"),
        )
        .map((node, order) => ({
          node,
          order,
          cells: Array.from(node.cells, (c) => c.textContent.trim()),
        }));
      placeholder =
        Array.from(body.rows).find((row) => row.querySelector("[colspan]")) ||
        null;
    }
    function render() {
      observer.disconnect();
      const positions = new Map(
        Array.from(body.rows, (row) => {
          const top = row.getBoundingClientRect().top;
          row
            .getAnimations()
            .filter((effect) => effect.id === "hub-feedback")
            .forEach((effect) => effect.cancel());
          return [row, top];
        }),
      );
      const result = HubTableModel.select(rows, state);
      state.page = result.page;
      body.replaceChildren(
        ...result.rows.map((row, i) => {
          row.node.style.setProperty("--row-index", i);
          return row.node;
        }),
      );
      // If the source has a specific empty state, preserve its explanation.
      if (!rows.length && placeholder) {
        body.append(placeholder);
        empty.hidden = true;
      } else empty.hidden = result.total !== 0;
      status.textContent =
        result.start + "–" + result.end + " of " + result.total + " rows";
      pageLabel.textContent = result.page + 1 + " / " + result.pages;
      previous.disabled = !result.page;
      next.disabled = result.page >= result.pages - 1;
      headers.forEach((header, i) => {
        if (header.querySelector(".table-sort"))
          header.setAttribute(
            "aria-sort",
            state.column === i
              ? state.direction === 1
                ? "ascending"
                : "descending"
              : "none",
          );
      });
      window.dispatchEvent(
        new CustomEvent("hub:table-render", {
          detail: { rows: Array.from(body.rows), positions },
        }),
      );
      watch();
    }
    headers.forEach((header, column) => {
      if (header.textContent.trim() === "Actions") return;
      const title = header.textContent.trim(),
        button = UI.el("button", "table-sort", title);
      button.type = "button";
      button.setAttribute("aria-label", "Sort by " + title);
      header.replaceChildren(button);
      header.setAttribute("aria-sort", "none");
      button.addEventListener("click", () => {
        state.direction = state.column === column ? -state.direction : 1;
        state.column = column;
        state.page = 0;
        render();
      });
    });
    search.addEventListener("input", () => {
      state.query = search.value;
      state.page = 0;
      render();
    });
    sizeSelect.addEventListener("change", () => {
      state.size = Number(sizeSelect.value);
      state.page = 0;
      render();
    });
    previous.addEventListener("click", () => {
      state.page--;
      render();
    });
    next.addEventListener("click", () => {
      state.page++;
      render();
    });
    function resetTable() {
      search.value = "";
      sizeSelect.value = "6";
      Object.assign(state, {
        query: "",
        column: -1,
        direction: 1,
        page: 0,
        size: 6,
      });
      render();
      search.focus();
    }
    reset.addEventListener("click", resetTable);
    search.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        resetTable();
      }
    });
    // Printing includes all current matching rows, even if the screen is paginated.
    let previousSize = 6;
    window.addEventListener("beforeprint", () => {
      previousSize = state.size;
      state.size = Math.max(rows.length, 1);
      render();
    });
    window.addEventListener("afterprint", () => {
      state.size = previousSize;
      render();
    });
    capture();
    render();
  });
})();
