
// =============================================================================
// INTERVENTION PDF EXPORT - SGME
// =============================================================================

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import type { InterventionWithRelations } from "@/types/intervention"

// =============================================================================
// HELPER: Build PDF document
// =============================================================================
async function buildPDF(
  data: InterventionWithRelations,
  technicienNom: string
) {
  const pdfDoc = await PDFDocument.create()

  const page = pdfDoc.addPage([595.28, 841.89]) // A4

  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = height - 50

  // Colors
  const dark = rgb(0.12, 0.16, 0.23)
  const gray = rgb(0.4, 0.45, 0.5)
  const lightGray = rgb(0.9, 0.92, 0.95)
  const white = rgb(1, 1, 1)

  // =============================================================================
  // HEADER
  // =============================================================================

  page.drawRectangle({
    x: 0,
    y: height - 70,
    width,
    height: 70,
    color: dark,
  })

  page.drawText("RAPPORT D'INTERVENTION", {
    x: 150,
    y: height - 40,
    size: 20,
    font: boldFont,
    color: white,
  })

  page.drawText("SGME — Système de Gestion de Maintenance", {
    x: 135,
    y: height - 58,
    size: 10,
    font,
    color: rgb(0.8, 0.85, 0.9),
  })

  y -= 90

  // =============================================================================
  // HELPERS
  // =============================================================================

  const drawSection = (title: string) => {
    y -= 20

    page.drawText(title, {
      x: 50,
      y,
      size: 14,
      font: boldFont,
      color: dark,
    })

    y -= 8

    page.drawLine({
      start: { x: 50, y },
      end: { x: width - 50, y },
      thickness: 1,
      color: lightGray,
    })

    y -= 20
  }

  const drawField = (
    label: string,
    value: string | number | undefined | null
  ) => {
    page.drawText(`${label} :`, {
      x: 50,
      y,
      size: 10,
      font: boldFont,
      color: gray,
    })

    page.drawText(String(value ?? "—"), {
      x: 200,
      y,
      size: 10,
      font,
      color: dark,
      maxWidth: 320,
    })

    y -= 18
  }

  // =============================================================================
  // INFORMATIONS GÉNÉRALES
  // =============================================================================

  drawSection("Informations générales")

  drawField("Intervention #", data.idIntervention)
  drawField("Description", data.description)
  drawField("Statut intervention", data.statut)
  drawField("Technicien", technicienNom)

  drawField(
    "Date création",
    new Date(data.createdAt).toLocaleDateString("fr-FR")
  )

  // =============================================================================
  // DEMANDE
  // =============================================================================

  drawSection("Demande associée")

  drawField("N° Demande", data.demande.idDemande)

  drawField(
    "Date demande",
    new Date(data.demande.dateDemande).toLocaleDateString("fr-FR")
  )

  drawField("Statut demande", data.demande.statut)
  drawField("Priorité", data.demande.priorite)
  drawField("Description", data.demande.description)

  // =============================================================================
  // CLIENT
  // =============================================================================

  drawSection("Client")

  drawField("Nom", data.demande.client.nom)
  drawField("Prénom", data.demande.client.prenom)
  drawField("Email", data.demande.client.email)

  // =============================================================================
  // ÉQUIPEMENT
  // =============================================================================

  drawSection("Équipement concerné")

  drawField("Nom", data.demande.equipement.nom)
  drawField("Type", data.demande.equipement.type)
  drawField("Marque", data.demande.equipement.marque)
  drawField("Modèle", data.demande.equipement.modele)
  drawField("N° Série", data.demande.equipement.numeroSerie)
  drawField("État", data.demande.equipement.etat)
  drawField("Localisation", data.demande.equipement.localisation)

  // =============================================================================
  // RAPPORT
  // =============================================================================

  drawSection("Rapport de maintenance")

  if (data.rapportMaintenance) {
    drawField("Diagnostic", data.rapportMaintenance.diagnostic)

    drawField(
      "Actions effectuées",
      data.rapportMaintenance.actionsEffectuees
    )

    drawField("Résultat", data.rapportMaintenance.resultat)
  } else {
    page.drawText("Aucun rapport soumis", {
      x: 50,
      y,
      size: 10,
      font,
      color: gray,
    })

    y -= 18
  }

  // =============================================================================
  // FOOTER
  // =============================================================================

  page.drawText(
    `Document généré le ${new Date().toLocaleDateString(
      "fr-FR"
    )} — SGME`,
    {
      x: 150,
      y: 30,
      size: 8,
      font,
      color: gray,
    }
  )

  return await pdfDoc.save()
}

// =============================================================================
// GET: Export intervention as PDF
// =============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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

    const idIntervention = parseInt(id, 10)

    if (isNaN(idIntervention)) {
      return NextResponse.json(
        { error: "ID d'intervention invalide" },
        { status: 400 }
      )
    }

    const intervention = await prisma.intervention.findUnique({
      where: { idIntervention },

      include: {
        demande: {
          include: {
            client: {
              select: {
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

            rapportMaintenance: true,
          },
        },
      },
    })

    if (!intervention) {
      return NextResponse.json(
        { error: "Intervention non trouvée" },
        { status: 404 }
      )
    }



    const data: InterventionWithRelations = {
      idIntervention: intervention.idIntervention,
      demandeId: intervention.demandeId,

      technicienId: (intervention as any).technicianId,

      description: intervention.description || "",

      statut: intervention.statut,

      observation: intervention.observation,

      createdAt: intervention.createdAt,

      updatedAt: intervention.updatedAt,

      demande: {
        idDemande: intervention.demande.idDemande,

        description: intervention.demande.description,

        priorite: intervention.demande.priorite,

        statut: intervention.demande.statut,

        dateDemande: intervention.demande.dateDemande,

        client: {
          nom: intervention.demande.client.lastName,

          prenom: intervention.demande.client.firstName,

          email: intervention.demande.client.email,
        },

        equipement: {
          idEquipement: intervention.demande.equipement.id,

          nom: intervention.demande.equipement.nom,

          type: intervention.demande.equipement.type,

          marque: intervention.demande.equipement.marque,

          modele: intervention.demande.equipement.modele,

          numeroSerie:
            intervention.demande.equipement.numeroSerie,

          etat: intervention.demande.equipement.etat,

          localisation:
            intervention.demande.equipement.localisation,
        },
      },

      rapportMaintenance:
        intervention.demande.rapportMaintenance,
    }

    const technicienNom =
      session.user.name ||
      session.user.email?.split("@")[0] ||
      "Technicien"

    const pdfBytes = await buildPDF(data, technicienNom)

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",

        "Content-Disposition": `attachment; filename="intervention-${data.idIntervention}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)

    return NextResponse.json(
      { error: "Erreur lors de la génération du PDF" },
      { status: 500 }
    )
  }
}

