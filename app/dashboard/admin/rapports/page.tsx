// ROLE: ADMIN — Admin reports page to view all reports system-wide

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RapportsAdminClient } from '@/components/rapports/RapportsAdminClient'

export default async function AdminRapportsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  return <RapportsAdminClient />
}
