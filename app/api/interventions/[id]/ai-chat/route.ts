import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getOrCreateSession, addAiMessage, generateAiResponse } from "@/lib/ai/diagnostic"

async function verifyTechnicianAccess(interventionId: number, userId: string) {
  const intervention = await prisma.intervention.findUnique({
    where: { idIntervention: interventionId },
    select: { technicianId: true, idIntervention: true },
  })

  if (!intervention) {
    return { allowed: false, error: "Intervention non trouvée", status: 404 }
  }

  const session = await auth()
  const isTechnician = intervention.technicianId === userId
  const isAdmin = session?.user?.role === "ADMIN"

  if (!isTechnician && !isAdmin) {
    return { allowed: false, error: "Accès refusé - réservé au technicien", status: 403 }
  }

  return { allowed: true }
}

const sendMessageSchema = z.object({
  contenu: z.string().min(1, "Le message ne peut pas être vide").max(2000, "Le message est trop long"),
})

// =============================================================================
// GET: Returns or creates the AI chat session for this intervention
// =============================================================================
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "TECHNICIEN" && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé - réservé aux techniciens" },
        { status: 403 }
      )
    }

    const { id } = await params
    const interventionId = parseInt(id, 10)

    if (isNaN(interventionId)) {
      return NextResponse.json({ error: "ID d'intervention invalide" }, { status: 400 })
    }

    const accessResult = await verifyTechnicianAccess(interventionId, session.user.id)
    if (!accessResult.allowed) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status })
    }

    const intervention = await prisma.intervention.findUnique({
      where: { idIntervention: interventionId },
      include: {
        demande: {
          select: {
            equipement: {
              select: { type: true },
            },
          },
        },
      },
    })

    if (!intervention) {
      return NextResponse.json({ error: "Intervention non trouvée" }, { status: 404 })
    }

    const data = await getOrCreateSession(interventionId, session.user.id)

    return NextResponse.json({
      session: data,
      equipmentType: intervention.demande.equipement.type,
    })
  } catch (error) {
    console.error("Error in AI chat GET:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// =============================================================================
// POST: Sends a technician message and gets an AI response
// =============================================================================
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "TECHNICIEN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { id } = await params
    const interventionId = parseInt(id, 10)

    if (isNaN(interventionId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 })
    }

    const accessResult = await verifyTechnicianAccess(interventionId, session.user.id)
    if (!accessResult.allowed) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status })
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

    const data = await getOrCreateSession(interventionId, session.user.id)

    await addAiMessage(data.id, "TECHNICIEN", contenu)

    const intervention = await prisma.intervention.findUnique({
      where: { idIntervention: interventionId },
      include: {
        demande: {
          select: {
            equipement: {
              select: { type: true },
            },
          },
        },
      },
    })

    const equipmentType = intervention?.demande.equipement.type || "PRINTER"

    const aiResponse = await generateAiResponse(contenu, data, equipmentType)

    await addAiMessage(data.id, "ASSISTANT", aiResponse.content, {
      diagnostic: aiResponse.diagnostic,
      suggestedActions: aiResponse.suggestedActions,
    })

    const updatedSession = await getOrCreateSession(interventionId, session.user.id)

    return NextResponse.json({
      session: updatedSession,
      aiResponse: aiResponse,
    })
  } catch (error) {
    console.error("Error in AI chat POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

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
