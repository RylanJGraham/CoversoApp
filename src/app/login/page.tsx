
"use client";

import Link from "next/link"
import { useState } from "react";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Hyperspeed from "@/components/hyperspeed"
import { getClientAuth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
      <path fill="none" d="M0 0h48v48H0z"></path>
    </svg>
  )
}

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState<false | 'google' | 'email'>(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAuthAction = async () => {
    const auth = getClientAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({ title: "Successfully authenticated!" });
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: "Google authentication failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setIsLoading('email');
    const auth = getClientAuth();
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Successfully logged in!" });
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({ title: "Account created successfully!" });
      }
      router.push('/dashboard');
    } catch (error: any) {
      toast({ title: `${mode === 'login' ? 'Login' : 'Sign up'} failed`, description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white relative">
       <Button asChild variant="outline" className="absolute top-4 left-4 z-20">
            <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Return to Home
            </Link>
        </Button>
      <div className="hidden lg:block relative">
        <div className="absolute inset-0 z-10 flex items-center justify-center">
            <Image src="/Logo2.png" alt="Coverso Logo" width={400} height={100} />
        </div>
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
              <CardTitle className="text-2xl">{mode === 'login' ? 'Login' : 'Sign Up'}</CardTitle>
              <CardDescription>
                {mode === 'login'
                  ? 'Enter your email below to login to your account'
                  : 'Enter your information to create an account'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailAuth} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && (
                      <Link href="#" className="ml-auto inline-block text-sm underline">
                        Forgot your password?
                      </Link>
                    )}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={!!isLoading}
                  />
                </div>
                {mode === 'signup' && (
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input 
                        id="confirm-password" 
                        type="password" 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={!!isLoading}
                    />
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={!!isLoading}>
                   {isLoading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mode === 'login' ? 'Login' : 'Sign Up'}
                </Button>
              </form>
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
                    <Button variant="outline" size="icon" className="rounded-full" onClick={() => handleAuthAction()} disabled={!!isLoading}>
                         {isLoading === 'google' ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon className="h-5 w-5" /> }
                        <span className="sr-only">Continue with Google</span>
                    </Button>
                </div>
              <div className="mt-4 text-center text-sm">
                {mode === 'login' ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button type="button" onClick={() => setMode('signup')} className="underline">
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button type="button" onClick={() => setMode('login')} className="underline">
                      Login
                    </button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
