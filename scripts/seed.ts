import "dotenv/config"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

async function main() {
  console.log("🌱 Starting full database seed...")

  try {
    // Clear existing data (order matters for FK constraints)
    console.log("🧹 Cleaning existing data...")
    await prisma.aiMessage.deleteMany()
    await prisma.aiChatSession.deleteMany()
    await prisma.utilisationMateriel.deleteMany()
    await prisma.intervention.deleteMany()
    await prisma.commandeStock.deleteMany()
    await prisma.rapportMaintenance.deleteMany()
    await prisma.demandeMaintenance.deleteMany()
    await prisma.materiel.deleteMany()
    await prisma.equipement.deleteMany()
    await prisma.message.deleteMany()
    await prisma.session.deleteMany()
    await prisma.account.deleteMany()
    await prisma.verificationToken.deleteMany()
    await prisma.user.deleteMany()

    // Hash password
    const hashedPassword = await bcrypt.hash("12345678", 12)

    // =============================================================================
    // 1. CREATE USERS (1 ADMIN, multiple TECHNICIEN, multiple EMPLOYE)
    // =============================================================================
    console.log("👥 Creating users...")

    // 1 ADMIN
    const admin = await prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: "SGME",
        email: "admin@gmail.com",
        password: hashedPassword,
        phone: "0600000001",
        role: "ADMIN",
        isActive: true,
        mustChangePassword: true,
      },
    })
    console.log("   ✅ Admin: admin@gmail.com")

    // TECHNICIENS
    const technicians = await Promise.all([
      prisma.user.create({
        data: {
          firstName: "Karim",
          lastName: "Benani",
          email: "technicien1@gmail.com",
          password: hashedPassword,
          phone: "0600000002",
          role: "TECHNICIEN",
          isActive: true,
          mustChangePassword: false,
          specialization: "ELECTRICAL",
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Samira",
          lastName: "Moumen",
          email: "technicien2@gmail.com",
          password: hashedPassword,
          phone: "0600000003",
          role: "TECHNICIEN",
          isActive: true,
          mustChangePassword: false,
          specialization: "NETWORK",
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Yassine",
          lastName: "Khaldi",
          email: "technicien3@gmail.com",
          password: hashedPassword,
          phone: "0600000004",
          role: "TECHNICIEN",
          isActive: true,
          mustChangePassword: false,
          specialization: "HVAC",
        },
      }),
    ])
    technicians.forEach((t) => console.log(`   ✅ Technicien: ${t.email}`))

    // EMPLOYES
    const employees = await Promise.all([
      prisma.user.create({
        data: {
          firstName: "Sonia",
          lastName: "Bouazizi",
          email: "employe1@gmail.com",
          password: hashedPassword,
          phone: "0600000005",
          role: "EMPLOYE",
          isActive: true,
          mustChangePassword: false,
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Mehdi",
          lastName: "Rached",
          email: "employe2@gmail.com",
          password: hashedPassword,
          phone: "0600000006",
          role: "EMPLOYE",
          isActive: true,
          mustChangePassword: false,
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Leila",
          lastName: "Haddad",
          email: "employe3@gmail.com",
          password: hashedPassword,
          phone: "0600000007",
          role: "EMPLOYE",
          isActive: true,
          mustChangePassword: false,
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Omar",
          lastName: "Farhat",
          email: "employe4@gmail.com",
          password: hashedPassword,
          phone: "0600000008",
          role: "EMPLOYE",
          isActive: true,
          mustChangePassword: false,
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Nadia",
          lastName: "Zerhouni",
          email: "employe5@gmail.com",
          password: hashedPassword,
          phone: "0600000009",
          role: "EMPLOYE",
          isActive: true,
          mustChangePassword: false,
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Rami",
          lastName: "Dahmani",
          email: "employe6@gmail.com",
          password: hashedPassword,
          phone: "0600000010",
          role: "EMPLOYE",
          isActive: true,
          mustChangePassword: false,
        },
      }),
      prisma.user.create({
        data: {
          firstName: "Ines",
          lastName: "Trabelsi",
          email: "employe7@gmail.com",
          password: hashedPassword,
          phone: "0600000011",
          role: "EMPLOYE",
          isActive: true,
          mustChangePassword: false,
        },
      }),
    ])
    employees.forEach((e) => console.log(`   ✅ Employé: ${e.email}`))

    // =============================================================================
    // 2. CREATE EQUIPEMENTS (need adminId)
    // =============================================================================
    console.log("🖥️  Creating equipment...")

    const equipements = await Promise.all([
      prisma.equipement.create({
        data: {
          nom: "Imprimante HP LaserJet",
          marque: "HP",
          modele: "LaserJet Pro MFP M428fdw",
          numeroSerie: "EQ-HP-001",
          etat: "DISPONIBLE",
          localisation: "Bureau 1 - RDC",
          type: "PRINTER",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Switch Réseau Cisco",
          marque: "Cisco",
          modele: "Catalyst 2960-24TT",
          numeroSerie: "EQ-CS-002",
          etat: "DISPONIBLE",
          localisation: "Salle Serveur",
          type: "NETWORK",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Climatiseur Split",
          marque: "Daikin",
          modele: "FTXM35R",
          numeroSerie: "EQ-DK-003",
          etat: "EN_PANNE",
          localisation: "Bureau 3 - Étage 1",
          type: "HVAC",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Onduleur APC",
          marque: "APC",
          modele: "Smart-UPS 1500VA",
          numeroSerie: "EQ-AP-004",
          etat: "DISPONIBLE",
          localisation: "Salle Serveur",
          type: "ELECTRICAL",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Caméra de Surveillance",
          marque: "Hikvision",
          modele: "DS-2CD2143G0-I",
          numeroSerie: "EQ-HK-005",
          etat: "DISPONIBLE",
          localisation: "Parking - Entrée",
          type: "SECURITY",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Imprimante Canon",
          marque: "Canon",
          modele: "imageCLASS MF445dw",
          numeroSerie: "EQ-CN-006",
          etat: "EN_MAINTENANCE",
          localisation: "Bureau 2 - RDC",
          type: "PRINTER",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Routeur WiFi",
          marque: "Ubiquiti",
          modele: "UniFi Dream Machine Pro",
          numeroSerie: "EQ-UB-007",
          etat: "DISPONIBLE",
          localisation: "Salle Réseau",
          type: "NETWORK",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Radiateur Électrique",
          marque: "Atlantic",
          modele: "Fahrenheit 3G",
          numeroSerie: "EQ-AT-008",
          etat: "HORS_SERVICE",
          localisation: "Salle de Réunion",
          type: "ELECTRICAL",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Thermostat Intelligent",
          marque: "Honeywell",
          modele: "T6 Pro Z-Wave",
          numeroSerie: "EQ-HW-009",
          etat: "DISPONIBLE",
          localisation: "Bureau 4 - Étage 2",
          type: "HVAC",
          adminId: admin.id,
        },
      }),
      prisma.equipement.create({
        data: {
          nom: "Centrale d'Alarme Intrusion",
          marque: "DSC",
          modele: "PowerSeries Neo",
          numeroSerie: "EQ-DS-010",
          etat: "DISPONIBLE",
          localisation: "Accueil - RDC",
          type: "SECURITY",
          adminId: admin.id,
        },
      }),
    ])
    equipements.forEach((e) => console.log(`   ✅ ${e.nom} (${e.type})`))

    // =============================================================================
    // 3. CREATE DEMANDES MAINTENANCE (many, by different employees, different statuses)
    // =============================================================================
    console.log("📋 Creating maintenance demandes...")

    const demandes = []

    const demandesData = [
      { description: "L'imprimante HP affiche une erreur de bourrage papier récurrente au niveau du bac 2. Impossible d'imprimer plus de 10 pages d'affilée.", clientEmail: "employe1@gmail.com", equipementIndex: 0, priorite: "MOYENNE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "Le switch Cisco ne répond plus au ping depuis le sous-réseau 192.168.1.0/24. Tous les ports semblent éteints.", clientEmail: "employe2@gmail.com", equipementIndex: 1, priorite: "URGENTE", statut: "EN_ATTENTE", technicianEmail: technicians[1].email },
      { description: "Le climatiseur du bureau 3 fuit de l'eau au niveau de l'unité intérieure. La condensation s'accumule et risque d'endommager le plafond.", clientEmail: "employe3@gmail.com", equipementIndex: 2, priorite: "HAUTE", statut: "VALIDEE", technicianEmail: technicians[2].email },
      { description: "L'onduleur APC émet un bip continu et indique 'Battery Replace' sur l'écran LCD. La batterie semble défectueuse.", clientEmail: "employe4@gmail.com", equipementIndex: 3, priorite: "HAUTE", statut: "EN_COURS", technicianEmail: technicians[0].email },
      { description: "La caméra de surveillance de l'entrée du parking transmet une image floue et deformée la nuit. Nécessite recalibrage ou remplacement.", clientEmail: "employe5@gmail.com", equipementIndex: 4, priorite: "MOYENNE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "L'imprimante Canon du bureau 2 imprime en mode sombre par défaut. Les cartouches noires semblent vides mais le test indique le contraire.", clientEmail: "employe1@gmail.com", equipementIndex: 5, priorite: "BASSE", statut: "REJETEE", technicianEmail: technicians[0].email },
      { description: "Le routeur WiFi Ubiquiti redémarre toutes les 30 minutes environ. Les utilisateurs signalent des déconnexions intermittentes du réseau sans fil.", clientEmail: "employe2@gmail.com", equipementIndex: 6, priorite: "URGENTE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "Le radiateur électrique Atlantic ne chauffe plus du tout. Le voyant de fonctionnement clignote en rouge. Aucune émanation de chaleur depuis 2 jours.", clientEmail: "employe6@gmail.com", equipementIndex: 7, priorite: "HAUTE", statut: "ANNULEE", technicianEmail: technicians[0].email },
      { description: "L'imprimante HP du bureau 1 fait un bruit de grincement anormal lors de l'initialisation. Les documents ressortent avec des traces d'encre.", clientEmail: "employe3@gmail.com", equipementIndex: 0, priorite: "MOYENNE", statut: "EN_COURS", technicianEmail: technicians[1].email },
      { description: "Problème de connectivité réseau sur le switch du 2ème étage. Plusieurs postes de travail n'accèdent plus à Internet ni aux ressources partagées.", clientEmail: "employe4@gmail.com", equipementIndex: 1, priorite: "URGENTE", statut: "VALIDEE", technicianEmail: technicians[1].email },
      { description: "Le climatiseur du bureau 3 ne répond plus à la télécommande. L'unité intérieure reste bloquée en mode chauffage alors que nous sommes en été.", clientEmail: "employe7@gmail.com", equipementIndex: 2, priorite: "MOYENNE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "L'onduleur APC de la salle serveur a une autonomie estimée de moins de 5 minutes. Il faut remplacer la batterie pour couvrir les coupures de courant.", clientEmail: "employe5@gmail.com", equipementIndex: 3, priorite: "HAUTE", statut: "TRAITEE", technicianEmail: technicians[2].email },
      { description: "La caméra de surveillance du parking enregistre des séquences floues pendant les heures de forte luminosité. Le capteur semble encrassé ou défectueux.", clientEmail: "employe6@gmail.com", equipementIndex: 4, priorite: "BASSE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "Après la dernière mise à jour firmware, le routeur Ubiquiti bloque l'accès au portail captif. Les invités ne peuvent plus se connecter au WiFi invité.", clientEmail: "employe7@gmail.com", equipementIndex: 6, priorite: "MOYENNE", statut: "EN_COURS", technicianEmail: technicians[2].email },
      { description: "L'imprimante Canon jams fréquemment les feuilles de format A3. Le rouleau d'entraînement semble usé et n'adhère plus correctement au papier.", clientEmail: "employe1@gmail.com", equipementIndex: 5, priorite: "MOYENNE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "Le thermostat Honeywell du bureau 4 ne maintient plus la température programmée. Il bascule en mode manuel de façon aléatoire et ignore les plages horaires.", clientEmail: "employe2@gmail.com", equipementIndex: 8, priorite: "MOYENNE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "La centrale d'alarme DSC de l'accueil déclenche des fausses alertes la nuit sans intrusion réelle. Les zones 3 et 5 semblent en défaut.", clientEmail: "employe3@gmail.com", equipementIndex: 9, priorite: "HAUTE", statut: "VALIDEE", technicianEmail: technicians[0].email },
      { description: "Le thermostat Honeywell émet un clignotement rouge et affiche 'Erreur de communication' avec la passerelle Z-Wave. Impossible de le piloter à distance.", clientEmail: "employe7@gmail.com", equipementIndex: 8, priorite: "BASSE", statut: "EN_ATTENTE", technicianEmail: null },
      { description: "Un indicateur de défaut persistant sur la centrale DSC empêche l'armement partiel. Le clavier affiche un code d'erreur 'Tamper'.", clientEmail: "employe6@gmail.com", equipementIndex: 9, priorite: "URGENTE", statut: "EN_COURS", technicianEmail: technicians[2].email },
    ]

    for (const d of demandesData) {
      const client = employees.find((e) => e.email === d.clientEmail)!
      const equipement = equipements[d.equipementIndex]
      const technician = d.technicianEmail ? technicians.find((t) => t.email === d.technicianEmail) : undefined

      const demande = await prisma.demandeMaintenance.create({
        data: {
          description: d.description,
          equipementId: equipement.id,
          clientId: client.id,
          priorite: d.priorite,
          statut: d.statut,
          technicianId: technician?.id,
        },
      })
      demandes.push(demande)
    }

    console.log(`   ✅ Created ${demandes.length} maintenance demandes`)

    // =============================================================================
    // 4. CREATE INTERVENTIONS
    // =============================================================================
    console.log("🔧 Creating interventions...")

    const interventionsData = [
      { demandeIndex: 1, technicianEmail: technicians[0].email, description: "Inspection complète du switch. Vérification des ports et du firmware.", observation: "Port 12 défectueux détecté", statut: "EN_COURS" },
      { demandeIndex: 2, technicianEmail: technicians[2].email, description: "Diagnostic de la fuite d'eau et vérification du système de drainage.", observation: "Tuyau de drainage bouché", statut: "EN_COURS" },
      { demandeIndex: 3, technicianEmail: technicians[0].email, description: "Remplacement de la batterie de l'onduleur APC et test de charge.", observation: "Batterie remplacée avec succès", statut: "TERMINEE" },
      { demandeIndex: 8, technicianEmail: technicians[1].email, description: "Nettoyage du tambour et remplacement du kit de fusion.", observation: "Kit de fusion usé", statut: "EN_COURS" },
      { demandeIndex: 9, technicianEmail: technicians[1].email, description: "Vérification de la configuration VLAN et des câbles réseau.", observation: "Câble RJ45 défectueux au port 5", statut: "OUVERTE" },
      { demandeIndex: 11, technicianEmail: technicians[2].email, description: "Nettoyage du capteur optique de la caméra et recalibrage de la vision nocturne.", observation: "Capteur encrassé", statut: "TERMINEE" },
      { demandeIndex: 13, technicianEmail: technicians[2].email, description: "Restauration firmware vers version stable et reconfiguration du portail captif.", observation: "Bug confirmé dans firmware v5.3.1", statut: "EN_COURS" },
    ]

    for (const iv of interventionsData) {
      const demande = demandes[iv.demandeIndex]
      const technician = technicians.find((t) => t.email === iv.technicianEmail)!

      await prisma.intervention.create({
        data: {
          demandeId: demande.idDemande,
          technicianId: technician.id,
          description: iv.description,
          observation: iv.observation,
          statut: iv.statut,
        },
      })
    }

    console.log(`   ✅ Created ${interventionsData.length} interventions`)

    // =============================================================================
    // 5. CREATE MATERIELS (Stock)
    // =============================================================================
    console.log("📦 Creating stock materials...")

    const materiels = await Promise.all([
      prisma.materiel.create({
        data: {
          reference: "MAT-001",
          nom: "Cartouche toner noir HP",
          description: "Cartouche originale HP pour LaserJet Pro",
          type: "CONSOMMABLE",
          quantiteStock: 15,
          seuilAlerte: 5,
          unite: "pièce",
          emplacement: "Rayon A - Étage 1",
          prixUnitaire: 85.5,
          adminId: admin.id,
        },
      }),
      prisma.materiel.create({
        data: {
          reference: "MAT-002",
          nom: "Batterie APC RBC-43",
          description: "Batterie de remplacement pour onduleur APC Smart-UPS 1500VA",
          type: "PIECE_DETACHEE",
          quantiteStock: 4,
          seuilAlerte: 2,
          unite: "pièce",
          emplacement: "Salle Stock - Armoire 3",
          prixUnitaire: 120.0,
          adminId: admin.id,
        },
      }),
      prisma.materiel.create({
        data: {
          reference: "MAT-003",
          nom: "Switch 24 ports CISCO",
          description: "Switch manageable Catalyst 2960-24TT",
          type: "PIECE_DETACHEE",
          quantiteStock: 2,
          seuilAlerte: 1,
          unite: "pièce",
          emplacement: "Salle Stock",
          prixUnitaire: 450.0,
          adminId: admin.id,
        },
      }),
      prisma.materiel.create({
        data: {
          reference: "MAT-004",
          nom: "Câble RJ45 Cat6",
          description: "Câble réseau Ethernet Cat6 de 3 mètres",
          type: "CONSOMMABLE",
          quantiteStock: 50,
          seuilAlerte: 10,
          unite: "unité",
          emplacement: "Rayon B - Étage 1",
          prixUnitaire: 5.5,
          adminId: admin.id,
        },
      }),
      prisma.materiel.create({
        data: {
          reference: "MAT-005",
          nom: "Tournevis de précision",
          description: "Kit tournevis 24 en 1 pour électronique et informatique",
          type: "OUTIL",
          quantiteStock: 8,
          seuilAlerte: 2,
          unite: "kit",
          emplacement: "Atelier - Étagère 2",
          prixUnitaire: 22.0,
          adminId: admin.id,
        },
      }),
    ])
    materiels.forEach((m) => console.log(`   ✅ ${m.reference} - ${m.nom} (Stock: ${m.quantiteStock})`))

    // =============================================================================
    // 6. CREATE UTILISATIONS MATERIEL (for some interventions)
    // =============================================================================
    console.log("🔩 Creating material usages...")

    const utilisations = [
      { materielIndex: 0, interventionIndex: 3, quantite: 2, motif: "Remplacement cartouches lors de l'intervention sur imprimante HP" },
      { materielIndex: 1, interventionIndex: 3, quantite: 1, motif: "Remplacement batterie APC" },
      { materielIndex: 3, interventionIndex: 4, quantite: 3, motif: "Remplacement câbles RJ45 défectueux" },
      { materielIndex: 2, interventionIndex: 1, quantite: 1, motif: "Switch de remplacement installé" },
      { materielIndex: 0, interventionIndex: 6, quantite: 1, motif: "Nettoyage capteur lors intervention camera" },
    ]

    const allInterventions = await prisma.intervention.findMany()
    for (const u of utilisations) {
      await prisma.utilisationMateriel.create({
        data: {
          materielId: materiels[u.materielIndex].id,
          interventionId: allInterventions[u.interventionIndex].idIntervention,
          quantiteUtilisee: u.quantite,
          motif: u.motif,
        },
      })
      console.log(`   ✅ ${materiels[u.materielIndex].reference} utilisé dans intervention #${allInterventions[u.interventionIndex].idIntervention}`)
    }

    console.log("")
    console.log("═══════════════════════════════════════════")
    console.log("✅ FULL DATABASE SEED COMPLETED SUCCESSFULLY!")
    console.log("═══════════════════════════════════════════")
    console.log("")
    console.log("📊 Summary:")
    console.log(`   👤 Users: 1 admin + ${technicians.length} techniciens + ${employees.length} employés = ${1 + technicians.length + employees.length} total`)
    console.log(`   🖥️  Equipements: ${equipements.length}`)
    console.log(`   📋 Demandes: ${demandes.length}`)
    console.log(`   🔧 Interventions: ${interventionsData.length}`)
    console.log(`   📦 Materials: ${materiels.length}`)
    console.log(`   🔩 Material usages: ${utilisations.length}`)
    console.log("")
    console.log("🔑 Credentials (all passwords: 12345678):")
    console.log(`   Admin:      admin@gmail.com`)
    console.log(`   Techniciens: technicien1@gmail.com, technicien2@gmail.com, technicien3@gmail.com`)
    console.log(`   Employés:   employe1@gmail.com through employe7@gmail.com`)
    console.log("")
  } catch (error) {
    console.error("❌ Seed failed:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .then(() => {
    console.log("✅ Seed completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  })
