"use client";

import { useEffect, useMemo, useState } from "react";

import {
  COMMITMENT_PHRASE,
  DURATION_OPTIONS,
  FINAL_CONFIRM_DELAY_SECONDS,
  GENERATED_PASSWORD_COPY_MESSAGE,
  GENERATED_PASSWORD_REVEAL_LABEL,
  PASSPHRASE_HINT,
  PASSPHRASE_MIN_LENGTH,
} from "@/lib/constants";
import { HourglassMark } from "@/components/hourglass-mark";
import { copyText } from "@/lib/clipboard";
import { generateLockInPassword } from "@/lib/passwords";

type CreateLockInSubmission = {
  serviceName: string;
  usernameOrEmail: string;
  password: string;
  note?: string;
  durationValue: string;
  customDate?: string;
  passphrase: string;
  confirmPassphrase?: string;
};

type Props = {
  hasExistingPassphrase: boolean;
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateLockInSubmission) => Promise<void>;
  initialStep?: 1 | 2 | 3;
};

function createInitialState(): CreateLockInSubmission {
  return {
    serviceName: "",
    usernameOrEmail: "",
    password: generateLockInPassword(),
    note: "",
    durationValue: DURATION_OPTIONS[2]?.value ?? "90d",
    customDate: "",
    passphrase: "",
    confirmPassphrase: "",
  };
}

