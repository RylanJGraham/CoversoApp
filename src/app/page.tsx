
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Coverso as CoversoForm } from '@/components/coverso';
import Hyperspeed from '@/components/hyperspeed';
import { Loader2 } from 'lucide-react';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { onAuthStateChanged } from 'firebase/auth';

interface UserProfile {
  onboardingComplete?: boolean;
  [key: string]: any;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const db = getClientFirestore();
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data() as UserProfile);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  // This is the public-facing page for all users.
  return (
    <CoversoForm user={user} profile={profile} />
  );
}
