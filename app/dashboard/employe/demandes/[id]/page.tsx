// ROLE: EMPLOYE — View own demande details
// SECURITY: Employee can only view demandes they created

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import type { InterventionWithRelations } from "@/types/intervention"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EmployeDemandeDetailPage({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "EMPLOYE") {
    redirect("/")
  }

  const { id } = await params
  const idDemande = parseInt(id, 10)

  if (isNaN(idDemande)) {
    notFound()
  }

  const demande = await prisma.demandeMaintenance.findUnique({
    where: { idDemande },
    include: {
      client: {
        select: { id: true, firstName: true, lastName: true, email: true },
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
      interventions: {
        orderBy: { createdAt: "asc" },
      },
      rapportMaintenance: true,
    },
  })

  if (!demande) {
    notFound()
  }

  if (demande.clientId !== session.user.id) {
    notFound()
  }

  const firstIntervention = demande.interventions[0] || null

  const data: InterventionWithRelations = {
    idIntervention: firstIntervention?.idIntervention || 0,
    demandeId: idDemande,
    technicienId: firstIntervention?.technicianId || "",
    description: firstIntervention?.description || "",
    statut: firstIntervention?.statut || "OUVERTE",
    observation: firstIntervention?.observation,
    createdAt: firstIntervention?.createdAt || demande.dateDemande,
    updatedAt: firstIntervention?.updatedAt || demande.updatedAt,
    demande: {
      idDemande: demande.idDemande,
      description: demande.description,
      priorite: demande.priorite,
      statut: demande.statut,
      dateDemande: demande.dateDemande,
      client: {
        nom: demande.client.lastName,
        prenom: demande.client.firstName,
        email: demande.client.email,
      },
      technician: null,
      equipement: {
        idEquipement: demande.equipement.id,
        nom: demande.equipement.nom,
        type: demande.equipement.type,
        marque: demande.equipement.marque,
        modele: demande.equipement.modele,
        numeroSerie: demande.equipement.numeroSerie,
        etat: demande.equipement.etat,
        localisation: demande.equipement.localisation,
      },
    },
    rapportMaintenance: demande.rapportMaintenance,
  }

  const { DemandeEmployeDetailClient } = await import("@/components/demandes/DemandeEmployeDetailClient")

  return <DemandeEmployeDetailClient demande={data} currentUserId={session.user.id} />
}