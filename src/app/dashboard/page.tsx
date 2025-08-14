
"use client";

import { useState, useEffect, Suspense, FC } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { getClientAuth, getClientFirestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, orderBy, query, Timestamp, setDoc, deleteDoc } from 'firebase/firestore';
import Hyperspeed from '@/components/hyperspeed';
import { Loader2, FileText, Download, Eye, Save, X, Trash2, PenLine } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '@/components/DashboardHeader';
import ProfileSetupModal from '@/components/ProfileSetupModal';
import { useToast } from '@/hooks/use-toast';
import UsageIndicator from '@/components/UsageIndicator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import TiltedCard from '@/components/TiltedCard';
import { Footer } from '@/components/Footer';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface UserProfile {
  fullName: string;
  onboardingComplete?: boolean;
  subscriptionPlan?: string;
  [key: string]: any;
}

interface CoverLetterDoc {
    id: string;
    fileName: string;
    coverLetter: string;
    jobTitle: string;
    companyName: string;
    createdAt: Timestamp;
}

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [documents, setDocuments] = useState<CoverLetterDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();


  useEffect(() => {
    const auth = getClientAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await checkUserProfile(user);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);
  
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
          await fetchDocuments(user.uid);
        }
      } else {
        setShowOnboarding(true);
      }
      setLoading(false);
  }
  
  const fetchDocuments = async (userId: string) => {
    const db = getClientFirestore();
    const docsQuery = query(collection(db, 'users', userId, 'documents'), orderBy('createdAt', 'desc'));
    const docsSnap = await getDocs(docsQuery);
    setDocuments(docsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CoverLetterDoc)));
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
     if (user) {
        checkUserProfile(user);
      }
  };

  const getUsage = () => {
    const userGenerations = documents.length;
    switch (userProfile?.subscriptionPlan) {
        case "Basic": return { current: userGenerations, max: 2, plan: "Basic" };
        case "Job Seeker": return { current: userGenerations, max: 10, plan: "Job Seeker" };
        case "Career Pro": return { current: userGenerations, max: 30, plan: "Career Pro" };
        case "Executive": return { current: userGenerations, max: Infinity, plan: "Executive" };
        case "Special": return { current: userGenerations, max: Infinity, plan: "Special Code" };
        default: return { current: 0, max: 2, plan: "Guest" };
    }
  }
  
  const handleDeleteDoc = async (docId: string) => {
    if(!user) return;
    try {
        const db = getClientFirestore();
        const docRef = doc(db, 'users', user.uid, 'documents', docId);
        await deleteDoc(docRef);
        
        setDocuments(documents.filter(d => d.id !== docId));
        toast({ title: "Document Deleted Successfully" });

    } catch (error) {
        toast({ title: "Error", description: "Could not delete document.", variant: "destructive"});
        console.error("Error deleting document:", error);
    }
  };

  const handleDownloadDoc = async (docToDownload: CoverLetterDoc) => {
     toast({ title: "Preparing PDF...", description: "This may take a moment." });

    // Create a temporary element to render the markdown for PDF conversion
    const content = document.createElement('div');
    content.innerHTML = docToDownload.coverLetter.replace(/\n/g, '<br>');
    content.style.padding = '20px';
    content.style.fontFamily = 'Times New Roman, serif';
    content.style.fontSize = '12px';
    content.style.lineHeight = '1.5';
    content.style.width = '210mm'; // A4 width
    document.body.appendChild(content);

    try {
        const canvas = await html2canvas(content, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'px',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / ratio;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
        
        while (heightLeft > 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        pdf.save(`${docToDownload.fileName || 'Cover-Letter'}.pdf`);
    } catch(e) {
        console.error(e);
        toast({ title: "PDF Creation Failed", description: "An error occurred while generating the PDF.", variant: "destructive" });
    } finally {
      document.body.removeChild(content);
    }
  };


  if (loading) {
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
                leftCars: [0x7653ff, 0xf76031, 0x7653ff],
                rightCars: [0x7653ff, 0xf76031, 0x7653ff],
                sticks: 0x7653ff,
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
  
  const { current, max, plan } = getUsage();

  return (
    <>
    <div className="flex flex-col min-h-screen font-body bg-white text-black">
      <DashboardHeader />
       <header className="h-[300px] w-full relative">
        <div className="absolute inset-0 z-10 grid grid-cols-5 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="col-span-3 flex flex-col items-start justify-center">
                <Image src="/Coverso.png" alt="Coverso Logo" width={400} height={100} />
                <p className="text-2xl font-light text-black mt-2">
                    Welcome, {userProfile?.fullName || user?.email}
                </p>
            </div>
             <div className="col-span-2 flex items-center justify-center">
                 <UsageIndicator current={current} max={max} planName={plan} />
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
                      leftCars: [0x7653ff, 0xf76031, 0x7653ff],
                      rightCars: [0x7653ff, 0xf76031, 0x7653ff],
                      sticks: 0x7653ff,
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {documents.map((doc) => (
                   <TiltedCard key={doc.id} containerHeight="auto" scaleOnHover={1.02} rotateAmplitude={2}>
                        <div className="flex flex-col h-full rounded-xl shadow-lg overflow-hidden bg-white">
                             <div className="bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-primary-foreground p-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 shrink-0" />
                                    <div className="truncate">
                                        <h3 className="font-semibold truncate">{doc.fileName || doc.jobTitle || 'Cover Letter'}</h3>
                                        <p className="text-primary-foreground/80 text-sm truncate">For {doc.companyName || 'a company'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-grow p-4 bg-white border-l-2 border-r-2 border-primary">
                                <p className="text-xs text-gray-600 line-clamp-6 whitespace-pre-line font-mono">{doc.coverLetter}</p>
                            </div>
                            <div className="flex justify-between items-center bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end text-primary-foreground p-3">
                                <p className="text-xs">
                                    Created: {doc.createdAt.toDate().toLocaleDateString()}
                                </p>
                                <div className="flex gap-1">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                             <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 hover:text-white h-8 w-8">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete your
                                                document.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteDoc(doc.id)} className="bg-destructive hover:bg-destructive/90">
                                                Continue
                                            </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20 hover:text-white h-8 w-8" onClick={() => handleDownloadDoc(doc)}>
                                        <Download className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" className="bg-white/90 text-primary hover:bg-white h-8 px-3" size="sm" onClick={() => router.push(`/edit/${doc.id}`)}>
                                        <PenLine className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </TiltedCard>
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
    <Footer />
    </>
  );
}


export default function DashboardPage() {
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
      <DashboardContent />
    </Suspense>
  )
}

    