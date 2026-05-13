// ROLE: EMPLOYE — View own demande details

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { DemandeWithRelations } from '@/types/demande'
import { DemandeEmployeDetailClient } from './DemandeEmployeDetailClient'

export default async function EmployeDemandeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'EMPLOYE') {
    redirect('/')
  }

  const { id } = await params
  const idDemande = parseInt(id, 10)
  if (isNaN(idDemande)) {
    redirect('/dashboard/employe/demandes')
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
    redirect('/dashboard/employe/demandes')
  }

  if (demande.client.id !== session.user.id) {
    redirect('/dashboard/employe/demandes')
  }

  return <DemandeEmployeDetailClient demande={demande} />
}