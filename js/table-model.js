/* Pure data operations shared by table rendering and regression checks. */
"use strict";
window.HubTableModel = (() => {
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  function compare(a, b) {
    a = String(a).trim();
    b = String(b).trim();
    if (weekdays.includes(a) && weekdays.includes(b))
      return weekdays.indexOf(a) - weekdays.indexOf(b);
    return collator.compare(a, b);
  }
  function select(
    rows,
    { query = "", column = -1, direction = 1, page = 0, size = 6 } = {},
  ) {
    const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
    let filtered = rows.filter((row) =>
      terms.every((term) =>
        row.cells.join(" ").toLocaleLowerCase().includes(term),
      ),
    );
    if (column >= 0)
      filtered = filtered
        .slice()
        .sort(
          (a, b) =>
            direction * compare(a.cells[column] || "", b.cells[column] || "") ||
            a.order - b.order,
        );
    size = Math.max(1, Number(size) || 6);
    const pages = Math.max(1, Math.ceil(filtered.length / size));
    page = Math.min(Math.max(0, Number(page) || 0), pages - 1);
    return {
      rows: filtered.slice(page * size, (page + 1) * size),
      total: filtered.length,
      pages,
      page,
      start: filtered.length ? page * size + 1 : 0,
      end: Math.min((page + 1) * size, filtered.length),
    };
  }
  return { compare, select };
})();
