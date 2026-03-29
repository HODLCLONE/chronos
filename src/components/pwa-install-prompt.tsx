"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Intentionally silent. Installability is helpful, not critical to core security.
    });

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    return () => window.removeEventListener("beforeinstallprompt", handlePrompt);
  }, []);

  if (!deferredPrompt || dismissed) {
    return null;
  }

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_20px_80px_rgba(0,0,0,0.2)] backdrop-blur sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/70">PWA install</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Install Chronos for an offline-first LockIn shell.</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Installing keeps Chronos one tap away and helps the app stay available when your network does not.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm text-slate-200 transition hover:border-white/30 hover:text-white sm:min-h-0 sm:w-auto sm:py-2"
            onClick={() => setDismissed(true)}
          >
            Later
          </button>
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
            onClick={async () => {
              await deferredPrompt.prompt();
              setDeferredPrompt(null);
            }}
          >
            Install app
          </button>
        </div>
      </div>
    </section>
  );
}
