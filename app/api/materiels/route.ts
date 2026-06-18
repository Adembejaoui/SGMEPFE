// =============================================================================
// MATERIELS API ROUTE - SGME
// =============================================================================
// This API route handles material/stock CRUD operations.
// It provides:
// - GET: List all materials with filtering, pagination, and search
// - POST: Create a new material (admin only)
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type {
  MaterielCreateInput,
  MaterielUpdateInput,
  MaterielListItem,
} from "@/types/stock"
import { z } from "zod"

// =============================================================================
// VALID FILTER VALUES
// =============================================================================
const VALID_TYPES = ["PIECE_DETACHEE", "CONSOMMABLE", "OUTIL"] as const

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================
const createMaterielSchema = z.object({
  reference: z.string().min(1, "La référence est requise"),
  nom: z.string().min(1, "Le nom est requis"),
  description: z.string().optional().nullable(),
  type: z.enum(["PIECE_DETACHEE", "CONSOMMABLE", "OUTIL"]),
  quantiteStock: z.number().int().nonnegative().optional(),
  seuilAlerte: z.number().int().nonnegative().optional(),
  unite: z.string().optional(),
  emplacement: z.string().optional().nullable(),
  prixUnitaire: z.number().nonnegative().optional().nullable(),
  adminId: z.string().min(1, "L'administrateur est requis"),
})

const updateMaterielSchema = z.object({
  reference: z.string().min(1, "La référence est requise").optional(),
  nom: z.string().min(1, "Le nom est requis").optional(),
  description: z.string().optional().nullable(),
  type: z.enum(["PIECE_DETACHEE", "CONSOMMABLE", "OUTIL"]).optional(),
  quantiteStock: z.number().int().nonnegative().optional(),
  seuilAlerte: z.number().int().nonnegative().optional(),
  unite: z.string().optional(),
  emplacement: z.string().optional().nullable(),
  prixUnitaire: z.number().nonnegative().optional().nullable(),
  adminId: z.string().optional(),
})

// =============================================================================
// GET HANDLER - LIST MATERIALS
// =============================================================================
// Returns a paginated list of materials with optional filtering.
// Query params:
// - page: page number (default: 1)
// - limit: items per page (default: 10)
// - type: filter by material type (optional)
// - search: search by reference or name (optional)
// - lowStock: show only low stock items (optional, boolean)
export async function GET(request: Request) {
  try {
    const session = await auth()

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.max(
      1,
      Math.min(100, parseInt(url.searchParams.get("limit") || "10", 10))
    )
    const skip = (page - 1) * limit
    const typeParam = url.searchParams.get("type")
    const search = url.searchParams.get("search")
    const lowStock = url.searchParams.get("lowStock") === "true"

    // Build where clause
    const whereClause: Record<string, unknown> = {}

    if (typeParam && VALID_TYPES.includes(typeParam as never)) {
      whereClause.type = typeParam
    }

    if (search) {
      whereClause.OR = [
        { reference: { contains: search, mode: "insensitive" } },
        { nom: { contains: search, mode: "insensitive" } },
      ]
    }

    const [materiels, total] = await Promise.all([
      prisma.materiel.findMany({
        where: whereClause as never,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              utilisations: true,
              commandes: true,
            },
          },
        },
      }),
      prisma.materiel.count({ where: whereClause as never }),
    ])

    let filteredMateriels = materiels

    if (lowStock) {
      filteredMateriels = materiels.filter((m) => m.quantiteStock <= m.seuilAlerte)
    }

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: filteredMateriels as MaterielListItem[],
      pagination: {
        total: lowStock ? filteredMateriels.length : total,
        page,
        limit,
        totalPages: lowStock ? Math.ceil(filteredMateriels.length / limit) : totalPages,
        hasNext: lowStock ? false : page < totalPages,
        hasPrev: lowStock ? false : page > 1,
      },
    })
  } catch (error) {
    console.error("Error fetching materials:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des matériels" },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER - CREATE MATERIAL
// =============================================================================
// Creates a new material. Only admins and technicians can create.
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createMaterielSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data as MaterielCreateInput

    // Check for duplicate reference
    const existing = await prisma.materiel.findUnique({
      where: { reference: data.reference },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Un matériel avec cette référence existe déjà" },
        { status: 400 }
      )
    }

    // Verify admin exists if not the current user
    const targetAdminId =
      data.adminId && data.adminId !== session.user.id ? data.adminId : session.user.id

    const admin = await prisma.user.findUnique({
      where: { id: targetAdminId },
    })

    if (!admin) {
      return NextResponse.json(
        { error: "L'administrateur spécifié n'existe pas" },
        { status: 400 }
      )
    }

    const newMateriel = await prisma.materiel.create({
      data: {
        reference: data.reference,
        nom: data.nom,
        description: data.description ?? null,
        type: data.type,
        quantiteStock: data.quantiteStock ?? 0,
        seuilAlerte: data.seuilAlerte ?? 0,
        unite: data.unite ?? "unité",
        emplacement: data.emplacement ?? null,
        prixUnitaire: data.prixUnitaire ?? null,
        adminId: targetAdminId,
      },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            utilisations: true,
            commandes: true,
          },
        },
      },
    })

    return NextResponse.json(newMateriel, { status: 201 })
  } catch (error) {
    console.error("Error creating material:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du matériel" },
      { status: 500 }
    )
  }
}
