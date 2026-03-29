# Chronos

Chronos is a local-first PWA for intentional account lockouts.

The product mode is called LockIn.

Chronos is not trying to be convenient. It is trying to help someone keep a promise to themselves by making impulsive reversal slower, more deliberate, and more emotionally explicit.

Primary use case: lock away credentials for something distracting — gaming, social, entertainment, or any account you do not want to access for a defined stretch of time — without deleting the account.

Live target: https://chronos.hodlhq.app

## Product overview

Chronos lets a user create a LockIn entry with:
- service name
- username or email hint
- encrypted secret payload
- optional encrypted note
- unlock date

The app then stores the encrypted record only on the current device and refuses to reveal it until the lock expires.

After expiry, reveal still requires the local passphrase.

## Core principle

Chronos is a commitment tool.

It is supposed to introduce friction.

That means:
- multi-step lock creation
- explicit warnings
- typed commitment language
- forced cooldown before final confirmation
- no convenience-first undo path
- no early unlock shortcut in V1

## Local-first explanation

Chronos V1 is local-only by design.

There is:
- no user account system
- no backend secret storage
- no cloud sync
- no analytics pipeline touching secrets
- no server-side reveal flow

Sensitive data is encrypted in the browser before it is written to IndexedDB.

The server only delivers static application code.

## Security model

Chronos uses browser-native Web Crypto APIs.

### Passphrase model

Chronos requires a local passphrase.

The passphrase is:
- never stored in plaintext
- used for key derivation
- required for reveal
- required for encrypted backup export/import

Chronos stores only a verifier derived from the passphrase, not the passphrase itself.

### Entry encryption model

For each LockIn entry:
1. Chronos derives a passphrase key using PBKDF2 + SHA-256 with a per-entry salt.
2. Chronos generates a random AES-GCM data key.
3. Chronos encrypts the secret payload with that data key.
4. Chronos wraps the data key with the passphrase-derived key.
5. Chronos stores only ciphertext + encryption metadata.

This means secrets never exist in plaintext at rest.

### Backup encryption model

Export creates an encrypted backup file locally.

The export bundle contains encrypted JSON protected with the local passphrase. Import decrypts the file locally and restores the snapshot into IndexedDB.

No server interaction is required for export or import.

## Storage model

Chronos stores data in IndexedDB with two logical buckets:

- `lockins` — encrypted LockIn entries
- `meta` — app-level passphrase verifier and small local settings

Each entry includes:
- `id`
- `serviceName`
- `usernameOrEmail` (stored as a masked hint)
- `encryptedSecretPayload`
- optional `encryptedNote`
- `createdAt`
- `unlockAt`
- `status`
- `encryption` metadata
- `version`

The actual username/email and password are stored inside the encrypted payload.

## Risks of data loss

Chronos is intentionally honest about this part.

You can lose data if:
- browser storage is cleared
- the device is lost or wiped
- the local passphrase is forgotten
- the user never exported a backup
- the encrypted backup file is lost or corrupted

There is no cloud recovery.

That is not an omission. It is part of the trust model.

## Export/import explanation

### Export

Export requires the local passphrase.

Chronos:
- reads the encrypted local snapshot
- encrypts the full backup bundle locally
- downloads an encrypted JSON file to the device

### Import

Import requires:
- the encrypted backup file
- the passphrase used to decrypt it
- explicit confirmation that local data will be replaced

Chronos decrypts the file locally and restores the snapshot into IndexedDB.

## Why Chronos is not a password manager

Chronos should not replace a real password manager.

It is missing password-manager responsibilities on purpose:
- no autofill
- no sync
- no vault recovery
- no account management
- no browser extension
- no convenience-focused UX

A password manager optimizes access.
Chronos optimizes restraint.

## Trust limitations

Chronos helps with impulsive behavior. It does not promise invulnerability.

Users should understand:
- technical users may bypass local restrictions
- browser storage can be inspected or destroyed
- a compromised device can compromise local data
- this app is primarily behavioral friction, not absolute custody

The honest claim is:
Chronos makes reversal annoying, slower, and more deliberate for the same user on the same device.

## Friction philosophy

Lock creation is a three-step process:

1. enter the credentials and choose a duration
2. acknowledge local-only and data-loss risk
3. acknowledge the commitment and type the confirmation sentence

The final button stays disabled during a forced cooldown.

This is intentional.

The reveal flow is less annoying after expiry because the user earned it, but Chronos still requires the passphrase and still avoids automatic exposure behaviors.

## Feature set in V1

- local-first Next.js PWA
- create LockIn entries
- fixed durations + custom date
- dashboard with countdowns and unlock dates
- detail view per LockIn
- reveal only after expiry
- masked-by-default secrets
- explicit copy actions only
- delete encrypted entry
- encrypted export/import
- offline-capable shell via service worker
- installable PWA manifest

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- IndexedDB via `idb`
- Web Crypto API
- Vitest for crypto/storage tests

## Development

```bash
npm install
npm run dev
```

### Test

```bash
npm test
```

### Lint

```bash
npm run lint
```

### Production build

```bash
npm run build
npm run start
```

## Code layout

- `src/components` — UI and client flows
- `src/lib/security` — crypto and backup logic
- `src/lib/storage` — IndexedDB persistence
- `src/lib/time.ts` — countdown and date utilities
- `src/app` — app routes, manifest, layout
- `public/sw.js` — offline shell service worker

## Future roadmap

Possible future work, if it can stay consistent with the local-only model:

- passphrase rotation with local re-encryption
- stronger backup management UX
- richer countdown views
- optional printable recovery instructions
- accessibility hardening and keyboard-only flow improvements
- more deliberate anti-bypass friction for highly committed users

## Non-goals

Chronos V1 does not include:
- cloud sync
- login/accounts
- social features
- browser extension support
- wallets or token tooling
- AI touching secrets
- monetization logic

## Final note

Chronos is for the moment when someone knows convenience is the enemy.

No cloud. No recovery. Just commitment.
