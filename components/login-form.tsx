"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Check session after login to determine redirect
  useEffect(() => {
    if (session?.user?.mustChangePassword) {
      router.push("/change-password")
    } else if (session && !session.user?.mustChangePassword) {
      router.push("/dashboard")
    }
  }, [session, router])

  async function handleCredentialsLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")
    
    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })
      
      if (result?.error) {
        setError("Invalid email or password")
        setIsLoading(false)
        return
      }
      
      // Update session to get fresh data including mustChangePassword
      await updateSession()
    } catch {
      setError("An error occurred. Please try again.")
      setIsLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/", redirect: false })
    } catch (error) {
      setError("Google login is not configured. Please use email login.")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login to your Gmao account
                </p>
              </div>

              {/* Credentials Login Form */}
              <form onSubmit={handleCredentialsLogin} className="space-y-4">
                {error && (
                  <div className="text-sm text-destructive text-center">{error}</div>
                )}
                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel>Password</FieldLabel>
                  <Input
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                  />
                </Field>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in with Email"}
                </Button>
              </form>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>

              {/* Google Login Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="mr-2 h-4 w-4"
                  >
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                   Sign in with Google
                 </Button>

              <FieldDescription className="text-center">
                Don't have an account? <a href="/register" className="underline">Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </div>
          <div className="relative hidden bg-muted md:block">
            <img
              src="https://xou955y8kd.ufs.sh/f/zvC4KODelhDMbXirS35iFWtAgHVDXY3jywaQ50s2hvOqKm7G"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
