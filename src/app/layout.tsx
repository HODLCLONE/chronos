import type { Metadata } from "next";
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
  appleWebApp: {
    capable: true,
    title: "Chronos",
    statusBarStyle: "black-translucent",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-[#04070f] text-slate-100">{children}</body>
    </html>
  );
}
