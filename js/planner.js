"use strict";
(async () => {
  if (!document.getElementById("planner-form")) return;
  await HubStore.ready;
  const UI = HubUI,
    form = document.getElementById("planner-form"),
    list = document.getElementById("task-list");
  form.elements.taskDate.min = UI.dateToday();
  function render() {
    const tasks = HubStore.tasks(),
      done = tasks.filter((t) => t.done),
      minutes = tasks.reduce((sum, t) => sum + t.minutes, 0),
      completed = done.reduce((sum, t) => sum + t.minutes, 0);
    document.getElementById("plan-count").textContent = tasks.length;
    document.getElementById("plan-minutes").textContent = minutes;
    document.getElementById("plan-completed").textContent = done.length;
    document.getElementById("plan-progress").value = minutes
      ? (completed / minutes) * 100
      : 0;
    document.getElementById("plan-progress-label").textContent = minutes
      ? Math.round((completed / minutes) * 100) +
        "% of planned minutes complete"
      : "Add your first session to begin";
    document.getElementById("plan-empty").hidden = tasks.length !== 0;
    document.getElementById("export-plan").disabled = tasks.length === 0;
    list.replaceChildren();
    tasks
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach((task) => {
        const item = UI.el("li", "task-item" + (task.done ? " task-done" : ""));
        const label = UI.el("label", "task-check");
        const input = UI.el("input", "form-check-input");
        input.type = "checkbox";
        input.checked = !!task.done;
        input.setAttribute("aria-label", "Mark " + task.title + " complete");
        input.addEventListener("change", async () => {
          input.disabled = true;
          try {
            await HubStore.saveTasks(
              HubStore.tasks().map((t) =>
                t.id === task.id ? { ...t, done: input.checked } : t,
              ),
            );
          } catch (error) {
            UI.toast(error.message);
            render();
          }
        });
        label.append(input);
        const text = UI.el("div", "task-copy");
        text.append(
          UI.el("strong", "", task.title),
          UI.el(
            "span",
            "muted-text",
            task.subject +
              " · " +
              UI.formatDate(task.date) +
              " · " +
              task.minutes +
              " min",
          ),
        );
        const remove = UI.el("button", "icon-button", "Remove");
        remove.type = "button";
        remove.setAttribute("aria-label", "Remove " + task.title);
        remove.addEventListener("click", async () => {
          remove.disabled = true;
          try {
            await HubStore.saveTasks(
              HubStore.tasks().filter((t) => t.id !== task.id),
            );
            UI.toast("Session removed.");
          } catch (error) {
            UI.toast(error.message);
            remove.disabled = false;
          }
        });
        item.append(label, text, remove);
        list.append(item);
      });
    document.getElementById("planner-owner").textContent = HubStore.current()
      ? "Plan for " + HubStore.current().name + " · kept for this tab session"
      : "Log in to save your study plan and track progress.";
  }
  UI.bindForm(
    form,
    {
      taskTitle: (v) =>
        v.trim().length < 3
          ? "Describe the session in at least 3 characters."
          : v.length > 80
            ? "Keep the session title within 80 characters."
            : "",
      taskSubject: (v) =>
        !HubData.subjects.some((s) => s.name === v) ? "Choose a subject." : "",
      taskDate: (v) =>
        !UI.validDate(v)
          ? "Choose a valid date."
          : v < UI.dateToday()
            ? "Choose today or a future date."
            : "",
      taskMinutes: (v) =>
        !v || !Number.isInteger(Number(v)) || Number(v) < 5 || Number(v) > 180
          ? "Choose a whole number from 5 to 180 minutes."
          : "",
    },
    async (data, f) => {
      await HubStore.saveTasks([
        ...HubStore.tasks(),
        {
          id: HubStore.uid(),
          title: String(data.get("taskTitle")).trim(),
          subject: String(data.get("taskSubject")),
          date: String(data.get("taskDate")),
          minutes: Number(data.get("taskMinutes")),
          done: false,
        },
      ]);
      f.reset();
      UI.clearErrors(f);
      UI.status(f, "Session added to your plan. Ready for the next one?", true);
    },
  );
  document.getElementById("export-plan").addEventListener("click", () => {
    // Neutralize formula-leading cells before exporting user-entered text to CSV.
    const cell = (v) =>
      '"' +
      String(v)
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""') +
      '"';
    const csv = [
      ["Session", "Subject", "Date", "Minutes", "Status"],
      ...HubStore.tasks().map((t) => [
        t.title,
        t.subject,
        t.date,
        t.minutes,
        t.done ? "Complete" : "Planned",
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = UI.el("a");
    link.href = url;
    link.download = "rasuli-study-plan.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    UI.toast("Your plan has been exported.");
  });
  window.addEventListener("hub:tasks", render);
  render();
  // Use wall-clock time instead of counting ticks, so background tabs stay accurate.
  const duration = document.getElementById("focus-duration"),
    display = document.getElementById("timer-display"),
    start = document.getElementById("timer-start"),
    reset = document.getElementById("timer-reset"),
    ring = document.getElementById("timer-ring"),
    note = document.getElementById("timer-note");
  let remaining = Number(duration.value) * 60,
    running = false,
    deadline = 0,
    interval = null,
    total = remaining;
  function paint() {
    const seconds = Math.max(0, Math.ceil(remaining));
    display.textContent =
      String(Math.floor(seconds / 60)).padStart(2, "0") +
      ":" +
      String(seconds % 60).padStart(2, "0");
    ring.style.setProperty(
      "--progress",
      ((total - seconds) / total) * 100 + "%",
    );
    start.textContent = running
      ? "Pause focus"
      : remaining === total
        ? "Start focus"
        : "Resume focus";
    duration.disabled = running;
  }
  function tick() {
    remaining = Math.max(0, (deadline - Date.now()) / 1000);
    if (!remaining) {
      running = false;
      clearInterval(interval);
      remaining = total;
      note.textContent =
        "Session complete. Take a short break, then mark your study task complete.";
      UI.toast("Focus session complete. Time for a break.");
    }
    paint();
  }
  start.addEventListener("click", () => {
    if (running) {
      remaining = Math.max(0, (deadline - Date.now()) / 1000);
      running = false;
      clearInterval(interval);
      note.textContent = "Paused. Resume when you are ready.";
    } else {
      deadline = Date.now() + remaining * 1000;
      running = true;
      interval = setInterval(tick, 250);
      note.textContent = "One task. Your full attention.";
    }
    paint();
  });
  function resetTimer() {
    clearInterval(interval);
    running = false;
    remaining = Number(duration.value) * 60;
    total = remaining;
    note.textContent = "Choose one task and give it your attention.";
    paint();
  }
  duration.addEventListener("change", resetTimer);
  reset.addEventListener("click", resetTimer);
  window.addEventListener("pagehide", () => clearInterval(interval));
  paint();
})();