export function CreateLockInFlow({ hasExistingPassphrase, pending, onClose, onSubmit, initialStep = 1 }: Props) {
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [typedPhrase, setTypedPhrase] = useState("");
  const [cooldown, setCooldown] = useState(FINAL_CONFIRM_DELAY_SECONDS);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [form, setForm] = useState<CreateLockInSubmission>(() => createInitialState());

  useEffect(() => {
    if (step !== 3 || cooldown === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldown((value) => Math.max(value - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldown, step]);

  const canConfirm = useMemo(
    () => typedPhrase === COMMITMENT_PHRASE && cooldown === 0 && !pending,
    [cooldown, pending, typedPhrase],
  );

  async function handleFinalSubmit() {
    try {
      setError(null);
      await onSubmit(form);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Chronos could not create this LockIn.",
      );
    }
  }

  async function handleCopyPassword() {
    await copyText(form.password);
    setError(null);
    setCopiedPassword(true);
    setPasswordMessage("Generated password copied. Paste it into the target platform before you continue.");
  }

  function handleGenerateAnotherPassword() {
    setError(null);
    setForm((current) => ({ ...current, password: generateLockInPassword() }));
    setCopiedPassword(false);
    setPasswordMessage(null);
  }

  function validateStepOne() {
    if (!form.serviceName.trim()) {
      throw new Error("Name the service you are locking away.");
    }

    if (!form.usernameOrEmail.trim()) {
      throw new Error("Enter the username or email tied to the account.");
    }

    if (!form.password.trim()) {
      throw new Error("Chronos could not generate a password yet. Try generating a fresh one.");
    }

    if (!copiedPassword) {
      throw new Error("Copy the generated password into the target platform before continuing.");
    }

    if (!form.passphrase.trim()) {
      throw new Error("Set or enter the local passphrase required for reveal.");
    }

    if (!hasExistingPassphrase) {
      if (form.passphrase.length < PASSPHRASE_MIN_LENGTH) {
        throw new Error(`Use at least ${PASSPHRASE_MIN_LENGTH} characters for the passphrase.`);
      }

      if (form.passphrase !== form.confirmPassphrase) {
        throw new Error("Passphrase confirmation does not match.");
      }
    }

    if (form.durationValue === "custom" && !form.customDate) {
      throw new Error("Choose the exact date when this LockIn can end.");
    }
  }

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-[var(--chronos-border)] bg-[rgba(9,4,10,0.84)] px-4 py-3 text-sm text-[var(--chronos-ink)] outline-none transition placeholder:text-[rgba(201,184,148,0.42)] focus:border-[var(--chronos-border-strong)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-y-auto bg-slate-950/80 px-3 pt-4 pb-[max(0.75rem,var(--safe-bottom))] backdrop-blur sm:px-4 sm:py-6"
      role="dialog"
      aria-modal="true"
      aria-label="Create LockIn"
    >
      <div className="chronos-panel flex max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] sm:max-h-[min(100dvh-3rem,56rem)]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--chronos-border)] px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex items-start gap-4">
            <HourglassMark className="mt-1 h-12 w-12 sm:h-14 sm:w-14" />
            <div>
              <p className="chronos-kicker">ACCESS RITE // TIME DELAY</p>
              <h2 className="chronos-title mt-2 text-2xl font-semibold">Enter the time lock console.</h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--chronos-muted)]">
                This rite is deliberately inconvenient. The system is here to defend the lock, not comfort the part of you that wants to reverse it early.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-slate-500">
          {[1, 2, 3].map((index) => (
            <span
              key={index}
              className={`rounded-full px-3 py-1 ${
                step === index ? "bg-cyan-300 text-slate-950" : "bg-white/5 text-slate-400"
              }`}
            >
              Rite {index}
            </span>
          ))}
        </div>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </p>
        ) : null}

        {step === 1 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Service name</span>
              <input
                className={inputClassName}
                placeholder="Steam, PlayStation Network, Riot, ..."
                value={form.serviceName}
                onChange={(event) => setForm((current) => ({ ...current, serviceName: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Username or email</span>
              <input
                className={inputClassName}
                placeholder="focus@example.com"
                value={form.usernameOrEmail}
                onChange={(event) => setForm((current) => ({ ...current, usernameOrEmail: event.target.value }))}
              />
            </label>

            <div className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-200">Generated lockout password</span>
              <div className="mt-2 rounded-[1.75rem] border border-cyan-300/20 bg-cyan-300/8 p-4">
                <p className="text-sm leading-7 text-slate-200">
                  The console generates the replacement password for you. It stays hidden here until you copy it into the platform you are locking down.
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-base tracking-[0.38em] text-slate-200" aria-label="Generated password hidden">
                  •••••••••••••
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
                    onClick={() => {
                      handleCopyPassword().catch(() => {
                        setError("The console could not copy the generated password.");
                      });
                    }}
                  >
                    {GENERATED_PASSWORD_COPY_MESSAGE}
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:text-cyan-200 sm:min-h-0 sm:w-auto sm:py-2"
                    onClick={handleGenerateAnotherPassword}
                  >
                    {GENERATED_PASSWORD_REVEAL_LABEL}
                  </button>
                </div>
                <p className="mt-3 text-xs leading-6 text-slate-400">
                  10–15 characters with letters, numbers, and symbols. Copy it, paste it into the target account, then continue.
                </p>
                {passwordMessage ? (
                  <p className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
                    {passwordMessage}
                  </p>
                ) : null}
              </div>
            </div>

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-200">Optional note</span>
              <textarea
                className={`${inputClassName} min-h-28 resize-y`}
                placeholder="Why are you doing this? What are you protecting your future self from?"
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-200">Lock duration</span>
              <select
                className={inputClassName}
                value={form.durationValue}
                onChange={(event) => setForm((current) => ({ ...current, durationValue: event.target.value }))}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {form.durationValue === "custom" ? (
              <label className="block">
                <span className="text-sm font-medium text-slate-200">Custom unlock date</span>
                <input
                  type="datetime-local"
                  className={inputClassName}
                  value={form.customDate}
                  onChange={(event) => setForm((current) => ({ ...current, customDate: event.target.value }))}
                />
              </label>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                The time lock will refuse to reveal this LockIn until the timer has fully expired.
              </div>
            )}

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-200">
                {hasExistingPassphrase ? "Enter local passphrase" : "Choose local passphrase"}
              </span>
              <input
                type="password"
                className={inputClassName}
                placeholder="Never stored in plaintext. Required for reveal and backup."
                value={form.passphrase}
                onChange={(event) => setForm((current) => ({ ...current, passphrase: event.target.value }))}
              />
              <p className="mt-2 text-xs text-slate-500">{PASSPHRASE_HINT}</p>
            </label>

            {!hasExistingPassphrase ? (
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-200">Confirm passphrase</span>
                <input
                  type="password"
                  className={inputClassName}
                  placeholder="Repeat it now. Future you only gets one honest shot."
                  value={form.confirmPassphrase}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, confirmPassphrase: event.target.value }))
                  }
                />
              </label>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 rounded-[1.75rem] border border-amber-400/20 bg-amber-400/10 p-6 text-sm text-amber-50">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/80">Warning 1 · local-only risk</p>
            <h3 className="mt-3 text-xl font-semibold text-white">This device is the vault. That is both the feature and the risk.</h3>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-amber-50/90">
              <li>• The time lock stores encrypted data only on this device. No cloud copy exists.</li>
              <li>• Clearing browser data, uninstalling the app, or losing the device may erase everything.</li>
              <li>• If you forget the passphrase, the system cannot recover the secret for you.</li>
              <li>• This is not a password manager replacement. It is a commitment tool with sharp edges.</li>
            </ul>
          </div>
        ) : null}

        {step === 3 ? (
            <div className="mt-8 rounded-[1.75rem] border border-[var(--chronos-border-strong)] bg-[rgba(143,48,69,0.18)] p-6 text-sm text-[var(--chronos-ink)]">
              <p className="text-xs uppercase tracking-[0.28em] text-[var(--chronos-gold-strong)]">Final rite · temporal commitment</p>
              <h3 className="mt-3 text-xl font-semibold text-[var(--chronos-ink)]">This seal is meant to outlast your weak moment.</h3>
              <p className="mt-4 max-w-2xl leading-7 text-[var(--chronos-muted)]">
                Speak the line exactly. The gate only opens for a vow repeated in full, after the hourglass has turned.
              </p>
              <div className="mt-5 rounded-2xl border border-[var(--chronos-border)] bg-[rgba(247,217,149,0.06)] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--chronos-gold)]">Seal spoken before the gate opens</p>
                <p className="mt-2 break-words text-sm leading-7 text-[var(--chronos-ink)]">{COMMITMENT_PHRASE}</p>
              </div>
              <label className="mt-6 block">
                <span className="text-sm font-medium text-[var(--chronos-ink)]">Type the seal exactly as shown above</span>
                <input
                  className={inputClassName}
                  value={typedPhrase}
                  onChange={(event) => setTypedPhrase(event.target.value)}
                  placeholder="Repeat the line exactly"
                />
              </label>
<p className="mt-4 text-xs uppercase tracking-[0.24em] text-rose-200/80">Cooldown</p>
            <p className="mt-1 text-sm text-rose-50/80">
              Final confirmation unlocks in {cooldown}s. Sit with it for a moment.
            </p>
          </div>
        ) : null}

        </div>

        <div className="border-t border-white/8 px-4 py-4 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {step > 1 ? (
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:text-white sm:min-h-0 sm:w-auto"
                onClick={() => {
                  setError(null);
                  setStep((current) => (current === 3 ? 2 : 1));
                }}
              >
                Back
              </button>
            ) : null}

            {step < 3 ? (
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:min-h-0 sm:w-auto"
                onClick={() => {
                  try {
                    setError(null);
                    if (step === 1) {
                      validateStepOne();
                    }

                    if (step === 2) {
                      setTypedPhrase("");
                      setCooldown(FINAL_CONFIRM_DELAY_SECONDS);
                    }

                    setStep((current) => (current === 1 ? 2 : 3));
                  } catch (stepError) {
                    setError(stepError instanceof Error ? stepError.message : "Chronos cannot continue yet.");
                  }
                }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold tracking-[0.18em] text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200 sm:min-h-0 sm:w-auto"
                disabled={!canConfirm}
                onClick={handleFinalSubmit}
              >
                {pending ? "Encrypting LockIn..." : "LOCK IN"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export type { CreateLockInSubmission };
