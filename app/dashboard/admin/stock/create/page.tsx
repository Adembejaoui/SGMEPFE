// =============================================================================
// STOCK CREATE PAGE - SGME
// =============================================================================
// Server component for creating new materials.
// =============================================================================

import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { MaterielForm } from "@/components/stock/MaterielForm"

async function getAdmins() {
  const users = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true, firstName: true, lastName: true },
    orderBy: { firstName: "asc" },
  })
  return users
}

export default async function StockCreatePage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const users = await getAdmins()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Nouveau matériel</h1>
          <p className="text-muted-foreground">
            Créez une entrée dans le stock
          </p>
        </div>
      </div>

      <div className="max-w-3xl">
        <MaterielForm users={users} />
      </div>
    </div>
  )
}
