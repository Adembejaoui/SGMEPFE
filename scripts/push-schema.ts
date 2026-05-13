import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const { Pool } = pg

async function main() {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres.triqnsotvtjiazjsywxl:EfqNQ1dGiLFfod1U@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"
  
  const pool = new Pool({ connectionString }) as unknown as ConstructorParameters<typeof PrismaPg>[0]
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })
  
  console.log("Pushing schema to database...")
  
  // Create Role enum
  await prisma.$executeRaw`
    DO $$ BEGIN
      CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYE', 'TECHNICIEN');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `
  
  // Create User table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "password" TEXT NOT NULL,
      "phone" TEXT,
      "image" TEXT,
      "role" "Role" NOT NULL DEFAULT 'EMPLOYE',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `
  
  // Create Account table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT
    );
  `
  
  // Create Session table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionToken" TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL,
      "expires" TIMESTAMP(3) NOT NULL
    );
  `
  
  // Create VerificationToken table
  await prisma.$executeRaw`
    CREATE TABLE IF NOT EXISTS "VerificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL UNIQUE,
      "expires" TIMESTAMP(3) NOT NULL
    );
  `
  
  // Add foreign key constraints
  await prisma.$executeRaw`
    ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  `
  
  await prisma.$executeRaw`
    ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  `
  
  // Create indexes
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" 
    ON "Account"("provider", "providerAccountId");
  `
  
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "Account_userId_idx" ON "Account"("userId");
  `
  
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "Session_sessionToken_key" 
    ON "Session"("sessionToken");
  `
  
  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
  `
  
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" 
    ON "VerificationToken"("token");
  `
  
  await prisma.$executeRaw`
    CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" 
    ON "VerificationToken"("identifier", "token");
  `
  
  console.log("Schema pushed successfully!")
  
  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
