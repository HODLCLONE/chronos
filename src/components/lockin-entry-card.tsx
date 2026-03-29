import Link from "next/link";

import { formatCountdown, formatUnlockDate, getLockStatus } from "@/lib/time";
import type { LockInEntry } from "@/lib/types";

export function LockInEntryCard({ entry }: { entry: LockInEntry }) {
  const status = getLockStatus(entry.unlockAt);

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.24)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">{status === "ready" ? "Unlockable" : "Locked"}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{entry.serviceName}</h3>
          <p className="mt-2 text-sm text-slate-400">Identity hint: {entry.usernameOrEmail}</p>
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

      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="max-w-sm text-sm text-slate-500">
          {status === "ready"
            ? "The waiting period is over. Reveal still requires the passphrase."
            : "Chronos is doing its job. The secret stays encrypted and inconvenient until time runs out."}
        </p>
        <Link
          href={`/lockins/${entry.id}`}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-cyan-300 hover:text-cyan-200"
        >
          View LockIn
        </Link>
      </div>
    </article>
  );
}
