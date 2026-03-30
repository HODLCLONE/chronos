"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { HourglassMark } from "@/components/hourglass-mark";
import { copyText } from "@/lib/clipboard";
import { deleteLockIn, getAppMeta, getLockInById } from "@/lib/storage/lockins";
import { decryptLockInPayload, verifyPassphrase } from "@/lib/security/crypto";
import { formatCountdown, formatUnlockDate, getLockStatus } from "@/lib/time";
import type { AppMeta, DecryptedLockInPayload, LockInEntry } from "@/lib/types";

export function LockInDetailClient({ id }: { id: string }) {
  const [entry, setEntry] = useState<LockInEntry | null>(null);
  const [meta, setMeta] = useState<AppMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [passphrase, setPassphrase] = useState("");
  const [revealed, setRevealed] = useState<DecryptedLockInPayload | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getLockInById(id), getAppMeta()])
      .then(([nextEntry, nextMeta]) => {
        setEntry(nextEntry ?? null);
        setMeta(nextMeta ?? null);
      })
      .catch(() => setError("Chronos could not load this LockIn from local storage."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleReveal() {
    if (!entry || !meta) {
      return;
    }

    setError(null);
    setMessage(null);

    if (getLockStatus(entry.unlockAt) !== "ready") {
      setError("The lock has not expired yet. Chronos will not reveal this early.");
      return;
    }

    const valid = await verifyPassphrase(passphrase, meta.passphraseVerifier);
    if (!valid) {
      setError("Incorrect passphrase. Chronos keeps the secret sealed.");
      return;
    }

    const decrypted = await decryptLockInPayload(entry, passphrase);
    setRevealed(decrypted);
    setPasswordVisible(false);
    setMessage("Reveal completed. Nothing was copied automatically.");
  }

  async function handleDelete() {
    if (!entry) {
      return;
    }

    const confirmed = window.confirm(
      "Delete this LockIn from local storage? This removes the encrypted record from this device.",
    );
    if (!confirmed) {
      return;
    }

    await deleteLockIn(entry.id);
    window.location.href = "/";
  }

  async function copyValue(value: string, label: string) {
    await copyText(value);
    setMessage(`${label} copied. Chronos only copies on explicit request.`);
  }

  if (loading) {
    return (
      <main className="min-h-screen px-4 py-10 text-slate-200">
        <div className="chronos-panel mx-auto flex max-w-4xl flex-col items-center gap-4 p-8 text-center">
          <HourglassMark animated className="h-16 w-16" />
          <div>
            <p className="chronos-kicker justify-center">Chronos remembers</p>
            <p className="mt-3 text-[var(--chronos-muted)]">The vault is turning its hourglass and reading this seal from local memory.</p>
          </div>
        </div>
      </main>
    );
  }

  if (!entry) {
    return (
      <main className="min-h-screen bg-[#04070f] px-4 py-10 text-slate-200">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Chronos</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">LockIn not found.</h1>
          <p className="mt-4 text-sm text-slate-400">
            The encrypted record might have been deleted, the browser data may have changed, or this device no longer holds that entry.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white">
            Back to vault
          </Link>
        </div>
      </main>
    );
  }

  const status = getLockStatus(entry.unlockAt);

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#02040a_0%,#070b14_55%,#05070d_100%)] px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.25rem+var(--safe-top))] text-slate-200 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 sm:gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2">
            Back to vault
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-rose-300/20 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:border-rose-300/40 sm:min-h-0 sm:w-auto sm:py-2"
            onClick={() => {
              handleDelete().catch(() => setError("Chronos could not delete the local record."));
            }}
          >
            Delete LockIn
          </button>
        </div>

        <section className="chronos-panel command-block scanner-grid p-4 sm:p-8">
          <p className="command-block-label">LOCK VECTOR DOSSIER</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className="id-block">
                  <p className="id-block-label">SIGNAL ID</p>
                  <p className="id-block-value">{entry.id.slice(0, 8)}</p>
                </div>
                <div className="id-block">
                  <p className="id-block-label">LOCK VECTOR</p>
                  <p className="id-block-value">{status === "ready" ? "UNLOCK WINDOW" : "SEALED"}</p>
                </div>
              </div>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">{entry.serviceName}</h1>
              <p className="mt-3 text-sm text-slate-400">Identity hint: {entry.usernameOrEmail}</p>
            </div>
            <span
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] ${
                status === "ready"
                  ? "bg-emerald-400/15 text-emerald-200"
                  : "bg-amber-400/15 text-amber-100"
              }`}
            >
              {status === "ready" ? "Unlock window open" : "Still locked"}
            </span>
          </div>

          <div className="mt-6 grid gap-3 md:mt-8 md:grid-cols-3 md:gap-4">
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Unlock date</p>
              <p className="mt-3 text-lg font-medium text-white">{formatUnlockDate(entry.unlockAt)}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Countdown</p>
              <p className="mt-3 text-lg font-medium text-white">{formatCountdown(entry.unlockAt)}</p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Trust model</p>
              <p className="mt-3 text-sm leading-7 text-slate-300">Local-only encryption. No cloud recovery. No early bypass in V1.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Reveal gate</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">
              {status === "ready" ? "You waited. Now prove it with the passphrase." : "Not yet."}
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {status === "ready"
                ? "Reveal is smoother than creation because the waiting period has been earned. Chronos still requires the local passphrase and explicit actions."
                : "Chronos will not offer a break-glass shortcut here. The friction is the point."}
            </p>

            <label className="mt-6 block text-sm font-medium text-slate-200">
              Local passphrase
              <input
                type="password"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#050812] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                value={passphrase}
                onChange={(event) => setPassphrase(event.target.value)}
                placeholder="Required for reveal"
              />
            </label>

            <button
              type="button"
              className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300 sm:min-h-0"
              disabled={status !== "ready"}
              onClick={() => {
                handleReveal().catch((revealError) =>
                  setError(revealError instanceof Error ? revealError.message : "Chronos could not decrypt the LockIn."),
                );
              }}
            >
              Reveal when ready
            </button>

            {error ? (
              <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>
            ) : null}
            {message ? (
              <p className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">{message}</p>
            ) : null}
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-4 sm:rounded-[2rem] sm:p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Secret material</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Masked by default. Explicit reveal only.</h2>

            {revealed ? (
              <div className="mt-6 space-y-5">
                <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Username or email</p>
                  <p className="mt-3 break-all text-lg font-medium text-white">{revealed.usernameOrEmail}</p>
                  <button
                    type="button"
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
                    onClick={() => {
                      copyValue(revealed.usernameOrEmail, "Username or email").catch(() =>
                        setError("Chronos could not copy the username or email."),
                      );
                    }}
                  >
                    Copy username or email
                  </button>
                </div>

                <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Password</p>
                  <p className="mt-3 break-all text-lg font-medium tracking-[0.28em] text-white">
                    {passwordVisible ? revealed.password : "•••••••••••••••"}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    Chronos keeps the password masked until you explicitly show it. Copy works either way.
                  </p>
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <button
                      type="button"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
                      onClick={() => {
                        copyValue(revealed.password, "Password").catch(() =>
                          setError("Chronos could not copy the password."),
                        );
                      }}
                    >
                      Copy password
                    </button>
                    <button
                      type="button"
                      className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
                      onClick={() => setPasswordVisible((current) => !current)}
                    >
                      {passwordVisible ? "Hide password" : "Show password"}
                    </button>
                  </div>
                </div>

                {revealed.note ? (
                  <div className="rounded-3xl border border-white/8 bg-white/[0.03] p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Locked note</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-200">{revealed.note}</p>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-sm leading-7 text-slate-400">
                Chronos will not auto-reveal, auto-copy, or auto-help. Wait for expiry, enter the passphrase, and choose each exposure action yourself.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
