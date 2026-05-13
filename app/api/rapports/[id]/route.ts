// =============================================================================
// RAPPORT DETAIL API ROUTE - SGME
// =============================================================================
// This API route handles individual rapport operations.
// It provides:
// - GET: Get one rapport by id with demandes and equipement relations
// - DELETE: Delete rapport (ADMIN only)
//
// Only administrators and technicians can access these routes.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// =============================================================================
// GET HANDLER - GET ONE RAPPORT
// =============================================================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisA" }, { status: 401 })
    }

    if (!["ADMIN", "TECHNICIEN"].includes(session.user.role)) {
      return NextResponse.json({ error: "AccAs refusA" }, { status: 403 })
    }

    const { id } = await params
    const idRapport = parseInt(id, 10)

    if (isNaN(idRapport)) {
      return NextResponse.json({ error: "ID de rapport invalide" }, { status: 400 })
    }

    const rapport = await prisma.rapportMaintenance.findUnique({
      where: { idRapport },
      include: {
        demande: {
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
                localisation: true,
              },
            },
            technician: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    })

    if (!rapport) {
      return NextResponse.json({ error: "Rapport non trouvA" }, { status: 404 })
    }

    return NextResponse.json({
      idRapport: rapport.idRapport,
      demandeId: rapport.demandeId,
      diagnostic: rapport.diagnostic,
      actionsEffectuees: rapport.actionsEffectuees,
      resultat: rapport.resultat,
      dateCreation: rapport.dateCreation,
      dateModification: rapport.dateModification,
      demande: {
        idDemande: rapport.demande.idDemande,
        description: rapport.demande.description,
        priorite: rapport.demande.priorite,
        statut: rapport.demande.statut,
        dateDemande: rapport.demande.dateDemande,
        client: {
          id: rapport.demande.client.id,
          nom: rapport.demande.client.lastName,
          prenom: rapport.demande.client.firstName,
          email: rapport.demande.client.email,
        },
        technician: rapport.demande.technician ? {
          id: rapport.demande.technician.id,
          nom: rapport.demande.technician.lastName,
          prenom: rapport.demande.technician.firstName,
          email: rapport.demande.technician.email,
        } : null,
        equipement: {
          idEquipement: rapport.demande.equipement.id,
          nom: rapport.demande.equipement.nom,
          type: rapport.demande.equipement.type,
          marque: rapport.demande.equipement.marque,
          modele: rapport.demande.equipement.modele,
          numeroSerie: rapport.demande.equipement.numeroSerie,
          localisation: rapport.demande.equipement.localisation,
        },
      },
    })
  } catch (error) {
    console.error("Error fetching rapport:", error)
    return NextResponse.json({ error: "Erreur lors de la rA cupA ration du rapport" }, { status: 500 })
  }
}

// =============================================================================
// DELETE HANDLER - DELETE RAPPORT
// =============================================================================
// Only ADMIN can delete rapports.
// =============================================================================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisA" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "AccAs rA servA aux administrateurs" }, { status: 403 })
    }

    const { id } = await params
    const idRapport = parseInt(id, 10)

    if (isNaN(idRapport)) {
      return NextResponse.json({ error: "ID de rapport invalide" }, { status: 400 })
    }

    const existingRapport = await prisma.rapportMaintenance.findUnique({
      where: { idRapport },
    })

    if (!existingRapport) {
      return NextResponse.json({ error: "Rapport non trouvA" }, { status: 404 })
    }

    await prisma.rapportMaintenance.delete({
      where: { idRapport },
    })

    return NextResponse.json({ message: "Rapport supprimA A vec succAs" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting rapport:", error)
    return NextResponse.json({ error: "Erreur lors de la suppression du rapport" }, { status: 500 })
  }
}
