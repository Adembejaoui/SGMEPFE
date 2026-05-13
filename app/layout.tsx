import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { auth } from "@/lib/auth"
import { SessionProvider } from "@/components/session-provider"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// Force dynamic rendering - always fetch session fresh
export const dynamic = "force-dynamic"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "SGME - Système de Gestion de Maintenance d'Équipement",
  description: "Plateforme de gestion de maintenance d'équipement",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get the current session on the server
  const session = await auth()

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
