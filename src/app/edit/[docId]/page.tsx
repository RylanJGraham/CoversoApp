
"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Coverso as CoversoForm } from '@/components/coverso';
import Hyperspeed from '@/components/hyperspeed';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Footer } from '@/components/Footer';
import type { GenerateCoverLetterOutput } from '@/ai/flows/cover-letter-generator';

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

interface CoverLetterDoc extends GenerateCoverLetterOutput {
    id: string;
    fileName: string;
    createdAt: Timestamp;
}

function EditPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [document, setDocument] = useState<CoverLetterDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const { docId } = params;

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const db = getClientFirestore();
        
        // Fetch User Profile
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setProfile(userDocSnap.data() as UserProfile);
        } else {
            router.push('/dashboard'); // Should have a profile if they have docs
        }

        // Fetch Document
        if (typeof docId === 'string') {
            const docRef = doc(db, 'users', user.uid, 'documents', docId);
            const docSnap = await getDoc(docRef);
            if(docSnap.exists()) {
                setDocument({ id: docSnap.id, ...docSnap.data() } as CoverLetterDoc);
            } else {
                // Handle doc not found
                 router.push('/dashboard');
            }
        }

      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, docId]);
  
  if (loading || !profile || !document) {
     return (
       <div className="w-full h-screen relative flex items-center justify-center">
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
    <>
        <CoversoForm user={user} profile={profile} isGeneratePage={false} existingDoc={document} />
        <Footer />
    </>
  );
}


export default function EditPage() {
    return (
        <Suspense fallback={
             <div className="w-full h-screen relative flex items-center justify-center">
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
        }>
            <EditPageContent />
        </Suspense>
    )
}

    