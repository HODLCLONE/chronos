import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#02040a_0%,#070b14_55%,#05070d_100%)] px-4 pb-[calc(1.5rem+var(--safe-bottom))] pt-[calc(1.25rem+var(--safe-top))] text-slate-100 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.34)] sm:rounded-[2rem] sm:p-8">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/75">Chronos · offline</p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">You are offline.</h1>
        <p className="text-sm leading-7 text-slate-300 sm:text-base">
          Chronos keeps your local vault on this device. If the main shell is already cached, reopen it from the home screen or browser tab. If not, reconnect once to refresh the offline shell.
        </p>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
          No cloud sync. No remote fallback. Your device cache and local encrypted storage are the whole system.
        </div>
        <Link
          href="/"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:w-auto"
        >
          Retry Chronos
        </Link>
      </div>
    </main>
  );
}
