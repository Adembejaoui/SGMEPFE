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
} from "@/components/ui/field"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const { data: session, update: updateSession } = useSession()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Redirect user after successful authentication
  useEffect(() => {
    if (!session) return

    if (session.user?.mustChangePassword) {
      router.replace("/change-password")
    } else {
      router.replace("/dashboard")
    }
  }, [session, router])

  async function handleCredentialsLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
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
        return
      }

      // Refresh the session to get updated user data
      await updateSession()
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center p-6 md:p-10",
        className
      )}
      {...props}
    >
      <div className="w-full max-w-5xl">
        <Card className="overflow-hidden p-0">
          <CardContent className="grid md:grid-cols-2">
            {/* Login Form */}
            <div className="p-6 md:p-10">
              <FieldGroup>
                {/* Header */}
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">
                    Welcome back
                  </h1>

                  <p className="text-balance text-muted-foreground">
                    Login to your GMAO account
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div
                    role="alert"
                    className="text-center text-sm text-destructive"
                  >
                    {error}
                  </div>
                )}

                {/* Credentials Login Form */}
                <form
                  onSubmit={handleCredentialsLogin}
                  className="space-y-4"
                >
                  {/* Email */}
                  <Field>
                    <FieldLabel htmlFor="email">
                      Email
                    </FieldLabel>

                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="name@example.com"
                      autoComplete="email"
                      disabled={isLoading}
                      required
                    />
                  </Field>

                  {/* Password */}
                  <Field>
                    <FieldLabel htmlFor="password">
                      Password
                    </FieldLabel>

                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={isLoading}
                      required
                    />
                  </Field>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in with Email"}
                  </Button>
                </form>
              </FieldGroup>
            </div>

            {/* Logo / Image */}
            <div className="relative flex min-h-[300px] items-center justify-center bg-muted md:min-h-0">
              <img
                src="https://eibdgxfutmrqetepmkxe.supabase.co/storage/v1/object/public/image/logo.png"
                alt="GMAO application logo"
                className="h-full w-full object-contain p-8"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Terms */}
      <FieldDescription className="px-6 py-4 text-center">
        By clicking continue, you agree to our{" "}
        <a
          href="#"
          className="underline underline-offset-4 hover:text-primary"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="#"
          className="underline underline-offset-4 hover:text-primary"
        >
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  )
}