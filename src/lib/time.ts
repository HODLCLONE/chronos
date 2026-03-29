import { addDays, formatDistanceStrict, isPast, parseISO } from "date-fns";

import { DURATION_OPTIONS } from "@/lib/constants";

export function resolveUnlockAt(durationValue: string, customDate?: string): string {
  if (durationValue === "custom") {
    if (!customDate) {
      throw new Error("Choose a custom unlock date.");
    }

    const parsed = new Date(customDate);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Choose a valid unlock date.");
    }

    return parsed.toISOString();
  }

  const option = DURATION_OPTIONS.find((entry) => entry.value === durationValue);
  if (!option?.days) {
    throw new Error("Choose a supported lock duration.");
  }

  return addDays(new Date(), option.days).toISOString();
}

export function getLockStatus(unlockAt: string): "locked" | "ready" {
  return isPast(parseISO(unlockAt)) ? "ready" : "locked";
}

export function formatUnlockDate(unlockAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(unlockAt));
}

export function formatCountdown(unlockAt: string, now = new Date()): string {
  const unlockDate = parseISO(unlockAt);
  if (unlockDate <= now) {
    return "Unlock window open";
  }

  return formatDistanceStrict(unlockDate, now, { addSuffix: true });
}

export function statusTone(unlockAt: string): "ready" | "locked" {
  return getLockStatus(unlockAt);
}
