// =============================================================================
// MATERIELS API ROUTE (SINGLE) - SGME
// =============================================================================
// Handles GET (retrieve), PUT (update), and DELETE for a single material.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { MaterielUpdateInput } from "@/types/stock"
import { z } from "zod"
import { notFound } from "next/navigation"

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
// GET HANDLER - SINGLE MATERIAL
// =============================================================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "TECHNICIEN")
    ) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const materielId = parseInt(id, 10)

    if (isNaN(materielId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
      include: {
        admin: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    if (!materiel) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }

    return NextResponse.json(materiel)
  } catch (error) {
    console.error("Error fetching material:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération du matériel" },
      { status: 500 }
    )
  }
}

// =============================================================================
// PUT HANDLER - UPDATE MATERIAL
// =============================================================================
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent modifier." },
        { status: 403 }
      )
    }

    const { id } = await params
    const materielId = parseInt(id, 10)

    if (isNaN(materielId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = updateMaterielSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data as MaterielUpdateInput

    if (data.reference) {
      const existingWithRef = await prisma.materiel.findFirst({
        where: {
          reference: data.reference,
          id: { not: materielId },
        },
      })

      if (existingWithRef) {
        return NextResponse.json(
          { error: "Un autre matériel utilise déjà cette référence" },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.materiel.update({
      where: { id: materielId },
      data: {
        ...(data.reference !== undefined && { reference: data.reference }),
        ...(data.nom !== undefined && { nom: data.nom }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.quantiteStock !== undefined && {
          quantiteStock: data.quantiteStock,
        }),
        ...(data.seuilAlerte !== undefined && {
          seuilAlerte: data.seuilAlerte,
        }),
        ...(data.unite !== undefined && { unite: data.unite }),
        ...(data.emplacement !== undefined && {
          emplacement: data.emplacement,
        }),
        ...(data.prixUnitaire !== undefined && {
          prixUnitaire: data.prixUnitaire,
        }),
        ...(data.adminId !== undefined && { adminId: data.adminId }),
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

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating material:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du matériel" },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE HANDLER - DELETE MATERIAL
// =============================================================================
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent supprimer." },
        { status: 403 }
      )
    }

    const { id } = await params
    const materielId = parseInt(id, 10)

    if (isNaN(materielId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const existing = await prisma.materiel.findUnique({
      where: { id: materielId },
      include: {
        _count: {
          select: {
            utilisations: true,
            commandes: true,
          },
        },
      },
    })

    if (!existing) {
      return NextResponse.json({ error: "Matériel non trouvé" }, { status: 404 })
    }

    if (existing._count.utilisations > 0) {
      return NextResponse.json(
        {
          error:
            "Impossible de supprimer : ce matériel est lié à des interventions.",
        },
        { status: 400 }
      )
    }

    await prisma.materiel.delete({
      where: { id: materielId },
    })

    return NextResponse.json(
      { message: "Matériel supprimé avec succès" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting material:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du matériel" },
      { status: 500 }
    )
  }
}
