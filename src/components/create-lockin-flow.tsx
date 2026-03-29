"use client";

import { useEffect, useMemo, useState } from "react";

import {
  COMMITMENT_PHRASE,
  DURATION_OPTIONS,
  FINAL_CONFIRM_DELAY_SECONDS,
  MODE_NAME,
  PASSPHRASE_HINT,
  PASSPHRASE_MIN_LENGTH,
} from "@/lib/constants";

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
};

const initialState: CreateLockInSubmission = {
  serviceName: "",
  usernameOrEmail: "",
  password: "",
  note: "",
  durationValue: DURATION_OPTIONS[2]?.value ?? "90d",
  customDate: "",
  passphrase: "",
  confirmPassphrase: "",
};

export function CreateLockInFlow({ hasExistingPassphrase, pending, onClose, onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [typedPhrase, setTypedPhrase] = useState("");
  const [cooldown, setCooldown] = useState(FINAL_CONFIRM_DELAY_SECONDS);
  const [form, setForm] = useState<CreateLockInSubmission>(initialState);

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

  function validateStepOne() {
    if (!form.serviceName.trim()) {
      throw new Error("Name the service you are locking away.");
    }

    if (!form.usernameOrEmail.trim()) {
      throw new Error("Enter the username or email tied to the account.");
    }

    if (!form.password.trim()) {
      throw new Error("Enter the secret you want Chronos to encrypt.");
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
    "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 px-4 py-6 backdrop-blur sm:items-center">
      <div className="w-full max-w-3xl rounded-[2rem] border border-white/10 bg-[#070b14] p-6 shadow-[0_30px_140px_rgba(0,0,0,0.45)] sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-cyan-200/70">Create {MODE_NAME}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Lock yourself out. Lock in.</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              Chronos is deliberately inconvenient. It is trying to help you keep a promise, not help you change your mind quickly.
            </p>
          </div>
          <button
            type="button"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/25 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mt-6 flex gap-3 text-xs uppercase tracking-[0.22em] text-slate-500">
          {[1, 2, 3].map((index) => (
            <span
              key={index}
              className={`rounded-full px-3 py-1 ${
                step === index ? "bg-cyan-300 text-slate-950" : "bg-white/5 text-slate-400"
              }`}
            >
              Step {index}
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

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-200">Password or secret</span>
              <input
                type="password"
                className={inputClassName}
                placeholder="Stored encrypted. Never sent anywhere."
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

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
                Chronos will refuse to reveal this LockIn until the timer has fully expired.
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
              <li>• Chronos stores encrypted data only on this device. No cloud copy exists.</li>
              <li>• Clearing browser data, uninstalling the app, or losing the device may erase everything.</li>
              <li>• If you forget the passphrase, Chronos cannot recover the secret for you.</li>
              <li>• This is not a password manager replacement. It is a commitment tool with sharp edges.</li>
            </ul>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-8 rounded-[1.75rem] border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-50">
            <p className="text-xs uppercase tracking-[0.28em] text-rose-200/85">Warning 2 · commitment</p>
            <h3 className="mt-3 text-xl font-semibold text-white">This is supposed to be hard to undo.</h3>
            <p className="mt-4 max-w-2xl leading-7 text-rose-50/90">
              You are deliberately creating friction for your future self. Chronos will make reveal annoying now so your goals have room to breathe later.
            </p>
            <label className="mt-6 block">
              <span className="text-sm font-medium text-rose-100">Type the confirmation sentence exactly</span>
              <input
                className={inputClassName}
                value={typedPhrase}
                onChange={(event) => setTypedPhrase(event.target.value)}
                placeholder={COMMITMENT_PHRASE}
              />
            </label>
            <p className="mt-4 text-xs uppercase tracking-[0.24em] text-rose-200/80">Cooldown</p>
            <p className="mt-1 text-sm text-rose-50/80">
              Final confirmation unlocks in {cooldown}s. Sit with it for a moment.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          {step > 1 ? (
            <button
              type="button"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:text-white"
              onClick={() => {
                setError(null);
                setStep((current) => current - 1);
              }}
            >
              Back
            </button>
          ) : null}

          {step < 3 ? (
            <button
              type="button"
              className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
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

                  setStep((current) => current + 1);
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
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-slate-500 disabled:text-slate-200"
              disabled={!canConfirm}
              onClick={handleFinalSubmit}
            >
              {pending ? "Encrypting LockIn..." : "Create LockIn"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export type { CreateLockInSubmission };
