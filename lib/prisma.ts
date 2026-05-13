import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const { Pool } = pg

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined")
  }
  
  const pool = new Pool({ connectionString }) as unknown as ConstructorParameters<typeof PrismaPg>[0]
  const adapter = new PrismaPg(pool)
  
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>
} & typeof global

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma
