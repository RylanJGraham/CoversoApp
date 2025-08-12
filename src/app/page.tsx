
"use client";

import { useState, useEffect } from 'react';
import { Coverso as CoversoForm } from '@/components/coverso';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import Hyperspeed from '@/components/hyperspeed';
import { getClientAuth } from '@/lib/firebase';
import type { User } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      
      // This is a placeholder for checking if a user is new.
      // In a real app, you would check a flag in your database.
      const isNewUser = localStorage.getItem('onboardingComplete') !== 'true';

      if (user && isNewUser) {
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleOnboardingComplete = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
  };

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
  
  if (showOnboarding) {
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
        <ProfileSetupModal
          isOpen={showOnboarding}
          onClose={handleOnboardingComplete}
          user={user}
        />
      </div>
    );
  }

  return (
    <CoversoForm />
  );
}
