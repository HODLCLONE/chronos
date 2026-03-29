"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type PromptState = {
  installed: boolean;
  online: boolean;
  canInstall: boolean;
  isIos: boolean;
  isSafari: boolean;
  dismissed: boolean;
};

type Props = {
  testState?: PromptState;
};

function detectStandalone() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  const matchesDisplayMode = typeof window.matchMedia === "function" && window.matchMedia("(display-mode: standalone)").matches;
  return matchesDisplayMode || navigatorWithStandalone.standalone === true;
}

function detectIos() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function detectSafari() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent;
  return /safari/i.test(userAgent) && !/crios|fxios|edgios|chrome|android/i.test(userAgent);
}

export function PwaInstallPrompt({ testState }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installed, setInstalled] = useState(() => testState?.installed ?? detectStandalone());
  const [online, setOnline] = useState(() => testState?.online ?? (typeof navigator === "undefined" ? true : navigator.onLine));
  const [isIos] = useState(() => testState?.isIos ?? detectIos());
  const [isSafari] = useState(() => testState?.isSafari ?? detectSafari());

  useEffect(() => {
    if (testState || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Intentionally silent. Installability is helpful, not critical to core security.
    });

    const handlePrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setDismissed(false);
    };

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [testState]);

  const state = useMemo<PromptState>(
    () => ({
      installed,
      online,
      canInstall: testState?.canInstall ?? Boolean(deferredPrompt),
      isIos,
      isSafari,
      dismissed: testState?.dismissed ?? dismissed,
    }),
    [deferredPrompt, dismissed, installed, isIos, isSafari, online, testState],
  );

  const showPrompt = !state.dismissed && (state.installed || !state.online || state.canInstall || (state.isIos && state.isSafari));

  if (!showPrompt) {
    return null;
  }

  return (
    <section className="chronos-panel p-4 sm:rounded-3xl sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <p className="chronos-kicker">Temple shell</p>
          <h2 className="chronos-title mt-1 text-lg font-semibold">
            {state.installed ? "Installed on this device" : "Install the shrine of Chronos."}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            {state.online
              ? state.installed
                ? "Offline-ready shell active. Launch from your home screen for the cleanest full-screen experience."
                : "Installing keeps Chronos one tap away and improves the app-shell feel when you launch it from the home screen."
              : "Offline-ready shell active. Local vault data stays on this device even while the network is down."}
          </p>

          {!state.online ? (
            <p className="mt-3 rounded-2xl border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
              Network is down right now. Cached UI remains available, but new browser assets wait for connection.
            </p>
          ) : null}

          {!state.canInstall && !state.installed && state.isIos && state.isSafari ? (
            <p className="mt-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              On iPhone Safari, tap Share, then choose Add to Home Screen.
            </p>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-56">
          {state.canInstall && !state.installed ? (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
              onClick={async () => {
                if (!deferredPrompt) {
                  return;
                }

                await deferredPrompt.prompt();
                const result = await deferredPrompt.userChoice.catch(() => ({ outcome: "dismissed" as const }));
                setDeferredPrompt(null);
                if (result.outcome === "accepted") {
                  setInstalled(true);
                }
              }}
            >
              Install app
            </button>
          ) : null}

          {state.installed ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
              Installed on this device
            </div>
          ) : null}

          {!state.installed ? (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm text-slate-200 transition hover:border-white/30 hover:text-white"
              onClick={() => setDismissed(true)}
            >
              Later
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
