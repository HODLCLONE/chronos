"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CreateLockInFlow, type CreateLockInSubmission } from "@/components/create-lockin-flow";
import { LockInEntryCard } from "@/components/lockin-entry-card";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { MODE_NAME, REQUIRED_WARNINGS } from "@/lib/constants";
import {
  createBackupBundle,
  createFreshMeta,
  createPassphraseVerifier,
  decryptBackupBundle,
  encryptLockInPayload,
  verifyPassphrase,
} from "@/lib/security/crypto";
import {
  exportChronosSnapshot,
  getAppMeta,
  getLockIns,
  replaceAllChronosData,
  saveAppMeta,
  saveLockIn,
} from "@/lib/storage/lockins";
import { resolveUnlockAt } from "@/lib/time";
import type { AppMeta, LockInEntry } from "@/lib/types";

function toastToneClass(tone: "success" | "error") {
  return tone === "success"
    ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-50"
    : "border-rose-300/25 bg-rose-400/10 text-rose-50";
}

export function ChronosApp() {
  const [entries, setEntries] = useState<LockInEntry[]>([]);
  const [meta, setMeta] = useState<AppMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const [backupPassphrase, setBackupPassphrase] = useState("");
  const [backupReplaceConfirmed, setBackupReplaceConfirmed] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    setLoading(true);

    try {
      const [nextEntries, nextMeta] = await Promise.all([getLockIns(), getAppMeta()]);
      setEntries(nextEntries);
      setMeta(nextMeta ?? null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh().catch((error) => {
      setToast({
        tone: "error",
        message: error instanceof Error ? error.message : "Chronos could not load local data.",
      });
      setLoading(false);
    });
  }, []);

  const readyCount = useMemo(
    () => entries.filter((entry) => new Date(entry.unlockAt).getTime() <= Date.now()).length,
    [entries],
  );

  async function handleCreate(payload: CreateLockInSubmission) {
    setCreatePending(true);

    try {
      const currentMeta = await getAppMeta();
      let nextMeta = currentMeta;

      if (currentMeta) {
        const matches = await verifyPassphrase(payload.passphrase, currentMeta.passphraseVerifier);
        if (!matches) {
          throw new Error("The local passphrase is wrong. Chronos will not create a new LockIn with a mismatched key.");
        }
      } else {
        const verifier = await createPassphraseVerifier(payload.passphrase);
        nextMeta = createFreshMeta(verifier);
        await saveAppMeta(nextMeta);
      }

      const encrypted = await encryptLockInPayload({
        passphrase: payload.passphrase,
        usernameOrEmail: payload.usernameOrEmail,
        password: payload.password,
        note: payload.note?.trim() ? payload.note : undefined,
      });

      const entry: LockInEntry = {
        id: crypto.randomUUID(),
        serviceName: payload.serviceName.trim(),
        usernameOrEmail: encrypted.usernameOrEmail,
        encryptedSecretPayload: encrypted.encryptedSecretPayload,
        encryptedNote: encrypted.encryptedNote,
        createdAt: new Date().toISOString(),
        unlockAt: resolveUnlockAt(payload.durationValue, payload.customDate),
        status: "locked",
        encryption: encrypted.encryption,
        version: 1,
      };

      await saveLockIn(entry);
      setMeta(nextMeta ?? null);
      setCreateOpen(false);
      setToast({ tone: "success", message: `${MODE_NAME} created. Future you now has to wait.` });
      await refresh();
    } finally {
      setCreatePending(false);
    }
  }

  async function handleExport() {
    if (!meta) {
      setToast({ tone: "error", message: "Create at least one LockIn before exporting." });
      return;
    }

    const passphrase = backupPassphrase.trim();
    if (!passphrase) {
      setToast({ tone: "error", message: "Enter the local passphrase to create an encrypted backup." });
      return;
    }

    const valid = await verifyPassphrase(passphrase, meta.passphraseVerifier);
    if (!valid) {
      setToast({ tone: "error", message: "Backup export refused. The passphrase did not match local state." });
      return;
    }

    const snapshot = await exportChronosSnapshot();
    const bundle = await createBackupBundle(snapshot, passphrase);
    const blob = new Blob([bundle], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `chronos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);

    await saveAppMeta({ ...meta, exportWarningAcknowledged: true });
    setMeta({ ...meta, exportWarningAcknowledged: true });
    setToast({ tone: "success", message: "Encrypted backup saved locally. Guard it like the device itself." });
  }

  async function handleImport(file: File | null) {
    if (!file) {
      setToast({ tone: "error", message: "Choose an encrypted Chronos backup file first." });
      return;
    }

    if (!backupReplaceConfirmed) {
      setToast({ tone: "error", message: "Confirm that import will replace current local data." });
      return;
    }

    const passphrase = backupPassphrase.trim();
    if (!passphrase) {
      setToast({ tone: "error", message: "Enter the passphrase required to decrypt the backup." });
      return;
    }

    const serialized = await file.text();
    const snapshot = await decryptBackupBundle(serialized, passphrase);
    const valid = await verifyPassphrase(passphrase, snapshot.meta.passphraseVerifier);
    if (!valid) {
      throw new Error("Backup decrypted, but the embedded passphrase verifier does not match. Import aborted.");
    }

    await replaceAllChronosData(snapshot);
    setBackupReplaceConfirmed(false);
    setBackupPassphrase("");
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
    setToast({ tone: "success", message: "Encrypted backup restored on this device." });
    await refresh();
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_25%),linear-gradient(180deg,#02040a_0%,#060913_50%,#05070d_100%)] text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.25rem+var(--safe-top))] sm:gap-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.34)] backdrop-blur sm:rounded-[2rem] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/75">Chronos · {MODE_NAME}</p>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Lock yourself out. Lock in.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                Chronos is a local-first commitment tool. It encrypts secrets before storing them on this device, then forces time and intention to stand between you and an impulsive reversal.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold tracking-[0.18em] text-slate-950 transition hover:bg-cyan-200 sm:min-h-0 sm:w-auto"
                  onClick={() => setCreateOpen(true)}
                >
                  LOCK IN
                </button>
                <a
                  href="#backup"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto"
                >
                  Backup and restore
                </a>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "Locked entries", value: entries.length.toString() },
                { label: "Ready to reveal", value: readyCount.toString() },
                { label: "Storage model", value: "Local only" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{metric.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-white">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <PwaInstallPrompt />

        {toast ? (
          <section className={`rounded-3xl border px-4 py-4 text-sm sm:px-5 ${toastToneClass(toast.tone)}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{toast.message}</p>
              <button type="button" className="text-xs uppercase tracking-[0.24em]" onClick={() => setToast(null)}>
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Trust model</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Honest constraints, not fake certainty.</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Chronos does not pretend to be absolute security. It is a disciplined speed bump: no cloud, no recovery, no convenience layer, and no promise that a determined technical user cannot bypass local restrictions.
            </p>
            <ul className="mt-6 grid gap-3 text-sm text-slate-300">
              {REQUIRED_WARNINGS.map((warning) => (
                <li key={warning} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  {warning}
                </li>
              ))}
            </ul>
          </div>

          <section id="backup" className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Encrypted backup</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Export and import stay client-side.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Export creates a locally encrypted file. Import decrypts locally. Neither action talks to a backend. If you lose both this device and your backup, Chronos cannot help you.
            </p>

            <label className="mt-6 block text-sm font-medium text-slate-200">
              Local passphrase
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#050812] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                placeholder="Required for export and import"
                value={backupPassphrase}
                onChange={(event) => setBackupPassphrase(event.target.value)}
              />
            </label>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 sm:min-h-0 sm:w-auto sm:py-2"
                onClick={() => {
                  handleExport().catch((error) =>
                    setToast({
                      tone: "error",
                      message: error instanceof Error ? error.message : "Chronos could not export backup data.",
                    }),
                  );
                }}
              >
                Export encrypted backup
              </button>
              <label className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2">
                <input ref={importInputRef} type="file" accept="application/json" className="hidden" />
                Choose backup file
              </label>
            </div>

            <div className="mt-5 rounded-3xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-50">
              <p className="font-semibold text-white">Import replaces current local data.</p>
              <label className="mt-3 flex items-start gap-3 text-sm text-amber-50/90">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-white/20 bg-transparent"
                  checked={backupReplaceConfirmed}
                  onChange={(event) => setBackupReplaceConfirmed(event.target.checked)}
                />
                <span>I understand import will overwrite the current device state if the backup decrypts correctly.</span>
              </label>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
              onClick={() => {
                const file = importInputRef.current?.files?.[0] ?? null;
                handleImport(file).catch((error) =>
                  setToast({
                    tone: "error",
                    message: error instanceof Error ? error.message : "Chronos could not import this backup.",
                  }),
                );
              }}
            >
              Restore encrypted backup
            </button>
          </section>
        </section>

        <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 sm:rounded-[2rem] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Vault</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Current LockIns</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Secrets stay masked until the lock expires and the correct passphrase is provided. There is no emergency bypass in V1. That friction is intentional.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-6 rounded-3xl border border-white/8 bg-white/[0.03] px-5 py-10 text-sm text-slate-400">
              Loading local vault state...
            </div>
          ) : entries.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center text-sm text-slate-400">
              No LockIns yet. Create the first one when you are ready to make reversal annoying on purpose.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {entries.map((entry) => (
                <LockInEntryCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </section>
      </div>

      {createOpen ? (
        <CreateLockInFlow
          hasExistingPassphrase={Boolean(meta)}
          pending={createPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={handleCreate}
        />
      ) : null}
    </main>
  );
}
