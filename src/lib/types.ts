export type LockStatus = "locked" | "ready";

export type EncryptionMetadata = {
  algorithm: "AES-GCM";
  keyDerivation: "PBKDF2";
  digest: "SHA-256";
  keyLength: 256;
  kdfIterations: number;
  salt: string;
  wrappedKey: string;
  wrappedKeyIv: string;
  secretPayloadIv: string;
  noteIv?: string;
};

export type LockInEntry = {
  id: string;
  serviceName: string;
  usernameOrEmail: string;
  encryptedSecretPayload: string;
  encryptedNote?: string;
  createdAt: string;
  unlockAt: string;
  status: LockStatus;
  encryption: EncryptionMetadata;
  version: 1;
};

export type DecryptedLockInPayload = {
  usernameOrEmail: string;
  password: string;
  note?: string;
};

export type PassphraseVerifier = {
  salt: string;
  iterations: number;
  checksum: string;
};

export type AppMeta = {
  createdAt: string;
  passphraseVerifier: PassphraseVerifier;
  exportWarningAcknowledged: boolean;
};

export type BackupSnapshot = {
  entries: LockInEntry[];
  meta: AppMeta;
};

export type BackupEnvelope = {
  version: "backup.v1";
  exportedAt: string;
  kdf: "PBKDF2";
  digest: "SHA-256";
  algorithm: "AES-GCM";
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
};

export type DurationOption = {
  label: string;
  value: string;
  days?: number;
};
