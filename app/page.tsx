import Link from "next/link"
import { auth, signOut } from "@/lib/auth"

import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await auth()

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Système de Gestion de Maintenance d&apos;Équipement
          </h1>

          <p className="text-lg text-muted-foreground">
            Gérez vos équipements, demandes de maintenance et interventions
            facilement avec la plateforme SGME.
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            {session?.user ? (
              <>
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Dashboard
                  </Link>
                </Button>

                <form
                  action={async () => {
                    "use server"
                    await signOut({
                      redirectTo: "/login",
                    })
                  }}
                >
                  <Button
                    type="submit"
                    variant="destructive"
                    size="lg"
                  >
                    Logout
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  disabled
                  className="cursor-not-allowed opacity-60"
                >
                  Dashboard
                </Button>

                <Button asChild size="lg" variant="outline">
                  <Link href="/login">
                    Login
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}