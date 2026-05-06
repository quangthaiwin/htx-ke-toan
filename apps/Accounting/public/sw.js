const CACHE_NAME = "farm-v1";
const STATIC_ASSETS = ["/farm", "/farm/issue", "/farm/transfer", "/farm/purchase", "/farm/lots", "/farm/suppliers", "/farm/harvest", "/farm/crops", "/farm/reports"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // API calls: network-first, queue if offline
  if (request.url.includes("/api/farm/")) {
    if (request.method === "GET") {
      event.respondWith(
        fetch(request)
          .then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return res;
          })
          .catch(() => caches.match(request))
      );
    } else {
      // POST/PATCH: try network, queue if offline
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          const body = await request.clone().text();
          await saveToOfflineQueue({
            url: request.url,
            method: request.method,
            body,
            headers: Object.fromEntries(request.headers.entries()),
            timestamp: Date.now(),
          });
          return new Response(JSON.stringify({ queued: true }), {
            status: 202,
            headers: { "Content-Type": "application/json" },
          });
        })
      );
    }
    return;
  }

  // Static: cache-first
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});

// Offline queue using IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("farm-offline", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("queue", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToOfflineQueue(entry) {
  const db = await openDB();
  const tx = db.transaction("queue", "readwrite");
  tx.objectStore("queue").add(entry);
}

async function flushOfflineQueue() {
  const db = await openDB();
  const tx = db.transaction("queue", "readonly");
  const store = tx.objectStore("queue");
  const entries = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
  });

  for (const entry of entries) {
    try {
      await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
      });
      const delTx = db.transaction("queue", "readwrite");
      delTx.objectStore("queue").delete(entry.id);
    } catch {
      break; // still offline
    }
  }
}

// Sync when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "flush-queue") {
    event.waitUntil(flushOfflineQueue());
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "flush-queue") {
    flushOfflineQueue();
  }
});
