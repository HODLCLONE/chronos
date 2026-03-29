import { describe, expect, it } from "vitest";

import {
  GENERATED_PASSWORD_MAX_LENGTH,
  GENERATED_PASSWORD_MIN_LENGTH,
  GENERATED_PASSWORD_PATTERN,
  generateLockInPassword,
} from "@/lib/passwords";

describe("generated lockin passwords", () => {
  it("creates passwords within the supported length and charset window", () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const password = generateLockInPassword();

      expect(password.length).toBeGreaterThanOrEqual(GENERATED_PASSWORD_MIN_LENGTH);
      expect(password.length).toBeLessThanOrEqual(GENERATED_PASSWORD_MAX_LENGTH);
      expect(password).toMatch(GENERATED_PASSWORD_PATTERN);
    }
  });

  it("always includes letters, numbers, and special characters", () => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      const password = generateLockInPassword();

      expect(password).toMatch(/[A-Za-z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    }
  });
});
