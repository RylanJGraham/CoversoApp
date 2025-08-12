
"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, orderBy, query, Timestamp, setDoc } from 'firebase/firestore';
import Hyperspeed from '@/components/hyperspeed';
import { Loader2, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { verifyCheckoutSessionFlow } from '@/ai/flows/stripe-checkout';
import { useToast } from '@/hooks/use-toast';


interface UserProfile {
  fullName: string;
  onboardingComplete?: boolean;
  [key: string]: any;
}

interface CoverLetterDoc {
    id: string;
    coverLetter: string;
    jobTitle: string;
    companyName: string;
    createdAt: Timestamp;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<CoverLetterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        
        const sessionId = searchParams.get('session_id');
        if (sessionId) {
            // Stripe redirect, verify session
            setLoading(true);
            try {
                const { paymentStatus, subscriptionId, customerId, planId } = await verifyCheckoutSessionFlow({ sessionId });
                if (paymentStatus === 'paid') {
                    const db = getClientFirestore();
                    const userDocRef = doc(db, 'users', user.uid);
                    await setDoc(userDocRef, {
                        onboardingComplete: true,
                        stripe: {
                            subscriptionId,
                            customerId,
                            planId,
                            status: 'active',
                        },
                    }, { merge: true });

                    toast({
                        title: "Payment Successful!",
                        description: "Your subscription is active and your profile is complete.",
                    });
                    
                    // Clear search params from URL
                    router.replace('/dashboard', undefined);
                } else {
                     toast({
                        title: "Payment Incomplete",
                        description: "Your payment was not successful. Please try again.",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                console.error("Stripe verification failed:", error);
                toast({
                    title: "Verification Failed",
                    description: "We couldn't verify your payment. Please contact support.",
                    variant: "destructive",
                });
            }
        }
        
        await checkUserProfile(user);

      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, searchParams]);
  
  const checkUserProfile = async (user: User) => {
      setLoading(true);
      const db = getClientFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const profile = userDocSnap.data() as UserProfile;
        setUserProfile(profile);
        if (!profile.onboardingComplete) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
          const docsQuery = query(collection(userDocRef, 'documents'), orderBy('createdAt', 'desc'));
          const docsSnap = await getDocs(docsQuery);
          setDocuments(docsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CoverLetterDoc)));
        }
      } else {
        setShowOnboarding(true);
      }
      setLoading(false);
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
     if (user) {
        checkUserProfile(user);
      }
  };

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
    )
  }

  return (
    <div className="flex flex-col min-h-screen font-body bg-white text-black">
      <DashboardHeader />
       <header className="h-[300px] w-full relative">
        <div className="absolute inset-0 z-10 flex items-center justify-start text-left max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-center">
                <Image src="/Logo2.png" alt="Coverso Logo" width={400} height={100} />
                <p className="text-2xl font-light text-black mt-2">
                    Welcome, {userProfile?.fullName || user?.email}
                </p>
            </div>
        </div>
        <div className="absolute inset-0 h-full w-full z-0">
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
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </header>
       <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Your Documents</h2>
             <Button onClick={() => router.push('/generate')}>Create New</Button>
        </div>
        
        {documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                    <Card key={doc.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                {doc.jobTitle || 'Cover Letter'}
                            </CardTitle>
                            <CardDescription>For {doc.companyName || 'a company'}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-sm text-muted-foreground line-clamp-4">{doc.coverLetter}</p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">
                                Created on {doc.createdAt.toDate().toLocaleDateString()}
                            </p>
                            <Button variant="outline" size="sm">View</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Documents Yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You haven't generated any cover letters. Get started by creating one.
                </p>
                <Button className="mt-6" onClick={() => router.push('/generate')}>Create Your First Cover Letter</Button>
            </div>
        )}

      </main>
    </div>
  );
}
