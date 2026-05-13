// ROLE: TECHNICIEN — Can view assigned demandes and update status

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DemandesTechnicienClient } from '@/components/demandes/DemandesTechnicienClient'

export default async function TechnicienDemandesPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'TECHNICIEN') {
    redirect('/')
  }

  return <DemandesTechnicienClient />
}