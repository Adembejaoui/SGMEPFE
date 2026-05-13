// =============================================================================
// DEMANDES MAINTENANCE API ROUTE - SGME
// =============================================================================
// This API route handles maintenance request (demande) listing and creation.
// It provides:
// - GET: List demandes with pagination, filtering by statut/priorite
//         ADMIN     → all demandes
//         TECHNICIEN → all demandes (intervention assignment not yet implemented)
//         CLIENT/EMPLOYE → only their own demandes
// - POST: Create a new maintenance request
//         Only CLIENT or EMPLOYE roles can create demandes
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { DemandeListItem } from "@/types/demande"
import { PrioriteDemande, StatutDemande } from "@/types/demande"

// =============================================================================
// VALID FILTER VALUES
// =============================================================================
const VALID_STATUTS: StatutDemande[] = [
  "EN_ATTENTE", "VALIDEE", "EN_COURS", "TRAITEE", "REJETEE", "ANNULEE",
]
const VALID_PRIORITES: PrioriteDemande[] = [
  "BASSE", "MOYENNE", "HAUTE", "URGENTE",
]

// =============================================================================
// GET HANDLER - LIST MAINTENANCE REQUESTS
// =============================================================================
// Returns a paginated list of maintenance requests based on user role.
// Query params:
// - statut: filter by status (e.g. EN_ATTENTE, VALIDEE, EN_COURS, TRAITEE)
// - priorite: filter by priority (e.g. BASSE, MOYENNE, HAUTE, URGENTE)
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

    const url = new URL(request.url)
    const statut = url.searchParams.get("statut")
    const priorite = url.searchParams.get("priorite")
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10", 10)))
    const skip = (page - 1) * limit

    // Build where clause based on role and filters
    const whereClause: Record<string, unknown> = {}

    if (statut && VALID_STATUTS.includes(statut as StatutDemande)) {
      whereClause.statut = statut
    }

    if (priorite && VALID_PRIORITES.includes(priorite as PrioriteDemande)) {
      whereClause.priorite = priorite
    }

    // CLIENT/EMPLOYE: only their own demandes
    if (session.user.role === "EMPLOYE" || session.user.role === "CLIENT") {
      whereClause.clientId = session.user.id
    }
    // ADMIN: all demandes (no additional filter)
    // TECHNICIEN: all demandes (intervention-based filtering deferred until Intervention model has technicienId)

     // Fetch demandes with pagination and relations
     const demandes = await prisma.demandeMaintenance.findMany({
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
           email: true,
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
       _count: {
         select: { interventions: true },
       },
     },
     })

    const total = await prisma.demandeMaintenance.count({ where: whereClause as any })
    const totalPages = Math.ceil(total / limit)

     // Map to DemandeListItem type
     const data: DemandeListItem[] = demandes.map((d: any) => ({
       idDemande: d.idDemande,
       description: d.description,
       priorite: d.priorite,
       statut: d.statut,
       dateDemande: d.dateDemande,
       client: {
         id: d.client?.id ?? "",
         firstName: d.client?.firstName ?? "",
         lastName: d.client?.lastName ?? "",
         email: d.client?.email ?? "",
       },
       equipement: {
         id: d.equipement?.id ?? 0,
         nom: d.equipement?.nom ?? "",
         type: d.equipement?.type ?? "",
         numeroSerie: d.equipement?.numeroSerie ?? "",
       },
       technician: d.technician ? {
         id: d.technician.id,
         firstName: d.technician.firstName,
         lastName: d.technician.lastName,
       } : null,
       _count: {
         interventions: d._count.interventions,
       },
     }))

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
    console.error("Error fetching demandes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes de maintenance" },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER - CREATE NEW MAINTENANCE REQUEST
// =============================================================================
// Creates a new maintenance request.
// Only CLIENT or EMPLOYE roles can create demandes.
// Sets clientId from session and statut to EN_ATTENTE automatically.
// Validates: description min 10 chars, equipementId must exist.
// =============================================================================

import { z } from "zod"

const createDemandeSchema = z.object({
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  priorite: z.enum(["BASSE", "MOYENNE", "HAUTE", "URGENTE"]),
  equipementId: z.number().int().positive("L'ID de l'équipement doit être un entier positif"),
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

    // Only CLIENT or EMPLOYE can create demandes
    if (session.user.role !== "CLIENT" && session.user.role !== "EMPLOYE") {
      return NextResponse.json(
        { error: "Seuls les clients et employés peuvent créer des demandes de maintenance" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const validationResult = createDemandeSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { description, priorite, equipementId } = validationResult.data

    // Verify the equipment exists
    const equipement = await prisma.equipement.findUnique({
      where: { id: equipementId },
    })

    if (!equipement) {
      return NextResponse.json(
        { error: "Équipement non trouvé" },
        { status: 404 }
      )
    }

    // Create the maintenance request with clientId from session and statut EN_ATTENTE
    const newDemande = await prisma.demandeMaintenance.create({
      data: {
        description,
        priorite,
        equipement: { connect: { id: equipementId } },
        client: { connect: { id: session.user.id } },
        statut: "EN_ATTENTE",
      },
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
          },
        },
      },
    })

    return NextResponse.json(newDemande, { status: 201 })
  } catch (error) {
    console.error("Error creating demande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la demande de maintenance" },
      { status: 500 }
    )
  }
}