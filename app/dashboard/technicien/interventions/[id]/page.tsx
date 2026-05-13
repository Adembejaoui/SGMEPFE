// ROLE: TECHNICIEN — View intervention details
// SECURITY: getServerSession, role check, ownership check

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { InterventionWithRelations } from '@/types/intervention'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TechnicienInterventionDetailPage({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'TECHNICIEN') {
    redirect('/dashboard')
  }

  const { id } = await params
  const idIntervention = parseInt(id, 10)

  if (isNaN(idIntervention)) {
    notFound()
  }

  // Fetch directly from Prisma
  const intervention = await prisma.intervention.findUnique({
    where: { idIntervention },
    include: {
      demande: {
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          equipement: {
            select: {
              id: true,
              nom: true,
              type: true,
              marque: true,
              modele: true,
              numeroSerie: true,
              etat: true,
              localisation: true,
            },
          },
          rapportMaintenance: true,
        },
      },
    },
  })

  if (!intervention) {
    notFound()
  }

  // SECURITY: Only the assigned technician can view
  if (intervention.technicianId !== session.user.id) {
    notFound()
  }

const data: InterventionWithRelations = {
    idIntervention: intervention.idIntervention,
    demandeId: intervention.demandeId,
    technicienId: (intervention as any).technicianId,
    description: intervention.description || "",
    statut: intervention.statut,
    observation: intervention.observation,
    createdAt: intervention.createdAt,
    updatedAt: intervention.updatedAt,
    demande: {
      idDemande: intervention.demande.idDemande,
      description: intervention.demande.description,
      priorite: intervention.demande.priorite,
      statut: intervention.demande.statut,
      dateDemande: intervention.demande.dateDemande,
      client: {
        nom: intervention.demande.client.lastName,
        prenom: intervention.demande.client.firstName,
        email: intervention.demande.client.email,
      },
      equipement: {
        idEquipement: intervention.demande.equipement.id,
        nom: intervention.demande.equipement.nom,
        type: intervention.demande.equipement.type,
        marque: intervention.demande.equipement.marque,
        modele: intervention.demande.equipement.modele,
        numeroSerie: intervention.demande.equipement.numeroSerie,
        etat: intervention.demande.equipement.etat,
        localisation: intervention.demande.equipement.localisation,
      },
    },
    rapportMaintenance: intervention.demande.rapportMaintenance,
  }

  const technicienNom = `${session.user.name || ''}`.trim() || session.user.email?.split('@')[0] || 'Technicien'

  const { InterventionDetailClient } = await import('@/components/interventions/InterventionDetailClient')

  return <InterventionDetailClient intervention={data} technicienNom={technicienNom} />
}