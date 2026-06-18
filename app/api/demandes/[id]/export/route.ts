import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { PDFFont } from "pdf-lib"

type DemandeExport = {
  idDemande: number
  description: string
  priorite: string
  statut: string
  dateDemande: Date
  createdAt: Date
  updatedAt: Date
  client: {
    firstName: string
    lastName: string
    email: string
  }
  equipement: {
    id: number
    nom: string
    type: string
    marque: string
    modele: string
    numeroSerie: string
    etat: string
    localisation: string
  }
  technician: {
    firstName: string
    lastName: string
    email: string
  } | null
  interventions: {
    idIntervention: number
    description: string
    statut: string
    observation: string | null
    createdAt: Date
    updatedAt: Date
    technician: {
      firstName: string
      lastName: string
      email: string
    } | null
  }[]
  rapportMaintenance: {
    diagnostic: string
    actionsEffectuees: string
    resultat: string
    dateCreation: Date
    dateModification: Date
  } | null
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatShortDate(date: Date) {
  return new Date(date).toLocaleDateString("fr-FR")
}

function userName(user: { firstName: string; lastName: string } | null) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : "Non assigné"
}

async function buildPDF(data: DemandeExport, employeNom: string) {
  const pdfDoc = await PDFDocument.create()
  const [pageWidth, pageHeight] = [595.28, 841.89]
  const margin = 50
  const dark = rgb(0.12, 0.16, 0.23)
  const gray = rgb(0.4, 0.45, 0.5)
  const lightGray = rgb(0.9, 0.92, 0.95)
  const white = rgb(1, 1, 1)
  const accent = rgb(0.08, 0.35, 0.75)

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const { width, height } = page.getSize()

  const drawHeader = () => {
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width,
      height: 70,
      color: dark,
    })

    page.drawText("DEMANDE DE MAINTENANCE", {
      x: 50,
      y: height - 40,
      size: 20,
      font: boldFont,
      color: white,
    })

    page.drawText("SGME — Système de Gestion de Maintenance", {
      x: 50,
      y: height - 58,
      size: 10,
      font,
      color: rgb(0.8, 0.85, 0.9),
    })

    page.drawText(`Demande #${data.idDemande}`, {
      x: width - 160,
      y: height - 40,
      size: 12,
      font: boldFont,
      color: white,
    })
  }

  const drawFooter = () => {
    page.drawLine({
      start: { x: margin, y: 35 },
      end: { x: width - margin, y: 35 },
      thickness: 0.5,
      color: lightGray,
    })

    page.drawText("Document généré le " + new Date().toLocaleDateString("fr-FR") + " — SGME", {
      x: margin,
      y: 22,
      size: 8,
      font,
      color: gray,
    })

    page.drawText(`Page ${pdfDoc.getPageCount()}`, {
      x: width - 80,
      y: 22,
      size: 8,
      font,
      color: gray,
    })
  }

  drawHeader()

  const addPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight])
    y = pageHeight - margin
    drawHeader()
  }

  const ensureSpace = (space: number) => {
    if (y - space < 95) {
      drawFooter()
      addPage()
    }
  }

  const drawWrappedText = (
    text: string | number | null | undefined,
    x: number,
    currentY: number,
    maxWidth: number,
    size: number,
    targetFont: PDFFont,
    color = dark,
    leading = 13
  ) => {
    const words = String(text ?? "—").split(/\s+/).filter(Boolean)
    let line = ""
    let nextY = currentY

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word

      if (targetFont.widthOfTextAtSize(testLine, size) > maxWidth && line) {
        page.drawText(line, { x, y: nextY, size, font: targetFont, color })
        nextY -= leading
        line = word
      } else {
        line = testLine
      }
    }

    if (line) {
      page.drawText(line, { x, y: nextY, size, font: targetFont, color })
      nextY -= leading
    }

    return nextY
  }

  const drawSection = (title: string) => {
    ensureSpace(120)

    y -= 12

    page.drawText(title, {
      x: margin,
      y,
      size: 14,
      font: boldFont,
      color: accent,
    })

    y -= 8

    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: lightGray,
    })

    y -= 18
  }

  const drawField = (
    label: string,
    value: string | number | null | undefined
  ) => {
    ensureSpace(55)

    page.drawText(label, {
      x: margin,
      y,
      size: 10,
      font: boldFont,
      color: gray,
    })

    y -= 14

    y = drawWrappedText(value, margin, y, width - margin * 2, 10, font, dark, 13)
    y -= 7
  }

  const drawSubsection = (title: string) => {
    ensureSpace(110)

    y -= 4

    page.drawText(title, {
      x: margin,
      y,
      size: 12,
      font: boldFont,
      color: dark,
    })

    y -= 18
  }

  drawSection("Informations générales")
  drawField("Description", data.description)
  drawField("Priorité", data.priorite)
  drawField("Statut demande", data.statut)
  drawField("Date de demande", formatDate(data.dateDemande))
  drawField("Créée le", formatDate(data.createdAt))
  drawField("Dernière mise à jour", formatDate(data.updatedAt))

  drawSection("Client")
  drawField("Nom complet", `${data.client.firstName} ${data.client.lastName}`.trim())
  drawField("Email", data.client.email)

  drawSection("Technicien assigné")
  drawField("Technicien", userName(data.technician))
  if (data.technician) {
    drawField("Email technicien", data.technician.email)
  }

  drawSection("Équipement concerné")
  drawField("Nom", data.equipement.nom)
  drawField("Type", data.equipement.type)
  drawField("Marque", data.equipement.marque)
  drawField("Modèle", data.equipement.modele)
  drawField("N° de série", data.equipement.numeroSerie)
  drawField("État", data.equipement.etat)
  drawField("Localisation", data.equipement.localisation)

  drawSection("Interventions")

  if (data.interventions.length === 0) {
    ensureSpace(55)
    page.drawText("Aucune intervention enregistrée.", {
      x: margin,
      y,
      size: 10,
      font,
      color: gray,
    })
    y -= 20
  } else {
    data.interventions.forEach((intervention, index) => {
      drawSubsection(`Intervention #${intervention.idIntervention}`)
      drawField("Statut intervention", intervention.statut)
      drawField("Description", intervention.description || "Intervention")
      drawField("Observation", intervention.observation || "Aucune observation")
      drawField("Technicien", userName(intervention.technician))
      drawField("Date intervention", formatShortDate(intervention.createdAt))
      drawField("Dernière mise à jour", formatShortDate(intervention.updatedAt))

      if (index < data.interventions.length - 1) {
        y -= 6
      }
    })
  }

  drawSection("Rapport de maintenance")

  if (data.rapportMaintenance) {
    drawField("Diagnostic", data.rapportMaintenance.diagnostic)
    drawField("Actions effectuées", data.rapportMaintenance.actionsEffectuees)
    drawField("Résultat", data.rapportMaintenance.resultat)
    drawField("Date de création", formatShortDate(data.rapportMaintenance.dateCreation))
    drawField("Date de modification", formatShortDate(data.rapportMaintenance.dateModification))
  } else {
    ensureSpace(55)
    page.drawText("Aucun rapport soumis.", {
      x: margin,
      y,
      size: 10,
      font,
      color: gray,
    })
    y -= 20
  }

  ensureSpace(95)
  page.drawText("Émis à l'attention de " + employeNom, {
    x: margin,
    y,
    size: 10,
    font,
    color: gray,
  })

  drawFooter()

  return await pdfDoc.save()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    if (session.user.role !== "EMPLOYE") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { id } = await params
    const idDemande = parseInt(id, 10)

    if (isNaN(idDemande)) {
      return NextResponse.json({ error: "ID de demande invalide" }, { status: 400 })
    }

    const demande = await prisma.demandeMaintenance.findUnique({
      where: { idDemande },
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
            marque: true,
            modele: true,
            numeroSerie: true,
            etat: true,
            localisation: true,
          },
        },
        technician: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        interventions: {
          orderBy: { createdAt: "asc" },
          select: {
            idIntervention: true,
            description: true,
            statut: true,
            observation: true,
            createdAt: true,
            updatedAt: true,
            technician: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        rapportMaintenance: true,
      },
    })

    if (!demande) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
    }

    if (demande.clientId !== session.user.id) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
    }

    const data: DemandeExport = {
      idDemande: demande.idDemande,
      description: demande.description,
      priorite: demande.priorite,
      statut: demande.statut,
      dateDemande: demande.dateDemande,
      createdAt: demande.createdAt,
      updatedAt: demande.updatedAt,
      client: {
        firstName: demande.client.firstName,
        lastName: demande.client.lastName,
        email: demande.client.email,
      },
      equipement: {
        id: demande.equipement.id,
        nom: demande.equipement.nom,
        type: demande.equipement.type,
        marque: demande.equipement.marque,
        modele: demande.equipement.modele,
        numeroSerie: demande.equipement.numeroSerie,
        etat: demande.equipement.etat,
        localisation: demande.equipement.localisation,
      },
      technician: demande.technician,
      interventions: demande.interventions,
      rapportMaintenance: demande.rapportMaintenance,
    }

    const employeNom =
      `${session.user.name || ""}`.trim() ||
      session.user.email?.split("@")[0] ||
      "Employé"

    const pdfBytes = await buildPDF(data, employeNom)

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="demande-${data.idDemande}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating demande PDF:", error)

    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    )
  }
}
