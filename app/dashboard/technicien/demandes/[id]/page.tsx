// ROLE: TECHNICIEN — View demande details and update status

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { DemandeWithRelations } from '@/types/demande'
import { DemandeTechnicienDetailClient } from './DemandeTechnicienDetailClient'

export default async function TechnicienDemandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'TECHNICIEN') {
    redirect('/')
  }

  const { id } = await params
  const idDemande = parseInt(id, 10)
  if (isNaN(idDemande)) {
    redirect('/dashboard/technicien/demandes')
  }

  const demande = await prisma.demandeMaintenance.findUnique({
    where: { idDemande },
    include: {
      client: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
      equipement: {
        select: { id: true, nom: true, type: true, numeroSerie: true },
      },
      interventions: true,
    },
  }) as unknown as DemandeWithRelations | null

  if (!demande) {
    redirect('/dashboard/technicien/demandes')
  }

  return <DemandeTechnicienDetailClient demande={demande} currentUserId={session.user.id} />
}