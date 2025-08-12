
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
          setProfile(userDocSnap.data() as UserProfile);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
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
                  leftCars: [0x10B981, 0x10B981, 0x10B981],
                  rightCars: [0x10B981, 0x10B981, 0x10B981],
                  sticks: 0x10B981,
                }
            }}
          />
       </div>
     );
  }
  
  return (
    <CoversoForm user={user} profile={profile} />
  );
}
