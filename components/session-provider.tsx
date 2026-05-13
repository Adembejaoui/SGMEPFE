"use client"

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import type { Session } from "next-auth"
import { Toaster } from "sonner"

interface SessionProviderProps {
  children: ReactNode
  session: Session | null
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
      <Toaster 
        position="top-right"
        richColors
        closeButton
      />
    </NextAuthSessionProvider>
  )
}
