import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { EquipementCreateForm } from "@/components/equipements/EquipementCreateForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CreateEquipmentPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true, firstName: true, lastName: true },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/equipment">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajouter un équipement</h1>
          <p className="text-muted-foreground">Créez un nouvel équipement dans le système</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations de l'équipement</CardTitle>
          <CardDescription>Remplissez tous les champs obligatoires</CardDescription>
        </CardHeader>
        <CardContent>
          <EquipementCreateForm users={users} />
        </CardContent>
      </Card>
    </div>
  )
}