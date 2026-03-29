import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PwaInstallPrompt } from "@/components/pwa-install-prompt";

describe("Chronos PWA shell", () => {
  it("shows installed and offline-ready status when the app is already installed", () => {
    const markup = renderToStaticMarkup(
      createElement(PwaInstallPrompt, {
        testState: {
          installed: true,
          online: false,
          canInstall: false,
          isIos: false,
          isSafari: false,
          dismissed: false,
        },
      }),
    );

    expect(markup).toContain("Installed on this device");
    expect(markup).toContain("Offline-ready shell active");
    expect(markup).not.toContain("Install app");
  });

  it("shows manual install guidance for iPhone Safari when no browser install event exists", () => {
    const markup = renderToStaticMarkup(
      createElement(PwaInstallPrompt, {
        testState: {
          installed: false,
          online: true,
          canInstall: false,
          isIos: true,
          isSafari: true,
          dismissed: false,
        },
      }),
    );

    expect(markup).toContain("Add to Home Screen");
    expect(markup).toContain("Share");
    expect(markup).not.toContain("Install app");
  });
});
