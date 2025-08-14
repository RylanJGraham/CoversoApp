

"use client";

import { useState, useRef, type FC, useEffect, forwardRef, useImperativeHandle } from "react";
import Image from 'next/image';
import { generateCoverLetter, type GenerateCoverLetterOutput } from "@/ai/flows/cover-letter-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  FileUp,
  FlaskConical,
  Link as LinkIcon,
  Loader2,
  Trash2,
  FileText,
  Wand2,
  Download,
  AlertCircle,
  UploadCloud,
  User,
  PlusCircle,
  BrainCircuit,
  ListChecks,
  ClipboardPaste,
  Info,
  DollarSign,
  PenLine,
  LogIn,
  Save,
  RefreshCw,
  ArrowLeft,
  Clock,
  Lock,
  Copy,
  Star,
  FileLock,
  Bold,
  Italic,
  CaseSensitive,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Hyperspeed from "./hyperspeed";
import TiltedCard from "./TiltedCard";
import AnimatedCounter from "./AnimatedCounter";
import { Header } from "./Header";
import { DashboardHeader } from "./DashboardHeader";
import { getClientAuth, getClientFirestore } from "@/lib/firebase";
import { addDoc, collection, doc, getDocs, serverTimestamp, query, where, getDoc, setDoc } from "firebase/firestore";
import type { User as FirebaseUser } from 'firebase/auth';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useRouter } from "next/navigation";
import UsageIndicator from "./UsageIndicator";
import { PersonalInfoForm, type PersonalInfoHandle } from "./PersonalInfoForm";
import { PortfolioVaultForm, type PortfolioVaultHandle } from "./PortfolioVaultForm";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Slider } from "./ui/slider";


interface UserProfile {
  fullName: string;
  userLocation: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  subscriptionPlan?: string;
  generations?: number; // Add this
  [key:string]: any;
}

interface CustomizationFormHandle {
  getValues: () => {
    jobDescription: string;
    tone: string;
    mustHaveInfo: string;
    pageLength: number;
  };
}

