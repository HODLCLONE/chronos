import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChronosBootSequence } from "@/components/chronos-boot-sequence";
import { CreateLockInFlow } from "@/components/create-lockin-flow";

describe("Chronos NERV-style time console pass", () => {
  it("shows the full confirmation sentence above the entry field", () => {
    const markup = renderToStaticMarkup(
      createElement(CreateLockInFlow, {
        hasExistingPassphrase: false,
        pending: false,
        onClose: () => undefined,
        onSubmit: async () => undefined,
        initialStep: 3,
      }),
    );

    expect(markup).toContain("Seal spoken before the gate opens");
    expect(markup).toContain("I understand this is meant to be hard to reverse");
    expect(markup).not.toContain("god of time");
    expect(markup).not.toContain("oath to Chronos");
  });

  it("renders a NERV-style temporal boot sequence", () => {
    const markup = renderToStaticMarkup(createElement(ChronosBootSequence, { visible: true }));

    expect(markup).toContain("SYSTEM BOOT // TIME GATE");
    expect(markup).toContain("TEMPORAL LOCK CONSOLE");
    expect(markup).toContain("chronos-hourglass");
    expect(markup).not.toContain("Temple clock engaged");
  });
});
