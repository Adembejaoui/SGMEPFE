import type { AiChatSessionWithMessages, AiMessageWithSession } from "@/types/intervention"
import { prisma } from "@/lib/prisma"

// =============================================================================
// AI DIAGNOSTIC ENGINE — SGME
// Knowledge base for equipment troubleshooting by type
// =============================================================================

const EQUIPMENT_KNOWLEDGE: Record<string, {
  title: string
  symptoms: { id: string; label: string }[]
  causes: { id: string; label: string; symptoms: string[]; verification: string }[]
  questions: { id: string; text: string }[]
}> = {
  PRINTER: {
    title: "Imprimante",
    symptoms: [
      { id: "no_power", label: "Pas d'alimentation" },
      { id: "no_print", label: "Impossible d'imprimer" },
      { id: "paper_jam", label: "Bourrage papier" },
      { id: "poor_quality", label: "Qualité d'impression mauvaise" },
      { id: "error_light", label: "Voyant d'erreur allumé" },
      { id: "no_response", label: "Pas de réponse" },
      { id: "no_ink", label: "Manque d'encre/toner" },
      { id: "strange_noise", label: "Bruit anormal" },
    ],
    causes: [
      {
        id: "power_supply",
        label: "Problème d'alimentation électrique",
        symptoms: ["no_power", "no_response"],
        verification: "Vérifier le câble d'alimentation et la prise murale. Tester avec une autre prise.",
      },
      {
        id: "paper_jam",
        label: "Bourrage papier dans le mécanisme",
        symptoms: ["paper_jam", "error_light", "no_print"],
        verification: "Ouvrir tous les bacs et voies d'accès papier. Retirer tout papier coincé.",
      },
      {
        id: "empty_toner",
        label: "Cartouche d'encre/toner vide",
        symptoms: ["no_ink", "poor_quality", "error_light"],
        verification: "Vérifier le niveau de toner/ink sur l'écran ou via le logiciel de gestion.",
      },
      {
        id: "drum_worn",
        label: "Tambour (drum) usé",
        symptoms: ["poor_quality", "strange_noise"],
        verification: "Inspecter les sorties pour traces de lignes ou points noirs.",
      },
      {
        id: "driver_issue",
        label: "Problème pilote d'impression",
        symptoms: ["no_print", "no_response"],
        verification: "Réinstaller le pilote depuis le site du fabricant.",
      },
      {
        id: "network_issue",
        label: "Connexion réseau défaillante",
        symptoms: ["no_print", "error_light"],
        verification: "Vérifier le câble réseau ou la connexion WiFi de l'imprimante.",
      },
    ],
    questions: [
      { id: "q_power", text: "L'imprimante est-elle sous tension ?" },
      { id: "q_led", text: "Quel voyant est allumé sur l'imprimante ?" },
      { id: "q_printed", text: "Un document s'imprime-t-il partiellement ou pas du tout ?" },
      { id: "q_quality", text: "Y a-t-il des traces ou des lignes sur les pages imprimées ?" },
      { id: "q_ink", text: "Avez-vous vérifié le niveau d'encre/toner ?" },
      { id: "q_network", text: "L'imprimante est-elle connectée en réseau ou en USB ?" },
    ],
  },
  NETWORK: {
    title: "Réseau",
    symptoms: [
      { id: "no_connection", label: "Pas de connexion internet" },
      { id: "slow_network", label: "Réseau lent" },
      { id: "intermittent", label: "Connexion intermittente" },
      { id: "no_access_server", label: "Accès serveur impossible" },
      { id: "dns_fail", label: "Résolution DNS échoue" },
      { id: "wifi_off", label: "WiFi non détecté" },
      { id: "vpn_issue", label: "VPN ne se connecte pas" },
    ],
    causes: [
      {
        id: "cable_damaged",
        label: "Câble réseau endommagé",
        symptoms: ["no_connection", "intermittent", "slow_network"],
        verification: "Remplacer le câble RJ45 par un neuf et vérifier les connecteurs.",
      },
      {
        id: "router_fail",
        label: "Panne routeur/switch",
        symptoms: ["no_connection", "no_access_server", "wifi_off"],
        verification: "Redémarrer le routeur. Vérifier les voyants (PWR, LAN, WAN).",
      },
      {
        id: "dns_issue",
        label: "Problème de configuration DNS",
        symptoms: ["dns_fail", "no_connection"],
        verification: "Tester avec 8.8.8.8 en DNS. Vérifier la config sur le poste et le DHCP.",
      },
      {
        id: "wifi_signal",
        label: "Signal WiFi faible",
        symptoms: ["wifi_off", "slow_network", "intermittent"],
        verification: "Mesurer la puissance du signal. Vérifier les obstacles et la distance.",
      },
      {
        id: "firewall_block",
        label: "Règles de pare-feu bloquantes",
        symptoms: ["no_access_server", "vpn_issue"],
        verification: "Tester en désactivant temporairement le pare-feu local.",
      },
      {
        id: "dhcp_conflict",
        label: "Conflit d'adresse IP / DHCP",
        symptoms: ["no_connection", "intermittent", "no_access_server"],
        verification: "ipconfig /release et /renew. Vérifier la plage IP disponible.",
      },
    ],
    questions: [
      { id: "q_wifi", text: "Le problème concerne le WiFi ou le câble Ethernet ?" },
      { id: "q_scope", text: "Est-ce que le problème affecte un seul poste ou plusieurs ?" },
      { id: "q_router", text: "Les voyants du routeur/switch sont-ils tous allumés normalement ?" },
      { id: "q_cable", text: "Le câble réseau est-il solidement branché des deux côtés ?" },
      { id: "q_speed", text: "La connexion est-elle lente dès le matin ou seulement à certaines heures ?" },
    ],
  },
  HVAC: {
    title: "Climatisation / CVC",
    symptoms: [
      { id: "no_cooling", label: "Pas de refroidissement" },
      { id: "no_heating", label: "Pas de chauffage" },
      { id: "strange_noise_hvac", label: "Bruit anormal" },
      { id: "water_leak", label: "Fuite d'eau" },
      { id: "bad_smell", label: "Odeur anormale" },
      { id: "not_starting", label: "Ne démarre pas" },
      { id: "high_bill", label: "Consommation électrique élevée" },
    ],
    causes: [
      {
        id: "filter_clogged",
        label: "Filtres à air obstrués",
        symptoms: ["no_cooling", "high_bill", "bad_smell"],
        verification: "Inspecter et remplacer les filtres à air.",
      },
      {
        id: "refrigerant_leak",
        label: "Fuite de fluide frigorigène",
        symptoms: ["no_cooling", "no_heating"],
        verification: "Vérifier les pressions côté HP et BP avec un manomètre.",
      },
      {
        id: "compressor_fail",
        label: "Compresseur défectueux",
        symptoms: ["not_starting", "strange_noise_hvac", "no_cooling"],
        verification: "Écouter le compresseur au démarrage. Vérifier le condensateur.",
      },
      {
        id: "clogged_drain",
        label: "Conduit de condensation bouché",
        symptoms: ["water_leak", "bad_smell"],
        verification: "Nettoyer le tuyau de drainage et vérifier le bac de récupération.",
      },
      {
        id: "thermostat_fail",
        label: "Thermostat / carte électronique défectueuse",
        symptoms: ["not_starting", "not_starting", "strange_noise_hvac"],
        verification: "Tester le thermostat avec un ohmmètre. Vérifier les connexions.",
      },
    ],
    questions: [
      { id: "q_type", text: "Quel type d'équipement CVC (split, gainable, VRV) ?" },
      { id: "q_issue", text: "Le problème est-il le froid, le chaud, ou les deux ?" },
      { id: "q_noise", text: "Entendez-vous un bruit anormal (grésillement, claquement) ?" },
      { id: "q_leak", text: "Y a-t-il des traces d'eau visibles ?" },
      { id: "q_filters", text: "Quand ont été changés les filtres pour la dernière fois ?" },
    ],
  },
  ELECTRICAL: {
    title: "Électrique",
    symptoms: [
      { id: "no_power_elec", label: "Pas d'alimentation" },
      { id: "breaker_trips", label: "Disjoncteur qui saute" },
      { id: "sparks", label: "Étincelles / Arc électrique" },
      { id: "burns", label: "Odeur de brûlé / traces de chauffe" },
      { id: "flicker", label: "Éclairage qui clignote" },
      { id: "outlet_dead", label: "Prise électrique sans courant" },
    ],
    causes: [
      {
        id: "overload",
        label: "Surcharge du circuit",
        symptoms: ["breaker_trips", "flicker"],
        verification: "Identifier et réduire la charge connectée sur le circuit concerné.",
      },
      {
        id: "short_circuit",
        label: "Court-circuit",
        symptoms: ["breaker_trips", "sparks", "burns"],
        verification: "Déconnecter l'alimentation. Inspecter les câbles et appareils.",
      },
      {
        id: "outlet_fault",
        label: "Prise ou point de connexion défectueux",
        symptoms: ["outlet_dead", "sparks", "burns"],
        verification: "Tester la continuité de la prise. Remplacer si défectueuse.",
      },
      {
        id: "loose_wire",
        label: "Connexion desserrée",
        symptoms: ["flicker", "outlet_dead", "breaker_trips"],
        verification: "Vérifier toutes les connexions au tableau électrique.",
      },
      {
        id: "breaker_fault",
        label: "Disjoncteur défectueux",
        symptoms: ["breaker_trips", "no_power_elec"],
        verification: "Remplacer le disjoncteur par un modèle identique.",
      },
    ],
    questions: [
      { id: "q_zone", text: "Quelle zone ou quel circuit est concerné ?" },
      { id: "q_scope_elec", text: "Le problème touche-t-il tout le bâtiment ou seulement une zone ?" },
      { id: "q_breaker", text: "Quel disjoncteur a sauté et à quelle intensité (10A, 16A, 20A) ?" },
      { id: "q_smoke", text: "Voyez-vous des traces de chauffe ou sentez-vous une odeur de brûlé ?" },
    ],
  },
  SECURITY: {
    title: "Sécurité",
    symptoms: [
      { id: "cam_offline", label: "Caméra hors ligne" },
      { id: "no_motion", label: "Pas de détection de mouvement" },
      { id: "alarm_false", label: "Fausse alarme" },
      { id: "access_fail", label: "Badge/accès non reconnu" },
      { id: "recorder_off", label: "Enregistreur arrêté" },
      { id: "audio_issue", label: "Problème audio (interphone)" },
    ],
    causes: [
      {
        id: "connectivity",
        label: "Perte de connectivité réseau",
        symptoms: ["cam_offline", "recorder_off"],
        verification: "Vérifier le câble réseau, l'adresse IP et le switch POE.",
      },
      {
        id: "poe_issue",
        label: "Alimentation POE défaillante",
        symptoms: ["cam_offline", "no_motion"],
        verification: "Tester le port POE du switch ou injecteur POE.",
      },
      {
        id: "sensor_dirty",
        label: "Capteur IR/détecteur sale ou mal positionné",
        symptoms: ["no_motion", "alarm_false"],
        verification: "Nettoyer l'optique du capteur et vérifier l'angle de détection.",
      },
      {
        id: "reader_fault",
        label: "Lecteur de badge défectueux",
        symptoms: ["access_fail", "no_motion"],
        verification: "Tester avec un badge connu. Vérifier le câblage du lecteur.",
      },
      {
        id: "storage_full",
        label: "Stockage disque plein",
        symptoms: ["recorder_off", "no_motion"],
        verification: "Vérifier l'espace disque du NVR et purger les anciennes séquences.",
      },
    ],
    questions: [
      { id: "q_device", text: "Quel équipement est concerné (caméra, alarme, lecteur) ?" },
      { id: "q_scope_sec", text: "Est-ce un seul équipement ou plusieurs sur la même zone ?" },
      { id: "q_power_sec", text: "Les voyants de l'équipement sont-ils allumés ?" },
      { id: "q_event", text: "Quel événement a précédé la panne (orage, coupure, maintenance) ?" },
    ],
  },
}

