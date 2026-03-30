import Link from "next/link";

import { formatCountdown, formatUnlockDate, getLockStatus } from "@/lib/time";
import type { LockInEntry } from "@/lib/types";

export function LockInEntryCard({ entry }: { entry: LockInEntry }) {
  const status = getLockStatus(entry.unlockAt);

  return (
    <article className="chronos-panel command-block scanner-grid p-4 sm:p-5">
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="command-block-label">{status === "ready" ? "Unlock window" : "Seal active"}</p>
          <h3 className="chronos-title mt-2 text-xl font-semibold">{entry.serviceName}</h3>
          <p className="mt-2 text-sm text-[var(--chronos-muted)]">Mortal identity: {entry.usernameOrEmail}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
            status === "ready"
              ? "bg-emerald-400/15 text-emerald-200"
              : "bg-amber-400/15 text-amber-100"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="mt-5 grid gap-4 text-sm text-slate-300 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Unlock date</p>
          <p className="mt-2">{formatUnlockDate(entry.unlockAt)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Countdown</p>
          <p className="mt-2">{formatCountdown(entry.unlockAt)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-sm text-slate-500">
          {status === "ready"
            ? "The waiting period is over. Reveal still requires the passphrase."
            : "Chronos is doing its job. The secret stays encrypted and inconvenient until time runs out."}
        </p>
        <Link
          href={`/lockins/${entry.id}`}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
        >
          View LockIn
        </Link>
      </div>
    </article>
  );
}
