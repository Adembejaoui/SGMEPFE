// =============================================================================
// NEXTAUTH CONFIGURATION - SGME
// =============================================================================
// This file configures NextAuth.js for authentication in the SGME application.
// It includes:
// - Credentials provider for email/password login
// - Prisma adapter for database integration
// - JWT session strategy
// - Custom callbacks to include user role and mustChangePassword in session
// Key features:
// - Password hashing with bcrypt
// - Role-based authentication (ADMIN, EMPLOYE, TECHNICIEN)
// - First-login password change detection
// =============================================================================
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
// =============================================================================
// CREDENTIALS VALIDATION SCHEMA
// =============================================================================
// Validates email and password format before authentication.
// Uses Zod for type-safe validation.
// =============================================================================
const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
})

// =============================================================================
// NEXTAUTH EXPORTS
// =============================================================================
// Exports the main NextAuth handlers, auth function, and sign-in/sign-out helpers.
// These are used throughout the application for authentication.
// =============================================================================
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use Prisma adapter for database integration
  adapter: PrismaAdapter(prisma),
  
  // Authentication providers
  providers: [
    // Credentials provider for email/password login
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // =============================================================================
      // AUTHORIZE FUNCTION
      // =============================================================================
      // This function is called when a user tries to sign in with credentials.
      // It validates the credentials and returns the user if authentication succeeds.
      // =============================================================================
      async authorize(credentials) {
        // Validate credentials format using Zod
        const parsedCredentials = credentialsSchema.safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          
          // Find user by email in database
          const user = await prisma.user.findUnique({
            where: { email },
          })

          // Check if user exists and has a password
          if (!user || !user.password) {
            return null
          }

          // Verify password matches using bcrypt
          const passwordsMatch = await bcrypt.compare(password, user.password)
          
          if (passwordsMatch) {
            // Return user object on successful authentication
            return user
          }
        }

        // Return null if authentication fails
        return null
      },
    }),
  ],
  
  // Custom pages configuration
  pages: {
    signIn: "/login", // Redirect to custom login page
  },
  
  // Session configuration
  session: {
    strategy: "jwt", // Use JWT for session management
    maxAge: 30 * 24 * 60 * 60, // 30 days session duration
  },
  
  // =============================================================================
  // CALLBACKS
  // =============================================================================
  // Custom callbacks to modify JWT token and session data.
  // These callbacks add user role and mustChangePassword to the session.
  // =============================================================================
  callbacks: {
    // =============================================================================
    // JWT CALLBACK
    // =============================================================================
    // Called whenever a JWT is created or updated.
    // On initial sign-in, adds user information to the token.
    // On subsequent calls (decoding), reads mustChangePassword from database
    // to ensure the session reflects the current state after password changes.
    // =============================================================================
    async jwt({ token, user }) {
      // Add user info to token on initial sign in
      if (user) {
        token.id = user.id ?? ""
        token.name = user.name ?? null
        token.image = user.image ?? null
        // Cast user to access custom properties defined in next-auth.d.ts
        token.role = (user as { role?: string }).role ?? "EMPLOYE"
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false
      } else if (token.id) {
        // On subsequent calls (decoding the token), read mustChangePassword
        // from the database to ensure the session reflects the current state.
        // This is necessary because the password change API updates the database
        // but the JWT token is cached until the next sign-in.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { mustChangePassword: true },
          })
          if (dbUser) {
            token.mustChangePassword = dbUser.mustChangePassword
          }
        } catch (error) {
          console.error("Error fetching mustChangePassword from database:", error)
        }
      }
      return token
    },
    
    // =============================================================================
    // SESSION CALLBACK
    // =============================================================================
    // Called whenever a session is checked.
    // Adds user information from token to the session object.
    // This makes role and mustChangePassword available in the client.
    // =============================================================================
    async session({ session, token }) {
      // Add user info from token to session
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string | null
        session.user.image = token.image as string | null
        session.user.role = token.role as string
        session.user.mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
})
