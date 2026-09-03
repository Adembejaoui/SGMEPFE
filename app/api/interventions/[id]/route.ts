// =============================================================================
// INTERVENTIONS [ID] API ROUTE - SGME
// =============================================================================
// This API route handles individual intervention record operations.
// SECURITY: TECHNICIEN-only access, ownership verified on each request.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { InterventionWithRelations, RapportMaintenance } from "@/types/intervention"
import type { StatutIntervention, StatutDemande } from "@/types/demande"
import { z } from "zod"

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================
const updateInterventionSchema = z.object({
  observation: z.string().optional(),
  statut: z.enum(["OUVERTE", "EN_COURS", "TERMINEE", "ANNULEE"]).optional(),
  technicianId: z.string().optional(),
  rapport: z.object({
    diagnostic: z.string().min(10, "Le diagnostic doit contenir au moins 10 caractères"),
    actionsEffectuees: z.string().min(10, "Les actions doivent contenir au moins 10 caractères"),
    resultat: z.enum([
      "Problème résolu",
      "Partiellement résolu",
      "Non résolu — pièce manquante",
      "Non résolu — intervention supplémentaire requise",
    ]),
  }).optional(),
})

// =============================================================================
// GET HANDLER
// =============================================================================
// SECURITY: Returns 403 if technicienId !== session.user.id
// SECURITY: Includes demande with client and equipement relations
// =============================================================================
export async function GET(
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
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

     if (!["TECHNICIEN", "ADMIN"].includes(session.user.role)) {
       return NextResponse.json(
         { error: "Accès réservé aux techniciens et administrateurs" },
         { status: 403 }
       )
     }

    const { id } = await params
    const idIntervention = parseInt(id, 10)

    if (isNaN(idIntervention)) {
      return NextResponse.json(
        { error: "ID d'intervention invalide" },
        { status: 400 }
      )
    }

     const intervention = await prisma.intervention.findUnique({
       where: { idIntervention },
       include: {
         demande: {
           include: {
             client: {
               select: { firstName: true, lastName: true, email: true },
             },
             equipement: {
               select: {
                 id: true, nom: true, type: true, marque: true,
                 modele: true, numeroSerie: true, etat: true, localisation: true,
               },
             },
             rapportMaintenance: true,
             technician: {
               select: { id: true, firstName: true, lastName: true, email: true },
             },
           },
         },
       },
     })

    if (!intervention) {
      return NextResponse.json(
        { error: "Intervention non trouvée" },
        { status: 404 }
      )
    }

    // SECURITY: Technicians can only view their own interventions; Admins can view any
    if (session.user.role === "TECHNICIEN" && intervention.technicianId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
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
         technician: intervention.demande.technician ? {
           id: intervention.demande.technician.id,
           nom: intervention.demande.technician.lastName,
           prenom: intervention.demande.technician.firstName,
           email: intervention.demande.technician.email,
         } : null,
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

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching intervention:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'intervention" },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT HANDLER
// =============================================================================
// SECURITY: Validates ownership before update for technicians; admins can update any
// SECURITY: Upserts RapportMaintenance, updates demande.statut to TRAITEE if TERMINEE
// SECURITY: Allows admin to reassign technician via technicianId
// =============================================================================
export async function PUT(
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
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    if (!["TECHNICIEN", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Seuls les techniciens et administrateurs peuvent modifier les interventions" },
        { status: 403 }
      )
    }

    const { id } = await params
    const idIntervention = parseInt(id, 10)

    if (isNaN(idIntervention)) {
      return NextResponse.json(
        { error: "ID d'intervention invalide" },
        { status: 400 }
      )
    }

    const existingIntervention = await prisma.intervention.findUnique({
      where: { idIntervention },
      include: {
        demande: {
          select: { idDemande: true, statut: true, technicianId: true },
        },
      },
    })

    if (!existingIntervention) {
      return NextResponse.json(
        { error: "Intervention non trouvée" },
        { status: 404 }
      )
    }

    // SECURITY: Only the assigned technician or admin can update
    if (session.user.role === "TECHNICIEN" && existingIntervention.technicianId !== session.user.id) {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validationResult = updateInterventionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { observation, statut, technicianId, rapport } = validationResult.data
    const shouldUpdateDemandeStatut = statut === "TERMINEE"

    // Build update data
    const updateData: {
      observation?: string | null
      statut?: StatutIntervention
      technicianId?: string
    } = {}

    if (observation !== undefined) {
      updateData.observation = observation
    }

    if (statut !== undefined) {
      updateData.statut = statut as StatutIntervention
    }

    if (technicianId !== undefined) {
      updateData.technicianId = technicianId
    }

    // Update intervention and rapport in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update intervention
      const updatedIntervention = await tx.intervention.update({
        where: { idIntervention },
        data: updateData,
      })

      // Upsert rapport maintenance if provided
      if (rapport) {
        await tx.rapportMaintenance.upsert({
          where: { demandeId: existingIntervention.demandeId },
          update: {
            diagnostic: rapport.diagnostic,
            actionsEffectuees: rapport.actionsEffectuees,
            resultat: rapport.resultat,
          },
          create: {
            demandeId: existingIntervention.demandeId,
            diagnostic: rapport.diagnostic,
            actionsEffectuees: rapport.actionsEffectuees,
            resultat: rapport.resultat,
          },
        })
      }

      // Update demande technician if provided
      if (technicianId !== undefined) {
        const demandeUpdateData: { technicianId: string; statut?: StatutDemande } = {
          technicianId,
        }
        // If demande was EN_ATTENTE, move to EN_COURS when technician is assigned
        if (existingIntervention.demande.statut === "EN_ATTENTE") {
          demandeUpdateData.statut = "EN_COURS"
        }
        await tx.demandeMaintenance.update({
          where: { idDemande: existingIntervention.demandeId },
          data: demandeUpdateData,
        })
      }

      // Update demande statut to TRAITEE if intervention is TERMINEE
      if (shouldUpdateDemandeStatut) {
        await tx.demandeMaintenance.update({
          where: { idDemande: existingIntervention.demandeId },
          data: { statut: "TRAITEE" },
        })
      }

      // Fetch updated intervention with relations
      const fullIntervention = await tx.intervention.findUnique({
        where: { idIntervention },
        include: {
          demande: {
            include: {
              client: {
                select: { firstName: true, lastName: true, email: true },
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
              technician: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
        },
      })

      return fullIntervention
    })

    const responseData: InterventionWithRelations = {
      idIntervention: result!.idIntervention,
      demandeId: result!.demandeId,
      technicienId: (result as any)!.technicianId,
      description: result!.description || "",
      statut: result!.statut,
      observation: result!.observation,
      createdAt: result!.createdAt,
      updatedAt: result!.updatedAt,
      demande: {
        idDemande: result!.demande.idDemande,
        description: result!.demande.description,
        priorite: result!.demande.priorite,
        statut: result!.demande.statut,
        dateDemande: result!.demande.dateDemande,
        client: {
          nom: result!.demande.client.lastName,
          prenom: result!.demande.client.firstName,
          email: result!.demande.client.email,
        },
        technician: result!.demande.technician ? {
          id: result!.demande.technician.id,
          nom: result!.demande.technician.lastName,
          prenom: result!.demande.technician.firstName,
          email: result!.demande.technician.email,
        } : null,
        equipement: {
          idEquipement: result!.demande.equipement.id,
          nom: result!.demande.equipement.nom,
          type: result!.demande.equipement.type,
          marque: result!.demande.equipement.marque,
          modele: result!.demande.equipement.modele,
          numeroSerie: result!.demande.equipement.numeroSerie,
          etat: result!.demande.equipement.etat,
          localisation: result!.demande.equipement.localisation,
        },
      },
      rapportMaintenance: result!.demande.rapportMaintenance,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Error updating intervention:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'intervention" },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE HANDLER
// =============================================================================
// SECURITY: ADMIN only
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
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès réservé aux administrateurs" },
        { status: 403 }
      )
    }

    const { id } = await params
    const idIntervention = parseInt(id, 10)

    if (isNaN(idIntervention)) {
      return NextResponse.json(
        { error: "ID d'intervention invalide" },
        { status: 400 }
      )
    }

    const existingIntervention = await prisma.intervention.findUnique({
      where: { idIntervention },
    })

    if (!existingIntervention) {
      return NextResponse.json(
        { error: "Intervention non trouvée" },
        { status: 404 }
      )
    }

    await prisma.intervention.delete({
      where: { idIntervention },
    })

    return NextResponse.json({
      message: "Intervention supprimée avec succès",
    })
  } catch (error) {
    console.error("Error deleting intervention:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'intervention" },
      { status: 500 }
    )
  }
}