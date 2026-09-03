// =============================================================================
// ADMIN USER DETAIL PAGE - SGME
// =============================================================================
// This page displays the details of a single user.
// Only administrators can access this page.
// =============================================================================

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UserDetailClient } from "./UserDetailClient"

export default async function AdminUserDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/")
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      specialization: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) {
    redirect("/dashboard/admin/users")
  }

  return <UserDetailClient user={user} />
}
