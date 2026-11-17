/* Browser-local database. No server, API, SQL service or extra library is used.
   localStorage keeps the Final project's required JSON copy; IndexedDB stores
   structured records and can restore that copy if it is missing. */
"use strict";
window.HubDatabase = (() => {
  const name = "RasuliKnowledgeHub";
  const version = 1;
  const stores = ["users", "resources", "progress", "metadata"];
  let connection;
  let opening;

  function open() {
    if (connection) return Promise.resolve(connection);
    if (opening) return opening;
    opening = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(Error("IndexedDB is unavailable in this browser."));
        return;
      }
      const request = indexedDB.open(name, version);
      request.onupgradeneeded = () => {
        const db = request.result;
        const users = db.createObjectStore("users", {keyPath: "id"});
        users.createIndex("email", "email", {unique: true});
        const resources = db.createObjectStore("resources", {keyPath: "id"});
        resources.createIndex("category", "category");
        db.createObjectStore("progress", {keyPath: "userId"});
        db.createObjectStore("metadata", {keyPath: "key"});
      };
      request.onerror = () => reject(request.error || Error("Could not open the browser database."));
      request.onblocked = () => reject(Error("Close older project tabs to finish updating the browser database."));
      request.onsuccess = () => {
        connection = request.result;
        connection.onversionchange = () => {
          connection.close();
          connection = null;
          opening = null;
        };
        resolve(connection);
      };
    }).catch(error => {
      opening = null;
      throw error;
    });
    return opening;
  }

  async function read() {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(stores, "readonly");
      const users = transaction.objectStore("users").getAll();
      const resources = transaction.objectStore("resources").getAll();
      const progress = transaction.objectStore("progress").getAll();
      const metadata = transaction.objectStore("metadata").get("snapshot");
      // Read results only after the complete transaction has succeeded.
      transaction.oncomplete = () => {
        if (!metadata.result) { resolve(null); return; }
        const ordering = metadata.result.resourceOrder || [];
        resources.result.sort((a, b) => ordering.indexOf(a.id) - ordering.indexOf(b.id));
        resolve({
          version: metadata.result.version,
          revision: metadata.result.revision,
          users: users.result,
          resources: resources.result,
          progress: Object.fromEntries(progress.result.map(item => [item.userId, {bookmarks: item.bookmarks, tasks: item.tasks}]))
        });
      };
      transaction.onabort = () => reject(transaction.error || Error("Could not read the browser database."));
    });
  }

  async function write(snapshot) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(stores, "readwrite");
      const metadata = transaction.objectStore("metadata");
      const current = metadata.get("snapshot");
      current.onsuccess = () => {
        // A slower write from another tab must not replace newer saved data.
        if ((current.result?.revision || 0) > (snapshot.revision || 0)) return;
        const users = transaction.objectStore("users");
        const resources = transaction.objectStore("resources");
        const progress = transaction.objectStore("progress");
        users.clear();
        resources.clear();
        progress.clear();
        snapshot.users.forEach(user => users.put(user));
        snapshot.resources.forEach(resource => resources.put(resource));
        Object.entries(snapshot.progress).forEach(([userId, value]) => progress.put({userId, ...value}));
        metadata.put({key: "snapshot", version: snapshot.version, revision: snapshot.revision || 0,
          resourceOrder: snapshot.resources.map(resource => resource.id)});
      };
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(transaction.error || Error("The browser database could not save this update."));
    });
  }

  return {name, read, write};
})();
