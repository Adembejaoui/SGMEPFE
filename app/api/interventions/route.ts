// =============================================================================
// INTERVENTIONS API ROUTE - SGME
// =============================================================================
// This API route handles intervention records for technicians.
// It provides:
// - GET: List interventions assigned to the current technician
//         Supports pagination and optional statut filtering
// - POST: Create a new intervention for a demande the technician has claimed
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { InterventionWithRelations } from "@/types/demande"
import { StatutIntervention } from "@/types/demande"

// =============================================================================
// VALID FILTER VALUES
// =============================================================================
const VALID_STATUTS_INTERVENTION: StatutIntervention[] = [
  "OUVERTE", "EN_COURS", "TERMINEE", "ANNULEE",
]

// =============================================================================
// GET HANDLER - LIST INTERVENTIONS
// =============================================================================
// Returns a paginated list of interventions assigned to the current technician.
// Query params:
// - statut: filter by status (OUVERTE, EN_COURS, TERMINEE, ANNULEE)
// - page: page number (default: 1)
// - limit: items per page (default: 10)
// =============================================================================
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    if (session.user.role !== "TECHNICIEN") {
      return NextResponse.json(
        { error: "Accès réservé aux techniciens" },
        { status: 403 }
      )
    }

    const url = new URL(request.url)
    const statut = url.searchParams.get("statut")
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10", 10)))
    const skip = (page - 1) * limit

    // Build where clause for revendications claimed by this technician
    const whereClause: Record<string, unknown> = {
      technicianId: session.user.id,
    }

    // Fetch revendications with pagination and relations
    const revendications = await prisma.demandeMaintenance.findMany({
      where: whereClause as any,
      skip,
      take: limit,
      orderBy: { dateDemande: "desc" },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
        interventions: {
          take: 1, // We only need at most one intervention per demande
          orderBy: { createdAt: "desc" },
        },
      },
    })

    // Get total count for pagination
    const total = await prisma.demandeMaintenance.count({ where: whereClause as any })
    const totalPages = Math.ceil(total / limit)

    // Map to InterventionWithRelations type
    // For each revendication, if there's an intervention, use it; otherwise create a placeholder
    const data: InterventionWithRelations[] = revendications.map((d: any) => {
      // Get the first intervention if it exists (there should be at most one)
      const intervention = d.interventions?.[0] || null
      
      return {
        idIntervention: intervention?.idIntervention || d.idDemande + 1000000, // Fallback ID if no intervention
        demandeId: d.idDemande,
        description: intervention?.description || "", // Intervention description or empty
        statut: intervention?.statut || "OUVERTE", // Intervention status or default
        createdAt: intervention?.createdAt || d.createdAt, // Intervention date or demande date
        updatedAt: intervention?.updatedAt || d.updatedAt, // Intervention update date or demande update date
        demande: {
          idDemande: d.idDemande,
          description: d.description,
          priorite: d.priorite,
          statut: d.statut,
          equipement: {
            id: d.equipement?.id ?? 0,
            nom: d.equipement?.nom ?? "",
            type: d.equipement?.type ?? "",
            numeroSerie: d.equipement?.numeroSerie ?? "",
          },
          client: {
            id: d.client?.id ?? "",
            firstName: d.client?.firstName ?? "",
            lastName: d.client?.lastName ?? "",
          },
        },
      }
    })

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching interventions:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des interventions" },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER - CREATE INTERVENTION
// =============================================================================
// Creates a new intervention record for a demande the technician has claimed.
// Validates: description min 5 chars, demandeId must exist and be claimed by technician
// =============================================================================

import { z } from "zod"

const createInterventionSchema = z.object({
  demandeId: z.number().int().positive("L'ID de la demande doit être un entier positif"),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères"),
})

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 401 }
      )
    }

    if (session.user.role !== "TECHNICIEN") {
      return NextResponse.json(
        { error: "Seuls les techniciens peuvent créer des interventions" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const validationResult = createInterventionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { demandeId, description } = validationResult.data

    // Verify the demande exists and is claimed by this technician
    const demande = await prisma.demandeMaintenance.findUnique({
      where: { idDemande: demandeId },
      include: {
        equipement: {
          select: {
            id: true,
            nom: true,
            type: true,
            numeroSerie: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!demande) {
      return NextResponse.json(
        { error: "Demande de maintenance non trouvée" },
        { status: 404 }
      )
    }

    if (demande.technicianId !== session.user.id) {
      return NextResponse.json(
        { error: "Cette demande ne vous est pas assignée" },
        { status: 403 }
      )
    }

    // Check if intervention already exists for this demande
    const existingIntervention = await prisma.intervention.findFirst({
      where: {
        demandeId,
        technicianId: session.user.id,
      },
    })

    if (existingIntervention) {
      return NextResponse.json(
        { error: "Une intervention existe déjà pour cette demande" },
        { status: 400 }
      )
    }

    const newIntervention = await prisma.intervention.create({
      data: {
        demandeId,
        description,
        statut: "OUVERTE",
        technicianId: session.user.id,
      },
      include: {
        demande: {
          select: {
            idDemande: true,
            description: true,
            priorite: true,
            statut: true,
            equipement: {
              select: {
                id: true,
                nom: true,
                type: true,
                numeroSerie: true,
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(newIntervention, { status: 201 })
  } catch (error) {
    console.error("Error creating intervention:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'intervention" },
      { status: 500 }
    )
  }
}