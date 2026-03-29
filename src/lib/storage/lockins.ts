import { openDB } from "idb";

import { getLockStatus } from "@/lib/time";
import type { AppMeta, BackupSnapshot, LockInEntry } from "@/lib/types";

type ChronosDB = {
  lockins: {
    key: string;
    value: LockInEntry;
  };
  meta: {
    key: string;
    value: AppMeta;
  };
};

const DB_NAME = "chronos-lockin";
const DB_VERSION = 1;
const META_KEY = "app-meta";

async function getDb() {
  return openDB<ChronosDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("lockins")) {
        db.createObjectStore("lockins", { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta");
      }
    },
  });
}

function withResolvedStatus(entry: LockInEntry): LockInEntry {
  return {
    ...entry,
    status: getLockStatus(entry.unlockAt),
  };
}

export async function saveLockIn(entry: LockInEntry): Promise<void> {
  const db = await getDb();
  await db.put("lockins", entry);
}

export async function getLockIns(): Promise<LockInEntry[]> {
  const db = await getDb();
  const entries = await db.getAll("lockins");

  return entries
    .map(withResolvedStatus)
    .sort((left, right) => new Date(left.unlockAt).getTime() - new Date(right.unlockAt).getTime());
}

export async function getLockInById(id: string): Promise<LockInEntry | undefined> {
  const db = await getDb();
  const entry = await db.get("lockins", id);

  return entry ? withResolvedStatus(entry) : undefined;
}

export async function deleteLockIn(id: string): Promise<void> {
  const db = await getDb();
  await db.delete("lockins", id);
}

export async function saveAppMeta(meta: AppMeta): Promise<void> {
  const db = await getDb();
  await db.put("meta", meta, META_KEY);
}

export async function getAppMeta(): Promise<AppMeta | undefined> {
  const db = await getDb();
  return db.get("meta", META_KEY);
}

export async function replaceAllChronosData(snapshot: BackupSnapshot): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["lockins", "meta"], "readwrite");

  await tx.objectStore("lockins").clear();
  await tx.objectStore("meta").clear();

  for (const entry of snapshot.entries) {
    await tx.objectStore("lockins").put(entry);
  }

  await tx.objectStore("meta").put(snapshot.meta, META_KEY);
  await tx.done;
}

export async function clearAllChronosData(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(["lockins", "meta"], "readwrite");
  await tx.objectStore("lockins").clear();
  await tx.objectStore("meta").clear();
  await tx.done;
}

export async function exportChronosSnapshot(): Promise<BackupSnapshot> {
  const [entries, meta] = await Promise.all([getLockIns(), getAppMeta()]);

  if (!meta) {
    throw new Error("Set a passphrase before exporting.");
  }

  return { entries, meta };
}