const CustomizationForm = forwardRef<CustomizationFormHandle, { isPayingUser: boolean }>(({ isPayingUser }, ref) => {
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("Professional");
  const [mustHaveInfo, setMustHaveInfo] = useState("");
  const [pageLength, setPageLength] = useState([1]);
  const { toast } = useToast();
  
  const standardTones = ["Professional", "Enthusiastic", "Formal", "Creative"];
  const premiumTones = ["Assertive", "Confident", "Personable", "Direct", "Strategic", "Data-driven"];


  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJobDescription(text);
      toast({ title: "Pasted from clipboard!" });
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      toast({ title: "Failed to paste", description: "Could not read from clipboard. Please paste manually.", variant: "destructive" });
    }
  };

  useImperativeHandle(ref, () => ({
    getValues: () => ({
      jobDescription,
      tone,
      mustHaveInfo,
      pageLength: pageLength[0],
    }),
  }));


  return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch pb-12">
        <TiltedCard containerHeight="auto" scaleOnHover={1.02} rotateAmplitude={2}>
            <div className="w-full rounded-2xl p-4 h-full flex flex-col">
                <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shrink-0">
                        3
                        </div>
                        <div>
                        <CardTitle className="text-black">Job Description</CardTitle>
                        <CardDescription className="text-gray-700">Paste the full text of the job description below.</CardDescription>
                        </div>
                    </div>
                    <TooltipProvider>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10 relative z-10">
                            <Info className="h-5 w-5" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-primary text-primary-foreground">
                            <p>Simply copy the entire job listing from the webpage and paste it here.</p>
                        </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-grow relative">
                    <Textarea
                        id="jobDescription"
                        name="jobDescription"
                        placeholder="Paste job description here..."
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        required
                        className="min-h-[150px] h-full"
                    />
                    <Button type="button" variant="default" size="icon" className="absolute bottom-6 right-6 h-8 w-8 bg-primary hover:bg-primary/90" onClick={handlePaste} aria-label="Paste job description">
                    <ClipboardPaste className="h-4 w-4 text-primary-foreground" />
                    </Button>
                </CardContent>
            </div>
        </TiltedCard>
        <Card className="w-full rounded-2xl p-4 space-y-6 flex flex-col">
            <CardHeader className="p-0">
                <CardTitle className="text-black">Customize Your Letter</CardTitle>
                <CardDescription className="text-gray-700">Guide the AI's writing style and include key information.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-grow flex flex-col gap-4">
                <div className="space-y-3">
                    <Label className="text-gray-800 font-semibold">Choose a Tone</Label>
                    <RadioGroup value={tone} onValueChange={setTone} className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {[...standardTones, ...premiumTones].map((t) => {
                        const isPremium = premiumTones.includes(t);
                        const isDisabled = isPremium && !isPayingUser;

                        const item = (
                         <div key={t} className="flex-1 min-w-[100px]">
                            <RadioGroupItem value={t} id={`r-${t}`} className="sr-only" disabled={isDisabled} />
                            <Label
                                htmlFor={`r-${t}`}
                                className={cn(
                                    "flex items-center justify-center p-2 rounded-lg border-2 cursor-pointer transition-colors h-12 text-black bg-white",
                                    "border-primary",
                                    tone === t ? "bg-primary text-primary-foreground" : "hover:bg-primary/10",
                                    isDisabled ? "bg-secondary/50 border-primary/30 cursor-not-allowed text-gray-500" : ""
                                )}
                            >
                                {isDisabled ? (
                                    <Lock className="h-5 w-5 text-primary" />
                                ) : (
                                    t
                                )}
                            </Label>
                        </div>
                        );
                        
                        if(isDisabled) {
                            return (
                                <TooltipProvider key={t} delayDuration={100}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>{item}</TooltipTrigger>
                                        <TooltipContent><p>This is a premium feature. Upgrade your plan to use this tone.</p></TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )
                        }
                        return item;
                    })}
                    </RadioGroup>
                </div>
                 <div className="space-y-4 pt-2">
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="pageLength" className={cn("font-semibold", !isPayingUser && "text-gray-500")}>
                                    Cover Letter Length
                                </Label>
                                {!isPayingUser && <Lock className="h-3 w-3 text-gray-500" />}
                            </div>
                        </TooltipTrigger>
                        {!isPayingUser && (
                            <TooltipContent>
                                <p>This is a premium feature. Upgrade to control the cover letter length.</p>
                            </TooltipContent>
                        )}
                        </Tooltip>
                    </TooltipProvider>
                    <div className="relative">
                        <Slider
                            id="pageLength"
                            min={1}
                            max={2.5}
                            step={0.5}
                            value={pageLength}
                            onValueChange={setPageLength}
                            disabled={!isPayingUser}
                        />
                         <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>1 page</span>
                            <span>{pageLength[0]} {pageLength[0] === 1 ? 'page' : 'pages'}</span>
                            <span>2.5 pages</span>
                        </div>
                         {!isPayingUser && (
                            <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 rounded-md cursor-not-allowed -mt-4">
                                <Lock className="h-6 w-6 text-primary" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2">
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="mustHaveInfo" className={cn("font-semibold", !isPayingUser && "text-gray-500")}>
                                Must-Have Information
                            </Label>
                            {!isPayingUser && <Lock className="h-3 w-3 text-gray-500" />}
                        </div>
                    </TooltipTrigger>
                    {!isPayingUser && (
                        <TooltipContent>
                            <p>This is a premium feature. Upgrade to tell the AI specific points to include.</p>
                        </TooltipContent>
                    )}
                    </Tooltip>
                </TooltipProvider>
                <div className="relative">
                    <Textarea
                        id="mustHaveInfo"
                        name="mustHaveInfo"
                        placeholder="e.g., 'Mention my 5 years of experience with React' or 'Highlight my passion for sustainable tech'."
                        value={mustHaveInfo}
                        onChange={(e) => setMustHaveInfo(e.target.value)}
                        className="min-h-[100px]"
                        disabled={!isPayingUser}
                    />
                    {!isPayingUser && (
                        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50 rounded-md cursor-not-allowed">
                            <Lock className="h-6 w-6 text-primary" />
                        </div>
                    )}
                </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
});

