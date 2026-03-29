import { beforeEach, describe, expect, it } from "vitest";

import { createPassphraseVerifier } from "@/lib/security/crypto";
import type { LockInEntry } from "@/lib/types";
import {
  clearAllChronosData,
  getAppMeta,
  getLockInById,
  getLockIns,
  replaceAllChronosData,
  saveAppMeta,
  saveLockIn,
} from "@/lib/storage/lockins";

const sampleEntry: LockInEntry = {
  id: "lock-1",
  serviceName: "PlayStation Network",
  usernameOrEmail: "f•••@e•••.com",
  encryptedSecretPayload: "ciphertext",
  encryptedNote: "note-ciphertext",
  createdAt: "2026-03-29T00:00:00.000Z",
  unlockAt: "2026-09-29T00:00:00.000Z",
  status: "locked",
  version: 1,
  encryption: {
    algorithm: "AES-GCM",
    keyDerivation: "PBKDF2",
    digest: "SHA-256",
    keyLength: 256,
    kdfIterations: 310000,
    salt: "salt",
    wrappedKey: "wrapped-key",
    wrappedKeyIv: "wrapped-key-iv",
    secretPayloadIv: "secret-payload-iv",
    noteIv: "note-iv",
  },
};

describe("lockin storage", () => {
  beforeEach(async () => {
    await clearAllChronosData();
  });

  it("saves and retrieves lockins from IndexedDB", async () => {
    await saveLockIn(sampleEntry);

    const entries = await getLockIns();
    const found = await getLockInById(sampleEntry.id);

    expect(entries).toHaveLength(1);
    expect(found?.serviceName).toBe(sampleEntry.serviceName);
  });

  it("saves meta and can replace the entire backup state", async () => {
    const passphraseVerifier = await createPassphraseVerifier("local-passphrase");

    await saveAppMeta({
      createdAt: "2026-03-29T00:00:00.000Z",
      passphraseVerifier,
      exportWarningAcknowledged: true,
    });

    await replaceAllChronosData({
      entries: [sampleEntry],
      meta: {
        createdAt: "2026-03-29T00:00:00.000Z",
        passphraseVerifier,
        exportWarningAcknowledged: true,
      },
    });

    const meta = await getAppMeta();
    const entries = await getLockIns();

    expect(meta?.passphraseVerifier.checksum).toBe(passphraseVerifier.checksum);
    expect(entries[0]?.id).toBe(sampleEntry.id);
  });
});
