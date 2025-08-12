
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Coverso as CoversoForm } from '@/components/coverso';
import Hyperspeed from '@/components/hyperspeed';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  fullName: string;
  userLocation: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  onboardingComplete?: boolean;
  subscriptionPlan?: string;
  [key: string]: any;
}

export default function GeneratePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const db = getClientFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userProfile = userDocSnap.data() as UserProfile;
           setProfile(userProfile);
            if (!userProfile.onboardingComplete) {
              router.push('/dashboard');
            }
        } else {
            // If no profile exists, they likely haven't completed onboarding.
            router.push('/dashboard');
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);
  
  if (loading || !profile) {
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
  
  return (
    <CoversoForm user={user} profile={profile} isGeneratePage={true}/>
  );
}
