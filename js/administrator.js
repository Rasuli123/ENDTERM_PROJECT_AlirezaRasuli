"use strict";
(async () => {
  await HubStore.ready;
  const form = document.getElementById("resource-editor");
  const search = document.getElementById("admin-search");
  const list = document.getElementById("admin-resources");
  const dialog = document.getElementById("remove-resource-dialog");
  const memberForm = document.getElementById("member-form");
  let removeId = "";
  HubData.subjects.forEach(subject => {
    const option = HubUI.el("option", "", subject.name);
    option.value = subject.name;
    form.elements.category.append(option);
  });
  function render() {
    const allowed = HubStore.current()?.role === "admin";
    document.getElementById("admin-guest").hidden = allowed;
    document.getElementById("admin-content").hidden = !allowed;
    if (!allowed) return;
    const resources = HubStore.resources();
    const query = search.value.trim().toLowerCase();
    const matches = resources.filter(resource => [resource.title, resource.author, resource.category].join(" ").toLowerCase().includes(query));
    document.getElementById("admin-resource-count").textContent = resources.length + " resources";
    document.getElementById("admin-empty").hidden = matches.length !== 0;
    list.replaceChildren(...matches.map(resource => {
      const article = HubUI.el("article", "admin-resource");
      const text = HubUI.el("div");
      text.append(HubUI.el("span", "eyebrow", resource.category), HubUI.el("h3", "h5", resource.title), HubUI.el("p", "muted-text", resource.author));
      const actions = HubUI.el("div", "editor-actions");
      const edit = HubUI.el("button", "btn btn-outline-mint btn-sm", "Edit");
      edit.type = "button";
      edit.dataset.editResource = resource.id;
      edit.setAttribute("aria-label", "Edit " + resource.title);
      const remove = HubUI.el("button", "btn btn-danger-soft btn-sm", "Remove");
      remove.type = "button";
      remove.dataset.removeResource = resource.id;
      remove.setAttribute("aria-label", "Remove " + resource.title);
      actions.append(edit, remove);
      article.append(text, actions);
      return article;
    }));
    const directory = document.getElementById("member-directory");
    directory.replaceChildren(...HubStore.users().map(user => {
      const row = HubUI.el("tr");
      [user.name, user.email, user.role === "admin" ? "Administrator" : "Member"].forEach(value => row.append(HubUI.el("td", "", value)));
      return row;
    }));
  }
  function cancelEdit() {
    form.reset();
    form.elements.resourceId.value = "";
    HubUI.clearErrors(form);
    document.getElementById("resource-editor-title").textContent = "Add a resource";
    document.getElementById("cancel-resource-edit").hidden = true;
  }
  search.addEventListener("input", render);
  list.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-resource]");
    if (edit) {
      const resource = HubStore.resources().find(item => item.id === edit.dataset.editResource);
      if (!resource) return;
      cancelEdit();
      form.elements.resourceId.value = resource.id;
      ["title", "author", "category", "year", "minutes", "level", "url", "description"].forEach(key => form.elements[key].value = resource[key]);
      form.elements.type.value = resource.type;
      document.getElementById("resource-editor-title").textContent = "Edit resource";
      document.getElementById("cancel-resource-edit").hidden = false;
      form.elements.title.focus();
    }
    const remove = event.target.closest("[data-remove-resource]");
    if (remove) {
      removeId = remove.dataset.removeResource;
      document.getElementById("remove-resource-name").textContent = HubStore.resources().find(item => item.id === removeId)?.title || "This resource";
      dialog.querySelector(".dialog-status").textContent = "";
      dialog.showModal();
    }
  });
  document.getElementById("confirm-remove-resource").addEventListener("click", async () => {
    try {
      await HubStore.removeResource(removeId);
      if (form.elements.resourceId.value === removeId) cancelEdit();
      dialog.close();
      HubUI.toast("Resource removed from the collection.");
    } catch (error) { dialog.querySelector(".dialog-status").textContent = error.message; }
  });
  document.getElementById("cancel-resource-edit").addEventListener("click", cancelEdit);
  const integerRule = (value, min, max) => value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
  HubUI.bindForm(form, {
    title: value => value.trim().length < 3 || value.length > 120 ? "Use a title between 3 and 120 characters." : "",
    author: value => value.trim().length < 2 || value.length > 120 ? "Enter an author or organisation (2–120 characters)." : "",
    category: value => HubData.subjects.some(subject => subject.name === value) ? "" : "Choose a subject.",
    type: value => ["Book", "Reference", "Practice"].includes(value) ? "" : "Choose a format.",
    year: value => integerRule(value, 1000, 2100) ? "" : "Use a whole year between 1000 and 2100.",
    minutes: value => integerRule(value, 5, 180) ? "" : "Use a whole number from 5 to 180 minutes.",
    level: value => ["Beginner", "Intermediate", "Advanced", "All levels"].includes(value) ? "" : "Choose a level.",
    url: value => { try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && value.length <= 1000 ? "" : "Use a complete HTTPS link without login details."; } catch { return "Enter a complete HTTPS link."; } },
    description: value => value.trim().length < 10 || value.length > 360 ? "Use a description between 10 and 360 characters." : ""
  }, async (fields, target) => {
    const wasEditing = Boolean(fields.get("resourceId"));
    await HubStore.saveResource(Object.fromEntries(fields.entries()));
    cancelEdit();
    HubUI.status(target, wasEditing ? "Resource updated in the library." : "Resource added to the library.", true);
  });
  ["hub:resources", "hub:members", "hub:account"].forEach(event => window.addEventListener(event, render));
  HubUI.bindForm(memberForm, {
    fullName: value => value.trim().length >= 2 && value.trim().length <= 50 ? "" : "Use a name between 2 and 50 characters.",
    email: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) && value.length <= 120 ? "" : "Enter a complete email address.",
    field: value => ["technology", "social-science", "health"].includes(value) ? "" : "Choose the member’s main interest.",
    password: value => value.length >= 12 && value.length <= 128 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[\W_]/.test(value) ? "" : "Use 12–128 characters with uppercase, lowercase, a number and a symbol.",
    confirmPassword: value => value && value === memberForm.elements.password.value ? "" : "The passwords must match."
  }, async (fields, target) => {
    const member = await HubStore.addMember({name: fields.get("fullName"), email: fields.get("email"), field: fields.get("field")}, fields.get("password"));
    target.reset();
    target.elements.password.type = "password";
    const show = target.querySelector("[data-show-password]");
    show.textContent = "Show password";
    show.setAttribute("aria-pressed", "false");
    HubUI.clearErrors(target);
    HubUI.status(target, "Member created: " + member.name + " (" + member.email + "). They can now log in with the practice password you chose.", true);
  });
  render();
})();
