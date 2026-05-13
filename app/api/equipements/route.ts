// =============================================================================
// EQUIPMENTS API ROUTE - SGME
// =============================================================================
// This API route handles equipment CRUD operations.
// It provides:
// - GET: List all equipments (with pagination and optional etat filter)
// - POST: Create a new equipment
//
// Only administrators and technicians can access these routes.
// The route checks the user's role before allowing access.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { EquipementCreateInput, EquipementListItem } from "@/types/equipement"
import { z } from "zod"

// =============================================================================
// CREATE EQUIPMENT VALIDATION SCHEMA
// =============================================================================
const createEquipementSchema = z.object({
  nom: z.string().min(1, "Le nom est requis"),
  type: z.string().min(1, "Le type est requis"),
  marque: z.string().min(1, "La marque est requis"),
  modele: z.string().min(1, "Le modèle est requis"),
  numeroSerie: z.string().min(1, "Le numéro de série est requis"),
  etat: z.enum(["DISPONIBLE", "EN_PANNE", "EN_MAINTENANCE", "HORS_SERVICE"]).optional(),
  localisation: z.string().min(1, "La localisation est requise"),
  adminId: z.string().optional(),
})

// =============================================================================
// GET HANDLER - LIST ALL EQUIPMENTS
// =============================================================================
// Returns a paginated list of equipments.
// Query params:
// - page: page number (default: 1)
// - limit: items per page (default: 10)
// - etat: filter by equipment state (optional)
//
// Only administrators and technicians can access this route.
// =============================================================================
export async function GET(request: Request) {
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

    // Parse query parameters
    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10", 10)))
    const skip = (page - 1) * limit
    const etat = url.searchParams.get("etat")

    // Build where clause
    const whereClause: any = {}
    if (etat && ["DISPONIBLE", "EN_PANNE", "EN_MAINTENANCE", "HORS_SERVICE"].includes(etat)) {
      whereClause.etat = etat
    }

    // Fetch equipments with pagination
    const [equipements, total] = await Promise.all([
      prisma.equipement.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      }) as Promise<EquipementListItem[]>,
      prisma.equipement.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: equipements,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error("Error fetching equipments:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des équipements" },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER - CREATE NEW EQUIPMENT
// =============================================================================
// Creates a new equipment in the system.
// Only administrators and technicians can access this route.
// =============================================================================
export async function POST(request: Request) {
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

    // Parse request body
    const body = await request.json()

    // Validate request data
    const validationResult = createEquipementSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 }
      )
    }

    const { nom, type, marque, modele, numeroSerie, etat, localisation, adminId } = validationResult.data

    // Check if equipment with same serial number already exists
    const existingEquipement = await prisma.equipement.findUnique({
      where: { numeroSerie }
    })

    if (existingEquipement) {
      return NextResponse.json(
        { error: "Un équipement avec ce numéro de série existe déjà" },
        { status: 400 }
      )
    }

    // If adminId is provided, verify the admin exists
    if (adminId) {
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

    // Create new equipment
    const newEquipement = await prisma.equipement.create({
      data: {
        nom,
        type,
        marque,
        modele,
        numeroSerie,
        etat: etat || "DISPONIBLE",
        localisation,
        adminId: adminId || null
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
    }) as unknown as EquipementListItem

    return NextResponse.json(newEquipement, { status: 201 })
  } catch (error) {
    console.error("Error creating equipment:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'équipement" },
      { status: 500 }
    )
  }
}
