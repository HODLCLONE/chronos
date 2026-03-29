import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Chronos",
    short_name: "Chronos",
    description: "Local-first LockIn vault for intentional account lockouts.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "window-controls-overlay"],
    background_color: "#04070f",
    theme_color: "#04070f",
    orientation: "portrait",
    categories: ["productivity", "utilities", "security"],
    shortcuts: [
      {
        name: "New LockIn",
        short_name: "New LockIn",
        description: "Open Chronos and create a fresh LockIn.",
        url: "/?action=new-lockin",
      },
      {
        name: "Vault",
        short_name: "Vault",
        description: "Jump straight into the local LockIn vault.",
        url: "/#vault",
      },
    ],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/chronos-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
