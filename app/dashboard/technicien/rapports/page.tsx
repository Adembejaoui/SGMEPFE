// ROLE: TECHNICIEN — Reports page with two-pane layout

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RapportsTechnicienClient } from '@/components/rapports/RapportsTechnicienClient'

export default async function TechnicienRapportsPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'TECHNICIEN') {
    redirect('/')
  }

  return <RapportsTechnicienClient />
}
