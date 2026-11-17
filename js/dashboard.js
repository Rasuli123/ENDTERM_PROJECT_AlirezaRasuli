"use strict";
(async () => {
  const dashboard = document.getElementById("dashboard-content");
  if (!dashboard) return;
  await HubStore.ready;
  const UI = HubUI;
  function render() {
    const user = HubStore.current();
    const isAdmin = user?.role === "admin";
    document.getElementById("access-state").hidden = Boolean(user);
    dashboard.hidden = !user || isAdmin;
    document.getElementById("admin-dashboard").hidden = !isAdmin;
    document.getElementById("dashboard-kicker").textContent = isAdmin ? "ADMINISTRATOR OVERVIEW" : "YOUR PERSONAL LEARNING SPACE";
    document.getElementById("dashboard-title").textContent = isAdmin ? "A well-kept library starts here." : "A shelf for your curiosity.";
    document.getElementById("dashboard-intro").textContent = isAdmin ? "Care for the collection, welcome members and keep every shelf useful." : "Save what matters. Plan what comes next. Keep your progress in one place.";
    if (!user) return;
    if (isAdmin) {
      const collection = HubStore.resources();
      const members = HubStore.users().filter(member => member.role === "member");
      document.getElementById("desk-resources").textContent = collection.length;
      document.getElementById("desk-members").textContent = members.length;
      document.getElementById("desk-subjects").textContent = new Set(collection.map(resource => resource.category)).size;
      document.getElementById("desk-note").textContent = user.adminNote || "Keep the collection balanced and welcome each new reader. Set your current priority in your staff profile.";
      document.getElementById("desk-coverage").replaceChildren(...HubData.subjects.map(subject => {
        const count = collection.filter(resource => resource.category === subject.name).length;
        const card = UI.el("article", "coverage-card");
        card.append(UI.el("h3", "h5", subject.name), UI.el("p", "muted-text", count + (count === 1 ? " resource" : " resources")));
        const link = UI.el("a", "text-link", "Browse shelf →");
        link.href = "resources.html?subject=" + encodeURIComponent(subject.name);
        card.append(link);
        return card;
      }));
      return;
    }
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
    document.getElementById("clear-shelf").hidden = resources.length === 0;
    document.getElementById("profile-goal").textContent =
      user.goal || "Start with one resource and one focused study session.";
    const next = tasks
      .filter((t) => !t.done)
      .sort((a, b) => (a.date + (a.time || "23:59")).localeCompare(b.date + (b.time || "23:59")))[0];
    document.getElementById("next-session").textContent = next
      ? next.title +
        " · " +
        UI.formatDate(next.date) +
        (next.time ? " at " + next.time : "") +
        " · " +
        next.minutes +
        " min"
      : "Your next step is a blank page. Add a session to your study plan.";
  }
  window.addEventListener("hub:bookmarks", render);
  window.addEventListener("hub:tasks", render);
  window.addEventListener("hub:resources", render);
  window.addEventListener("hub:account", render);
  window.addEventListener("hub:profile", render);
  window.addEventListener("hub:members", render);
  const clearDialog = document.getElementById("clear-shelf-dialog");
  document.getElementById("clear-shelf").addEventListener("click", () => {
    clearDialog.querySelector(".dialog-status").textContent = "";
    clearDialog.showModal();
  });
  document.getElementById("confirm-clear-shelf").addEventListener("click", async () => {
    try {
      await HubStore.clearBookmarks();
      clearDialog.close();
      HubUI.toast("Your reading shelf has been cleared.");
    } catch (error) { clearDialog.querySelector(".dialog-status").textContent = error.message; }
  });
  render();
})();
