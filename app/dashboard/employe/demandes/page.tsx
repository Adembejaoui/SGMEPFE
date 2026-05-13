// ROLE: EMPLOYE — Can create and view own demandes

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DemandesEmployeClient } from '@/components/demandes/DemandesEmployeClient'

export default async function EmployeDemandesPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'EMPLOYE') {
    redirect('/')
  }

  return <DemandesEmployeClient />
}