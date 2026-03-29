import { describe, expect, it } from "vitest";

import {
  createBackupBundle,
  createPassphraseVerifier,
  decryptBackupBundle,
  decryptLockInPayload,
  encryptLockInPayload,
  maskUsername,
  verifyPassphrase,
} from "@/lib/security/crypto";

const passphrase = "LockIn for 180 disciplined days";

describe("security crypto", () => {
  it("creates and verifies a passphrase verifier without storing plaintext", async () => {
    const verifier = await createPassphraseVerifier(passphrase);

    expect(verifier.checksum).toBeTruthy();
    expect(verifier.salt).toBeTruthy();
    expect(await verifyPassphrase(passphrase, verifier)).toBe(true);
    expect(await verifyPassphrase("wrong passphrase", verifier)).toBe(false);
  });

  it("encrypts and decrypts a lock payload with AES-GCM metadata", async () => {
    const encrypted = await encryptLockInPayload({
      passphrase,
      usernameOrEmail: "focus@example.com",
      password: "super-secret",
      note: "Do not touch until the exam is done.",
    });

    expect(encrypted.encryptedSecretPayload).not.toContain("super-secret");
    expect(encrypted.usernameOrEmail).toContain("@");
    expect(encrypted.usernameOrEmail).not.toBe("focus@example.com");

    const decrypted = await decryptLockInPayload(encrypted, passphrase);

    expect(decrypted.usernameOrEmail).toBe("focus@example.com");
    expect(decrypted.password).toBe("super-secret");
    expect(decrypted.note).toBe("Do not touch until the exam is done.");
  });

  it("encrypts and decrypts a local backup bundle", async () => {
    const backup = await createBackupBundle(
      {
        entries: [
          {
            id: "entry-1",
            serviceName: "Steam",
            usernameOrEmail: maskUsername("focus@example.com"),
            encryptedSecretPayload: "ciphertext",
            encryptedNote: "note-cipher",
            createdAt: "2026-03-29T00:00:00.000Z",
            unlockAt: "2026-06-29T00:00:00.000Z",
            status: "locked",
            version: 1,
            encryption: {
              algorithm: "AES-GCM",
              keyDerivation: "PBKDF2",
              digest: "SHA-256",
              keyLength: 256,
              kdfIterations: 310000,
              salt: "salt",
              wrappedKey: "wrapped",
              wrappedKeyIv: "wrapped-iv",
              secretPayloadIv: "secret-iv",
              noteIv: "note-iv",
            },
          },
        ],
        meta: {
          passphraseVerifier: await createPassphraseVerifier(passphrase),
          createdAt: "2026-03-29T00:00:00.000Z",
          exportWarningAcknowledged: true,
        },
      },
      passphrase,
    );

    expect(backup).toContain("backup.v1");
    expect(backup).not.toContain("Steam");

    const restored = await decryptBackupBundle(backup, passphrase);

    expect(restored.entries).toHaveLength(1);
    expect(restored.entries[0]?.serviceName).toBe("Steam");
  });
});
