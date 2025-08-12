
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coverso as CoversoForm } from '@/components/coverso';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import Hyperspeed from '@/components/hyperspeed';
import { getClientAuth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      
      if (user) {
        // If user is logged in, redirect to dashboard. 
        // The dashboard will handle the onboarding check.
        router.push('/dashboard');
        return;
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  if (loading) {
     return (
       <div className="w-full h-screen relative">
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
     );
  }
  
  // This part is now primarily for non-logged-in users.
  // Onboarding logic will be moved to the dashboard.
  return (
    <CoversoForm />
  );
}
