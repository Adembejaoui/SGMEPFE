// =============================================================================
// COMMANDE STOCK [ID] API ROUTE - SGME
// =============================================================================
// Handles GET, PUT, DELETE for a single purchase order.

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCommandeSchema = z.object({
  quantiteCommandee: z.number().int().positive().optional(),
  fournisseur: z.string().optional().nullable(),
  statut: z.enum(["EN_ATTENTE", "RECUE", "ANNULEE"]).optional(),
  dateReception: z.coerce.date().optional().nullable(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const commandeId = parseInt(id, 10)

    if (isNaN(commandeId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const commande = await prisma.commandeStock.findUnique({
      where: { id: commandeId },
      include: {
        materiel: {
          select: {
            id: true,
            reference: true,
            nom: true,
            unite: true,
            type: true,
            quantiteStock: true,
          },
        },
      },
    })

    if (!commande) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    }

    return NextResponse.json(commande)
  } catch (error) {
    console.error("Error fetching commande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la commande" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const commandeId = parseInt(id, 10)

    if (isNaN(commandeId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const body = await request.json()
    const validationResult = updateCommandeSchema.safeParse(body)

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

    const existing = await prisma.commandeStock.findUnique({
      where: { id: commandeId },
      include: { materiel: true },
    })

    if (!existing) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (data.quantiteCommandee !== undefined) {
      updateData.quantiteCommandee = data.quantiteCommandee
    }
    if (data.fournisseur !== undefined) {
      updateData.fournisseur = data.fournisseur
    }
    if (data.statut !== undefined) {
      updateData.statut = data.statut
    }
    if (data.dateReception !== undefined) {
      updateData.dateReception = data.dateReception

      if (data.dateReception && existing.statut !== "RECUE") {
        updateData.statut = "RECUE"
      }
    }

    const updated = await prisma.commandeStock.update({
      where: { id: commandeId },
      data: updateData,
      include: {
        materiel: {
          select: {
            id: true,
            reference: true,
            nom: true,
            unite: true,
            type: true,
            quantiteStock: true,
          },
        },
      },
    })

    if (data.statut === "RECUE" && existing.statut !== "RECUE") {
      await prisma.materiel.update({
        where: { id: existing.materielId },
        data: {
          quantiteStock: { increment: existing.quantiteCommandee },
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating commande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la commande" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const commandeId = parseInt(id, 10)

    if (isNaN(commandeId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const existing = await prisma.commandeStock.findUnique({
      where: { id: commandeId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
    }

    if (existing.statut === "RECUE") {
      return NextResponse.json(
        { error: "Impossible de supprimer une commande déjà reçue" },
        { status: 400 }
      )
    }

    await prisma.commandeStock.delete({
      where: { id: commandeId },
    })

    return NextResponse.json({ message: "Commande supprimée avec succès" })
  } catch (error) {
    console.error("Error deleting commande:", error)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la commande" },
      { status: 500 }
    )
  }
}