CustomizationForm.displayName = 'CustomizationForm';

type AppState = "idle" | "loading" | "success" | "error";

export function Coverso({ user, profile, isGeneratePage = false, existingDoc }: { user: FirebaseUser | null, profile: UserProfile | null, isGeneratePage?: boolean, existingDoc?: GenerateCoverLetterOutput & {id: string, fileName?: string} | null }) {

  const [aiResult, setAiResult] = useState<GenerateCoverLetterOutput | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");

  const [anonGenerations, setAnonGenerations] = useState(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [showNameWarningDialog, setShowNameWarningDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userGenerations, setUserGenerations] = useState(0);
  
  const [activeSubMenu, setActiveSubMenu] = useState<"analysis" | "download" | null>(null);
  
  const personalInfoRef = useRef<PersonalInfoHandle>(null);
  const portfolioVaultRef = useRef<PortfolioVaultHandle>(null);
  const customizationRef = useRef<CustomizationFormHandle>(null);
  const letterContentRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();
  const router = useRouter();


  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined' && !user) {
        const storedGenerations = localStorage.getItem('anonymousGenerations');
        setAnonGenerations(storedGenerations ? parseInt(storedGenerations, 10) : 0);
    }
    if (user) {
        const fetchGenerations = async () => {
            const db = getClientFirestore();
            const userDocRef = doc(db, "users", user.uid);
            const documentsCollectionRef = collection(userDocRef, "documents");
            const querySnapshot = await getDocs(documentsCollectionRef);
            setUserGenerations(querySnapshot.size);
        };
        fetchGenerations();
    }
    if (existingDoc) {
        setAiResult(existingDoc);
        setGeneratedCoverLetter(existingDoc.coverLetter);
        setFileName(existingDoc.fileName || existingDoc.jobTitle);
        setAppState("success");
    }
  }, [user, existingDoc]);

  const isPayingUser = !!profile?.subscriptionPlan && profile.subscriptionPlan !== 'Basic' && profile.subscriptionPlan !== 'Guest';
  
  const handleGenerateSample = () => {
    const sampleResult: GenerateCoverLetterOutput = {
      coverLetter: `[Your Name]\n[Your Address] | [Your Email] | [Your Phone]\n\n[Date]\n\nHiring Manager\n[Company Name]\n[Company Address]\n\nDear Hiring Manager,\n\nI am writing to express my keen interest in the [Job Title] position at [Company Name], which I discovered on [Platform]. Having followed [Company Name]'s impressive work in the tech industry for some time, I am confident that my skills in software development and my passion for innovation align perfectly with your team's goals.\n\nIn my previous role at [Previous Company], I was instrumental in developing and launching a new feature that increased user engagement by 25%. My experience with React, Node.js, and cloud services has prepared me to tackle the challenges of this role and contribute meaningfully to your projects from day one.\n\nI am particularly drawn to this opportunity because of [Company Name]'s commitment to [a specific company value or project]. I am eager to bring my problem-solving abilities and collaborative spirit to your dynamic team.\n\nThank you for considering my application. I have attached my resume for your review and look forward to the possibility of discussing how I can contribute to [Company Name]'s continued success.\n\nSincerely,\n[Your Name]`,
      jobTitle: "Software Engineer (Sample)",
      companyName: "Tech Solutions Inc. (Sample)",
      keyFocusPoints: [
        "React and Node.js proficiency",
        "Experience with cloud services (AWS/GCP)",
        "Proven track record of increasing user engagement",
      ],
    };
    setAiResult(sampleResult);
    setGeneratedCoverLetter(sampleResult.coverLetter);
    setFileName(`Cover Letter for ${sampleResult.companyName}`);
    setAppState("success");
    setError(null);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

     if (!user) {
      if (anonGenerations >= 2) {
        setShowLimitDialog(true);
        return;
      }
    } else if (profile?.subscriptionPlan === 'Basic') {
      if (userGenerations >= 2) {
          toast({
            title: "Basic Plan Limit Reached",
            description: "You've reached your limit of 2 generations. Please upgrade your plan to continue.",
            variant: "destructive"
          });
          return;
      }
    }

    const personalInfo = personalInfoRef.current?.getValues();
    const portfolioInfo = portfolioVaultRef.current?.getValues();
    const customizationInfo = customizationRef.current?.getValues();


    if (!personalInfo || !portfolioInfo || !customizationInfo) {
      toast({ title: "Form Error", description: "Could not read form data.", variant: "destructive" });
      return;
    }

    if (portfolioInfo.files.length === 0) {
      toast({ title: "No CV Uploaded", description: "Please upload your CV to get started.", variant: "destructive" });
      return;
    }
    if (!personalInfo.fullName || !personalInfo.userLocation) {
      toast({ title: "Missing Personal Info", description: "Please provide your full name and location.", variant: "destructive" });
      return;
    }
    if (!customizationInfo.jobDescription) {
      toast({ title: "No Job Description", description: "Please paste the job description.", variant: "destructive" });
      return;
    }
    
    setAppState("loading");
    setAiResult(null);
    setGeneratedCoverLetter("");
    setError(null);

    try {
      const { files, portfolioUrls } = portfolioInfo;
      const cvFile = files.find(f => f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume')) || files[0];
      const supportingFiles = files.filter(f => f !== cvFile);

      const fileToDataUri = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      const cvDataUri = await fileToDataUri(cvFile);
      const supportingDocs = await Promise.all(supportingFiles.map(fileToDataUri));
      const finalPortfolioUrls = portfolioUrls.filter(url => url.trim() !== "");

      const result = await generateCoverLetter({
        ...personalInfo,
        ...customizationInfo,
        pageLength: isPayingUser ? customizationInfo.pageLength : 1,
        cvDataUri,
        supportingDocs,
        portfolioUrls: finalPortfolioUrls,
        mustHaveInfo: isPayingUser ? customizationInfo.mustHaveInfo : '',
      });

      if (!user) {
        setAiResult(result);
        setGeneratedCoverLetter(result.coverLetter);
        setFileName(`Cover Letter for ${result.companyName}`);
        // Handle anonymous users
        const newCount = anonGenerations + 1;
        localStorage.setItem('anonymousGenerations', newCount.toString());
        setAnonGenerations(newCount);
        toast({
            title: `Generation ${newCount} of 2 Used`,
            description: "Sign up to save your documents and get more generations.",
        });
        setAppState("success");

      } else {
         const db = getClientFirestore();
         const userDocRef = doc(db, "users", user.uid);
         const documentsCollectionRef = collection(userDocRef, "documents");
         
         const newDocRef = await addDoc(documentsCollectionRef, {
            fileName: `Cover Letter for ${result.companyName}`,
            coverLetter: result.coverLetter,
            jobTitle: result.jobTitle,
            companyName: result.companyName,
            keyFocusPoints: result.keyFocusPoints,
            createdAt: serverTimestamp(),
         });
         setUserGenerations(prev => prev + 1);
         router.push(`/edit/${newDocRef.id}`);
      }

    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(errorMessage);
      setAppState("error");
      toast({
        title: "AI Generation Failed",
        description: "Something went wrong. Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDownload = () => {
    if (!generatedCoverLetter) return;
    const blob = new Blob([generatedCoverLetter], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'Cover-Letter'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
   const handleDownloadPdf = async () => {
    const contentToRender = letterContentRef.current;
    if (!contentToRender) {
        toast({ title: "Error", description: "Could not find content to download.", variant: "destructive" });
        return;
    }
    toast({ title: "Preparing PDF...", description: "This may take a moment." });

    // Create a temporary element to render the markdown for PDF conversion
    const printElement = document.createElement('div');
    printElement.innerHTML = generatedCoverLetter.replace(/\n/g, '<br>');
    printElement.style.padding = '40px';
    printElement.style.fontFamily = 'Times New Roman, serif';
    printElement.style.fontSize = '12px';
    printElement.style.lineHeight = '1.5';
    printElement.style.width = '210mm'; // A4 width
    document.body.appendChild(printElement);
    
    try {
        const canvas = await html2canvas(printElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width / 2;
        const imgHeight = canvas.height / 2;
        const ratio = imgWidth / imgHeight;
        
        let finalImgWidth = pdfWidth - 20; // with margin
        let finalImgHeight = finalImgWidth / ratio;
        
        let heightLeft = finalImgHeight;
        let position = 10; // top margin
        
        pdf.addImage(imgData, 'PNG', 10, position, finalImgWidth, finalImgHeight);
        heightLeft -= (pdfHeight - 20);
        
        while (heightLeft > 0) {
            position = heightLeft - finalImgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, finalImgWidth, finalImgHeight);
            heightLeft -= (pdfHeight - 20);
        }

        pdf.save(`${fileName || 'Cover-Letter'}.pdf`);
    } catch(e) {
        console.error(e);
        toast({ title: "PDF Creation Failed", description: "An error occurred while generating the PDF.", variant: "destructive" });
    } finally {
      document.body.removeChild(printElement);
    }
  };

  const handleCopyToClipboard = () => {
    if (!generatedCoverLetter) return;
    navigator.clipboard.writeText(generatedCoverLetter).then(() => {
        toast({ title: "Copied to clipboard!" });
    }).catch(err => {
        toast({ title: "Failed to copy", description: "Could not copy text to clipboard.", variant: "destructive" });
    });
  };

  const handleSave = async (forceSave = false) => {
    if (!user || !aiResult) {
      toast({ title: "Cannot Save", description: "You must be logged in to save documents.", variant: "destructive"});
      return;
    }
    
    if (!(existingDoc?.id)) {
        toast({title: "Error", description: "No document ID found to update.", variant: "destructive"});
        return;
    }
    
    setIsSaving(true);
    let finalFileName = fileName || aiResult.jobTitle;

    if (!finalFileName && !forceSave) {
        setShowNameWarningDialog(true);
        setIsSaving(false);
        return;
    }
    if (!finalFileName && forceSave) {
        finalFileName = "Untitled";
    }

    try {
        const db = getClientFirestore();
        const docRef = doc(db, "users", user.uid, 'documents', existingDoc.id);
    
        await setDoc(docRef, {
            fileName: finalFileName,
            coverLetter: generatedCoverLetter,
        }, { merge: true });

        toast({
            title: "Document Saved!",
            description: `"${finalFileName}" has been updated.`,
        });

    } catch (error) {
        console.error("Error saving document: ", error);
        toast({ title: "Save failed", description: "Could not save your document. Please try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }
  
  const Step: FC<{
    step: number;
    title: string;
    description: string;
    tooltipContent: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }> = ({ step, title, description, tooltipContent, children, className }) => (
     <TiltedCard containerHeight="auto" scaleOnHover={1.02} rotateAmplitude={2}>
        <div className={cn("w-full rounded-2xl p-4 h-full flex flex-col", className)}>
            <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shrink-0">
                        {step}
                    </div>
                    <div>
                        <CardTitle className="text-black">{title}</CardTitle>
                        <CardDescription className="text-gray-700">{description}</CardDescription>
                    </div>
                  </div>
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10 relative z-10">
                          <Info className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-primary text-primary-foreground">
                        <p>{tooltipContent}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">{children}</CardContent>
        </div>
    </TiltedCard>
  );

  const getUsage = () => {
    if (!user) return { current: anonGenerations, max: 2, plan: "Guest"};
    switch (profile?.subscriptionPlan) {
        case "Basic": return { current: userGenerations, max: 2, plan: "Basic" };
        case "Job Seeker": return { current: userGenerations, max: 10, plan: "Job Seeker" };
        case "Career Pro": return { current: userGenerations, max: 30, plan: "Career Pro" };
        case "Executive": return { current: userGenerations, max: Infinity, plan: "Executive" };
        case "Special": return { current: userGenerations, max: Infinity, plan: "Special Code" };
        default: return { current: anonGenerations, max: 2, plan: "Guest" };
    }
  }

  const { current, max, plan } = getUsage();


  return (
    <TooltipProvider>
    <div className="flex flex-col min-h-screen font-body bg-white">
       { user ? <DashboardHeader /> : <Header /> }
      
      { appState !== "success" && !isGeneratePage && (
         <header className="h-[400px] w-full relative bg-white">
            <div className="absolute inset-0 z-10 grid grid-cols-1 md:grid-cols-2 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="col-span-1 flex items-center justify-start p-8 text-left">
                     <div className="flex flex-col items-start justify-center">
                        <Image src="/Coverso.png" alt="Coverso Logo" width={400} height={100} />
                        <p className="text-2xl font-light text-black mt-2">Helping to Accelerate Today</p>
                        <div className="mt-6 bg-primary text-primary-foreground px-8 py-4 rounded-lg text-left inline-block shadow-lg">
                            <p className="text-lg font-semibold">Cover Letters Drafted Today:</p>
                            <div className="flex items-end gap-3 mt-4">
                                <p className="text-4xl font-mono font-bold">
                                    <AnimatedCounter to={68} />
                                </p>
                                <span className="text-lg font-semibold mb-1">Cover Letters</span>
                            </div>
                            <div className="flex items-end gap-3 mt-1">
                                <Clock className="h-8 w-8" />
                                <p className="text-4xl font-mono font-bold">
                                    <AnimatedCounter to={12240} />
                                </p>
                                <span className="text-lg font-semibold mb-1">Minutes Saved</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-span-1 hidden md:flex items-center justify-end p-8">
                </div>
            </div>
            <div className="absolute inset-0 h-full w-full z-0 col-start-2 col-span-2">
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
      )}

      <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
         { isGeneratePage && appState === "idle" && (
            <div className="grid grid-cols-3 gap-8 items-center py-8">
                <div className="col-span-2">
                    <h1 className="text-4xl font-bold text-black">Cover Letter Generator</h1>
                    <p className="text-lg text-gray-600 mt-2">Create your cover letters in seconds!</p>
                </div>
                <div className="col-span-1 flex justify-end">
                   <UsageIndicator current={current} max={max} planName={plan} />
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8 items-center w-full">
          {appState !== 'success' && appState !== 'loading' && (
            <div className="w-full space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                   <div className="relative z-10">
                        <Step step={1} title="Personal Info Vault" description="Your personal details for the cover letter." tooltipContent="We use this information to populate the header of your cover letter.">
                        <PersonalInfoForm ref={personalInfoRef} profile={profile} user={user} />
                        </Step>
                   </div>
                  
                    <Step step={2} title="Portfolio Vault" description="Upload your CV and supporting documents." tooltipContent="Upload your CV (PDF, DOCX) and any other relevant files. You can also link to online portfolios or documents.">
                      <PortfolioVaultForm ref={portfolioVaultRef} isPayingUser={isPayingUser} />
                    </Step>
                </div>
                
                <CustomizationForm ref={customizationRef} isPayingUser={isPayingUser} />

                <div className="w-full flex flex-col gap-4 items-center">
                    <Button type="submit" size="lg" className="w-full max-w-lg" disabled={appState === 'loading'}>
                        {appState === 'loading' ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
                        {appState === 'loading' ? "Drafting..." : "Accelerate Your Job Application Now"}
                    </Button>
                    <Button type="button" size="lg" className="w-full max-w-lg" variant="secondary" onClick={handleGenerateSample}>
                        Generate Sample (for testing)
                    </Button>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        We value your privacy. Your personal details and documents are not stored.
                    </p>
                </div>
            </div>
          )}

          {appState !== 'idle' && (
            <div className="w-full py-8">
                {appState === 'loading' && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center h-[60vh]">
                      <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                      <p className="font-semibold text-black text-xl">The Alchemist is at work...</p>
                      <p className="text-base text-gray-600">Analyzing your documents and the job posting.</p>
                  </div>
                )}
                {appState === 'error' && (
                  <div className="flex-grow flex flex-col items-center justify-center text-center text-destructive h-[60vh]">
                      <AlertCircle className="w-12 h-12 mb-4" />
                      <p className="font-semibold text-xl">An Error Occurred</p>
                      <p className="text-base">{error}</p>
                      <Button onClick={() => setAppState('idle')} className="mt-4">Try Again</Button>
                  </div>
                )}
                {appState === 'success' && aiResult && (
                  <div className="space-y-8">
                     {user ? null : (
                       <div className="mb-8">
                         <div className="py-10 px-8 bg-primary/5 rounded-2xl border-2 border-dashed border-primary">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                              <div className="md:col-span-2">
                                  <h2 className="text-3xl font-bold text-black flex items-center gap-3">
                                    <Star className="h-8 w-8 text-accent" />
                                    Unlock the Full Power of Coverso
                                  </h2>
                                  <p className="text-lg text-gray-600 mt-2">
                                    Create an account to save your generated documents, access premium AI features, and manage your job applications all in one place.
                                  </p>
                              </div>
                              <div className="flex flex-col gap-3 items-stretch md:items-end">
                                  <Button size="lg" onClick={() => router.push('/login')}>
                                    <LogIn className="w-5 h-5 mr-2" />
                                    Sign Up or Login to Save
                                  </Button>
                                   <Button size="lg" variant="secondary" onClick={() => router.push('/pricing')}>
                                     <DollarSign className="w-5 h-5 mr-2" />
                                      View Pricing &amp; Plans
                                  </Button>
                              </div>
                            </div>
                         </div>
                       </div>
                    )}
                    <div className="grid grid-cols-12 gap-8 items-start">
                      <div className="col-span-3 sticky top-24">
                        <Card className="border-primary bg-white">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-primary">
                                <Wand2 className="h-5 w-5" />
                                Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-2">
                                 <Button 
                                    variant="outline"
                                    onClick={() => user ? router.push('/dashboard') : setAppState('idle')}
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    {user ? "Return to Dashboard" : "Start Over"}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setActiveSubMenu(activeSubMenu === 'analysis' ? null : 'analysis')}
                                    className={cn(
                                        "hover:bg-accent hover:text-accent-foreground",
                                        activeSubMenu === 'analysis' && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <BrainCircuit className="w-4 h-4 mr-2" />
                                    AI Analysis
                                </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => setActiveSubMenu(activeSubMenu === 'download' ? null : 'download')}
                                    className={cn(
                                        "hover:bg-accent hover:text-accent-foreground",
                                        activeSubMenu === 'download' && "bg-accent text-accent-foreground"
                                    )}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download &amp; Export
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => toast({title: "Coming Soon!", description: "This feature is under development."})}
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reprompt
                                </Button>
                            </CardContent>
                        </Card>
                        
                        {activeSubMenu === 'analysis' && (
                            <Card className="border-accent bg-white mt-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-accent">
                                    <BrainCircuit className="h-5 w-5" />
                                    AI Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                    <h3 className="font-semibold">Job Title</h3>
                                    <p className="text-sm text-muted-foreground">{aiResult.jobTitle}</p>
                                    </div>
                                    <div>
                                    <h3 className="font-semibold">Company Name</h3>
                                    <p className="text-sm text-muted-foreground">{aiResult.companyName}</p>
                                    </div>
                                    <div>
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <ListChecks className="h-5 w-5" />
                                        Key Focus Points
                                    </h3>
                                    <ul className="list-disc pl-5 mt-1 space-y-1 text-sm text-muted-foreground">
                                        {aiResult.keyFocusPoints.map((point, index) => (
                                        <li key={index}>{point}</li>
                                        ))}
                                    </ul>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {activeSubMenu === 'download' && (
                              <Card className="border-accent bg-white mt-4">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base text-accent">
                                        <Download className="h-5 w-5" />
                                        Download Options
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <Button variant="outline" className="justify-start gap-2" onClick={handleDownloadPdf}>
                                        <FileText className="h-4 h-4" />
                                        Download as PDF (.pdf)
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={handleDownload}>
                                        <FileText className="h-4 h-4" />
                                        Download as Markdown (.md)
                                    </Button>
                                    <Button variant="outline" className="justify-start gap-2" onClick={handleCopyToClipboard}>
                                        <Copy className="h-4 h-4" />
                                        Copy to Clipboard
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                      </div>
                      <div className="col-span-9">
                        <Card className="w-full border-primary overflow-hidden">
                           <div className="bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end p-4 flex flex-row items-center justify-between">
                              <Input 
                                  value={fileName}
                                  onChange={(e) => setFileName(e.target.value)}
                                  placeholder="Enter document name..."
                                  className="font-semibold text-lg max-w-md bg-white/90 focus-visible:ring-accent"
                              />
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                             <div tabIndex={user ? -1 : 0}>
                                                <Button 
                                                    onClick={() => handleSave()}
                                                    disabled={!user || isSaving}
                                                    className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary"
                                                >
                                                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </TooltipTrigger>
                                        {!user && (
                                            <TooltipContent>
                                                <p>Sign up or Login to save your document.</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                          </div>
                          <div className="border-b border-primary/20 bg-primary/10 p-2 flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Bold className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Italic className="w-4 h-4" /></Button>
                            <Separator orientation="vertical" className="h-6" />
                             <Select defaultValue="12pt">
                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10pt">10pt</SelectItem>
                                    <SelectItem value="11pt">11pt</SelectItem>
                                    <SelectItem value="12pt">12pt</SelectItem>
                                    <SelectItem value="14pt">14pt</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select defaultValue="Inter">
                                <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Inter">Inter</SelectItem>
                                    <SelectItem value="Arial">Arial</SelectItem>
                                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                    <SelectItem value="Georgia">Georgia</SelectItem>
                                </SelectContent>
                            </Select>
                          </div>
                          <div className="p-0" ref={letterContentRef}>
                            <Textarea
                                value={generatedCoverLetter}
                                onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                                placeholder="Your generated cover letter will appear here..."
                                className="w-full resize-none border-0 focus-visible:ring-0 rounded-none p-8"
                              />
                          </div>
                        </Card>
                         <div className="mt-4 flex justify-end">
                            <div className="bg-accent text-accent-foreground rounded-lg px-4 py-2 text-sm font-semibold shadow-md">
                                {isPayingUser || (plan !== "Guest" && plan !== "Basic")
                                    ? `Unlimited Generations (${plan} Plan)`
                                    : `${current}/${max} Generations Used`
                                }
                            </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>
            )}
        </form>
      </main>
      <AlertDialog open={showLimitDialog} onOpenChange={setShowLimitDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>You've Reached Your Limit</AlertDialogTitle>
            <AlertDialogDescription>
                You have used your 2 free cover letter generations. Please sign up or log in to continue generating and save your documents.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Stay as Guest</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push('/login')}>
                <LogIn className="w-4 h-4 mr-2" />
                Login or Sign Up
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showNameWarningDialog} onOpenChange={setShowNameWarningDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Save without a name?</AlertDialogTitle>
            <AlertDialogDescription>
                Your document doesn't have a name. It will be saved as "Untitled". Are you sure you want to proceed?
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSave(true)}>
                Save as Untitled
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}

    
