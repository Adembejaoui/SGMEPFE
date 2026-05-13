// =============================================================================
// PATCH HANDLER - CLAIM DEMANDE
// =============================================================================

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Non autorisA" },
        { status: 401 }
      )
    }

    if (
      session.user.role !==
      "TECHNICIEN"
    ) {
      return NextResponse.json(
        {
          error:
            "Seuls les techniciens peuvent prendre en charge des demandes",
        },
        { status: 403 }
      )
    }

    const { id } = await params
    const idDemande = parseInt(id, 10)

    if (isNaN(idDemande)) {
      return NextResponse.json(
        {
          error:
            "ID de demande invalide",
        },
        { status: 400 }
      )
    }

    const demande =
      await prisma.demandeMaintenance.findUnique(
        {
          where: {
            idDemande,
          },

          include: {
            equipement: {
              select: {
                id: true,
                nom: true,
                type: true,
                numeroSerie: true,
              },
            },

            technician: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },

            interventions: true,
          },
        }
      )

    if (!demande) {
      return NextResponse.json(
        {
          error:
            "Demande de maintenance non trouvA"
        },
        { status: 404 }
      )
    }

    if (
      demande.technicianId
    ) {
      return NextResponse.json(
        {
          error:
            "Cette demande a dAjA A tA A prise en charge",
        },
        { status: 400 }
      )
    }

    if (
      !session.user
        .specialization
    ) {
      return NextResponse.json(
        {
          error:
            "Aucune spAcialisation dAfinnie"
        },
        { status: 400 }
      )
    }

    if (
      session.user
        .specialization !==
      demande.equipement.type
    ) {
      return NextResponse.json(
        {
          error:
            `SpAcialisation incompatible (${session.user.specialization})`
        },
        { status: 403 }
      )
    }

    // Start a transaction to ensure both operations succeed or both fail
    const result = await prisma.$transaction(async (tx) => {
      // Update the demande to assign it to the technician
      const updatedDemande = await tx.demandeMaintenance.update({
        where: {
          idDemande,
        },
        data: {
          technicianId:
            session.user.id,

          statut:
            demande.statut ===
            "EN_ATTENTE"
              ? "EN_COURS"
              : demande.statut,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },

          equipement: {
            select: {
              id: true,
              nom: true,
              type: true,
              numeroSerie: true,
            },
          },

          technician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },

          interventions: true,
        },
      })

      // Check if an intervention already exists for this demande by this technician
      const existingIntervention = await tx.intervention.findFirst({
        where: {
          demandeId: idDemande,
          technicianId: session.user.id,
        },
      })

      let newIntervention = null
      if (!existingIntervention) {
        // No existing intervention, create a new one
        newIntervention = await tx.intervention.create({
          data: {
            demandeId: idDemande,
            description: `Intervention commencA e pour la demande: ${demande.description.substring(0, 50)}${demande.description.length > 50 ? '...' : ''}`,
            statut: "OUVERTE",
            technicianId: session.user.id,
          },
        })
      }

      return { updatedDemande, interventionCreated: newIntervention !== null }
    })

    return NextResponse.json(
      {
        ...result.updatedDemande,
        interventionCreated: result.interventionCreated, // Include flag to indicate if intervention was created
      }
    )
  } catch (error) {
    console.error(
      "Error claiming demande:",
      error
    )

    return NextResponse.json(
      {
        error:
          "Erreur lors de la prise en charge de la demande",
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE HANDLER - DELETE DEMANDE
// =============================================================================
// Deletes a maintenance request.
// Only ADMIN can delete demandes, or CLIENT/EMPLOYE can delete their own.
// Cascade deletes interventions and rapportMaintenance.
// =============================================================================
export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Non autorisA" },
        { status: 401 }
      )
    }

    const { id } = await params
    const idDemande = parseInt(id, 10)

    if (isNaN(idDemande)) {
      return NextResponse.json(
        { error: "ID de demande invalide" },
        { status: 400 }
      )
    }

    const demande = await prisma.demandeMaintenance.findUnique({
      where: { idDemande },
    })

    if (!demande) {
      return NextResponse.json(
        { error: "Demande de maintenance non trouvA" },
        { status: 404 }
      )
    }

    // Role-based access control
    if (session.user.role === "ADMIN") {
      // Admins can delete any demande
    } else if (session.user.role === "CLIENT" || session.user.role === "EMPLOYE") {
      // Clients/EmployAs can only delete their own demandes
      if (demande.clientId !== session.user.id) {
        return NextResponse.json(
          { error: "AccAs refusA" },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "AccAs refusA" },
        { status: 403 }
      )
    }

    // Delete the demande (cascade will handle interventions and rapportMaintenance)
    await prisma.demandeMaintenance.delete({
      where: { idDemande },
    })

    return NextResponse.json(
      { message: "Demande de maintenance supprimA A vec succAs" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting demande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la demande de maintenance" },
      { status: 500 }
    )
  }
}
