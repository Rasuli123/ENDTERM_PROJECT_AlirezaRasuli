"use strict";
(async () => {
  const dashboard = document.getElementById("dashboard-content");
  if (!dashboard) return;
  await HubStore.ready;
  const UI = HubUI,
    user = HubStore.current();
  if (!user) return;
  document.getElementById("access-state").hidden = true;
  dashboard.hidden = false;
  function render() {
    const resources = HubStore.resources().filter((r) =>
        HubStore.bookmarks().includes(r.id),
      ),
      tasks = HubStore.tasks(),
      done = tasks.filter((t) => t.done);
    document.getElementById("dashboard-saved").textContent = resources.length;
    document.getElementById("dashboard-tasks").textContent = tasks.length;
    document.getElementById("dashboard-done").textContent = done.length;
    document
      .getElementById("saved-resources")
      .replaceChildren(...resources.map(UI.resourceCard));
    document.getElementById("saved-empty").hidden = resources.length !== 0;
    document.getElementById("profile-goal").textContent =
      user.goal || "Start with one resource and one focused study session.";
    const next = tasks
      .filter((t) => !t.done)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    document.getElementById("next-session").textContent = next
      ? next.title +
        " · " +
        UI.formatDate(next.date) +
        " · " +
        next.minutes +
        " min"
      : "Your next step is a blank page. Add a session to your study plan.";
  }
  window.addEventListener("hub:bookmarks", render);
  window.addEventListener("hub:tasks", render);
  window.addEventListener("hub:resources", render);
  render();
})();
