// =============================================================================
// COMMANDES STOCK API ROUTE - SGME
// =============================================================================
// This API route handles purchase order CRUD operations.
// It provides:
// - GET: List all purchase orders with filtering and pagination
// - POST: Create a new purchase order (admin only)
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { CommandeStockWithMateriel } from "@/types/stock"
import { z } from "zod"

const VALID_STATUSES = ["EN_ATTENTE", "RECUE", "ANNULEE"] as const
const VALID_TYPES = ["PIECE_DETACHEE", "CONSOMMABLE", "OUTIL"] as const

const createCommandeSchema = z.object({
  materielId: z.number().int().positive("Le matériel est requis"),
  quantiteCommandee: z.number().int().positive("La quantité doit être positive"),
  fournisseur: z.string().optional().nullable(),
})

const updateCommandeSchema = z.object({
  quantiteCommandee: z.number().int().positive().optional(),
  fournisseur: z.string().optional().nullable(),
  statut: z.enum(["EN_ATTENTE", "RECUE", "ANNULEE"]).optional(),
  dateReception: z.coerce.date().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10))
    const limit = Math.max(1, Math.min(100, parseInt(url.searchParams.get("limit") || "10", 10)))
    const skip = (page - 1) * limit
    const statut = url.searchParams.get("statut")
    const materielId = url.searchParams.get("materielId")
    const search = url.searchParams.get("search")

    const whereClause: Record<string, unknown> = {}

    if (statut && VALID_STATUSES.includes(statut as never)) {
      whereClause.statut = statut
    }

    if (materielId) {
      whereClause.materielId = parseInt(materielId, 10)
    }

    if (search) {
      whereClause.OR = [
        { fournisseur: { contains: search, mode: "insensitive" } },
        { materiel: { reference: { contains: search, mode: "insensitive" } } },
        { materiel: { nom: { contains: search, mode: "insensitive" } } },
      ]
    }

    const [commandes, total] = await Promise.all([
      prisma.commandeStock.findMany({
        where: whereClause as never,
        skip,
        take: limit,
        orderBy: { dateCommande: "desc" },
        include: {
          materiel: {
            select: {
              id: true,
              reference: true,
              nom: true,
              unite: true,
              type: true,
            },
          },
        },
      }),
      prisma.commandeStock.count({ where: whereClause as never }),
    ])

    const totalPages = Math.ceil(total / limit)
    const commandesWithMateriel = commandes as CommandeStockWithMateriel[]

    return NextResponse.json({
      data: commandesWithMateriel,
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
    console.error("Error fetching commandes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des commandes" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const validationResult = createCommandeSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    const materiel = await prisma.materiel.findUnique({
      where: { id: data.materielId },
    })

    if (!materiel) {
      return NextResponse.json(
        { error: "Le matériel spécifié n'existe pas" },
        { status: 400 }
      )
    }

    const newCommande = await prisma.commandeStock.create({
      data: {
        materielId: data.materielId,
        quantiteCommandee: data.quantiteCommandee,
        fournisseur: data.fournisseur ?? null,
        statut: "EN_ATTENTE",
      },
      include: {
        materiel: {
          select: {
            id: true,
            reference: true,
            nom: true,
            unite: true,
            type: true,
          },
        },
      },
    })

    return NextResponse.json(newCommande, { status: 201 })
  } catch (error) {
    console.error("Error creating commande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la commande" },
      { status: 500 }
    )
  }
}
