# Chronos V1 Internal Plan

Goal: Build a production-ready local-first PWA for intentional account lockouts, with all sensitive data encrypted client-side before local storage and never sent to a backend.

◆ Architecture
- Next.js App Router + TypeScript + Tailwind CSS.
- Static/local-first client app with no custom backend, no analytics, no secret-bearing network flows.
- Security-sensitive logic isolated in `src/lib/security/*`; IndexedDB persistence isolated in `src/lib/storage/*`.
- PWA via service worker + manifest for installability and offline shell support.

◆ Encryption model
- Required user passphrase never stored in plaintext.
- Derive a key-encryption key from passphrase using PBKDF2/SHA-256 with per-entry salt and high iteration count.
- Generate a random AES-GCM data key per entry.
- Encrypt secret payload and optional note with AES-GCM using random IVs.
- Wrap the data key with the passphrase-derived key; store only ciphertext, salts, IVs, algorithm metadata, timestamps, and version.
- Export/import uses the same browser-local crypto flow. No server round trips.

◆ Storage model
- IndexedDB stores encrypted LockIn entries, app settings, and encrypted export metadata only.
- Entry shape: id, serviceName, usernameOrEmail, encryptedSecretPayload, optional encryptedNote, createdAt, unlockAt, status, encryption metadata, version.
- No plaintext secrets at rest. Avoid localStorage for secrets.

◆ UX flow
- Dashboard: active/expired entries, countdowns, warnings, install prompt, backup entry point.
- Create flow: 3 steps exactly.
  1. Credentials + duration + passphrase entry.
  2. Warning screen for local-only/data-loss risks.
  3. Commitment screen with typed sentence + forced delay before confirm.
- Detail view: masked by default, unlock only after expiry with passphrase, explicit reveal/copy actions.
- Export/import: strong irreversible-risk copy and explicit file handling.

◆ Friction model
- Intentionally serious copy, no convenience language.
- Two warning gates before lock creation.
- Typed confirmation phrase and 5s cooldown before final lock button.
- Reveal is easier after unlock time, but still requires passphrase and explicit actions.
- No early unlock in V1 unless safety remains intact. Default plan: omit break-glass to preserve local-only trust model and avoid weakening the commitment loop.

◆ Verification focus
- Unit-test crypto round trips and storage adapters.
- Build and lint cleanly.
- Inspect client code for accidental secret logging/network use.
- Deploy to Vercel, attach `chronos.hodlhq.app`, and verify production app behavior.
