
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Coverso as CoversoForm } from '@/components/coverso';
import Hyperspeed from '@/components/hyperspeed';
import { Loader2 } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If user is authenticated, redirect to dashboard
        router.push('/dashboard');
      } else {
        // If not authenticated, stop loading and show the landing page
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
     return (
       <div className="w-full h-screen relative flex items-center justify-center">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
         <Hyperspeed
            effectOptions={{
                colors: {
                  roadColor: 0x080808,
                  islandColor: 0x0a0a0a,
                  background: 0x000000,
                  shoulderLines: 0x131318,
                  brokenLines: 0x131318,
                  leftCars: [0x7653ff, 0xf76031, 0x7653ff],
                  rightCars: [0x7653ff, 0xf76031, 0x7653ff],
                  sticks: 0x7653ff,
                }
            }}
          />
       </div>
     );
  }

  // This is the public-facing page for unauthenticated users.
  // Authenticated users are redirected in the useEffect.
  return (
    <CoversoForm user={null} profile={null} />
  );
}
