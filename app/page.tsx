import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Force dynamic rendering - don't cache this page
export const dynamic = "force-dynamic"

export default async function Home() {
  const session = await auth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              Système de Gestion de Maintenance d'Équipement
            </CardTitle>
            <CardDescription>
              Bienvenue sur la plateforme SGME
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {session?.user ? (
              <div className="grid gap-4">
                <div className="flex items-center gap-4 justify-center">
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="h-16 w-16 rounded-full"
                    />
                  )}
                  <div className="text-center">
                    <p className="font-medium">{session.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <form
                  action={async () => {
                    "use server"
                    await signOut({ redirectTo: "/login" })
                  }}
                >
                  <Button type="submit" variant="destructive" className="w-full">
                    Sign out
                  </Button>
                </form>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Veuillez vous connecter pour accéder à la plateforme.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button>
                    <a href="/login">Se connecter</a>
                  </Button>
                  <Button variant="outline">
                    <a href="/register">S'inscrire</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
