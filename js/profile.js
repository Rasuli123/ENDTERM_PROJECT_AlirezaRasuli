"use strict";
(async () => {
  await HubStore.ready;
  const form = document.getElementById("profile-form");
  const interests = {technology: "Technology & mathematics", "social-science": "Social sciences", health: "Health & research"};
  function render() {
    const user = HubStore.current();
    document.getElementById("profile-guest").hidden = Boolean(user);
    document.getElementById("profile-content").hidden = !user;
    if (!user) return;
    const isAdmin = user.role === "admin";
    document.getElementById("staff-permissions").hidden = !isAdmin;
    document.getElementById("profile-kicker").textContent = isAdmin ? "THE PERSON BEHIND THE LIBRARY DESK" : "YOUR OWN CHAPTER";
    document.getElementById("profile-title").textContent = isAdmin ? "Your staff profile." : "A space that remembers you.";
    document.getElementById("profile-intro").textContent = isAdmin ? "Your contact details, library focus and administrator responsibilities." : "Your details, your direction, your next small step.";
    document.getElementById("profile-interest-label").textContent = isAdmin ? "Library focus" : "Main interest";
    document.getElementById("profile-count-label").textContent = isAdmin ? "Resources managed" : "Saved resources";
    document.getElementById("profile-secondary-label").textContent = isAdmin ? "Registered members" : "Study time planned";
    document.getElementById("profile-editor-title").textContent = isAdmin ? "Your administrator details" : "Your learning profile";
    document.getElementById("profile-editor-intro").textContent = isAdmin ? "Keep your contact details current and choose a priority for the library." : "Update your details and set one goal worth coming back to.";
    document.getElementById("profile-field-label").textContent = isAdmin ? "Library focus" : "Main interest";
    document.getElementById("profile-goal-label").textContent = isAdmin ? "Administration note" : "Learning goal";
    document.getElementById("profile-dashboard-link").textContent = isAdmin ? "Open admin dashboard →" : "Open my dashboard →";
    form.elements.goal.placeholder = isAdmin ? "For example: add introductory books to each subject." : "For example: build and explain my first JavaScript project.";
    document.getElementById("profile-initials").textContent = user.name.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase();
    document.getElementById("profile-name").textContent = user.name;
    document.getElementById("profile-email").textContent = user.email;
    document.getElementById("profile-role").textContent = user.role === "admin" ? "Administrator" : "Member";
    document.getElementById("profile-interest").textContent = interests[user.field] || "Not chosen";
    document.getElementById("profile-bookmarks").textContent = isAdmin ? HubStore.resources().length : HubStore.bookmarks().length;
    document.getElementById("profile-minutes").textContent = isAdmin ? HubStore.users().filter(member => member.role === "member").length : HubStore.tasks().reduce((sum, task) => sum + task.minutes, 0) + " min";
    form.elements.fullName.value = user.name;
    form.elements.email.value = user.email;
    form.elements.field.value = user.field;
    form.elements.goal.value = (isAdmin ? user.adminNote : user.goal) || "";
  }
  HubUI.bindForm(form, {
    fullName: value => value.trim().length < 2 || value.trim().length > 50 ? "Use a name between 2 and 50 characters." : "",
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.length <= 120 ? "" : "Enter a complete email address.",
    field: value => interests[value] ? "" : "Choose your main interest.",
    goal: value => value.trim().length > 240 ? "Keep your goal within 240 characters." : ""
  }, async (fields, target) => {
    await HubStore.updateProfile({name: fields.get("fullName"), email: fields.get("email"), field: fields.get("field"), goal: fields.get("goal")});
    HubUI.status(target, HubStore.current()?.role === "admin" ? "Staff profile saved. Your library priority is up to date." : "Profile saved. Your next chapter is ready.", true);
  });
  render();
  window.addEventListener("hub:account", render);
  window.addEventListener("hub:profile", render);
  window.addEventListener("hub:bookmarks", render);
  window.addEventListener("hub:tasks", render);
  window.addEventListener("hub:members", render);
  window.addEventListener("hub:resources", render);
  if (new URLSearchParams(location.search).get("welcome") === "1" && HubStore.current()) {
    const message = document.getElementById("profile-welcome");
    message.textContent = "You’re signed in. Welcome back, " + HubStore.current().name.split(" ")[0] + ".";
    message.hidden = false;
    history.replaceState(null, "", "profile.html");
  }
})();
