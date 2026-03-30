import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChronosApp } from "@/components/chronos-app";
import { LockInEntryCard } from "@/components/lockin-entry-card";
import type { LockInEntry } from "@/lib/types";

const sampleEntry: LockInEntry = {
  id: "lock-1",
  serviceName: "PlayStation Network",
  usernameOrEmail: "f•••@e•••.com",
  encryptedSecretPayload: "ciphertext",
  encryptedNote: "note-ciphertext",
  createdAt: "2026-03-29T00:00:00.000Z",
  unlockAt: "2099-09-29T00:00:00.000Z",
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

describe("Chronos console depth pass", () => {
  it("adds command-block, scanner-grid, and hex scanner treatment to core app surfaces", () => {
    const markup = renderToStaticMarkup(createElement(ChronosApp));

    expect(markup).toContain("command-block");
    expect(markup).toContain("scanner-grid");
    expect(markup).toContain("hex-scanner");
    expect(markup).toContain("MEASURED CONSTRAINTS");
  });

  it("renders lock cards with denser console identifiers", () => {
    const markup = renderToStaticMarkup(createElement(LockInEntryCard, { entry: sampleEntry }));

    expect(markup).toContain("SIGNAL ID");
    expect(markup).toContain("LOCK VECTOR");
    expect(markup).toContain("command-block");
  });

  it("renders reveal and archive surfaces with table-style operations console labels", () => {
    const markup = renderToStaticMarkup(createElement(ChronosApp));

    expect(markup).toContain("ARCHIVE COMMAND BLOCK");
    expect(markup).toContain("REVEAL AUTH GATE");
    expect(markup).toContain("SECRET READOUT");
  });
});
