import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { UsersAdminClient } from "@/components/admin/UsersAdminClient"

export default async function UserListPage() {
  const session = await auth()

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
    }
  })

  return <UsersAdminClient initialUsers={users as any} />
}
