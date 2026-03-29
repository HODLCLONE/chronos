import { BACKUP_KDF_ITERATIONS, KDF_ITERATIONS } from "@/lib/constants";
import type {
  AppMeta,
  BackupEnvelope,
  BackupSnapshot,
  DecryptedLockInPayload,
  LockInEntry,
  PassphraseVerifier,
} from "@/lib/types";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function cryptoApi(): Crypto {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto is unavailable in this browser.");
  }

  return globalThis.crypto;
}

function randomBytes(length: number): Uint8Array {
  return cryptoApi().getRandomValues(new Uint8Array(length));
}

function toBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

async function sha256Base64(data: Uint8Array): Promise<string> {
  const digest = await cryptoApi().subtle.digest("SHA-256", toArrayBuffer(data));
  return toBase64(digest);
}

async function derivePassphraseBytes(
  passphrase: string,
  salt: string,
  iterations: number,
): Promise<Uint8Array> {
  const keyMaterial = await cryptoApi().subtle.importKey(
    "raw",
    toArrayBuffer(encoder.encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await cryptoApi().subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: toArrayBuffer(fromBase64(salt)),
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return new Uint8Array(bits);
}

async function derivePassphraseKey(
  passphrase: string,
  salt: string,
  iterations: number,
): Promise<CryptoKey> {
  const derived = await derivePassphraseBytes(passphrase, salt, iterations);
  return cryptoApi().subtle.importKey("raw", toArrayBuffer(derived), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encryptUtf8(
  key: CryptoKey,
  iv: Uint8Array,
  value: string,
): Promise<string> {
  const ciphertext = await cryptoApi().subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoder.encode(value)),
  );

  return toBase64(ciphertext);
}

async function decryptUtf8(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: string,
): Promise<string> {
  const plaintext = await cryptoApi().subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(fromBase64(ciphertext)),
  );

  return decoder.decode(plaintext);
}

async function encryptBytes(
  key: CryptoKey,
  iv: Uint8Array,
  value: Uint8Array,
): Promise<string> {
  const ciphertext = await cryptoApi().subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(value),
  );

  return toBase64(ciphertext);
}

async function decryptBytes(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: string,
): Promise<Uint8Array> {
  const plaintext = await cryptoApi().subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(fromBase64(ciphertext)),
  );

  return new Uint8Array(plaintext);
}

export function maskUsername(usernameOrEmail: string): string {
  if (!usernameOrEmail) {
    return "Hidden until unlock";
  }

  const [localPart, domain] = usernameOrEmail.split("@");
  if (domain) {
    const domainHead = domain.slice(0, 1);
    return `${localPart.slice(0, 1)}•••@${domainHead}•••`;
  }

  return `${usernameOrEmail.slice(0, 2)}•••`;
}

export async function createPassphraseVerifier(
  passphrase: string,
): Promise<PassphraseVerifier> {
  const salt = toBase64(randomBytes(16));
  const derived = await derivePassphraseBytes(passphrase, salt, KDF_ITERATIONS);

  return {
    salt,
    iterations: KDF_ITERATIONS,
    checksum: await sha256Base64(derived),
  };
}

export async function verifyPassphrase(
  passphrase: string,
  verifier: PassphraseVerifier,
): Promise<boolean> {
  const derived = await derivePassphraseBytes(
    passphrase,
    verifier.salt,
    verifier.iterations,
  );

  return (await sha256Base64(derived)) === verifier.checksum;
}

