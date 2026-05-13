// ROLE: ADMIN — Admin view of intervention details (read-only)

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InterventionDetailAdminClient } from '@/components/interventions/InterventionDetailAdminClient'

export default async function AdminInterventionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const { id } = await params
  const idIntervention = parseInt(id, 10)

  if (isNaN(idIntervention)) {
    redirect('/dashboard/admin/rapports')
  }

  // Fetch the intervention data (same as technician endpoint but for admin)
  // We'll fetch in the client component to reuse the same API
  return <InterventionDetailAdminClient interventionId={idIntervention} />
}
