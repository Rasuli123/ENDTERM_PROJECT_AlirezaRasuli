/* Final frontend: JSON in localStorage, with structured records in IndexedDB.
   This coursework simulation is not a secure authentication service. */
"use strict";
window.HubStore = (() => {
  const DATA_KEY = "rasuli.hub.final.data.v1";
  const SESSION_KEY = "rasuli.hub.final.account.v1";
  const PASSWORD_ROUNDS = 100000;
  const initialUsers = [
    {
      id: "alireza-member",
      name: "Alireza Rasuli",
      email: "alireza@rasulihub.local",
      role: "admin",
      field: "technology",
      goal: "",
      passwordSalt: "hub-alireza-browser-v1",
      passwordHash:
        "6a64af0e81b58f811fb2b69930f1c5fec4d9b3e587adc1bc626e35063aed55e9",
    },
    {
      id: "hub-member",
      name: "Sara Ahmadi",
      email: "member@rasulihub.local",
      role: "member",
      field: "technology",
      goal: "",
      passwordSalt: "hub-member-browser-v1",
      passwordHash:
        "f08f93995699e697b0b1a557ebfd2b3363b22529cda4e4351b26e2895887ac56",
    },
  ];
  // Update only the two original built-in credentials. Keep every profile,
  // saved item and user-created account, including any custom password hash.
  const previousPasswords = {
    "alireza-member": "ab8b99bad9022d9b2039e94a4439caf49a6ef19e5491a2878cf4e8e9761d27ae",
    "hub-member": "989ed01bdd76098c0f321ab57a8b3cb6dc514b4a2178005759758e233157ae57",
  };
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const emit = (name) => window.dispatchEvent(new Event(name));
  let storageIssue = "";
  let databaseIssue = "";
  let activeId = "";
  let data = {
    version: 1,
    users: copy(initialUsers),
    resources: copy(HubData.resources),
    progress: {},
  };

  function storageError(message) {
    storageIssue = message;
    window.dispatchEvent(
      new CustomEvent("hub:storage-error", { detail: message }),
    );
    return Error(message);
  }
  function readData() {
    let raw;
    try {
      raw = localStorage.getItem(DATA_KEY);
    } catch {
      throw storageError(
        "Browser storage is unavailable. Allow site data to use accounts and the planner.",
      );
    }
    if (!raw)
      return {
        version: 1,
        users: copy(initialUsers),
        resources: copy(HubData.resources),
        progress: {},
      };
    return parseData(raw);
  }
  function parseData(raw) {
    try {
      const saved = JSON.parse(raw);
      if (
        saved.version !== 1 ||
        !Array.isArray(saved.users) ||
        !Array.isArray(saved.resources) ||
        !saved.progress ||
        typeof saved.progress !== "object" ||
        Array.isArray(saved.progress) ||
        !saved.users.every(
          (user) =>
            user && typeof user.id === "string" && typeof user.name === "string" &&
            typeof user.email === "string" && typeof user.passwordHash === "string" &&
            typeof user.passwordSalt === "string",
        ) || !saved.resources.every(resource => resource && typeof resource.id === "string" &&
          typeof resource.title === "string" && typeof resource.author === "string" &&
          typeof resource.category === "string" && typeof resource.description === "string" &&
          Number.isFinite(resource.minutes) && resource.minutes > 0 &&
          typeof resource.url === "string" && /^https:\/\//.test(resource.url)) ||
        !Object.values(saved.progress).every(item => item && Array.isArray(item.bookmarks) &&
          item.bookmarks.every(id => typeof id === "string") && Array.isArray(item.tasks) &&
          item.tasks.every(task => task && typeof task.id === "string" && typeof task.title === "string" &&
            typeof task.subject === "string" && typeof task.date === "string" &&
            Number.isInteger(task.minutes) && task.minutes > 0 && typeof task.done === "boolean")) ||
        !saved.users.every(user => ["technology", "social-science", "health"].includes(user.field)

        )
      )
        throw Error();
      saved.users.forEach((user) => {
        user.role = user.id === "alireza-member" ? "admin" : "member";
        const original = initialUsers.find(item => item.id === user.id);
        if (original && user.passwordSalt === original.passwordSalt &&
            user.passwordHash === previousPasswords[user.id]) {
          user.passwordHash = original.passwordHash;
        }
      });
      return saved;
    } catch {
      throw storageError(
        "Saved data could not be read. Clear this site’s local storage in browser settings to start again. Your existing data has not been overwritten.",
      );
    }
  }
  // Save before changing the displayed state, so a failed save never looks successful.
  async function saveData(next) {
    next.revision = Math.max(Date.now(), Number(next.revision || 0) + 1);
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(next));
    } catch {
      throw storageError(
        "The browser could not save this change. Check available space and site-storage permissions.",
      );
    }
    data = next;
    storageIssue = "";
    try {
      await HubDatabase.write(copy(next));
      databaseIssue = "";
    } catch {
      databaseIssue = "The browser database is unavailable. Your changes are still saved in localStorage. Allow IndexedDB in browser settings to keep the database copy as well.";
    }
    if (databaseIssue) window.dispatchEvent(new CustomEvent("hub:storage-error", {detail: databaseIssue}));
    else emit("hub:storage-ready");
  }
  async function change(update, eventName) {
    const next = readData();
    const result = update(next);
    await saveData(next);
    if (eventName) emit(eventName);
    return result;
  }
  const ready = (async () => {
    try {
      const hasJson = localStorage.getItem(DATA_KEY) !== null;
      data = readData();
      // The account menu can render immediately from the JSON copy, without
      // waiting for the IndexedDB transaction on every page navigation.
      activeId = JSON.parse(localStorage.getItem(SESSION_KEY) || '\"\"');
      if (!hasJson) {
        try {
          const savedDatabase = await HubDatabase.read();
          // Another tab may have saved while the database was opening.
          if (localStorage.getItem(DATA_KEY) !== null) data = readData();
          else if (savedDatabase) data = parseData(JSON.stringify(savedDatabase));
        } catch {
          databaseIssue = "The browser database is unavailable. This page will use its localStorage copy.";
        }
      }
      await saveData(data);
    } catch (error) {
      storageIssue = error.message;
    }
    return {ok: !storageIssue, message: storageIssue || databaseIssue};
  })();

  function publicProfile(user) {
    if (!user) return null;
    const { passwordHash, passwordSalt, ...profile } = user;
    return copy(profile);
  }
  function current() {
    return publicProfile(data.users.find((user) => user.id === activeId));
  }
  function requireAccount() {
    const user = current();
    if (!user)
      throw Error("Log in or create an account to save your progress.");
    return user;
  }
  function progress() {
    return data.progress[activeId] || { bookmarks: [], tasks: [] };
  }
  function progressFor(next, id) {
    if (!next.progress[id]) next.progress[id] = { bookmarks: [], tasks: [] };
    return next.progress[id];
  }
  function uid() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }
  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number),
      date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }
  // Web Crypto runs inside the browser. The digest avoids keeping plain-text
  // passwords, but client-side account checks still cannot provide real security.
  async function passwordDigest(password, salt) {
    if (!crypto.subtle)
      throw Error(
        "Use this website over HTTPS or a local preview such as Live Server to use accounts.",
      );
    const bytes = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      bytes.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const result = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: bytes.encode(salt),
        iterations: PASSWORD_ROUNDS,
        hash: "SHA-256",
      },
      key,
      256,
    );
    return Array.from(new Uint8Array(result), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }
  async function login(email, password) {
    await ready;
    data = readData();
    const user = data.users.find(
      (item) => item.email === email.trim().toLowerCase(),
    );
    if (
      !user ||
      (await passwordDigest(password, user.passwordSalt)) !== user.passwordHash
    )
      return null;
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(user.id));
    } catch {
      throw Error("Allow browser storage to log in.");
    }
    activeId = user.id;
    emit("hub:account");
    return publicProfile(user);
  }
  async function createAccount(profile, password, byAdministrator = false) {
    await ready;
    if (byAdministrator) requireAdmin();
    const name = String(profile.name || "").trim(),
      email = String(profile.email || "")
        .trim()
        .toLowerCase();
    if (name.length < 2 || name.length > 50)
      throw Error("Enter a name between 2 and 50 characters.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120)
      throw Error("Enter a complete email address.");
    if (
      password.length < 12 ||
      password.length > 128 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password) ||
      !/[\W_]/.test(password)
    )
      throw Error(
        "Use 12–128 characters with uppercase, lowercase, a number and a symbol.",
      );
    if (!["technology", "social-science", "health"].includes(profile.field))
      throw Error("Choose your main interest.");
    if (readData().users.some((user) => user.email === email))
      throw Object.assign(
        Error("An account already uses this email. Log in instead."),
        { field: "email" },
      );
    const passwordSalt = uid(),
      passwordHash = await passwordDigest(password, passwordSalt);
    const user = {
      id: uid(),
      name,
      email,
      role: "member",
      field: profile.field,
      goal: String(profile.goal || "").trim(),
      passwordSalt,
      passwordHash,
    };
    return change((next) => {
      if (byAdministrator) requireAdmin();
      if (next.users.some((item) => item.email === email))
        throw Object.assign(
          Error("An account already uses this email. Log in instead."),
          { field: "email" },
        );
      next.users.push(user);
      progressFor(next, user.id);
      return publicProfile(user);
    }, "hub:members");
  }
  // The public form can only create members. The staff action checks its role
  // again after password hashing, in case the account changed in another tab.
  function register(profile, password) { return createAccount(profile, password); }
  function addMember(profile, password) { return createAccount(profile, password, true); }
  async function logout() {
    await ready;
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      throw Error(
        "The browser could not sign you out. Allow site storage and try again, or clear this site’s saved data in browser settings.",
      );
    }
    activeId = "";
    emit("hub:account");
    HubNavigation.go("index.html");
  }
  async function toggleBookmark(id) {
    await ready;
    const user = requireAccount();
    return change((next) => {
      if (!next.resources.some((item) => item.id === id))
        throw Error("This resource is no longer available.");
      const saved = progressFor(next, user.id);
      const adding = !saved.bookmarks.includes(id);
      saved.bookmarks = adding
        ? [...saved.bookmarks, id]
        : saved.bookmarks.filter((item) => item !== id);
      return adding;
    }, "hub:bookmarks");
  }
  async function saveTasks(items) {
    await ready;
    const user = requireAccount();
    if (user.role !== "member") throw Error("Study plans are available to members. Open your administrator dashboard to manage the library.");
    if (
      !Array.isArray(items) ||
      items.some(
        (task) =>
          !task.id ||
          typeof task.title !== "string" ||
          task.title.trim().length < 3 ||
          task.title.length > 80 ||
          !HubData.subjects.some((subject) => subject.name === task.subject) ||
          !validDate(task.date) ||
          (task.time !== undefined && task.time !== "" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(task.time)) ||
          !Number.isInteger(task.minutes) ||
          task.minutes < 5 ||
          task.minutes > 180 ||
          typeof task.done !== "boolean",
      ) ||
      new Set(items.map((task) => task.id)).size !== items.length
    )
      throw Error("Check the session title, subject, date and minutes.");
    await change((next) => {
      progressFor(next, user.id).tasks = copy(items);
    }, "hub:tasks");
  }

  async function updateProfile(profile) {
    await ready;
    const user = requireAccount();
    const name = String(profile.name || "").trim();
    const email = String(profile.email || "").trim().toLowerCase();
    const goal = String(profile.goal || "").trim();
    if (name.length < 2 || name.length > 50) throw Object.assign(Error("Use a name between 2 and 50 characters."), {field: "fullName"});
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) throw Object.assign(Error("Enter a complete email address."), {field: "email"});
    if (!["technology", "social-science", "health"].includes(profile.field)) throw Object.assign(Error("Choose your main interest."), {field: "field"});
    if (goal.length > 240) throw Object.assign(Error("Keep your goal within 240 characters."), {field: "goal"});
    const result = await change(next => {
      if (next.users.some(item => item.id !== user.id && item.email === email)) throw Object.assign(Error("An account already uses this email."), {field: "email"});
      const target = next.users.find(item => item.id === user.id);
      if (!target) throw Error("This account is no longer available. Log in again.");
      Object.assign(target, {name, email, field: profile.field});
      if (user.role === "admin") target.adminNote = goal;
      else target.goal = goal;
      return publicProfile(target);
    }, "hub:profile");
    emit("hub:account");
    return result;
  }
  async function clearBookmarks() {
    await ready;
    const user = requireAccount();
    await change(next => { progressFor(next, user.id).bookmarks = []; }, "hub:bookmarks");
  }
  function requireAdmin() {
    if (requireAccount().role !== "admin") throw Error("Administrator access is required for this action.");
  }
  async function saveResource(fields) {
    await ready;
    requireAdmin();
    const value = key => String(fields[key] || "").trim();
    const title = value("title"), author = value("author"), description = value("description");
    const category = value("category"), type = value("type"), level = value("level");
    const minutes = Number(fields.minutes), year = Number(fields.year), url = value("url");
    if (title.length < 3 || title.length > 120 || author.length < 2 || author.length > 120 || description.length < 10 || description.length > 360) throw Error("Check the title, author and description lengths.");
    if (!HubData.subjects.some(subject => subject.name === category) || !["Book", "Reference", "Practice"].includes(type) || !["Beginner", "Intermediate", "Advanced", "All levels"].includes(level)) throw Error("Choose a valid subject, format and level.");
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 180 || !Number.isInteger(year) || year < 1000 || year > 2100) throw Error("Check the year and suggested study minutes.");
    let parsed;
    try { parsed = new URL(url); } catch { throw Error("Enter a complete HTTPS resource link."); }
    if (parsed.protocol !== "https:" || parsed.username || parsed.password || url.length > 1000) throw Error("Use an HTTPS resource link without login details.");
    return change(next => {
      const id = value("resourceId");
      const existing = id && next.resources.find(resource => resource.id === id);
      if (id && !existing) throw Error("This resource was removed. Cancel this edit and add a new one.");
      const resource = {id: id || "r-" + uid(), title, author, description, category, type, level, year, minutes, url, core: type === "Book"};
      if (existing) Object.assign(existing, resource);
      else next.resources.push(resource);
      return copy(resource);
    }, "hub:resources");
  }
  async function removeResource(id) {
    await ready;
    requireAdmin();
    await change(next => {
      if (!next.resources.some(resource => resource.id === id)) throw Error("This resource has already been removed.");
      next.resources = next.resources.filter(resource => resource.id !== id);
      Object.values(next.progress).forEach(item => { item.bookmarks = item.bookmarks.filter(bookmark => bookmark !== id); });
    }, "hub:resources");
    emit("hub:bookmarks");
  }
  // Other tabs receive the storage event; the tab making the change uses the
  // hub events above. Both paths refresh the same visible state.
  window.addEventListener("storage", event => {
    if (event.key !== DATA_KEY && event.key !== SESSION_KEY && event.key !== null) return;
    try {
      data = readData();
      activeId = JSON.parse(localStorage.getItem(SESSION_KEY) || '\"\"');
      storageIssue = "";
      ["hub:storage-ready", "hub:account", "hub:profile", "hub:resources", "hub:bookmarks", "hub:tasks", "hub:members"].forEach(emit);
    } catch (error) { storageError(error.message); }
  });
  return {
    ready,
    updateProfile,
    clearBookmarks,
    saveResource,
    removeResource,
    users: () => current()?.role === "admin" ? data.users.map(publicProfile) : [],
    login,
    register,
    addMember,
    logout,
    toggleBookmark,
    saveTasks,
    uid,
    current,
    resources: () => copy(data.resources),
    bookmarks: () => [...progress().bookmarks],
    tasks: () => copy(progress().tasks),
    get storageMessage() {
      return storageIssue || databaseIssue;
    },
  };
})();
