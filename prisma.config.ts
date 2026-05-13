import path from "node:path"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
    migrations: {
    path: "prisma/migrations",
    seed: "npx tsx scripts/seed-admin.ts",
    },
  datasource: {
    url: "postgresql://postgres.triqnsotvtjiazjsywxl:EfqNQ1dGiLFfod1U@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?schema=public",
  },
})
