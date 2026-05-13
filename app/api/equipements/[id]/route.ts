// =============================================================================
// EQUIPMENT DETAIL API ROUTE - SGME
// =============================================================================
// This API route handles single equipment operations.
// It provides:
// - GET: Get one equipment by id (with relations)
// - PUT: Update equipment
// - DELETE: Delete equipment (with cascade)
//
// Only administrators and technicians can access these routes.
// The route checks the user's role before allowing access.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { EquipementUpdateInput, EquipementWithDemandes } from "@/types/equipement"
import { z } from "zod"

// =============================================================================
// UPDATE EQUIPMENT VALIDATION SCHEMA
// =============================================================================
const updateEquipementSchema = z.object({
  nom: z.string().min(1, "Le nom est requis").optional(),
  type: z.string().min(1, "Le type est requis").optional(),
  marque: z.string().min(1, "La marque est requis").optional(),
  modele: z.string().min(1, "Le modèle est requis").optional(),
  numeroSerie: z.string().min(1, "Le numéro de série est requis").optional(),
  etat: z.enum(["DISPONIBLE", "EN_PANNE", "EN_MAINTENANCE", "HORS_SERVICE"]).optional(),
  localisation: z.string().min(1, "La localisation est requise").optional(),
  adminId: z.string().optional().nullable(),
}).refine(data => Object.keys(data).length > 0, {
  message: "Au moins un champ doit être fourni pour la mise à jour"
})

// =============================================================================
// GET HANDLER - GET ONE EQUIPMENT
// =============================================================================
// Returns one equipment by id with relations.
//
// Only administrators and technicians can access this route.
// =============================================================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current session
    const session = await auth()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Check if user is admin or technician
    if (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    // Get id from params
    const { id } = await params
    const equipementId = parseInt(id, 10)

    if (isNaN(equipementId)) {
      return NextResponse.json(
        { error: "ID d'équipement invalide" },
        { status: 400 }
      )
    }

    // Fetch equipment with relations
    const equipement = await prisma.equipement.findUnique({
      where: { id: equipementId },
      include: {
        demandesMaintenance: {
          include: {
            employe: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        },
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    }) as unknown as EquipementWithDemandes | null

    if (!equipement) {
      return NextResponse.json(
        { error: "Équipement non trouvé" },
        { status: 404 }
      )
    }

    return NextResponse.json(equipement)
  } catch (error) {
    console.error("Error fetching equipment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'équipement" },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT HANDLER - UPDATE EQUIPMENT
// =============================================================================
// Updates an existing equipment.
// Partial updates are allowed.
//
// Only administrators and technicians can access this route.
// =============================================================================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current session
    const session = await auth()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Check if user is admin or technician
    if (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    // Get id from params
    const { id } = await params
    const equipementId = parseInt(id, 10)

    if (isNaN(equipementId)) {
      return NextResponse.json(
        { error: "ID d'équipement invalide" },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validationResult = updateEquipementSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { nom, type, marque, modele, numeroSerie, etat, localisation, adminId } = validationResult.data

    // Check if equipment exists
    const existingEquipement = await prisma.equipement.findUnique({
      where: { id: equipementId }
    })

    if (!existingEquipement) {
      return NextResponse.json(
        { error: "Équipement non trouvé" },
        { status: 404 }
      )
    }

    // Check if new serial number is already used by another equipment
    if (numeroSerie && numeroSerie !== existingEquipement.numeroSerie) {
      const duplicate = await prisma.equipement.findUnique({
        where: { numeroSerie }
      })
      if (duplicate) {
        return NextResponse.json(
          { error: "Un équipement avec ce numéro de série existe déjà" },
          { status: 400 }
        )
      }
    }

    // If adminId is provided, verify the admin exists
    if (adminId !== undefined) {
      if (adminId !== null) {
        const admin = await prisma.user.findUnique({
          where: { id: adminId, role: "ADMIN" }
        })
        if (!admin) {
          return NextResponse.json(
            { error: "L'administrateur spécifié n'existe pas" },
            { status: 400 }
          )
        }
      }
    }

    // Update equipment
    const updatedEquipement = await prisma.equipement.update({
      where: { id: equipementId },
      data: {
        nom: nom || existingEquipement.nom,
        type: type || existingEquipement.type,
        marque: marque || existingEquipement.marque,
        modele: modele || existingEquipement.modele,
        numeroSerie: numeroSerie || existingEquipement.numeroSerie,
        etat: etat || existingEquipement.etat,
        localisation: localisation || existingEquipement.localisation,
        adminId: adminId !== undefined ? adminId : existingEquipement.adminId
      },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    }) as unknown as EquipementWithDemandes

    return NextResponse.json(updatedEquipement)
  } catch (error) {
    console.error("Error updating equipment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'équipement" },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE HANDLER - DELETE EQUIPMENT
// =============================================================================
// Deletes an equipment and all related maintenance requests (cascade).
//
// Only administrators can access this route.
// =============================================================================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the current session
    const session = await auth()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    // Check if user is admin (only admins can delete)
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé" },
        { status: 403 }
      )
    }

    // Get id from params
    const { id } = await params
    const equipementId = parseInt(id, 10)

    if (isNaN(equipementId)) {
      return NextResponse.json(
        { error: "ID d'équipement invalide" },
        { status: 400 }
      )
    }

    // Check if equipment exists
    const existingEquipement = await prisma.equipement.findUnique({
      where: { id: equipementId }
    })

    if (!existingEquipement) {
      return NextResponse.json(
        { error: "Équipement non trouvé" },
        { status: 404 }
      )
    }

    // Delete equipment (cascade will delete related demandesMaintenance)
    await prisma.equipement.delete({
      where: { id: equipementId }
    })

    return NextResponse.json(
      { message: "Équipement supprimé avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting equipment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'équipement" },
      { status: 500 }
    )
  }
}
