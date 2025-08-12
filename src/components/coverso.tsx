
"use client";

import { useState, useRef, type ChangeEvent, useMemo, type FC } from "react";
import Image from 'next/image';
import Link from 'next/link';
import { generateCoverLetter, type GenerateCoverLetterOutput } from "@/ai/flows/cover-letter-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils";
import Hyperspeed from "./hyperspeed";
import TiltedCard from "./TiltedCard";
import AnimatedCounter from "./AnimatedCounter";
import { Separator } from "./ui/separator";


type AppState = "idle" | "loading" | "success" | "error";

export function Coverso() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobDescription, setJobDescription] = useState("");
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([""]);
  const [fullName, setFullName] = useState("");
  const [userLocation, setUserLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [tone, setTone] = useState("Professional");
  const [mustHaveInfo, setMustHaveInfo] = useState("");

  const [aiResult, setAiResult] = useState<GenerateCoverLetterOutput | null>(null);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const hasCv = files.some(f => f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume'));
      if (hasCv && newFiles.some(f => f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume'))) {
        toast({
          title: "CV already uploaded",
          description: "You have already uploaded a CV. To replace it, please remove the existing one first.",
          variant: "destructive"
        });
        return;
      }
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  
  const handlePortfolioUrlChange = (index: number, value: string) => {
    const newUrls = [...portfolioUrls];
    newUrls[index] = value;
    setPortfolioUrls(newUrls);
  };

  const addPortfolioUrlInput = () => {
    setPortfolioUrls([...portfolioUrls, ""]);
  };
  
  const removePortfolioUrlInput = (index: number) => {
    setPortfolioUrls(portfolioUrls.filter((_, i) => i !== index));
  };

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


  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      toast({ title: "No CV Uploaded", description: "Please upload your CV to get started.", variant: "destructive" });
      return;
    }
     if (!fullName || !userLocation) {
      toast({ title: "Missing Personal Info", description: "Please provide your full name and location.", variant: "destructive" });
      return;
    }
    if (!jobDescription) {
      toast({ title: "No Job Description", description: "Please paste the job description.", variant: "destructive" });
      return;
    }
    
    setAppState("loading");
    setAiResult(null);
    setGeneratedCoverLetter("");
    setError(null);

    try {
      const cvFile = files.find(f => f.name.toLowerCase().includes('cv') || f.name.toLowerCase().includes('resume')) || files[0];
      const supportingFiles = files.filter(f => f !== cvFile);

      const cvDataUri = await fileToDataUri(cvFile);
      const supportingDocs = await Promise.all(supportingFiles.map(fileToDataUri));
      const finalPortfolioUrls = portfolioUrls.filter(url => url.trim() !== "");

      const result = await generateCoverLetter({
        fullName,
        userLocation,
        phone,
        email,
        linkedinUrl,
        cvDataUri,
        jobDescription,
        supportingDocs,
        portfolioUrls: finalPortfolioUrls,
        tone,
        mustHaveInfo,
      });

      setAiResult(result);
      setGeneratedCoverLetter(result.coverLetter);
      setAppState("success");
      toast({
        title: "Cover Letter Generated!",
        description: "Your new cover letter is ready for editing and download.",
      });
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
    link.download = 'cover-letter.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
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


  return (
    <TooltipProvider>
    <div className="flex flex-col min-h-screen font-body bg-white">
      <div className="w-full h-16 bg-white">
        <div className="h-full flex items-center justify-end px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-4">
              <Link href="/about" className="text-primary hover:underline">About Us</Link>
              <Link href="/faq" className="text-primary hover:underline">FAQ</Link>
              <Separator orientation="vertical" className="h-6 bg-primary" />
              <Button variant="ghost" className="text-primary hover:bg-primary hover:text-primary-foreground text-lg">
                <Link href="/login">Login</Link>
              </Button>
            </nav>
        </div>
      </div>
      <header className="h-[400px] w-full relative">
        <div className="absolute inset-0 z-10 grid grid-cols-1 md:grid-cols-2 max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="col-span-1 flex items-center justify-start p-8 text-left">
                <div className="flex flex-col items-start justify-center">
                    <Image src="/Logo2.png" alt="Coverso Logo" width={400} height={100} />
                    <p className="text-2xl font-light text-black mt-2">Speeding Up Your Application</p>
                    <div className="mt-6 bg-primary text-primary-foreground p-4 rounded-lg text-left inline-block">
                        <h3 className="text-lg font-semibold">Cover Letters Drafted Today</h3>
                        <p className="text-4xl font-mono font-bold mt-1">
                          <AnimatedCounter to={100} />
                        </p>
                         <div className="mt-2 text-sm text-primary-foreground/80 flex items-center gap-2">
                            <p className="text-xl font-mono font-bold">
                                <AnimatedCounter to={18000} />
                            </p>
                            <span>Minutes Saved</span>
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
                leftCars: [0x10B981, 0x10B981, 0x10B981],
                rightCars: [0x10B981, 0x10B981, 0x10B981],
                sticks: 0x10B981,
                }
            }}
            />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </header>


      <main className="flex-grow w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8 items-center w-full">
            <div className="w-full space-y-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    <Step step={1} title="Personal Info Vault" description="Your personal details for the cover letter." tooltipContent="We use this information to populate the header of your cover letter.">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-gray-800">Full Name*</Label>
                          <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rylan James Graham" required />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="location" className="text-gray-800">Location*</Label>
                          <Input id="location" value={userLocation} onChange={(e) => setUserLocation(e.target.value)} placeholder="Barcelona, Spain" required />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="phone" className="text-gray-800">Phone Number</Label>
                          <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 635967609" />
                          </div>
                          <div className="space-y-2">
                          <Label htmlFor="email" className="text-gray-800">Email</Label>
                          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="rylangraham02@gmail.com" />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="linkedin" className="text-gray-800">LinkedIn Profile URL</Label>
                          <Input id="linkedin" type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourprofile" />
                          </div>
                      </div>
                    </Step>
                  
                    <Step step={2} title="Portfolio Vault" description="Upload your CV and supporting documents." tooltipContent="Upload your CV (PDF, DOCX) and any other relevant files. You can also link to online portfolios or documents.">
                       <div className="space-y-4">
                        <div
                        className="relative flex flex-col items-center justify-center w-full p-4 transition-colors border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/80 hover:bg-primary/5"
                        onClick={() => fileInputRef.current?.click()}
                        >
                        <UploadCloud className="w-10 h-10 text-muted-foreground" />
                        <p className="font-semibold text-primary">Click to upload files</p>
                        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT. Ensure one file is your CV.</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                        />
                        </div>
                        {files.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-gray-800">Uploaded Files:</Label>
                            <ul className="space-y-2">
                            {files.map((file, index) => (
                                <li key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between p-2 text-sm rounded-md bg-secondary">
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{file.name}</span>
                                    {(file.name.toLowerCase().includes('cv') || file.name.toLowerCase().includes('resume')) && <Badge variant="outline">CV</Badge>}
                                </div>
                                <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0" onClick={() => handleRemoveFile(index)} aria-label={`Remove ${file.name}`}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                </li>
                            ))}
                            </ul>
                        </div>
                        )}
                        <div className="space-y-2">
                        <Label className="text-gray-800">Portfolio / Document URLs</Label>
                        {portfolioUrls.map((url, index) => (
                            <div key={index} className="flex items-center gap-2">
                            <Input 
                                type="url" 
                                placeholder="https://docs.google.com/document/d/..." 
                                value={url} 
                                onChange={(e) => handlePortfolioUrlChange(index, e.target.value)} 
                            />
                            <Button variant="ghost" size="icon" className="w-8 h-8 shrink-0" onClick={() => removePortfolioUrlInput(index)} aria-label="Remove URL">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addPortfolioUrlInput}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Add URL
                        </Button>
                        </div>
                       </div>
                    </Step>
                </div>

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
                     <div className="w-full rounded-2xl p-4 space-y-6 flex flex-col">
                        <CardHeader className="p-4 pb-2">
                            <div className="flex items-start gap-4">
                                <div>
                                <CardTitle className="text-black">Customize</CardTitle>
                                <CardDescription className="text-gray-700">Guide the AI's writing style and include key information.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 flex-grow flex flex-col gap-4">
                            <div className="space-y-3">
                            <Label className="text-gray-800">Choose a Tone</Label>
                            <RadioGroup value={tone} onValueChange={setTone} className="flex flex-wrap gap-4">
                                {["Professional", "Enthusiastic", "Formal", "Creative"].map((t) => (
                                    <div key={t} className="flex items-center space-x-2">
                                        <RadioGroupItem value={t} id={`r-${t}`} />
                                        <Label htmlFor={`r-${t}`} className="text-gray-800">{t}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mustHaveInfo" className="text-gray-800">Must-Have Information</Label>
                                <Textarea
                                id="mustHaveInfo"
                                placeholder="e.g., 'Mention my 5 years of experience with React' or 'Highlight my passion for sustainable tech'."
                                value={mustHaveInfo}
                                onChange={(e) => setMustHaveInfo(e.target.value)}
                                className="min-h-[100px]"
                            />
                            </div>
                            <div className="mt-auto">
                                <Button type="submit" size="lg" className="mt-4" disabled={appState === 'loading'}>
                                    {appState === 'loading' ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    ) : (
                                    <Wand2 className="w-5 h-5 mr-2" />
                                    )}
                                    {appState === 'loading' ? "Drafting..." : "Generate Cover Letter"}
                                </Button>
                             </div>
                        </CardContent>
                    </div>
                </div>

                {appState !== 'idle' && (
                <div className="w-full space-y-4">
                    <TiltedCard containerHeight="auto" scaleOnHover={1.02} rotateAmplitude={2} >
                        <div className="min-h-[60vh] flex flex-col w-full rounded-2xl p-4">
                            <CardHeader className="p-4">
                                <CardTitle className="text-black">Your Generated Cover Letter</CardTitle>
                                <CardDescription className="text-gray-700">The AI-generated result will appear here. You can edit it before downloading.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 flex-grow flex flex-col">
                                {appState === 'loading' && (
                                <div className="flex-grow flex flex-col items-center justify-center text-center">
                                    <Loader2 className="w-12 h-12 mb-4 animate-spin text-primary" />
                                    <p className="font-semibold text-black">The Alchemist is at work...</p>
                                    <p className="text-sm text-gray-600">Analyzing your documents and the job posting.</p>
                                </div>
                                )}
                                {appState === 'error' && (
                                <div className="flex-grow flex flex-col items-center justify-center text-center text-destructive">
                                    <AlertCircle className="w-12 h-12 mb-4" />
                                    <p className="font-semibold">An Error Occurred</p>
                                    <p className="text-sm">{error}</p>
                                </div>
                                )}
                                {appState === 'success' && (
                                <div className="flex-grow flex flex-col">
                                    <Textarea
                                    value={generatedCoverLetter}
                                    onChange={(e) => setGeneratedCoverLetter(e.target.value)}
                                    placeholder="Your generated cover letter will appear here..."
                                    className="flex-grow w-full resize-none"
                                    rows={20}
                                    />
                                    <Button onClick={handleDownload} className="mt-4" disabled={!generatedCoverLetter}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Download as Markdown
                                    </Button>
                                </div>
                                )}
                            </CardContent>
                        </div>
                    </TiltedCard>
                    
                    {appState === 'success' && aiResult && (
                     <TiltedCard containerHeight="auto" scaleOnHover={1.02} rotateAmplitude={2}>
                        <div className="w-full rounded-2xl p-4">
                            <CardHeader className="p-4">
                            <CardTitle className="flex items-center gap-2 text-black">
                                <BrainCircuit className="h-6 w-6" />
                                AI Analysis
                            </CardTitle>
                            <CardDescription className="text-gray-700">Here's what the AI understood from the job posting.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 p-4 pt-0">
                                <div>
                                <h3 className="font-semibold text-gray-800">Job Title</h3>
                                <p className="text-muted-foreground">{aiResult.jobTitle}</p>
                                </div>
                                <div>
                                <h3 className="font-semibold text-gray-800">Company Name</h3>
                                <p className="text-muted-foreground">{aiResult.companyName}</p>
                                </div>
                                <div>
                                <h3 className="font-semibold flex items-center gap-2 text-gray-800">
                                    <ListChecks className="h-5 w-5" />
                                    Key Focus Points
                                </h3>
                                <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                                    {aiResult.keyFocusPoints.map((point, index) => (
                                    <li key={index}>{point}</li>
                                    ))}
                                </ul>
                                </div>
                            </CardContent>
                        </div>
                    </TiltedCard>
                    )}
                </div>
                )}
            </div>
        </form>
      </main>
    </div>
    </TooltipProvider>
  );
}

    