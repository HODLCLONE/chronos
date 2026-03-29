import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Chronos",
    short_name: "Chronos",
    description: "Local-first LockIn vault for intentional account lockouts.",
    start_url: "/",
    display: "standalone",
    background_color: "#04070f",
    theme_color: "#04070f",
    orientation: "portrait",
    categories: ["productivity", "utilities", "security"],
    icons: [
      {
        src: "/chronos-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