// =============================================================================
// AI SERVICE FUNCTIONS
// =============================================================================

async function getEquipmentTypeTitle(type: string): Promise<string> {
  return EQUIPMENT_KNOWLEDGE[type]?.title || "Équipement"
}

function getInitialQuestions(equipementType: string) {
  return (
    EQUIPMENT_KNOWLEDGE[equipementType.toUpperCase()]?.questions ||
    EQUIPMENT_KNOWLEDGE["PRINTER"]?.questions ||
    []
  )
}

function getSymptoms(equipementType: string) {
  return (
    EQUIPMENT_KNOWLEDGE[equipementType.toUpperCase()]?.symptoms ||
    EQUIPMENT_KNOWLEDGE["PRINTER"]?.symptoms ||
    []
  )
}

function matchCausesToSymptoms(
  equipementType: string,
  selectedSymptomIds: string[]
): { id: string; label: string; verification: string }[] {
  const causes = EQUIPMENT_KNOWLEDGE[equipementType.toUpperCase()]?.causes || EQUIPMENT_KNOWLEDGE["PRINTER"]?.causes || []
  const selected = new Set(selectedSymptomIds)

  const scored = causes
    .map((cause) => {
      const matchCount = cause.symptoms.filter((s) => selected.has(s)).length
      const confidence = matchCount / Math.max(cause.symptoms.length, 1)
      return { ...cause, confidence, matchCount }
    })
    .filter((c) => c.matchCount > 0)
    .sort((a, b) => b.confidence - a.confidence)

  return scored.slice(0, 3)
}

