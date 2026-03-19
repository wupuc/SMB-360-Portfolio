import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserAuthForm } from "./components/user-auth-form"

const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true"

export default function LoginPage() {
  return (
    <Card className="p-6">
      {isDemoMode && (
        <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-800">
          Tryb demo — nie wymagane konto. Kliknij &ldquo;Wypróbuj demo&rdquo; aby zacząć.
        </div>
      )}

      <div className="flex flex-col space-y-2 text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Login</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and password below <br />
          to log into your account
        </p>
      </div>

      {isDemoMode && (
        <div className="mt-4">
          <Button asChild className="w-full" size="lg">
            <Link href="/platform/dashboard">Wypróbuj demo</Link>
          </Button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">lub zaloguj się</span>
            </div>
          </div>
        </div>
      )}

      <UserAuthForm />

      <p className="text-muted-foreground mt-4 px-8 text-center text-sm">
        By clicking login, you agree to our{" "}
        <a
          href="/terms"
          className="hover:text-primary underline underline-offset-4"
        >
          Terms of Service
        </a>{" "}
        and{" "}
        <a
          href="/privacy"
          className="hover:text-primary underline underline-offset-4"
        >
          Privacy Policy
        </a>
        .
      </p>
    </Card>
  )
}
