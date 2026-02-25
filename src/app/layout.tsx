import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://shipper.wetruck.ai");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "WeTruck Shipper",
    template: "%s | WeTruck Shipper",
  },
  description:
    "Ship and manage your freight with WeTruck. Create shipments, track in real time, and manage containers from one place.",
  applicationName: "WeTruck Shipper",
  keywords: [
    "WeTruck",
    "shipper",
    "freight",
    "logistics",
    "shipments",
    "tracking",
  ],
  authors: [{ name: "WeTruck", url: "https://www.wetruck.ai" }],
  creator: "WeTruck",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en",
    url: appUrl,
    siteName: "WeTruck Shipper",
    title: "WeTruck Shipper",
    description:
      "Ship and manage your freight with WeTruck. Create shipments, track in real time, and manage containers from one place.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "WeTruck",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "WeTruck Shipper",
    description:
      "Ship and manage your freight with WeTruck. Create shipments, track in real time, and manage containers.",
    images: ["/icon.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

import { AuthProvider } from "@/components/providers/AuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { DocumentPreviewProvider } from "@/components/providers/DocumentPreviewProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <DocumentPreviewProvider>
                {children}
                <Toaster />
              </DocumentPreviewProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
