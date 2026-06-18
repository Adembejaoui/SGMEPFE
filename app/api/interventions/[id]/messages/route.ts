// =============================================================================
// MESSAGES API ROUTE - SGME
// =============================================================================
// Handles GET and POST operations for intervention messages.
// SECURITY: Only client (employee) and technician can access messages.
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================
const sendMessageSchema = z.object({
  contenu: z.string().min(1, "Le message ne peut pas être vide").max(2000, "Le message est trop long (max 2000 caractères)"),
})

// =============================================================================
// HELPER: VERIFY INTERVENTION ACCESS
// =============================================================================
async function verifyInterventionAccess(interventionId: number, userId: string) {
  const intervention = await prisma.intervention.findUnique({
    where: { idIntervention: interventionId },
    include: {
      demande: {
        select: { clientId: true },
      },
    },
  })

  if (!intervention) {
    return { allowed: false, error: "Intervention non trouvée", status: 404 }
  }

  // TECHNICIEN or ADMIN can access if they're the technician
  // EMPLOYE can access if they're the client who created the demande
  const session = await auth()
  const isTechnician = intervention.technicianId === userId
  const isClient = intervention.demande.clientId === userId
  const isAdmin = session?.user?.role === "ADMIN"

  if (!isTechnician && !isClient && !isAdmin) {
    return { allowed: false, error: "Accès refusé", status: 403 }
  }

  return { allowed: true, intervention }
}

// =============================================================================
// GET HANDLER
// =============================================================================
// Returns all messages for the intervention where user is client or technician.
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

    const { id } = await params
    const interventionId = parseInt(id, 10)

    if (isNaN(interventionId)) {
      return NextResponse.json(
        { error: "ID d'intervention invalide" },
        { status: 400 }
      )
    }

    const access = await verifyInterventionAccess(interventionId, session.user.id)
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    const messages = await prisma.message.findMany({
      where: { interventionId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    )
  }
}

// =============================================================================
// POST HANDLER
// =============================================================================
// Creates a new message for the intervention.
// =============================================================================
export async function POST(
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

    const { id } = await params
    const interventionId = parseInt(id, 10)

    if (isNaN(interventionId)) {
      return NextResponse.json(
        { error: "ID d'intervention invalide" },
        { status: 400 }
      )
    }

    const access = await verifyInterventionAccess(interventionId, session.user.id)
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.error },
        { status: access.status }
      )
    }

    const body = await request.json()
    const validation = sendMessageSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      )
    }

    const { contenu } = validation.data

    const message = await prisma.message.create({
      data: {
        interventionId,
        senderId: session.user.id,
        contenu,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error("Error creating message:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    )
  }
}

// =============================================================================
// OPTIONS HANDLER
// =============================================================================
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}