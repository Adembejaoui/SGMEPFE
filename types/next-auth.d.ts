// =============================================================================
// NEXTAUTH TYPE EXTENSIONS - SGME
// =============================================================================
// This file extends the default NextAuth types to include custom fields:
// - role: User role (ADMIN, EMPLOYE, TECHNICIEN)
// - mustChangePassword: Whether user must change password on first login
//
// These extensions allow TypeScript to recognize our custom user properties
// throughout the application.
// =============================================================================

import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

// =============================================================================
// EXTEND USER TYPE
// =============================================================================
// Extends the default User type to include our custom fields.
// This allows TypeScript to recognize user.role and user.mustChangePassword.
// =============================================================================
declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string
    mustChangePassword?: boolean
  }

  // =============================================================================
  // EXTEND SESSION TYPE
  // =============================================================================
  // Extends the default Session type to include our custom fields.
  // This allows TypeScript to recognize session.user.role and 
  // session.user.mustChangePassword.
  // =============================================================================
  interface Session {
    user: {
      id: string
      name: string | null
      email: string
      image: string | null
      role: string
      mustChangePassword: boolean
    } & DefaultSession["user"]
  }
}

// =============================================================================
// EXTEND JWT TYPE
// =============================================================================
// Extends the default JWT type to include our custom fields.
// This allows TypeScript to recognize token.role and token.mustChangePassword.
// =============================================================================
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    name: string | null
    image: string | null
    role: string
    mustChangePassword: boolean
  }
}
