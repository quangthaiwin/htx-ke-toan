"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});

      window.addEventListener("online", () => {
        navigator.serviceWorker.controller?.postMessage("flush-queue");
      });
    }
  }, []);

  return null;
}
