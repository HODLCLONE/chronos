import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chronos.hodlhq.app"),
  title: "Chronos",
  description:
    "Chronos is a local-first LockIn PWA that encrypts account credentials on-device and forces intentional friction before you can get them back.",
  applicationName: "Chronos",
  manifest: "/manifest.webmanifest",
  keywords: ["Chronos", "LockIn", "focus", "local-first", "PWA", "commitment tool"],
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/chronos-icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Chronos",
    statusBarStyle: "black-translucent",
    startupImage: ["/apple-touch-icon.png"],
  },
  openGraph: {
    title: "Chronos",
    description: "No cloud. No recovery. Just commitment.",
    url: "https://chronos.hodlhq.app",
    siteName: "Chronos",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Chronos",
    description: "Lock yourself out. Lock in.",
  },
};

export const viewport: Viewport = {
  themeColor: "#04070f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#04070f] text-slate-100">
        <div className="scan-line-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
