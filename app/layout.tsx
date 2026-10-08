import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AppWrapper } from "@/components/app-wrapper"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const siteUrl = "https://pitokenexplorer.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pi Token Explorer | Pi Network Token & Liquidity Explorer",
    template: "%s | Pi Token Explorer",
  },
  description:
    "Pi Token Explorer is built by W3C Digital Network to help users explore Pi Network tokens with live token prices, liquidity, market data, and ecosystem information.",
  applicationName: "Pi Token Explorer",
  keywords: [
    "Pi Token Explorer",
    "Pi Network tokens",
    "Pi ecosystem",
    "Pi Network",
    "Pi liquidity",
    "Pi token prices",
    "Pi token market data",
    "Pi ecosystem explorer",
    "Pi blockchain",
  ],
  authors: [{ name: "W3C Digital Network" }],
  creator: "W3C Digital Network",
  publisher: "W3C Digital Network",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [
      {
        rel: "icon",
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        rel: "icon",
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Pi Token Explorer",
    title: "Pi Token Explorer | Pi Network Token & Liquidity Explorer",
    description:
      "Explore Pi Network tokens, prices, liquidity, and ecosystem market data in one place.",
  },
  twitter: {
    card: "summary",
    title: "Pi Token Explorer | Pi Network Token & Liquidity Explorer",
    description:
      "Explore Pi Network tokens, prices, liquidity, and ecosystem market data.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans">
        <AppWrapper>{children}</AppWrapper>
      </body>
    </html>
  )
}
