import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChronosApp } from "@/components/chronos-app";
import { CreateLockInFlow } from "@/components/create-lockin-flow";

describe("Chronos mobile-first UI", () => {
  it("uses LOCK IN as the primary creation CTA copy", () => {
    const markup = renderToStaticMarkup(createElement(ChronosApp));

    expect(markup).toContain(">LOCK IN<");
    expect(markup).not.toContain(">Create LockIn<");
  });

  it("renders the create flow as a scrollable mobile-first sheet", () => {
    const markup = renderToStaticMarkup(
      createElement(CreateLockInFlow, {
        hasExistingPassphrase: false,
        pending: false,
        onClose: () => undefined,
        onSubmit: async () => undefined,
      }),
    );

    expect(markup).toContain("overflow-y-auto");
    expect(markup).toContain("items-end sm:items-center");
    expect(markup).toContain("max-h-[calc(100dvh-1.5rem)]");
    expect(markup).toContain("rounded-t-[2rem] sm:rounded-[2rem]");
  });
});
