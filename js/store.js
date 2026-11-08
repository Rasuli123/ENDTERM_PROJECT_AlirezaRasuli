/* Endterm frontend: profiles and progress last for this tab session.
   Member sign-in is a coursework simulation, not a security boundary. */
"use strict";
window.HubStore = (() => {
  const DATA_KEY = "rasuli.hub.endterm.data.v1";
  const SESSION_KEY = "rasuli.hub.endterm.account.v1";
  const PASSWORD_ROUNDS = 100000;
  const initialUsers = [
    {
      id: "alireza-member",
      name: "Alireza Rasuli",
      email: "alireza@rasulihub.local",
      role: "member",
      field: "technology",
      goal: "",
      passwordSalt: "hub-alireza-browser-v1",
      passwordHash:
        "ab8b99bad9022d9b2039e94a4439caf49a6ef19e5491a2878cf4e8e9761d27ae",
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
        "989ed01bdd76098c0f321ab57a8b3cb6dc514b4a2178005759758e233157ae57",
    },
  ];
  const copy = (value) => JSON.parse(JSON.stringify(value));
  const emit = (name) => window.dispatchEvent(new Event(name));
  let storageIssue = "";
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
      raw = sessionStorage.getItem(DATA_KEY);
    } catch {
      throw storageError(
        "Browser session storage is unavailable. Allow site data to use accounts and the planner.",
      );
    }
    if (!raw)
      return {
        version: 1,
        users: copy(initialUsers),
        resources: copy(HubData.resources),
        progress: {},
      };
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
            user.id && user.email && user.passwordHash && user.passwordSalt,
        )
      )
        throw Error();
      saved.users.forEach((user) => {
        user.role = "member";
      });
      return saved;
    } catch {
      throw storageError(
        "Session data could not be read. Open the website in a new tab to start a fresh session.",
      );
    }
  }
  // Save before changing the displayed state, so a failed save never looks successful.
  function saveData(next) {
    try {
      sessionStorage.setItem(DATA_KEY, JSON.stringify(next));
    } catch {
      throw storageError(
        "The browser could not save this change. Check available space and site-storage permissions.",
      );
    }
    data = next;
    storageIssue = "";
    emit("hub:storage-ready");
  }
  function change(update, eventName) {
    const next = readData();
    const result = update(next);
    saveData(next);
    if (eventName) emit(eventName);
    return result;
  }
  try {
    data = readData();
    saveData(data);
    activeId = sessionStorage.getItem(SESSION_KEY) || "";
  } catch (error) {
    storageIssue = error.message;
  }
  const ready = Promise.resolve({ ok: !storageIssue, message: storageIssue });

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
      sessionStorage.setItem(SESSION_KEY, user.id);
    } catch {
      throw Error("Allow browser session storage to log in.");
    }
    activeId = user.id;
    emit("hub:account");
    return publicProfile(user);
  }
  async function register(profile, password) {
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
      studyTime: profile.studyTime || "",
      startDate: profile.startDate || "",
      age: profile.age || "",
      phone: profile.phone || "",
      readingList: !!profile.readingList,
      passwordSalt,
      passwordHash,
    };
    return change((next) => {
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
  async function logout() {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      throw Error(
        "The browser could not end this session. Close this tab to finish signing out.",
      );
    }
    activeId = "";
    emit("hub:account");
    location.href = "index.html";
  }
  async function toggleBookmark(id) {
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
    const user = requireAccount();
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
          !Number.isInteger(task.minutes) ||
          task.minutes < 5 ||
          task.minutes > 180 ||
          typeof task.done !== "boolean",
      ) ||
      new Set(items.map((task) => task.id)).size !== items.length
    )
      throw Error("Check the session title, subject, date and minutes.");
    change((next) => {
      progressFor(next, user.id).tasks = copy(items);
    }, "hub:tasks");
  }
  return {
    ready,
    login,
    register,
    logout,
    toggleBookmark,
    saveTasks,
    uid,
    current,
    resources: () => copy(data.resources),
    bookmarks: () => [...progress().bookmarks],
    tasks: () => copy(progress().tasks),
    get storageMessage() {
      return storageIssue;
    },
  };
})();
