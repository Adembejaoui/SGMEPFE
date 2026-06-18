// =============================================================================
// INTERVENTION MATERIALS API ROUTE - SGME
// =============================================================================
// Handles GET (list usage), POST (record usage) for materials on an intervention.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { UtilisationCreateInput } from "@/types/stock"
import { z } from "zod"

const createUtilisationSchema = z.object({
  materielId: z.number().int().positive("ID du matériel invalide"),
  quantiteUtilisee: z.number().int().positive("La quantité doit être positive"),
  motif: z.string().optional().nullable(),
})

// =============================================================================
// GET HANDLER - LIST MATERIALS USED IN INTERVENTION
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
    const interventionId = parseInt(id, 10)

    if (isNaN(interventionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const utilisations = await prisma.utilisationMateriel.findMany({
      where: { interventionId },
      include: {
        materiel: {
          select: {
            id: true,
            reference: true,
            nom: true,
            type: true,
            unite: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(utilisations)
  } catch (error) {
    console.error("Error fetching material usage:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des matériels utilisés" },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER - RECORD MATERIAL USAGE IN INTERVENTION
// =============================================================================
// Technicians and admins can record material consumption.
// Automatically decrements stock on success.
export async function POST(
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
    const interventionId = parseInt(id, 10)

    if (isNaN(interventionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = createUtilisationSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { materielId, quantiteUtilisee, motif } = validationResult.data

    const intervention = await prisma.intervention.findUnique({
      where: { idIntervention: interventionId },
      select: { idIntervention: true, technicianId: true },
    })

    if (!intervention) {
      return NextResponse.json(
        { error: "Intervention non trouvée" },
        { status: 404 }
      )
    }

    if (
      session.user.role === "TECHNICIEN" &&
      intervention.technicianId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Vous n'êtes pas assigné à cette intervention" },
        { status: 403 }
      )
    }

    const materiel = await prisma.materiel.findUnique({
      where: { id: materielId },
    })

    if (!materiel) {
      return NextResponse.json(
        { error: "Matériel non trouvé" },
        { status: 404 }
      )
    }

    const existingUsage = await prisma.utilisationMateriel.findUnique({
      where: {
        materielId_interventionId: {
          materielId,
          interventionId,
        },
      },
    })

    if (existingUsage) {
      return NextResponse.json(
        { error: "Ce matériel est déjà enregistré pour cette intervention" },
        { status: 400 }
      )
    }

    if (materiel.quantiteStock < quantiteUtilisee) {
      return NextResponse.json(
        {
          error: `Stock insuffisant. Disponible: ${materiel.quantiteStock} ${materiel.unite}, demandé: ${quantiteUtilisee}`,
        },
        { status: 400 }
      )
    }

    const utilisation = await prisma.utilisationMateriel.create({
      data: {
        materielId,
        interventionId,
        quantiteUtilisee,
        motif: motif ?? null,
      },
      include: {
        materiel: {
          select: {
            id: true,
            reference: true,
            nom: true,
            type: true,
            unite: true,
          },
        },
      },
    })

    await prisma.materiel.update({
      where: { id: materielId },
      data: {
        quantiteStock: { decrement: quantiteUtilisee },
      },
    })

    return NextResponse.json(utilisation, { status: 201 })
  } catch (error) {
    console.error("Error recording material usage:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement de l'utilisation" },
      { status: 500 }
    )
  }
}

// =============================================================================
// DELETE HANDLER - REMOVE MATERIAL USAGE
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
    const interventionId = parseInt(id, 10)

    if (isNaN(interventionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await request.json()
    const { materielId, quantiteUtilisee } = body as {
      materielId: number
      quantiteUtilisee: number
    }

    if (
      typeof materielId !== "number" ||
      typeof quantiteUtilisee !== "number" ||
      materielId <= 0 ||
      quantiteUtilisee <= 0
    ) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    const existing = await prisma.utilisationMateriel.findUnique({
      where: {
        materielId_interventionId: {
          materielId,
          interventionId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Utilisation non trouvée" },
        { status: 404 }
      )
    }

    await prisma.utilisationMateriel.delete({
      where: {
        materielId_interventionId: {
          materielId,
          interventionId,
        },
      },
    })

    await prisma.materiel.update({
      where: { id: materielId },
      data: {
        quantiteStock: { increment: quantiteUtilisee },
      },
    })

    return NextResponse.json(
      { message: "Utilisation supprimée, stock restauré" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deleting material usage:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    )
  }
}