export async function getAiChatSessions(
  technicianId: string,
  interventionId?: number
): Promise<AiChatSessionWithMessages[]> {
  const where: any = { technicianId }
  if (interventionId) {
    where.interventionId = interventionId
  }

  const sessions = await prisma.aiChatSession.findMany({
    where,
    include: {
      intervention: {
        include: {
          demande: {
            select: {
              idDemande: true,
              description: true,
              equipement: {
                select: {
                  nom: true,
                  type: true,
                },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return sessions
}

export async function getOrCreateSession(
  interventionId: number,
  technicianId: string
): Promise<AiChatSessionWithMessages> {
  const session = await prisma.aiChatSession.findUnique({
    where: {
      interventionId_technicianId: {
        interventionId,
        technicianId,
      },
    },
    include: {
      intervention: {
        include: {
          demande: {
            select: {
              idDemande: true,
              description: true,
              equipement: {
                select: {
                  nom: true,
                  type: true,
                },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (session) return session

  return prisma.aiChatSession.create({
    data: {
      interventionId,
      technicianId,
    },
    include: {
      intervention: {
        include: {
          demande: {
            select: {
              idDemande: true,
              description: true,
              equipement: {
                select: {
                  nom: true,
                  type: true,
                },
              },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  })
}

export async function addAiMessage(
  sessionId: string,
  role: "TECHNICIEN" | "ASSISTANT",
  contenu: string,
  extra?: {
    diagnostic?: string
    suggestedActions?: string
  }
) {
  return prisma.aiMessage.create({
    data: {
      sessionId,
      role,
      contenu,
      diagnostic: extra?.diagnostic,
      suggestedActions: extra?.suggestedActions,
    },
  })
}

// =============================================================================
// AI ENGINE: generates a diagnostic response
// =============================================================================

export async function generateAiResponse(
  technicianMessage: string,
  session: AiChatSessionWithMessages,
  equipementType: string
): Promise<{
  content: string
  diagnostic?: string
  suggestedActions?: string
}> {
  const conversationHistory = session.messages.filter((m) => m.role === "TECHNICIEN")
  const assistantMessages = session.messages.filter((m) => m.role === "ASSISTANT")
  const isFirstTechnicianMessage = conversationHistory.length <= 1

  const equipmentType = (equipementType || "PRINTER").toUpperCase()

  // ---------------------------------------------------------------
  // STAGE 1: First interaction — present equipment context + questions
  // ---------------------------------------------------------------
  if (isFirstTechnicianMessage) {
    const description = session.intervention.demande.description || ""
    const equipmentName = session.intervention.demande.equipement.nom
    const questions = EQUIPMENT_KNOWLEDGE[equipmentType]?.questions || EQUIPMENT_KNOWLEDGE["PRINTER"]?.questions
    const questionsText = questions
      .map((q, i) => `${i + 1}. ${q.text}`)
      .join("\n")

    const response = `📋 **${EQUIPMENT_KNOWLEDGE[equipmentType]?.title || "Équipement"} — Analyse préliminaire**

Je vois que vous intervenez sur : **${equipmentName}**

Description de la demande : _${description.slice(0, 200)}${description.length > 200 ? "..." : ""}_

Pour affiner mon diagnostic, pouvez-vous me répondre sur ces points :

${questionsText}

N'hésitez pas à ajouter toute information supplémentaire (bruit, erreur affichée, circonstances de la panne).`

    return {
      content: response,
    }
  }

  // ---------------------------------------------------------------
  // STAGE 2: Second interaction — ask about symptoms
  // ---------------------------------------------------------------
  if (conversationHistory.length === 2 && !assistantMessages.some((m) => m.diagnostic)) {
    const symptoms = EQUIPMENT_KNOWLEDGE[equipmentType]?.symptoms || EQUIPMENT_KNOWLEDGE["PRINTER"]?.symptoms
    const symptomsText = symptoms.map((s) => `• ${s.label} (${s.id})`).join("\n")

    const response = `🔍 **Sélection des symptômes**

Merci. Maintenant, parmi ces symptômes possibles, lesquels correspondent à ce que vous observez ? Répondez avec les codes ou les descriptions :

${symptomsText}

Si vous ne voyez pas votre symptôme, décrivez-le librement.`

    return {
      content: response,
    }
  }

  // ---------------------------------------------------------------
  // STAGE 3: Third interaction — build diagnostic from symptoms
  // ---------------------------------------------------------------
  if (conversationHistory.length === 3) {
    const selectedSymptomText = technicianMessage.toLowerCase()
    const allSymptoms = EQUIPMENT_KNOWLEDGE[equipmentType]?.symptoms || []
    const matchedSymptomIds = allSymptoms
      .filter((s) =>
        selectedSymptomText.includes(s.id) ||
        s.label.toLowerCase().split(" ").some((word) => selectedSymptomText.includes(word))
      )
      .map((s) => s.id)

    const matched = matchCausesToSymptoms(equipmentType, matchedSymptomIds)

    const topCause = matched[0]
    const secondaryCauses = matched.slice(1)
    let diagnostic = ""

    if (topCause) {
      diagnostic = topCause.label
      const diagnosticText = `🎯 **Diagnostic probable**

**Cause principale :** ${topCause.label}
**Vérification :** ${topCause.verification}

${
  secondaryCauses.length > 0
    ? `**Causes alternatives possibles :**\n${secondaryCauses
        .map((c) => `• ${c.label} — ${c.verification}`)
        .join("\n")}`
    : ""
}

Ai-je bon ? Si oui, je peux vous proposer les actions correctives. Sinon, décrivez ce que vous avez déjà vérifié.`

      return {
        content: diagnosticText,
        diagnostic: topCause.label,
        suggestedActions: [topCause.verification, ...secondaryCauses.map((c) => c.verification)].join("\n"),
      }
    }

    // Fallback: no symptom match found
    const fallbackResponse = `Je n'ai pas pu associer clairement vos symptômes à une cause spécifique dans ma base de données. Voici quelques vérifications générales :

1. Vérifiez l'alimentation et les connexions (câbles, prises)
2. Consultez le manuel de l'équipement pour les codes d'erreur
3. Notez tout code d'erreur ou message affiché sur l'équipement

Pouvez-vous me décrire plus précisément ce qui s'est passé ? (bruit, message d'erreur, circonstances)`

    return {
      content: fallbackResponse,
    }
  }

  // ---------------------------------------------------------------
  // STAGE 4: Subsequent interactions — contextual help
  // ---------------------------------------------------------------
  const lowerInput = technicianMessage.toLowerCase()

  // Check for confirmation of diagnostic
  const confirmPatterns = ["oui", "correct", "c'est ça", "exact", "ça marche", "bon diagnostic", "oui c'est ça"]
  const isConfirmed = confirmPatterns.some((p) => lowerInput.includes(p))

  if (isConfirmed && assistantMessages.some((m) => m.diagnostic)) {
    const diagnosticActions = assistantMessages
      .filter((m) => m.suggestedActions)
      .slice(-1)
      .map((m) => m.suggestedActions)
      .join("\n")

    const response = `✅ **Plan d'action recommandé**

D'après le diagnostic retenu, voici les étapes à suivre :

${diagnosticActions}

**Matériel à prévoir :**
• Outils de base (tournevis, multimètre)
• Pièces de rechange selon la cause identifiée

**Consignes de sécurité :**
• Coupez l'alimentation avant toute intervention interne
• Portez les EPI adaptés
• Testez l'équipement après chaque action

Souhaitez-vous que je vous détaille une étape en particulier ?`

    return {
      content: response,
    }
  }

  // General fallback for other messages
  const generalResponse = `Je comprends. Voici quelques pistes supplémentaires :

• Vérifiez le manuel d'utilisation de l'équipement : **${session.intervention.demande.equipement.nom}**
• Consultez la section "dépannage" du fabricant
• Vérifiez les historiques de maintenance précédents

Souhaitez-vous :
1. Explorer une cause spécifique ?
2. Obtenir la liste des vérifications à effectuer ?
3. Consulter les pièces de rechange courantes pour ce type d'équipement ?`

  return {
    content: generalResponse,
  }
}

function isAiChatMessage(message: any): boolean {
  return (
    message &&
    typeof message.role === "string" &&
    ["TECHNICIEN", "ASSISTANT"].includes(message.role)
  )
}