
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Hyperspeed from "@/components/hyperspeed"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="M15.5 9.5a3.5 3.5 0 0 0-7 0" />
      <path d="M15.5 9.5a3.5 3.5 0 0 0-7 0" />
      <path d="M8.5 14.5h7" />
    </svg>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="hidden lg:block relative">
        <Hyperspeed
          effectOptions={{
              colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0x131318,
              brokenLines: 0x131318,
              leftCars: [0x10B981, 0x10B981, 0x10B981],
              rightCars: [0x10B981, 0x10B981, 0x10B981],
              sticks: 0x10B981,
              }
          }}
        />
      </div>
      <div className="flex items-center justify-center p-6 bg-primary">
          <Card className="mx-auto w-full max-w-sm bg-white">
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link href="#" className="ml-auto inline-block text-sm underline">
                      Forgot your password?
                    </Link>
                  </div>
                  <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-muted-foreground">
                        Or continue with
                        </span>
                    </div>
                </div>
                <div className="flex justify-center">
                    <Button variant="outline" size="icon" className="rounded-full">
                        <GoogleIcon className="h-5 w-5" />
                        <span className="sr-only">Login with Google</span>
                    </Button>
                </div>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="#" className="underline">
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}

function ChromeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="4" />
      <line x1="21.17" x2="12" y1="8" y2="8" />
      <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
      <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
    </svg>
  )
}
