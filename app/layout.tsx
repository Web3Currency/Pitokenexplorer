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
    "Explore Pi Network tokens with live token prices, liquidity, market data, and ecosystem information. Search and discover Pi ecosystem assets with liquidity pools.",
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
