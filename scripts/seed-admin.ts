// =============================================================================
// SEED ADMIN SCRIPT - SGME
// =============================================================================
// This script creates an initial admin account for the SGME application.
// It should be run once after setting up the database.
//
// Usage:
// npx tsx scripts/seed-admin.ts
//
// The script creates an admin user with:
// - Email: admin@sgme.com
// - Password: Admin123!
// - Role: ADMIN
// - mustChangePassword: true (forces password change on first login)
// =============================================================================

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import bcrypt from "bcryptjs"

// =============================================================================
// PRISMA CLIENT
// =============================================================================
// Create Prisma client with PostgreSQL adapter for proper connection.
// =============================================================================
const { Pool } = pg

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined")
  }
  
  const pool = new Pool({ connectionString }) as unknown as ConstructorParameters<typeof PrismaPg>[0]
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({ adapter })
}

// =============================================================================
// MAIN FUNCTION
// =============================================================================
// Main function that seeds the admin account.
// =============================================================================
async function main() {
  console.log("🌱 Seeding admin account...")

  // Create Prisma client with adapter
  const prisma = createPrismaClient()

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: "admin@sgme.com" }
    })

    if (existingAdmin) {
      console.log("⚠️  Admin account already exists")
      console.log("   Email: admin@sgme.com")
      console.log("   Use existing credentials to login")
      return
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("Admin123!", 12)

    // Create admin user
    // Note: Make sure to run 'npx prisma generate' after schema changes
    const admin = await prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: "SGME",
        email: "admin@sgme.com",
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        mustChangePassword: true, // Force password change on first login
        phone: "",
        image: "",
      }
    })

    console.log("✅ Admin account created successfully!")
    console.log("   Email: admin@sgme.com")
    console.log("   Password: Admin123!")
    console.log("   Role: ADMIN")
    console.log("")
    console.log("⚠️  Important: You must change the password on first login!")
  } catch (error) {
    console.error("❌ Error seeding admin account:", error)
    throw error
  } finally {
    // Disconnect from database
    await prisma.$disconnect()
  }
}

// =============================================================================
// RUN SCRIPT
// =============================================================================
// Run the main function and handle errors.
// =============================================================================
main()
  .then(() => {
    console.log("✅ Seed completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error)
    process.exit(1)
  })
