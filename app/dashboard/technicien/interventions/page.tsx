// ROLE: TECHNICIEN — Can view interventions for claimed demandes

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InterventionsTechnicienClient } from '@/components/interventions/InterventionsTechnicienClient'

export default async function TechnicienInterventionsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'TECHNICIEN') {
    redirect('/')
  }

  return <InterventionsTechnicienClient />
}