// ROLE: ADMIN — Can view all demandes, filter, update status, and delete

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DemandesAdminClient } from '@/components/demandes/DemandesAdminClient'

export default async function AdminDemandesPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return <DemandesAdminClient />
}