export async function encryptLockInPayload(input: {
  passphrase: string;
  usernameOrEmail: string;
  password: string;
  note?: string;
}): Promise<Pick<LockInEntry, "usernameOrEmail" | "encryptedSecretPayload" | "encryptedNote" | "encryption">> {
  const salt = toBase64(randomBytes(16));
  const wrappedKeyIv = randomBytes(12);
  const secretPayloadIv = randomBytes(12);
  const noteIv = input.note ? randomBytes(12) : undefined;

  const passphraseKey = await derivePassphraseKey(
    input.passphrase,
    salt,
    KDF_ITERATIONS,
  );

  // Security-sensitive path: the raw data key exists only in memory long enough
  // to wrap it with the passphrase-derived key and encrypt the payload.
  const dataKey = await cryptoApi().subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
  const rawDataKey = new Uint8Array(await cryptoApi().subtle.exportKey("raw", dataKey));

  const wrappedKey = await encryptBytes(passphraseKey, wrappedKeyIv, rawDataKey);
  const encryptedSecretPayload = await encryptUtf8(
    dataKey,
    secretPayloadIv,
    JSON.stringify({
      usernameOrEmail: input.usernameOrEmail,
      password: input.password,
    }),
  );
  const encryptedNote = input.note
    ? await encryptUtf8(dataKey, noteIv!, input.note)
    : undefined;

  return {
    usernameOrEmail: maskUsername(input.usernameOrEmail),
    encryptedSecretPayload,
    encryptedNote,
    encryption: {
      algorithm: "AES-GCM",
      keyDerivation: "PBKDF2",
      digest: "SHA-256",
      keyLength: 256,
      kdfIterations: KDF_ITERATIONS,
      salt,
      wrappedKey,
      wrappedKeyIv: toBase64(wrappedKeyIv),
      secretPayloadIv: toBase64(secretPayloadIv),
      noteIv: noteIv ? toBase64(noteIv) : undefined,
    },
  };
}

export async function decryptLockInPayload(
  entry: Pick<LockInEntry, "encryptedSecretPayload" | "encryptedNote" | "encryption">,
  passphrase: string,
): Promise<DecryptedLockInPayload> {
  try {
    const passphraseKey = await derivePassphraseKey(
      passphrase,
      entry.encryption.salt,
      entry.encryption.kdfIterations,
    );
    const rawDataKey = await decryptBytes(
      passphraseKey,
      fromBase64(entry.encryption.wrappedKeyIv),
      entry.encryption.wrappedKey,
    );
    const dataKey = await cryptoApi().subtle.importKey(
      "raw",
      toArrayBuffer(rawDataKey),
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );

    const secretPayload = JSON.parse(
      await decryptUtf8(
        dataKey,
        fromBase64(entry.encryption.secretPayloadIv),
        entry.encryptedSecretPayload,
      ),
    ) as { usernameOrEmail: string; password: string };

    const note = entry.encryptedNote && entry.encryption.noteIv
      ? await decryptUtf8(dataKey, fromBase64(entry.encryption.noteIv), entry.encryptedNote)
      : undefined;

    return {
      usernameOrEmail: secretPayload.usernameOrEmail,
      password: secretPayload.password,
      note,
    };
  } catch {
    throw new Error("Passphrase check failed. Chronos will not reveal this LockIn.");
  }
}

export async function createBackupBundle(
  snapshot: BackupSnapshot,
  passphrase: string,
): Promise<string> {
  const salt = toBase64(randomBytes(16));
  const iv = randomBytes(12);
  const key = await derivePassphraseKey(passphrase, salt, BACKUP_KDF_ITERATIONS);
  const ciphertext = await encryptUtf8(key, iv, JSON.stringify(snapshot));

  const envelope: BackupEnvelope = {
    version: "backup.v1",
    exportedAt: new Date().toISOString(),
    kdf: "PBKDF2",
    digest: "SHA-256",
    algorithm: "AES-GCM",
    iterations: BACKUP_KDF_ITERATIONS,
    salt,
    iv: toBase64(iv),
    ciphertext,
  };

  return JSON.stringify(envelope, null, 2);
}

export async function decryptBackupBundle(
  serialized: string,
  passphrase: string,
): Promise<BackupSnapshot> {
  let parsed: BackupEnvelope;

  try {
    parsed = JSON.parse(serialized) as BackupEnvelope;
  } catch {
    throw new Error("Backup file is unreadable.");
  }

  if (parsed.version !== "backup.v1") {
    throw new Error("Backup version is unsupported.");
  }

  try {
    const key = await derivePassphraseKey(passphrase, parsed.salt, parsed.iterations);
    const plaintext = await decryptUtf8(key, fromBase64(parsed.iv), parsed.ciphertext);
    return JSON.parse(plaintext) as BackupSnapshot;
  } catch {
    throw new Error("Backup decryption failed. Check the passphrase and file.");
  }
}

export function createFreshMeta(passphraseVerifier: PassphraseVerifier): AppMeta {
  return {
    createdAt: new Date().toISOString(),
    passphraseVerifier,
    exportWarningAcknowledged: false,
  };
}
