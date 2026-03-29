import type { DurationOption } from "@/lib/types";

export const APP_NAME = "Chronos";
export const MODE_NAME = "LockIn";
export const COMMITMENT_PHRASE = "I understand this is meant to be hard to reverse";
export const PASSPHRASE_MIN_LENGTH = 12;
export const PASSPHRASE_HINT =
  "Use a phrase you can remember months from now. There is no cloud recovery.";
export const KDF_ITERATIONS = 310_000;
export const BACKUP_KDF_ITERATIONS = 350_000;
export const FINAL_CONFIRM_DELAY_SECONDS = 5;

export const DURATION_OPTIONS: DurationOption[] = [
  { label: "7 days", value: "7d", days: 7 },
  { label: "30 days", value: "30d", days: 30 },
  { label: "90 days", value: "90d", days: 90 },
  { label: "180 days", value: "180d", days: 180 },
  { label: "1 year", value: "365d", days: 365 },
  { label: "Custom date", value: "custom" },
];

export const REQUIRED_WARNINGS = [
  "Data is stored only on this device.",
  "Clearing browser data may erase everything.",
  "Losing this device may mean losing access permanently.",
  "There is no cloud recovery.",
  "Chronos is not a password manager replacement.",
  "This is a commitment tool.",
  "A technical user may still bypass local restrictions.",
];
